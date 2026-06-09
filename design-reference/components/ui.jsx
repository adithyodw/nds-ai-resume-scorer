/* ============================================================
   NDS TalentScore — UI primitives (icons, badges, gauges)
   ============================================================ */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ---------------- Icon set (stroke, 1.6) ---------------- */
const ICON_PATHS = {
  dashboard: "M3 3h7v7H3V3zm11 0h7v4h-7V3zM3 14h7v7H3v-7zm11-3h7v10h-7V11z",
  upload: "M12 16V4m0 0l-4 4m4-4l4 4M5 20h14",
  database: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  compare: "M9 3v18M3 7h6M3 12h6M3 17h6m6-14v18m6-12h-6m6 5h-6m6 5h-6",
  manager: "M3 21v-2a5 5 0 015-5h2m4-4a4 4 0 10-8 0 4 4 0 008 0zm2 13l2 2 4-4",
  analytics: "M4 20V10m6 10V4m6 16v-7m6 7V8",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6zm8-3a8 8 0 00-.2-1.8l2-1.6-2-3.4-2.4 1a8 8 0 00-3-1.8L14 1h-4l-.4 2.6a8 8 0 00-3 1.8l-2.4-1-2 3.4 2 1.6A8 8 0 004 12c0 .6.1 1.2.2 1.8l-2 1.6 2 3.4 2.4-1a8 8 0 003 1.8L10 23h4l.4-2.6a8 8 0 003-1.8l2.4 1 2-3.4-2-1.6c.1-.6.2-1.2.2-1.8z",
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-4.3-4.3",
  bell: "M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9zM13.7 21a2 2 0 01-3.4 0",
  filter: "M3 5h18l-7 8v6l-4 2v-8L3 5z",
  check: "M5 13l4 4L19 7",
  x: "M6 6l12 12M18 6L6 18",
  chevR: "M9 6l6 6-6 6",
  chevD: "M6 9l6 6 6-6",
  chevL: "M15 6l-6 6 6 6",
  arrowUp: "M12 19V5m0 0l-6 6m6-6l6 6",
  arrowDown: "M12 5v14m0 0l6-6m-6 6l-6-6",
  star: "M12 3l2.6 5.5 6 .8-4.3 4.2 1 6L12 17l-5.3 2.5 1-6L3.4 9.3l6-.8L12 3z",
  bolt: "M13 2L4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5z",
  doc: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm0 0v6h6",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z",
  sun: "M12 7a5 5 0 100 10 5 5 0 000-10zM12 1v2m0 18v2M4.2 4.2l1.4 1.4m12.8 12.8l1.4 1.4M1 12h2m18 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z",
  download: "M12 3v12m0 0l-4-4m4 4l4-4M4 21h16",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  mapPin: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1116 0zm-8 3a3 3 0 100-6 3 3 0 000 6z",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zm0-14v5l3 2",
  briefcase: "M20 7h-4V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM10 5h4v2h-4V5z",
  cash: "M2 6h20v12H2V6zm10 9a3 3 0 100-6 3 3 0 000 6z",
  shield: "M12 2l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5l8-3z",
  award: "M12 14a6 6 0 100-12 6 6 0 000 12zm-3 .5L7 22l5-2.5L17 22l-2-7.5",
  trend: "M22 7l-8.5 8.5-4-4L2 19m20-12h-6m6 0v6",
  flag: "M4 21V4m0 0h12l-2 4 2 4H4",
  plus: "M12 5v14m-7-7h14",
  grid: "M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5-5-5m5 5H9",
  refresh: "M21 12a9 9 0 11-3-6.7M21 4v4h-4",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7zm10 3a3 3 0 100-6 3 3 0 000 6z",
};

function Icon({ name, size = 18, stroke = 1.7, className = "", style = {} }) {
  const d = ICON_PATHS[name];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style} aria-hidden="true">
      {d && d.split("M").filter(Boolean).map((seg, i) => <path key={i} d={"M" + seg} />)}
    </svg>
  );
}

