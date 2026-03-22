import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CommunityHubHeader from './CommunityHubHeader';
import { API_BASE } from '../config';
import './CommunityHub.css';

const formatWhen = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString();
  } catch {
    return '—';
  }
};

const EventCard = ({ ev }) => (
  <Link
    to={`/community-hub/content/${ev._id}`}
    className={`community-hub-event-card community-hub-event-card--full${ev.finished ? ' community-hub-event-card--finished' : ''}`}
  >
    <div className="community-hub-event-full">
      <div className="community-hub-event-full-media">
        {ev.imageUrl ? (
          <img
            className="community-hub-event-full-poster"
            src={ev.imageUrl}
            alt=""
            loading="lazy"
          />
        ) : (
          <div
            className="community-hub-event-poster-placeholder community-hub-event-full-poster-fallback"
            aria-hidden
          >
            <span className="community-hub-event-poster-placeholder-label">Event</span>
          </div>
        )}
      </div>
      <div className="community-hub-event-full-body">
        <p className="community-hub-event-meta">{ev.category || 'Event'}</p>
        <h3 className="community-hub-event-full-title">{ev.title}</h3>
        {ev.finished && (
          <p className="community-hub-event-finished-pill">
            {ev.finishedByManual && !ev.finishedByDate
              ? 'Finished · Closed early'
              : 'Finished · Past start date'}
          </p>
        )}
        <p className="community-hub-event-full-desc">{ev.description}</p>
        <div className="community-hub-event-full-details">
          <p className="community-hub-event-detail">
            <strong>When:</strong> {formatWhen(ev.startDateTime)}
            {ev.endDateTime ? ` – ${formatWhen(ev.endDateTime)}` : ''}
          </p>
          <p className="community-hub-event-detail">
            <strong>Where:</strong> {ev.location || '—'}
          </p>
          <p className="community-hub-event-detail">
            <strong>Organizer:</strong> {ev.organizer || '—'}
          </p>
          {ev.contactInfo && (
            <p className="community-hub-event-detail">
              <strong>Contact:</strong> {ev.contactInfo}
            </p>
          )}
          {ev.videoUrl && (
            <p className="community-hub-event-detail community-hub-event-detail--video">
              <strong>Video:</strong> available on the event page
            </p>
          )}
        </div>
        <span className="community-hub-event-full-cta">Open event &amp; video →</span>
      </div>
    </div>
  </Link>
);

const CommunityHubContent = () => {
  const [upcoming, setUpcoming] = useState([]);
  const [finished, setFinished] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError('');
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/community-events`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'Could not load events.');
        if (!cancelled) {
          setUpcoming(data.upcoming || []);
          setFinished(data.finished || []);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Could not load events.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="community-hub-content-page font-sans">
      <CommunityHubHeader sticky />

      <main
        id="hub-content"
        className="community-hub-content community-hub-content--full"
        aria-label="Community Hub"
      >
        <h2 className="community-hub-events-title">Community Hub events</h2>
        <p className="community-hub-events-sub">
          Upcoming events are listed first (soonest start date). Finished events moved automatically after
          the start day or by an admin.
        </p>

        {loading && <p className="community-hub-events-empty">Loading events…</p>}
        {error && <p className="community-hub-events-error" role="alert">{error}</p>}

        {!loading && !error && upcoming.length === 0 && finished.length === 0 && (
          <p className="community-hub-events-empty">No events published yet. Check back soon.</p>
        )}

        {!loading && !error && (upcoming.length > 0 || finished.length > 0) && (
          <div className="community-hub-events-sections">
            {upcoming.length > 0 && (
              <section className="community-hub-events-section" aria-labelledby="hub-upcoming-heading">
                <h3 id="hub-upcoming-heading" className="community-hub-events-section-title">
                  Upcoming events
                </h3>
                <div className="community-hub-events-list">
                  {upcoming.map((ev) => (
                    <EventCard key={ev._id} ev={ev} />
                  ))}
                </div>
              </section>
            )}

            {finished.length > 0 && (
              <section className="community-hub-events-section" aria-labelledby="hub-finished-heading">
                <h3 id="hub-finished-heading" className="community-hub-events-section-title">
                  Finished events
                </h3>
                <div className="community-hub-events-list">
                  {finished.map((ev) => (
                    <EventCard key={ev._id} ev={ev} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default CommunityHubContent;
