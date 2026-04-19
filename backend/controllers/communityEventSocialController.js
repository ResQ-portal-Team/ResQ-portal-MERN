const mongoose = require('mongoose');
const CommunityEvent = require('../models/CommunityEvent');
const CommunityEventLike = require('../models/CommunityEventLike');
const CommunityEventComment = require('../models/CommunityEventComment');
const User = require('../models/User');

function getActorUserId(req) {
  const u = req.user;
  if (!u) return null;
  if (u.role === 'admin') return null;
  const raw = u.id ?? u.userId ?? u.sub ?? (u._id != null ? String(u._id) : null);
  if (!raw) return null;
  const s = String(raw).trim();
  if (!mongoose.Types.ObjectId.isValid(s)) return null;
  return s;
}

function oid(id) {
  return new mongoose.Types.ObjectId(id);
}

exports.getSocial = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    const exists = await CommunityEvent.findById(eventId).select('_id').lean();
    if (!exists) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const userIdStr = getActorUserId(req);
    const userId = userIdStr ? oid(userIdStr) : null;
    const eid = oid(eventId);

    const [likeCount, likedDoc, rootComments] = await Promise.all([
      CommunityEventLike.countDocuments({ eventId: eid }),
      userId ? CommunityEventLike.findOne({ eventId: eid, userId }).select('_id').lean() : null,
      CommunityEventComment.find({ eventId: eid, parentCommentId: null })
        .sort({ createdAt: -1 })
        .limit(50)
        .select('text authorName createdAt')
        .lean(),
    ]);

    const rootIds = rootComments.map((c) => c._id);
    const replyDocs =
      rootIds.length === 0
        ? []
        : await CommunityEventComment.find({
            eventId: eid,
            parentCommentId: { $in: rootIds },
          })
            .sort({ createdAt: 1 })
            .select('text authorName createdAt parentCommentId')
            .lean();

    const repliesByParent = new Map();
    for (const r of replyDocs) {
      const k = String(r.parentCommentId);
      if (!repliesByParent.has(k)) repliesByParent.set(k, []);
      repliesByParent.get(k).push({
        _id: r._id,
        text: r.text,
        authorName: r.authorName,
        createdAt: r.createdAt,
      });
    }

    const comments = rootComments.map((c) => ({
      _id: c._id,
      text: c.text,
      authorName: c.authorName,
      createdAt: c.createdAt,
      replies: repliesByParent.get(String(c._id)) || [],
    }));

    res.status(200).json({
      likeCount,
      liked: Boolean(likedDoc),
      comments,
    });
  } catch (err) {
    console.error('getSocial:', err);
    res.status(500).json({ message: 'Failed to load reactions.' });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const userIdStr = getActorUserId(req);
    if (!userIdStr || !mongoose.Types.ObjectId.isValid(userIdStr)) {
      return res.status(403).json({
        message: 'Sign in with your student account to like events.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    const exists = await CommunityEvent.findById(eventId).select('_id').lean();
    if (!exists) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const userId = oid(userIdStr);
    const eid = oid(eventId);
    const existing = await CommunityEventLike.findOne({ eventId: eid, userId });

    if (existing) {
      await CommunityEventLike.deleteOne({ _id: existing._id });
    } else {
      try {
        await CommunityEventLike.create({ eventId: eid, userId });
      } catch (e) {
        if (e && e.code === 11000) {
          /* concurrent insert — like row already exists */
        } else {
          throw e;
        }
      }
    }

    const likeCount = await CommunityEventLike.countDocuments({ eventId: eid });
    const liked = !existing;

    res.status(200).json({ liked, likeCount });
  } catch (err) {
    console.error('toggleLike:', err);
    res.status(500).json({ message: err.message || 'Failed to update like.' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const parentRaw = req.body?.parentCommentId;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    const exists = await CommunityEvent.findById(eventId).select('_id').lean();
    if (!exists) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    let text = req.body?.text;
    if (text === undefined || text === null) text = '';
    text = String(text).trim();
    if (text.length < 1) {
      return res.status(400).json({ message: 'Comment cannot be empty.' });
    }
    if (text.length > 2000) {
      return res.status(400).json({ message: 'Comment is too long (max 2000 characters).' });
    }

    const hasParent =
      parentRaw !== undefined && parentRaw !== null && String(parentRaw).trim() !== '';

    if (hasParent) {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Only administrators can reply to comments.' });
      }
      const parentId = String(parentRaw).trim();
      if (!mongoose.Types.ObjectId.isValid(parentId)) {
        return res.status(400).json({ message: 'Invalid parent comment.' });
      }
      const parent = await CommunityEventComment.findById(parentId).lean();
      if (!parent || String(parent.eventId) !== String(eventId)) {
        return res.status(404).json({ message: 'Parent comment not found.' });
      }
      if (parent.parentCommentId) {
        return res.status(400).json({ message: 'You can only reply to top-level comments.' });
      }

      const doc = await CommunityEventComment.create({
        eventId: oid(eventId),
        parentCommentId: oid(parentId),
        isAdminReply: true,
        text,
        authorName: 'Admin',
      });

      return res.status(201).json({
        comment: {
          _id: doc._id,
          text: doc.text,
          authorName: doc.authorName,
          createdAt: doc.createdAt,
          parentCommentId: doc.parentCommentId,
        },
      });
    }

    const userIdStr = getActorUserId(req);
    if (!userIdStr || !mongoose.Types.ObjectId.isValid(userIdStr)) {
      if (req.user?.role === 'admin') {
        return res.status(403).json({
          message:
            'Administrators cannot post new top-level comments here. Use Reply on a comment instead.',
        });
      }
      return res.status(403).json({
        message: 'Sign in with your student account to comment.',
      });
    }

    const user = await User.findById(userIdStr).select('nickname').lean();
    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    const doc = await CommunityEventComment.create({
      eventId: oid(eventId),
      userId: oid(userIdStr),
      text,
      authorName: user.nickname || 'Member',
    });

    res.status(201).json({
      comment: {
        _id: doc._id,
        text: doc.text,
        authorName: doc.authorName,
        createdAt: doc.createdAt,
      },
    });
  } catch (err) {
    console.error('addComment:', err);
    res.status(500).json({ message: err.message || 'Failed to post comment.' });
  }
};