/* ---------------- score helpers ---------------- */
function scoreTone(v) { return v >= 85 ? "pos" : v >= 70 ? "warn" : "neg"; }
function toneColor(t) { return { pos: "var(--pos)", warn: "var(--warn)", neg: "var(--neg)", info: "var(--info)" }[t] || "var(--ac)"; }
function scoreColor(v) { return toneColor(scoreTone(v)); }

/* ---------------- Avatar ---------------- */
const AV_HUES = { AR: 245, SN: 290, BS: 200, DL: 160, RP: 20, MA: 320, HW: 55, PA: 130, FN: 0 };
function Avatar({ c, size = 40, ring = false }) {
  const hue = AV_HUES[c.initials] ?? 245;
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.3, flexShrink: 0,
      display: "grid", placeItems: "center",
      fontWeight: 700, fontSize: size * 0.36, letterSpacing: "-0.02em",
      color: `hsl(${hue} 70% 82%)`,
      background: `linear-gradient(145deg, hsl(${hue} 40% 22%), hsl(${hue} 45% 14%))`,
      border: `1px solid hsl(${hue} 40% 30%)`,
      boxShadow: ring ? `0 0 0 3px var(--bg-2), 0 0 0 4px hsl(${hue} 50% 40%)` : "none",
    }}>{c.initials}</div>
  );
}

/* ---------------- Recommendation badge ---------------- */
function RecBadge({ rec, size = "md" }) {
  const r = NDS.REC[rec];
  if (!r) return null;
  const col = toneColor(r.tone);
  const pad = size === "sm" ? "3px 9px" : "5px 12px";
  const fs = size === "sm" ? 11 : 12.5;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: pad,
      borderRadius: 999, fontSize: fs, fontWeight: 700, letterSpacing: "0.01em", whiteSpace: "nowrap",
      color: col, background: `color-mix(in srgb, ${col} 14%, transparent)`,
      border: `1px solid color-mix(in srgb, ${col} 35%, transparent)`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 99, background: col, boxShadow: `0 0 8px ${col}` }} />
      {r.label}
    </span>
  );
}

/* ---------------- Status pill ---------------- */
const STATUS_META = {
  new: { label: "New", tone: "info" },
  review: { label: "In Review", tone: "warn" },
  shortlisted: { label: "Shortlisted", tone: "pos" },
  rejected: { label: "Rejected", tone: "neg" },
};
function StatusPill({ status }) {
  const m = STATUS_META[status] || STATUS_META.new;
  const col = toneColor(m.tone);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px",
      borderRadius: 6, fontSize: 11.5, fontWeight: 600,
      color: col, background: `color-mix(in srgb, ${col} 12%, transparent)`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: 99, background: col }} />
      {m.label}
    </span>
  );
}

/* ---------------- Score Ring (animated) ---------------- */
function ScoreRing({ value, size = 92, stroke = 8, label = "MATCH", delay = 0, showSuffix = true }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf; const t0 = performance.now() + delay;
    const dur = 1100;
    const tick = (now) => {
      const p = Math.max(0, Math.min(1, (now - t0) / dur));
      const eased = 1 - Math.pow(1 - p, 3);
      setV(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, delay]);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const col = scoreColor(value);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-4)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circ}
          strokeDashoffset={circ * (1 - v / 100)}
          style={{ filter: `drop-shadow(0 0 6px color-mix(in srgb, ${col} 50%, transparent))` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
        <div>
          <div className="mono" style={{ fontSize: size * 0.30, fontWeight: 600, lineHeight: 1, color: col }}>
            {Math.round(v)}{showSuffix && <span style={{ fontSize: size * 0.15, opacity: .7 }}>%</span>}
          </div>
          {label && <div style={{ fontSize: size * 0.10, fontWeight: 700, letterSpacing: "0.14em", color: "var(--tx-2)", marginTop: 3 }}>{label}</div>}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Icon, Avatar, RecBadge, StatusPill, ScoreRing, scoreTone, toneColor, scoreColor, STATUS_META });
