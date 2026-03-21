import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CommunityHubHeader from './CommunityHubHeader';
import { API_BASE } from '../config';
import { youtubeEmbedSrcWithAutoplay, youtubeEmbedUrl } from './communityHubVideo';
import './CommunityHub.css';

const CommunityHubEventDetail = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const directVideoRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError('');
      setLoading(true);
      setEvent(null);
      try {
        const res = await fetch(`${API_BASE}/api/community-events/${eventId}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'Could not load this event.');
        if (!cancelled) setEvent(data.event);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Could not load this event.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const ytEmbed = event?.videoUrl ? youtubeEmbedUrl(event.videoUrl) : null;

  useEffect(() => {
    if (!event?.videoUrl || ytEmbed) return;
    const el = directVideoRef.current;
    if (!el) return;
    el.muted = false;
    const p = el.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {});
    }
  }, [event, ytEmbed]);

  const formatWhen = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleString();
    } catch {
      return '—';
    }
  };

  const ytSrc = ytEmbed ? youtubeEmbedSrcWithAutoplay(ytEmbed) : null;

  return (
    <div className="community-hub-content-page font-sans">
      <CommunityHubHeader sticky />

      <main className="community-hub-content community-hub-detail" aria-label="Event details">
        <button
          type="button"
          className="community-hub-back"
          onClick={() => navigate('/community-hub/content')}
        >
          ← Back to events
        </button>

        {loading && <p className="community-hub-events-empty">Loading event…</p>}
        {error && <p className="community-hub-events-error" role="alert">{error}</p>}

        {!loading && !error && event && (
          <article className="community-hub-detail-article">
            <header
              className={`community-hub-detail-header${event.imageUrl ? '' : ' community-hub-detail-header--no-banner'}`}
            >
              {event.imageUrl && (
                <img
                  className="community-hub-detail-banner-thumb"
                  src={event.imageUrl}
                  alt=""
                  loading="eager"
                />
              )}
              <div className="community-hub-detail-headline">
                <p className="community-hub-event-meta">{event.category || 'Event'}</p>
                <h1 className="community-hub-detail-title">{event.title}</h1>
              </div>
            </header>

            {event.videoUrl && (
              <section className="community-hub-detail-video-stage" aria-label="Event video">
                <div className="community-hub-detail-video-stage-inner">
                  <p className="community-hub-detail-video-label">Event video</p>
                  <div className="community-hub-detail-video-frame">
                    {ytSrc ? (
                      <iframe
                        title={`Video: ${event.title}`}
                        src={ytSrc}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        ref={directVideoRef}
                        key={event.videoUrl}
                        src={event.videoUrl}
                        controls
                        playsInline
                        autoPlay
                        onLoadedData={(e) => {
                          e.currentTarget.muted = false;
                          e.currentTarget.play().catch(() => {});
                        }}
                      />
                    )}
                  </div>
                  <p className="community-hub-video-hint">
                    Autoplay tries to play with sound. If your browser blocks it, tap the video once to
                    start.
                  </p>
                </div>
              </section>
            )}

            <div className="community-hub-detail-inner">
              <p className="community-hub-event-desc community-hub-detail-desc">{event.description}</p>

              <div className="community-hub-detail-facts">
                <p className="community-hub-event-detail">
                  <strong>When:</strong> {formatWhen(event.startDateTime)}
                  {event.endDateTime ? ` – ${formatWhen(event.endDateTime)}` : ''}
                </p>
                <p className="community-hub-event-detail">
                  <strong>Where:</strong> {event.location}
                </p>
                <p className="community-hub-event-detail">
                  <strong>Organizer:</strong> {event.organizer}
                </p>
                {event.contactInfo && (
                  <p className="community-hub-event-detail">
                    <strong>Contact:</strong> {event.contactInfo}
                  </p>
                )}
              </div>
            </div>
          </article>
        )}

        {!loading && !error && !event && (
          <p className="community-hub-events-empty">Event not found.</p>
        )}
      </main>
    </div>
  );
};

export default CommunityHubEventDetail;
