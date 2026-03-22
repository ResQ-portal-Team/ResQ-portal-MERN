import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CommunityHubHeader from './CommunityHubHeader';
import { API_BASE } from '../config';
import { youtubeEmbedSrcWithAutoplay, youtubeEmbedUrl } from './communityHubVideo';

/* ─── Design tokens ─────────────────────────────────────────────────────────── */
const T = {
  bg:        '#080b10',
  surface:   '#0e1117',
  surfaceAlt:'#131720',
  border:    'rgba(255,255,255,0.07)',
  text:      '#e6e1d8',
  muted:     '#7a7690',
  hint:      '#3e3d4e',
  accent:    '#6c5ce7',
  accentLo:  'rgba(108,92,231,0.15)',
  accentBdr: 'rgba(108,92,231,0.3)',
  amber:     '#f59e0b',
  amberLo:   'rgba(245,158,11,0.1)',
  amberBdr:  'rgba(245,158,11,0.25)',
  red:       '#ef4444',
  redLo:     'rgba(239,68,68,0.08)',
  redBdr:    'rgba(239,68,68,0.2)',
  serif:     "'Playfair Display', 'Georgia', serif",
  sans:      "'DM Sans', 'Helvetica Neue', sans-serif",
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&display=swap');
  @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin   { to { transform: rotate(360deg); } }
  .back-btn:hover   { border-color: rgba(255,255,255,0.25) !important; color: #e6e1d8 !important; }
  .fact-row + .fact-row { border-top: 0.5px solid rgba(255,255,255,0.07); }
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

/* ─── Spinner ────────────────────────────────────────────────────────────────── */
const Spinner = () => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, padding:'72px 0', color:'#7a7690', fontSize:14, fontFamily:T.sans }}>
    <div style={{ width:28, height:28, border:'2px solid rgba(255,255,255,0.07)', borderTop:'2px solid #6c5ce7', borderRadius:'50%', animation:'spin 0.75s linear infinite' }} />
    Loading event…
  </div>
);

