const mongoose = require('mongoose');
const CommunityEvent = require('../models/CommunityEvent');
const EventPollResponse = require('../models/EventPollResponse');
const { EXPERIENCE, BEST_PART } = EventPollResponse;

function buildStats(rows) {
  const total = rows.length;
  if (total === 0) {
    return {
      total: 0,
      attendedYes: 0,
      attendedNo: 0,
      attendedSkipped: 0,
      ratingAverage: null,
      ratingCount: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      experience: { Good: 0, Average: 0, Bad: 0 },
      bestPart: { Activities: 0, Speaker: 0, Food: 0, Organization: 0 },
    };
  }
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const experience = { Good: 0, Average: 0, Bad: 0 };
  const bestPart = { Activities: 0, Speaker: 0, Food: 0, Organization: 0 };
  let attendedYes = 0;
  let attendedNo = 0;
  let attendedSkipped = 0;
  let ratingSum = 0;
  let ratingCount = 0;
  for (const r of rows) {
    if (typeof r.attended === 'boolean') {
      if (r.attended) attendedYes += 1;
      else attendedNo += 1;
    } else {
      attendedSkipped += 1;
    }
    if (typeof r.rating === 'number' && r.rating >= 1 && r.rating <= 5) {
      ratingSum += r.rating;
      ratingCount += 1;
      ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
    }
    if (r.experience && experience[r.experience] !== undefined) {
      experience[r.experience] += 1;
    }
    if (r.bestPart && bestPart[r.bestPart] !== undefined) {
      bestPart[r.bestPart] += 1;
    }
  }
  return {
    total,
    attendedYes,
    attendedNo,
    attendedSkipped,
    ratingAverage:
      ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : null,
    ratingCount,
    ratingDistribution,
    experience,
    bestPart,
  };
}

exports.submit = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    const event = await CommunityEvent.findById(id).select('_id').lean();
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { attended, rating, experience, bestPart, suggestion } = body;

    let sug = suggestion;
    if (sug === undefined || sug === null) sug = '';
    else sug = String(sug).trim();
    if (sug.length > 500) {
      return res.status(400).json({ message: 'Suggestion must be at most 500 characters.' });
    }

    const payload = { eventId: id };
    if (sug.length > 0) payload.suggestion = sug;

    if (attended !== undefined && attended !== null && attended !== '') {
      let a = attended;
      if (typeof a !== 'boolean') {
        if (a === 'true' || a === true) a = true;
        else if (a === 'false' || a === false) a = false;
        else {
          return res.status(400).json({ message: 'Did you attend? must be yes or no.' });
        }
      }
      payload.attended = a;
    }

    if (rating !== undefined && rating !== null && rating !== '') {
      const n = Number(rating);
      const r = Number.isFinite(n) ? Math.round(n) : NaN;
      if (!Number.isInteger(r) || r < 1 || r > 5) {
        return res.status(400).json({ message: 'Overall rating must be a whole number from 1 to 5.' });
      }
      payload.rating = r;
    }

    if (experience !== undefined && experience !== null && String(experience).trim() !== '') {
      const exp = String(experience).trim();
      if (!EXPERIENCE.includes(exp)) {
        return res.status(400).json({ message: 'Invalid value for how was the event.' });
      }
      payload.experience = exp;
    }

    if (bestPart !== undefined && bestPart !== null && String(bestPart).trim() !== '') {
      const bp = String(bestPart).trim();
      if (!BEST_PART.includes(bp)) {
        return res.status(400).json({ message: 'Invalid value for best part of the event.' });
      }
      payload.bestPart = bp;
    }

    const hasAny =
      typeof payload.attended === 'boolean' ||
      typeof payload.rating === 'number' ||
      Boolean(payload.experience) ||
      Boolean(payload.bestPart) ||
      sug.length > 0;

    if (!hasAny) {
      return res.status(400).json({
        message: 'Add at least one answer to save feedback, or skip the request.',
      });
    }

    const doc = await EventPollResponse.create(payload);

    res.status(201).json({
      message: 'Thank you for your feedback.',
      response: doc.toObject(),
    });
  } catch (err) {
    console.error('eventPoll submit:', err);
    res.status(500).json({ message: err.message || 'Could not save feedback.' });
  }
};

/** Admin: one row per event that has at least one response */
exports.listSummary = async (req, res) => {
  try {
    const grouped = await EventPollResponse.aggregate([
      {
        $group: {
          _id: '$eventId',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const eventIds = grouped.map((g) => g._id);
    const events = await CommunityEvent.find({ _id: { $in: eventIds } })
      .select('title startDateTime category')
      .lean();
    const byId = new Map(events.map((e) => [String(e._id), e]));

    const rows = grouped.map((g) => {
      const ev = byId.get(String(g._id));
      return {
        eventId: g._id,
        title: ev?.title || '(deleted event)',
        startDateTime: ev?.startDateTime || null,
        category: ev?.category || null,
        responseCount: g.count,
        avgRating: g.avgRating != null ? Math.round(g.avgRating * 10) / 10 : null,
      };
    });

    res.status(200).json({ events: rows });
  } catch (err) {
    console.error('eventPoll listSummary:', err);
    res.status(500).json({ message: 'Failed to load poll summary.' });
  }
};

/** Admin: stats + all responses for one event */
exports.detail = async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event id.' });
    }

    const event = await CommunityEvent.findById(eventId).select('title startDateTime category').lean();
    const responses = await EventPollResponse.find({ eventId })
      .sort({ createdAt: -1 })
      .lean();

    const stats = buildStats(responses);

    res.status(200).json({
      event: event || { _id: eventId, title: '(event not found)', startDateTime: null, category: null },
      stats,
      responses,
    });
  } catch (err) {
    console.error('eventPoll detail:', err);
    res.status(500).json({ message: 'Failed to load poll detail.' });
  }
};

exports.removeByEventId = async (eventId) => {
  if (!mongoose.Types.ObjectId.isValid(eventId)) return;
  await EventPollResponse.deleteMany({ eventId });
};
