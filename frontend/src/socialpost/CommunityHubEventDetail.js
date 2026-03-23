import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CommunityHubHeader from './CommunityHubHeader';
import { API_BASE } from '../config';
import { youtubeEmbedSrcNoAutoplay, youtubeEmbedSrcWithAutoplay, youtubeEmbedUrl } from './communityHubVideo';
import { useTheme } from '../ThemeContext';

/* ─── Design tokens (dark = current hub aesthetic; light = readable on white) ─ */
const T_DARK = {
  bg:        '#080b10',
  surface:   '#0e1117',
  surfaceAlt:'#131720',
  border:    'rgba(255,255,255,0.07)',
  text:      '#e6e1d8',
  muted:     '#7a7690',
  hint:      '#3e3d4e',
  factValue: '#cdc9d8',
  title:     '#f0ece3',
  descBg:    '#0f1218',
  descText:  '#ada9bc',
  backHover: 'rgba(255,255,255,0.25)',
  spinnerBd: 'rgba(255,255,255,0.07)',
  videoLine: 'rgba(255,255,255,0.04)',
  serif:     "'Playfair Display', 'Georgia', serif",
  sans:      "'DM Sans', 'Helvetica Neue', sans-serif",
};

const T_LIGHT = {
  bg:        '#f8fafc',
  surface:   '#ffffff',
  surfaceAlt:'#f1f5f9',
  border:    'rgba(15,23,42,0.1)',
  text:      '#0f172a',
  muted:     '#64748b',
  hint:      '#64748b',
  factValue: '#334155',
  title:     '#0f172a',
  descBg:    '#ffffff',
  descText:  '#475569',
  backHover: 'rgba(15,23,42,0.25)',
  spinnerBd: 'rgba(15,23,42,0.12)',
  videoLine: 'rgba(15,23,42,0.08)',
  serif:     "'Playfair Display', 'Georgia', serif",
  sans:      "'DM Sans', 'Helvetica Neue', sans-serif",
};

const getGlobalCss = (tk) => `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&display=swap');
  @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin   { to { transform: rotate(360deg); } }
  .back-btn:hover   { border-color: ${tk.backHover} !important; color: ${tk.text} !important; }
  .fact-row + .fact-row { border-top: 0.5px solid ${tk.border}; }
  @media (max-width: 720px) {
    .layout-grid   { grid-template-columns: 1fr !important; }
    .sidebar       { position: static !important; }
  }
`;

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
const fmt = (d) => {
  if (!d) return null;
  try {
    return new Date(d).toLocaleString(undefined, {
      weekday:'short', month:'short', day:'numeric',
      year:'numeric', hour:'2-digit', minute:'2-digit',
    });
  } catch { return null; }
};

const POLL_BEST_PARTS = ['Activities', 'Speaker', 'Food', 'Organization'];

/* ─── Spinner ────────────────────────────────────────────────────────────────── */
const Spinner = ({ tk }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, padding:'72px 0', color:tk.muted, fontSize:14, fontFamily:tk.sans }}>
    <div style={{ width:28, height:28, border:`2px solid ${tk.spinnerBd}`, borderTop:'2px solid #6c5ce7', borderRadius:'50%', animation:'spin 0.75s linear infinite' }} />
    Loading event…
  </div>
);