/* ─── FactRow ────────────────────────────────────────────────────────────────── */
const FactRow = ({ icon, label, value }) =>
  value ? (
    <div className="fact-row" style={{ display:'flex', alignItems:'flex-start', gap:11, padding:'12px 0' }}>
      <span style={{ fontSize:14, marginTop:2, flexShrink:0, lineHeight:1 }}>{icon}</span>
      <div>
        <p style={{ margin:'0 0 3px', fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase', color:'#3e3d4e' }}>{label}</p>
        <p style={{ margin:0, fontSize:13.5, color:'#cdc9d8', lineHeight:1.55 }}>{value}</p>
      </div>
    </div>
  ) : null;

/* ─── Main ───────────────────────────────────────────────────────────────────── */
export default function CommunityHubEventDetail() {
  const { eventId } = useParams();
  const navigate    = useNavigate();
  const [event, setEvent]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const videoRef = useRef(null);

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
  const ytSrc   = ytEmbed ? youtubeEmbedSrcWithAutoplay(ytEmbed) : null;

  useEffect(() => {
    if (!event?.videoUrl || ytEmbed) return;
    const el = videoRef.current;
    if (!el) return;
    el.muted = false;
    el.play?.().catch?.(() => {});
  }, [event, ytEmbed]);

  const when = event
    ? [fmt(event.startDateTime), event.endDateTime ? fmt(event.endDateTime) : null].filter(Boolean).join(' – ')
    : null;

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.sans }}>
      <style>{GLOBAL_CSS}</style>
      <CommunityHubHeader sticky />

      <main style={{ width:'100%', maxWidth:'none', margin:0, padding:'28px 0 80px 16px', boxSizing:'border-box' }}>

        {/* Back */}
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate('/community-hub/content')}
          style={{
            display:'inline-flex', alignItems:'center', gap:7,
            background:'none', border:'0.5px solid rgba(255,255,255,0.1)',
            borderRadius:8, color:'#7a7690', fontSize:13,
            fontFamily:T.sans, fontWeight:500, padding:'7px 15px',
            cursor:'pointer', marginBottom:28,
            transition:'border-color .18s, color .18s',
          }}
        >
          ← Back to events
        </button>

        {/* States */}
        {loading && <Spinner />}

        {!loading && error && (
          <p role="alert" style={{
            background:'rgba(239,68,68,0.08)', border:'0.5px solid rgba(239,68,68,0.2)',
            borderRadius:10, color:'#ef4444', fontSize:14, padding:'13px 18px', margin:0,
          }}>
            {error}
          </p>
        )}

        {!loading && !error && !event && (
          <p style={{ color:'#7a7690', fontSize:15, textAlign:'center', padding:'60px 0' }}>
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
                      outline:'1px solid rgba(255,255,255,0.04)',
                    }}>
                      {ytSrc ? (
                        <iframe
                          title={`Video: ${event.title}`}
                          src={ytSrc}
                          style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:'none' }}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          ref={videoRef}
                          key={event.videoUrl}
                          src={event.videoUrl}
                          controls
                          playsInline
                          autoPlay
                          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'contain' }}
                          onLoadedData={(e) => {
                            e.currentTarget.muted = false;
                            e.currentTarget.play?.().catch?.(() => {});
                          }}
                        />
                      )}
                    </div>
                    <p style={{ margin:'7px 0 0', fontSize:11.5, color:'#3e3d4e', fontStyle:'italic' }}>
                      Autoplay with sound — tap the video if your browser blocks it.
                    </p>
                  </section>
                ) : (
                  <div style={{
                    width:'100%',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    aspectRatio:'16/9', borderRadius:13,
                    background:'#131720', border:'0.5px solid rgba(255,255,255,0.07)',
                    color:'#3e3d4e', fontSize:13,
                  }}>
                    No video available
                  </div>
                )}

                {/* Description */}
                {event.description && (
                  <div style={{
                    background:'#0f1218', border:'0.5px solid rgba(255,255,255,0.07)',
                    borderRadius:12, padding:'18px 20px',
                  }}>
                    <p style={{ margin:0, fontSize:14.5, lineHeight:1.8, color:'#ada9bc' }}>
                      {event.description}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Sidebar: event details ── */}
              <aside
                className="sidebar"
                style={{
                  background:'#0e1117', border:'0.5px solid rgba(255,255,255,0.07)',
                  borderRadius:12, padding:'4px 16px 12px',
                  position:'sticky', top:20,
                }}
                aria-label="Event information"
              >
                {event.imageUrl && (
                  <div style={{
                    margin:'0 -16px 14px', borderRadius:10, overflow:'hidden',
                    border:'0.5px solid rgba(255,255,255,0.08)',
                    background:'#131720',
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
                  margin:'0 0 14px', fontFamily:T.serif, fontWeight:700,
                  fontSize:'clamp(18px,2.2vw,24px)', lineHeight:1.25, color:'#f0ece3',
                }}>
                  {event.title}
                </h1>
                <p style={{
                  margin:'0 0 2px', fontSize:10, fontWeight:700,
                  letterSpacing:'0.09em', textTransform:'uppercase', color:'#3e3d4e',
                }}>
                  Details
                </p>
                <FactRow icon="🏷" label="Category" value={event.category || 'Event'} />
                {event.finished && (
                  <FactRow
                    icon="⏱"
                    label="Status"
                    value={event.finishedByManual && !event.finishedByDate ? 'Closed by admin' : 'Event ended'}
                  />
                )}
                <FactRow icon="🗓" label="When"      value={when} />
                <FactRow icon="📍" label="Where"     value={event.location} />
                <FactRow icon="👤" label="Organizer" value={event.organizer} />
                <FactRow icon="✉️" label="Contact"   value={event.contactInfo} />
              </aside>

            </div>
          </article>
        )}
      </main>
    </div>
  );
}
