/**
 * Finished = manually marked by admin OR startDateTime is before the start of today (UTC).
 */
function startOfUtcDay(d) {
  const x = new Date(d);
  return Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate());
}

function isStartBeforeToday(startDateTime) {
  const start = new Date(startDateTime).getTime();
  const todayStart = startOfUtcDay(new Date());
  return start < todayStart;
}

function enrichEvent(ev) {
  const finishedByDate = isStartBeforeToday(ev.startDateTime);
  const finishedByManual = Boolean(ev.manuallyFinished);
  const finished = finishedByManual || finishedByDate;
  return {
    ...ev,
    finished,
    finishedByDate,
    finishedByManual,
  };
}

function splitUpcomingFinished(enriched) {
  const upcoming = enriched
    .filter((e) => !e.finished)
    .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
  const finished = enriched
    .filter((e) => e.finished)
    .sort((a, b) => new Date(b.startDateTime) - new Date(a.startDateTime));
  return { upcoming, finished };
}

module.exports = {
  enrichEvent,
  splitUpcomingFinished,
  isStartBeforeToday,
};
