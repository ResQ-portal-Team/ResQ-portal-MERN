import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CommunityHubHeader from './CommunityHubHeader';
import { API_BASE } from '../config';
import SiteFooter from '../SiteFooter';

/* ─── Styles ────────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,400;1,600&family=Outfit:wght@300;400;500;600&display=swap');

  :root {
    /* Muted “light” — softer than stark white/slate-50 */
    --bg:          #d4dce6;
    --bg-1:        #e4eaf1;
    --bg-2:        #c9d4e0;
    --border:      rgba(15,23,42,0.11);
    --border-hi:   rgba(15,23,42,0.18);
    --gold:        #92400e;
    --gold-2:      #b45309;
    --gold-dim:    rgba(146,64,14,0.14);
    --gold-glow:   rgba(146,64,14,0.07);
    --text:        #1e293b;
    --text-2:      #475569;
    --text-3:      #64748b;
    --skel-mid:    #94a3b8;
    --radius:      14px;
    --dis:         'Cormorant Garamond', Georgia, serif;
    --body:        'Outfit', sans-serif;
  }

  html.dark {
    --bg:          #0a0c10;
    --bg-1:        #0f1218;
    --bg-2:        #151b24;
    --border:      rgba(255,255,255,0.06);
    --border-hi:   rgba(255,255,255,0.13);
    --gold:        #c9a84c;
    --gold-2:      #e2c47a;
    --gold-dim:    rgba(201,168,76,0.12);
    --gold-glow:   rgba(201,168,76,0.06);
    --text:        #e4e0d8;
    --text-2:      #8a8d96;
    --text-3:      #555c6a;
    --skel-mid:    #1c2332;
  }

  *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ch { min-height: 100vh; background: var(--bg); font-family: var(--body); color: var(--text); }

  /* ── Hero ────────────────────────────────────────────── */
  .ch-hero {
    position: relative;
    overflow: hidden;
    padding: 48px 40px 32px;
    border-bottom: 1px solid var(--border);
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(240px, 280px);
    gap: 20px 28px;
    align-items: start;
  }
  .ch-hero-orb-2 {
    position: absolute;
    bottom: -200px;
    left: -80px;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }
  html:not(.dark) .ch-hero-orb-2 {
    opacity: 0.42;
  }
  .ch-hero-orb {
    position: relative;
    width: 100%;
    max-width: 280px;
    margin-left: auto;
    z-index: 1;
  }
  .ch-hero-orb-glow {
    position: absolute;
    top: -120px;
    right: -80px;
    width: 520px;
    height: 520px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(201,168,76,0.09) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }
  html:not(.dark) .ch-hero-orb-glow {
    opacity: 0.42;
  }
  .ch-hero-orb .ch-cal {
    position: relative;
    top: auto;
    width: 100%;
    max-width: 256px;
    margin-left: auto;
    margin-right: 0;
  }
  .ch-hero-content {
    position: relative;
    z-index: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .ch-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--gold);
    margin: 0;
  }
  .ch-eyebrow-line {
    width: 100px;
    height: 1.5px;
    background: var(--gold);
    opacity: 0.6;
  }
  .ch-hero-title {
    font-family: var(--dis);
    font-size: clamp(36px, 5.5vw, 72px);
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.02em;
    color: var(--text);
    max-width: 820px;
    margin: 0;
  }
  .ch-hero-title em {
    font-style: italic;
    font-weight: 600;
    color: var(--gold);
    display: block;
    margin-top: 0.12em;
    line-height: 1.05;
  }
  .ch-hero-rule {
    width: 64px;
    height: 2px;
    background: linear-gradient(90deg, var(--gold), transparent);
    margin: 0;
    flex-shrink: 0;
  }
  .ch-hero-sub {
    font-size: 14px;
    font-weight: 300;
    line-height: 1.55;
    color: var(--text-2);
    max-width: 440px;
    letter-spacing: 0.02em;
    margin: 0;
  }

  /* ── Main ────────────────────────────────────────────── */
  .ch-main {
    padding: 72px 48px 120px;
    max-width: none;
  }

  /* ── Section ─────────────────────────────────────────── */
  .ch-section + .ch-section { margin-top: 80px; }

  .ch-section-hd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 20px;
    margin-bottom: 36px;
  }
  .ch-section-left {
    display: flex;
    align-items: baseline;
    gap: 16px;
  }
  .ch-section-title {
    font-family: var(--dis);
    font-size: 28px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--text);
  }
  .ch-section-count {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.1em;
    color: var(--text-3);
    text-transform: uppercase;
  }
  .ch-section-line {
    flex: 1;
    height: 1px;
    background: var(--border);
    min-width: 40px;
  }

  /* ── Upcoming head with calendar ─────────────────────── */
  .ch-up-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 32px;
    flex-wrap: wrap;
    margin-bottom: 36px;
  }
  .ch-up-left {
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1 1 0;
  }
  .ch-up-title-row {
    display: flex;
    align-items: baseline;
    gap: 16px;
  }

  /* ── Calendar ────────────────────────────────────────── */
  .ch-cal {
    flex: 0 0 auto;
    width: 256px;
    background: var(--bg-1);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
    position: sticky;
    top: 80px;
  }
  .ch-cal-clock {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.1em;
    color: var(--gold);
    margin-bottom: 12px;
    font-variant-numeric: tabular-nums;
  }
  .ch-cal-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .ch-cal-month {
    font-family: var(--dis);
    font-size: 15px;
    font-weight: 600;
    color: var(--text);
  }
  .ch-cal-btn {
    width: 28px; height: 28px;
    border: 1px solid var(--border);
    border-radius: 7px;
    background: transparent;
    color: var(--text-2);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.15s;
    display: flex; align-items: center; justify-content: center;
  }
  .ch-cal-btn:hover { background: var(--gold-dim); border-color: rgba(201,168,76,0.3); color: var(--gold); }
  .ch-cal-wdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    margin-bottom: 4px;
  }
  .ch-cal-wdays span {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-3);
    text-align: center;
  }
  .ch-cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }
  .ch-cal-cell {
    aspect-ratio: 1;
    max-height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 400;
    color: var(--text-3);
    border-radius: 5px;
    border: 1px solid transparent;
  }
  .ch-cal-cell--muted { opacity: 0.2; }
  .ch-cal-cell--today {
    color: var(--gold);
    border-color: rgba(201,168,76,0.35);
    background: var(--gold-dim);
    font-weight: 600;
  }
  .ch-cal-cell--event:not(.ch-cal-cell--muted) {
    color: var(--text);
    font-weight: 600;
    background: rgba(255,255,255,0.04);
    border-color: var(--border-hi);
    box-shadow: inset 0 -1.5px 0 var(--gold);
  }
  .ch-cal-legend {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid var(--border);
    font-size: 9px;
    color: var(--text-3);
    display: flex;
    align-items: center;
    gap: 6px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .ch-cal-legend-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--gold);
    flex-shrink: 0;
  }

  /* ── Event grid (spaced cards; each post is its own rounded block) ─ */
  .ch-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
    background: transparent;
    border: none;
    border-radius: 0;
    overflow: visible;
  }

  /* ── Event card ──────────────────────────────────────── */
  .ch-card {
    display: flex;
    flex-direction: column;
    background: var(--bg-1);
    text-decoration: none;
    color: inherit;
    position: relative;
    overflow: hidden;
    transition: background 0.2s, box-shadow 0.2s, border-color 0.2s;
    padding: 12px;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    box-sizing: border-box;
    box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
  }
  html.dark .ch-card {
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.25);
  }
  .ch-card::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--gold-glow) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
  }
  .ch-card:hover {
    background: var(--bg-2);
    border-color: var(--border-hi);
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  }
  html.dark .ch-card:hover {
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
  }
  .ch-card:hover::after { opacity: 1; }
  .ch-card--finished { opacity: 0.55; }
  .ch-card--finished:hover { opacity: 0.8; }

  /* Poster — inner radius merges with body into one tile */
  .ch-poster {
    position: relative;
    width: 100%;
    aspect-ratio: 16/7;
    overflow: hidden;
    background: var(--bg-2);
    border-radius: 10px 10px 0 0;
  }
  .ch-poster img {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    filter: brightness(0.85) saturate(0.9);
  }
  .ch-card:hover .ch-poster img { transform: scale(1.06); filter: brightness(0.9) saturate(1); }
  .ch-poster-fallback {
    width: 100%; height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background:
      repeating-linear-gradient(-45deg, transparent, transparent 18px, rgba(255,255,255,0.012) 18px, rgba(255,255,255,0.012) 19px);
  }
  .ch-poster-icon {
    font-size: 28px;
    opacity: 0.15;
  }
  .ch-poster-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(10,12,16,0.7) 0%, transparent 60%);
  }

  /* Badges */
  .ch-badge {
    position: absolute;
    top: 14px;
    left: 14px;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--bg);
    background: var(--gold);
    border-radius: 4px;
    padding: 4px 9px;
    z-index: 1;
  }
  .ch-badge-done {
    position: absolute;
    top: 14px;
    right: 14px;
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-2);
    background: rgba(10,12,16,0.75);
    backdrop-filter: blur(8px);
    border: 1px solid var(--border-hi);
    border-radius: 4px;
    padding: 4px 9px;
    z-index: 1;
  }

  /* Card body */
  .ch-body {
    padding: 18px 16px 18px;
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 0;
    border-radius: 0 0 10px 10px;
  }
  .ch-card-num {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.15em;
    color: var(--text-3);
    text-transform: uppercase;
    margin-bottom: 10px;
  }
  .ch-card-title {
    font-family: var(--dis);
    font-size: 22px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.01em;
    color: var(--text);
    margin-bottom: 10px;
    transition: color 0.2s;
  }
  .ch-card:hover .ch-card-title { color: var(--gold-2); }
  .ch-card-desc {
    font-size: 13px;
    font-weight: 300;
    line-height: 1.7;
    color: var(--text-2);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 20px;
    letter-spacing: 0.01em;
  }

  /* Meta */
  .ch-meta {
    margin-top: auto;
    padding-top: 16px;
    border-top: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .ch-meta-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 11.5px;
    color: var(--text-2);
    line-height: 1.5;
  }
  .ch-meta-ico { flex-shrink: 0; opacity: 0.5; font-size: 11px; margin-top: 1px; }
  .ch-meta-lbl { color: rgba(201,168,76,0.65); font-weight: 500; margin-right: 4px; }

  /* CTA */
  .ch-cta {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 20px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--gold);
  }
  .ch-cta-arrow {
    width: 20px;
    height: 1px;
    background: var(--gold);
    position: relative;
    transition: width 0.25s ease;
  }
  .ch-cta-arrow::after {
    content: '';
    position: absolute;
    right: 0;
    top: -3px;
    width: 6px;
    height: 6px;
    border-top: 1px solid var(--gold);
    border-right: 1px solid var(--gold);
    transform: rotate(45deg);
  }
  .ch-card:hover .ch-cta-arrow { width: 32px; }

  /* ── States ──────────────────────────────────────────── */
  .ch-state {
    text-align: center;
    padding: 100px 24px;
    color: var(--text-2);
  }
  .ch-state-icon {
    font-size: 36px;
    margin-bottom: 20px;
    opacity: 0.6;
  }
  .ch-state-title {
    font-family: var(--dis);
    font-size: 28px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 10px;
    letter-spacing: -0.01em;
  }
  .ch-state-sub { font-size: 14px; font-weight: 300; line-height: 1.7; }
  .ch-error { color: #d96262; }

  /* ── Skeleton ────────────────────────────────────────── */
  .ch-skel {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
    background: transparent;
    border: none;
    border-radius: 0;
    overflow: visible;
  }
  .ch-skel-card {
    background: var(--bg-1);
    overflow: hidden;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    padding: 12px;
    box-sizing: border-box;
    box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
  }
  html.dark .ch-skel-card {
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.25);
  }
  .ch-skel-poster {
    width: 100%;
    aspect-ratio: 16/7;
    border-radius: 10px 10px 0 0;
    background: linear-gradient(90deg, var(--bg-2) 25%, var(--skel-mid) 50%, var(--bg-2) 75%);
    background-size: 300% 100%;
    animation: skel 2s ease infinite;
  }
  .ch-skel-lines {
    padding: 18px 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    border-radius: 0 0 10px 10px;
  }
  .ch-skel-line {
    height: 11px;
    border-radius: 4px;
    background: linear-gradient(90deg, var(--bg-2) 25%, var(--skel-mid) 50%, var(--bg-2) 75%);
    background-size: 300% 100%;
    animation: skel 2s ease infinite;
  }
  .ch-skel-line:nth-child(1) { width: 40%; animation-delay: 0.1s; }
  .ch-skel-line:nth-child(2) { width: 80%; animation-delay: 0.2s; }
  .ch-skel-line:nth-child(3) { width: 60%; animation-delay: 0.3s; }
  @keyframes skel { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  /* ── Responsive ──────────────────────────────────────── */
  @media (max-width: 900px) {
    .ch-hero {
      padding: 36px 24px 28px;
      grid-template-columns: 1fr;
      gap: 16px;
    }
    .ch-hero-orb {
      max-width: 300px;
      margin-left: 0;
    }
    .ch-main { padding: 52px 24px 80px; }
    .ch-up-head { flex-direction: column; }
    .ch-cal { width: 100%; max-width: 300px; position: relative; top: auto; }
  }
  @media (max-width: 640px) {
    .ch-hero { padding: 28px 16px 24px; }
    .ch-main { padding: 40px 16px 64px; }
    .ch-grid, .ch-skel { grid-template-columns: 1fr; }
  }
`;

/* ─── Helpers ───────────────────────────────────────────────────────────── */
const localDateKey = (d) => {
  if (!d) return null;
  try {
    const x = new Date(d);
    if (Number.isNaN(x.getTime())) return null;
    return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;
  } catch { return null; }
};

const fmt = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
};

const WDAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

/* ─── Calendar ──────────────────────────────────────────────────────────── */
const RealtimeCalendar = ({ eventDateKeys }) => {
  const [now, setNow] = useState(() => new Date());
  const [view, setView] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const year = view.getFullYear();
  const month = view.getMonth();
  const startPad = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevLast = new Date(year, month, 0).getDate();
  const todayKey = localDateKey(now);

  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push({ type: 'pad', day: prevLast - startPad + i + 1, key: `p${i}` });
  for (let d = 1; d <= daysInMonth; d++) {
    const dk = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cells.push({ type: 'day', day: d, dateKey: dk, key: dk });
  }
  const rem = cells.length % 7;
  for (let i = 1; i <= (rem === 0 ? 0 : 7 - rem); i++) cells.push({ type: 'pad', day: i, key: `n${i}` });

  const clockStr = now.toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  return (
    <aside className="ch-cal" aria-label="Calendar">
      <p className="ch-cal-clock">{clockStr}</p>
      <div className="ch-cal-nav">
        <button type="button" className="ch-cal-btn" onClick={() => setView(new Date(year, month-1, 1))} aria-label="Previous">‹</button>
        <span className="ch-cal-month">{view.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</span>
        <button type="button" className="ch-cal-btn" onClick={() => setView(new Date(year, month+1, 1))} aria-label="Next">›</button>
      </div>
      <div className="ch-cal-wdays">{WDAYS.map(w => <span key={w}>{w}</span>)}</div>
      <div className="ch-cal-grid">
        {cells.map(c => {
          const muted = c.type === 'pad';
          const isToday = !muted && c.dateKey === todayKey;
          const hasEv = !muted && eventDateKeys.has(c.dateKey);
          let cls = 'ch-cal-cell';
          if (muted) cls += ' ch-cal-cell--muted';
          if (isToday) cls += ' ch-cal-cell--today';
          if (hasEv) cls += ' ch-cal-cell--event';
          return <div key={c.key} className={cls}>{c.day}</div>;
        })}
      </div>
      <div className="ch-cal-legend">
        <span className="ch-cal-legend-dot" />
        <span>Event scheduled</span>
      </div>
    </aside>
  );
};

/* ─── Skeleton ──────────────────────────────────────────────────────────── */
const Skeleton = () => (
  <div className="ch-skel">
    {[0,1,2,3].map(i => (
      <div className="ch-skel-card" key={i}>
        <div className="ch-skel-poster" />
        <div className="ch-skel-lines">
          <div className="ch-skel-line" />
          <div className="ch-skel-line" />
          <div className="ch-skel-line" />
        </div>
      </div>
    ))}
  </div>
);

/* ─── EventCard ─────────────────────────────────────────────────────────── */
const EventCard = ({ ev, index }) => (
  <Link
    to={`/community-hub/content/${ev._id}`}
    className={`ch-card${ev.finished ? ' ch-card--finished' : ''}`}
  >
    <div className="ch-poster">
      {ev.imageUrl
        ? <img src={ev.imageUrl} alt="" loading="lazy" />
        : <div className="ch-poster-fallback"><span className="ch-poster-icon">◈</span></div>
      }
      <div className="ch-poster-overlay" />
      {ev.category && <span className="ch-badge">{ev.category}</span>}
      {ev.finished && (
        <span className="ch-badge-done">
          {ev.finishedByManual && !ev.finishedByDate ? 'Closed early' : 'Finished'}
        </span>
      )}
    </div>

    <div className="ch-body">
      <span className="ch-card-num">
        {String(index + 1).padStart(2, '0')}
      </span>
      <h3 className="ch-card-title">{ev.title}</h3>
      {ev.description && <p className="ch-card-desc">{ev.description}</p>}

      <div className="ch-meta">
        <div className="ch-meta-row">
          <span className="ch-meta-ico">◷</span>
          <span>
            <span className="ch-meta-lbl">When </span>
            {fmt(ev.startDateTime)}
            {ev.endDateTime ? ` – ${fmt(ev.endDateTime)}` : ''}
          </span>
        </div>
        {ev.location && (
          <div className="ch-meta-row">
            <span className="ch-meta-ico">◉</span>
            <span><span className="ch-meta-lbl">Where </span>{ev.location}</span>
          </div>
        )}
        {ev.organizer && (
          <div className="ch-meta-row">
            <span className="ch-meta-ico">◎</span>
            <span><span className="ch-meta-lbl">By </span>{ev.organizer}</span>
          </div>
        )}
        {ev.videoUrl && (
          <div className="ch-meta-row">
            <span className="ch-meta-ico">▶</span>
            <span>Recording available</span>
          </div>
        )}
      </div>

      <span className="ch-cta">
        {ev.finished ? 'View recap' : 'View event'}
        <span className="ch-cta-arrow" aria-hidden />
      </span>
    </div>
  </Link>
);

/* ─── Sections ──────────────────────────────────────────────────────────── */
const UpcomingSection = ({ events }) => (
  <section className="ch-section" aria-labelledby="ch-upcoming">
    <div className="ch-up-head">
      <div className="ch-up-left">
        <div className="ch-up-title-row">
          <h3 id="ch-upcoming" className="ch-section-title">Upcoming events</h3>
          <span className="ch-section-count">{events.length} scheduled</span>
        </div>
      </div>
    </div>
    <div className="ch-grid">
      {events.map((ev, i) => <EventCard key={ev._id} ev={ev} index={i} />)}
    </div>
  </section>
);

const FinishedSection = ({ events }) => (
  <section className="ch-section" aria-labelledby="ch-finished">
    <div className="ch-section-hd">
      <div className="ch-section-left">
        <h3 id="ch-finished" className="ch-section-title">Past events</h3>
        <span className="ch-section-count">{events.length} archived</span>
      </div>
      <div className="ch-section-line" />
    </div>
    <div className="ch-grid">
      {events.map((ev, i) => <EventCard key={ev._id} ev={ev} index={i} />)}
    </div>
  </section>
);

/* ─── Page ──────────────────────────────────────────────────────────────── */
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
    return () => { cancelled = true; };
  }, []);

  const empty = !loading && !error && upcoming.length === 0 && finished.length === 0;

  const heroEventDateKeys = useMemo(() => {
    const s = new Set();
    upcoming.forEach((ev) => {
      const k = localDateKey(ev.startDateTime);
      if (k) s.add(k);
    });
    return s;
  }, [upcoming]);

  return (
    <div className="ch flex min-h-screen flex-col">
      <style>{STYLES}</style>
      <CommunityHubHeader sticky />

      {/* Hero */}
      <div className="ch-hero">
        <div className="ch-hero-orb-2" aria-hidden />
        <div className="ch-hero-content">
          <p className="ch-eyebrow">
            <span className="ch-eyebrow-line" />
            Community Hub
            <span className="ch-eyebrow-line" />
          </p>
          <h2 className="ch-hero-title">
            What&apos;s on
            <em>near you</em>
          </h2>
          <div className="ch-hero-rule" />
          <p className="ch-hero-sub">
            Upcoming events sorted by soonest start date. Finished events are archived automatically or by an admin.
          </p>
        </div>
        <div className="ch-hero-orb">
          <div className="ch-hero-orb-glow" aria-hidden />
          <RealtimeCalendar eventDateKeys={heroEventDateKeys} />
        </div>
      </div>

      {/* Content */}
      <main id="hub-content" className="ch-main flex-1" aria-label="Community Hub Events">
        {loading && <Skeleton />}

        {error && (
          <div className="ch-state">
            <div className="ch-state-icon">⚠</div>
            <p className="ch-state-title ch-error">Something went wrong</p>
            <p className="ch-state-sub">{error}</p>
          </div>
        )}

        {empty && (
          <div className="ch-state">
            <div className="ch-state-icon">◈</div>
            <p className="ch-state-title">Nothing published yet</p>
            <p className="ch-state-sub">No events here — check back soon.</p>
          </div>
        )}

        {!loading && !error && !empty && (
          <>
            {upcoming.length > 0 && <UpcomingSection events={upcoming} />}
            {finished.length > 0 && <FinishedSection events={finished} />}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default CommunityHubContent;