/* ─── FactRow ────────────────────────────────────────────────────────────────── */
const FactRow = ({ icon, label, value, tk }) =>
  value ? (
    <div className="fact-row" style={{ display:'flex', alignItems:'flex-start', gap:11, padding:'12px 0' }}>
      <span style={{ fontSize:14, marginTop:2, flexShrink:0, lineHeight:1 }}>{icon}</span>
      <div>
        <p style={{ margin:'0 0 3px', fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase', color:tk.hint }}>{label}</p>
        <p style={{ margin:0, fontSize:13.5, color:tk.factValue, lineHeight:1.55 }}>{value}</p>
      </div>
    </div>
  ) : null;

/* ─── Main ───────────────────────────────────────────────────────────────────── */
export default function CommunityHubEventDetail() {
  const { theme } = useTheme();
  const tk = theme === 'dark' ? T_DARK : T_LIGHT;
  const { eventId } = useParams();
  const navigate    = useNavigate();
  const [event, setEvent]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const videoRef = useRef(null);

  const [pollSubmitted, setPollSubmitted] = useState(false);
  const [pollAttended, setPollAttended] = useState(null);
  const [pollRating, setPollRating] = useState(0);
  const [pollExperience, setPollExperience] = useState('');
  const [pollBestPart, setPollBestPart] = useState('');
  const [pollSuggestion, setPollSuggestion] = useState('');
  const [pollSubmitting, setPollSubmitting] = useState(false);
  const [pollFormError, setPollFormError] = useState('');
  const [thanksOpen, setThanksOpen] = useState(false);
  const [thanksSaved, setThanksSaved] = useState(false);
  /** No localStorage: feedback popup shows on every visit to this page */
  const [pollGateDismissed, setPollGateDismissed] = useState(false);

  useEffect(() => {
    setPollGateDismissed(false);
    setPollSubmitted(false);
    setThanksOpen(false);
    setPollSubmitting(false);
    setPollFormError('');
    setPollAttended(null);
    setPollRating(0);
    setPollExperience('');
    setPollBestPart('');
    setPollSuggestion('');
  }, [eventId]);

  useEffect(() => {
    let dead = false;
    (async () => {
      setError(''); setLoading(true); setEvent(null);
      try {
        const r = await fetch(`${API_BASE}/api/community-events/${eventId}`);
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.message || 'Could not load event.');
        if (!dead) setEvent(d.event);
      } catch (e) {
        if (!dead) setError(e.message || 'Could not load event.');
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, [eventId]);

  const ytEmbed = event?.videoUrl ? youtubeEmbedUrl(event.videoUrl) : null;
  const introPollOpen = Boolean(event && !pollGateDismissed);
  const allowVideoPlayback = pollGateDismissed && !thanksOpen;

  useEffect(() => {
    if (!allowVideoPlayback || !event?.videoUrl || ytEmbed) return;
    const el = videoRef.current;
    if (!el) return;
    el.muted = false;
    el.play?.().catch?.(() => {});
  }, [allowVideoPlayback, event?.videoUrl, ytEmbed]);

  const when = event
    ? [fmt(event.startDateTime), event.endDateTime ? fmt(event.endDateTime) : null].filter(Boolean).join(' – ')
    : null;

  const pollHasAnyAnswer = () =>
    pollAttended !== null ||
    pollRating >= 1 ||
    (pollExperience !== '' && ['Good', 'Average', 'Bad'].includes(pollExperience)) ||
    POLL_BEST_PARTS.includes(pollBestPart) ||
    pollSuggestion.trim().length > 0;

  const finishThanks = (savedToServer) => {
    setThanksSaved(savedToServer);
    setPollSubmitted(true);
    setPollGateDismissed(true);
    setThanksOpen(true);
  };

  const closeIntroPoll = () => {
    setPollGateDismissed(true);
  };

  const submitPoll = async (e) => {
    e.preventDefault();
    if (!eventId) return;
    setPollFormError('');

    if (!pollHasAnyAnswer()) {
      finishThanks(false);
      return;
    }

    const body = {};
    if (pollAttended !== null) body.attended = pollAttended;
    if (pollRating >= 1 && pollRating <= 5) body.rating = pollRating;
    if (pollExperience && ['Good', 'Average', 'Bad'].includes(pollExperience)) {
      body.experience = pollExperience;
    }
    if (POLL_BEST_PARTS.includes(pollBestPart)) body.bestPart = pollBestPart;
    const sug = pollSuggestion.trim();
    if (sug) body.suggestion = sug;

    setPollSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/community-events/${eventId}/poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not submit feedback.');
      finishThanks(true);
    } catch (err) {
      const msg = err?.message || '';
      if (msg === 'Failed to fetch' || msg === 'Load failed' || msg === 'NetworkError when attempting to fetch resource.') {
        setPollFormError(
          'Could not reach the server. Start the backend (port 5000) or run from the dev app with the API proxy.'
        );
      } else {
        setPollFormError(msg || 'Could not submit feedback.');
      }
    } finally {
      setPollSubmitting(false);
    }
  };

  const pillBtn = (active) => ({
    padding:'8px 14px',
    borderRadius:8,
    border:`0.5px solid ${active ? 'rgba(108,92,231,0.55)' : tk.border}`,
    background: active ? 'rgba(108,92,231,0.18)' : tk.surfaceAlt,
    color: active ? tk.title : tk.muted,
    fontSize:13,
    fontFamily:tk.sans,
    fontWeight:600,
    cursor:'pointer',
  });

  return (
    <div style={{ minHeight:'100vh', background:tk.bg, color:tk.text, fontFamily:tk.sans }}>
      <style>{getGlobalCss(tk)}</style>
      <CommunityHubHeader sticky />

      <main style={{ width:'100%', maxWidth:'none', margin:0, padding:'28px 0 80px 16px', boxSizing:'border-box' }}>

        {/* Back */}
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate('/community-hub/content')}
          style={{
            display:'inline-flex', alignItems:'center', gap:7,
            background:'none', border:`0.5px solid ${tk.border}`,
            borderRadius:8, color:tk.muted, fontSize:13,
            fontFamily:tk.sans, fontWeight:500, padding:'7px 15px',
            cursor:'pointer', marginBottom:28,
            transition:'border-color .18s, color .18s',
          }}
        >
          ← Back to events
        </button>

        {/* States */}
        {loading && <Spinner tk={tk} />}

        {!loading && error && (
          <p role="alert" style={{
            background:'rgba(239,68,68,0.08)', border:'0.5px solid rgba(239,68,68,0.2)',
            borderRadius:10, color:'#ef4444', fontSize:14, padding:'13px 18px', margin:0,
          }}>
            {error}
          </p>
        )}

        {!loading && !error && !event && (
          <p style={{ color:tk.muted, fontSize:15, textAlign:'center', padding:'60px 0' }}>
            Event not found.
          </p>
        )}

        {/* Main content */}
        {!loading && !error && event && (
          <article style={{ animation:'fadeUp .35s ease both' }}>

            {/* ┌──────────────────────────────────────────────────────┐
                │  BODY: video (primary) + sidebar                     │
                └──────────────────────────────────────────────────────┘ */}
            <div
              className="layout-grid"
              style={{ display:'grid', gridTemplateColumns:'1fr 252px', gap:18, alignItems:'start' }}
            >

              {/* ── Video column ── */}
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

                {/* Video player */}
                {event.videoUrl ? (
                  <section aria-label="Event video">
                    <div style={{
                      position:'relative', paddingTop:'56.25%',
                      borderRadius:13, overflow:'hidden',
                      background:'#000',
                      border:'0.5px solid rgba(108,92,231,0.18)',
                      outline:`1px solid ${tk.videoLine}`,
                    }}>
                      {ytEmbed ? (
                        <iframe
                          key={allowVideoPlayback ? 'yt-play' : 'yt-hold'}
                          title={`Video: ${event.title}`}
                          src={
                            allowVideoPlayback
                              ? youtubeEmbedSrcWithAutoplay(ytEmbed)
                              : youtubeEmbedSrcNoAutoplay(ytEmbed)
                          }
                          style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:'none' }}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          ref={videoRef}
                          key={`${event.videoUrl}-${allowVideoPlayback ? 'p' : 'h'}`}
                          src={event.videoUrl}
                          controls
                          playsInline
                          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'contain' }}
                        />
                      )}
                    </div>
                    <p style={{ margin:'7px 0 0', fontSize:11.5, color:tk.hint, fontStyle:'italic' }}>
                      {introPollOpen
                        ? 'Quick feedback appears first — the video starts after you close it or submit.'
                        : 'Autoplay with sound — tap the video if your browser blocks it.'}
                    </p>
                  </section>
                ) : (
                  <div style={{
                    width:'100%',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    aspectRatio:'16/9', borderRadius:13,
                    background:tk.surfaceAlt, border:`0.5px solid ${tk.border}`,
                    color:tk.hint, fontSize:13,
                  }}>
                    No video available
                  </div>
                )}

                {/* Description */}
                {event.description && (
                  <div style={{
                    background:tk.descBg, border:`0.5px solid ${tk.border}`,
                    borderRadius:12, padding:'18px 20px',
                  }}>
                    <p style={{ margin:0, fontSize:14.5, lineHeight:1.8, color:tk.descText }}>
                      {event.description}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Sidebar: event details ── */}
              <aside
                className="sidebar"
                style={{
                  background:tk.surface, border:`0.5px solid ${tk.border}`,
                  borderRadius:12, padding:'4px 16px 12px',
                  position:'sticky', top:20,
                }}
                aria-label="Event information"
              >
                {event.imageUrl && (
                  <div style={{
                    margin:'0 -16px 14px', borderRadius:10, overflow:'hidden',
                    border:`0.5px solid ${tk.border}`,
                    background:tk.surfaceAlt,
                  }}>
                    <img
                      src={event.imageUrl}
                      alt=""
                      loading="eager"
                      style={{ width:'100%', aspectRatio:'16 / 10', objectFit:'cover', display:'block' }}
                    />
                  </div>
                )}
                <h1 style={{
                  margin:'0 0 14px', fontFamily:tk.serif, fontWeight:700,
                  fontSize:'clamp(18px,2.2vw,24px)', lineHeight:1.25, color:tk.title,
                }}>
                  {event.title}
                </h1>
                <p style={{
                  margin:'0 0 2px', fontSize:10, fontWeight:700,
                  letterSpacing:'0.09em', textTransform:'uppercase', color:tk.hint,
                }}>
                  Details
                </p>
                <FactRow icon="🏷" label="Category" value={event.category || 'Event'} tk={tk} />
                {event.finished && (
                  <FactRow
                    icon="⏱"
                    label="Status"
                    value={event.finishedByManual && !event.finishedByDate ? 'Closed by admin' : 'Event ended'}
                    tk={tk}
                  />
                )}
                <FactRow icon="🗓" label="When"      value={when} tk={tk} />
                <FactRow icon="📍" label="Where"     value={event.location} tk={tk} />
                <FactRow icon="👤" label="Organizer" value={event.organizer} tk={tk} />
                <FactRow icon="✉️" label="Contact"   value={event.contactInfo} tk={tk} />
              </aside>

            </div>

            {pollSubmitted && pollGateDismissed && (
              <p style={{ marginTop:24, fontSize:14, color:tk.factValue }}>
                Thank you — you are all set.
              </p>
            )}
          </article>
        )}
      </main>

      {introPollOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="intro-poll-title"
          style={{
            position:'fixed',
            inset:0,
            zIndex:1000,
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            padding:20,
            background:'rgba(0,0,0,0.6)',
            boxSizing:'border-box',
            overflowY:'auto',
          }}
          onClick={closeIntroPoll}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width:'100%',
              maxWidth:520,
              maxHeight:'min(90vh, 720px)',
              overflowY:'auto',
              background:tk.surface,
              border:`0.5px solid ${tk.border}`,
              borderRadius:14,
              padding:'20px 20px 22px',
              boxShadow:'0 24px 60px rgba(0,0,0,0.45)',
            }}
          >
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:14 }}>
              <h2
                id="intro-poll-title"
                style={{
                  margin:0,
                  fontFamily:tk.serif,
                  fontSize:'clamp(18px,2vw,22px)',
                  fontWeight:700,
                  color:tk.title,
                  lineHeight:1.25,
                }}
              >
                Quick feedback
              </h2>
              <button
                type="button"
                onClick={closeIntroPoll}
                aria-label="Close feedback"
                style={{
                  flexShrink:0,
                  padding:'6px 12px',
                  borderRadius:8,
                  border:`0.5px solid ${tk.border}`,
                  background:tk.surfaceAlt,
                  color:tk.muted,
                  fontSize:13,
                  fontFamily:tk.sans,
                  fontWeight:600,
                  cursor:'pointer',
                }}
              >
                Close
              </button>
            </div>
            <p style={{ margin:'0 0 16px', fontSize:12.5, color:tk.muted, lineHeight:1.5 }}>
              Essential inputs only — help us improve future events. Nothing is required; answer only what you want.
            </p>
            <form onSubmit={submitPoll} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:tk.hint }}>
                  Did you attend?
                </p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  <button type="button" style={pillBtn(pollAttended === true)} onClick={() => setPollAttended(true)}>Yes</button>
                  <button type="button" style={pillBtn(pollAttended === false)} onClick={() => setPollAttended(false)}>No</button>
                </div>
              </div>

              <div>
                <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:tk.hint }}>
                  Overall rating (1–5)
                </p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }} role="group" aria-label="Star rating">
                  {[1,2,3,4,5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPollRating(n)}
                      style={pillBtn(pollRating === n)}
                    >
                      {n} ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:tk.hint }}>
                  How was the event?
                </p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {['Good','Average','Bad'].map((x) => (
                    <button
                      key={x}
                      type="button"
                      style={pillBtn(pollExperience === x)}
                      onClick={() => setPollExperience(x)}
                    >
                      {x}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="intro-poll-best" style={{ display:'block', margin:'0 0 8px', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:tk.hint }}>
                  Best part of the event
                </label>
                <select
                  id="intro-poll-best"
                  value={pollBestPart}
                  onChange={(e) => setPollBestPart(e.target.value)}
                  style={{
                    width:'100%',
                    padding:'10px 12px',
                    borderRadius:8,
                    border:`0.5px solid ${tk.border}`,
                    background:tk.surfaceAlt,
                    color:tk.text,
                    fontSize:14,
                    fontFamily:tk.sans,
                  }}
                >
                  <option value="">Choose one…</option>
                  {POLL_BEST_PARTS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="intro-poll-sug" style={{ display:'block', margin:'0 0 8px', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:tk.hint }}>
                  One suggestion (optional)
                </label>
                <textarea
                  id="intro-poll-sug"
                  rows={2}
                  maxLength={500}
                  value={pollSuggestion}
                  onChange={(e) => setPollSuggestion(e.target.value)}
                  placeholder="Short text…"
                  style={{
                    width:'100%',
                    padding:'10px 12px',
                    borderRadius:8,
                    border:`0.5px solid ${tk.border}`,
                    background:tk.descBg,
                    color:tk.descText,
                    fontSize:14,
                    fontFamily:tk.sans,
                    resize:'vertical',
                    minHeight:64,
                    boxSizing:'border-box',
                  }}
                />
              </div>

              {pollFormError && (
                <p role="alert" style={{ margin:0, fontSize:13, color:'#ef4444' }}>{pollFormError}</p>
              )}

              <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginTop:4 }}>
                <button
                  type="submit"
                  disabled={pollSubmitting}
                  style={{
                    padding:'10px 20px',
                    borderRadius:8,
                    border:'none',
                    background: pollSubmitting ? tk.hint : '#6c5ce7',
                    color:'#fff',
                    fontSize:14,
                    fontFamily:tk.sans,
                    fontWeight:600,
                    cursor: pollSubmitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {pollSubmitting ? 'Submitting…' : 'Submit feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {thanksOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="thanks-title"
          style={{
            position:'fixed',
            inset:0,
            zIndex:1001,
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            padding:20,
            background:'rgba(0,0,0,0.55)',
            boxSizing:'border-box',
          }}
          onClick={() => setThanksOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width:'100%',
              maxWidth:400,
              background:tk.surface,
              border:`0.5px solid ${tk.border}`,
              borderRadius:14,
              padding:'24px 22px 20px',
              boxShadow:'0 20px 50px rgba(0,0,0,0.35)',
            }}
          >
            <h3
              id="thanks-title"
              style={{
                margin:'0 0 10px',
                fontFamily:tk.serif,
                fontSize:20,
                fontWeight:700,
                color:tk.title,
              }}
            >
              Thank you
            </h3>
            <p style={{ margin:'0 0 20px', fontSize:14, lineHeight:1.6, color:tk.descText }}>
              {thanksSaved
                ? 'Your feedback has been received. You did not need to fill every field — we appreciate whatever you shared.'
                : 'You do not need to fill every field. Thanks for taking a moment with this form.'}
            </p>
            <button
              type="button"
              onClick={() => setThanksOpen(false)}
              style={{
                width:'100%',
                padding:'11px 16px',
                borderRadius:8,
                border:'none',
                background:'#6c5ce7',
                color:'#fff',
                fontSize:14,
                fontFamily:tk.sans,
                fontWeight:600,
                cursor:'pointer',
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
