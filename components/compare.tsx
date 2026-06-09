"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Candidate } from "@/lib/types";
import { NDS } from "@/lib/nds-data";
import { Icon, Avatar, RecBadge, scoreColor } from "./primitives";

function RadarOverlay({
  cands,
  colors,
}: {
  cands: Candidate[];
  colors: string[];
}) {
  const axes = NDS.RADAR_AXES;
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 40;
  const n = axes.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (val: number, i: number) => [
    cx + Math.cos(angle(i)) * (val / 100) * R,
    cy + Math.sin(angle(i)) * (val / 100) * R,
  ];
  const poly = (vals: number[]) => vals.map((v, i) => pt(v, i).join(",")).join(" ");
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 60);
    return () => clearTimeout(t);
  }, []);
  return (
    <svg width={size} height={size} style={{ overflow: "visible" }}>
      {[25, 50, 75, 100].map((rr) => (
        <polygon
          key={rr}
          points={axes.map((_, i) => pt(rr, i).join(",")).join(" ")}
          fill="none"
          stroke="var(--line)"
          strokeWidth="1"
          opacity={rr === 100 ? 0.9 : 0.45}
        />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pt(100, i);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" strokeWidth="1" opacity="0.45" />;
      })}
      {cands.map((c, ci) => (
        <polygon
          key={c.id}
          points={poly(c.radar)}
          fill={`color-mix(in srgb, ${colors[ci]} 10%, transparent)`}
          stroke={colors[ci]}
          strokeWidth="2"
          style={{
            transition: "all 1s cubic-bezier(.2,.7,.2,1)",
            transformOrigin: "center",
            transform: shown ? "scale(1)" : "scale(0.1)",
            opacity: shown ? 1 : 0,
            transitionDelay: `${ci * 120}ms`,
          }}
        />
      ))}
      {axes.map((ax, i) => {
        const [x, y] = pt(120, i);
        const anchor =
          Math.abs(Math.cos(angle(i))) < 0.3 ? "middle" : Math.cos(angle(i)) > 0 ? "start" : "end";
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            style={{ fontSize: 9.5, fontWeight: 600, fill: "var(--tx-2)" }}
          >
            {ax.split(" ")[0]}
          </text>
        );
      })}
    </svg>
  );
}

export function CompareView({
  compareSet,
  allCandidates,
  onOpen,
  onRemove,
  onAdd,
  setView,
}: {
  compareSet: string[];
  allCandidates: Candidate[];
  onOpen: (c: Candidate) => void;
  onRemove: (id: string) => void;
  onAdd: (id: string) => void;
  setView: (v: string) => void;
}) {
  const cands = compareSet
    .map((id) => allCandidates.find((c) => c.id === id))
    .filter((c): c is Candidate => Boolean(c));

  if (cands.length < 2) {
    const pickable = allCandidates.filter((c) => !compareSet.includes(c.id)).slice(0, 6);
    return (
      <div style={{ maxWidth: 680, margin: "30px auto 0", textAlign: "center" }}>
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 16,
            margin: "0 auto 18px",
            display: "grid",
            placeItems: "center",
            background: "var(--ac-soft)",
            color: "var(--ac-hi)",
          }}
        >
          <Icon name="compare" size={28} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Compare candidates side by side</h2>
        <p style={{ fontSize: 13.5, color: "var(--tx-2)", marginTop: 6, marginBottom: 24 }}>
          Select at least 2 candidates to build a comparison matrix with overlaid capability radar and per-dimension
          winners.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 10,
            textAlign: "left",
          }}
        >
          {pickable.map((c) => (
            <button
              key={c.id}
              onClick={() => onAdd(c.id)}
              className="panel"
              style={{ padding: 14, display: "flex", alignItems: "center", gap: 11, textAlign: "left" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--ac)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
            >
              <Avatar c={c} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {c.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--tx-2)" }}>{c.match}% match</div>
              </div>
              <Icon name="plus" size={16} style={{ color: "var(--ac-hi)" }} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const rows: {
    key: string;
    label: string;
    fmt?: (c: Candidate) => number;
    suffix?: string;
    best?: "max" | "min";
    tone?: boolean;
    render?: (c: Candidate) => ReactNode;
  }[] = [
    { key: "match", label: "AI Match", fmt: (c) => c.match, suffix: "%", best: "max", tone: true },
    { key: "rec", label: "Recommendation", render: (c) => <RecBadge rec={c.recommendation} size="sm" /> },
    { key: "technical", label: "Technical", fmt: (c) => c.scores.technical, best: "max", tone: true },
    { key: "certification", label: "Certifications", fmt: (c) => c.scores.certification, best: "max", tone: true },
    { key: "experience_s", label: "Experience Score", fmt: (c) => c.scores.experience, best: "max", tone: true },
    { key: "communication", label: "Communication", fmt: (c) => c.scores.communication, best: "max", tone: true },
    { key: "quality", label: "Résumé Quality", fmt: (c) => c.scores.quality, best: "max", tone: true },
    { key: "experience", label: "Years Experience", fmt: (c) => c.experience, suffix: "y", best: "max" },
    {
      key: "certs",
      label: "Active Certs",
      fmt: (c) => c.certs.filter((x) => x.active).length,
      best: "max",
    },
    {
      key: "salary",
      label: "Salary band",
      render: (c) => (
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>
          {c.salaryBand.includes("S$") ? c.salaryBand : `${c.salaryExpect} jt/mo`}
        </span>
      ),
    },
    { key: "notice", label: "Notice Period", fmt: (c) => c.noticeDays, suffix: "d", best: "min" },
  ];

  const radarColors = ["var(--ac)", "var(--info)", "var(--pos)"];

  function bestId(row: (typeof rows)[number]) {
    if (!row.best || !row.fmt) return null;
    const vals = cands.map((c) => ({ id: c.id, v: row.fmt!(c) }));
    const target =
      row.best === "max" ? Math.max(...vals.map((x) => x.v)) : Math.min(...vals.map((x) => x.v));
    return vals.find((x) => x.v === target)?.id ?? null;
  }

  const grid = `180px repeat(${cands.length}, 1fr)`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>Comparison Matrix</h2>
          <p style={{ fontSize: 13, color: "var(--tx-2)", marginTop: 2 }}>
            {cands.length} candidates · best value per row highlighted
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => setView("database")}>
          <Icon name="plus" size={15} /> Add from database
        </button>
      </div>

      <div
        className="panel fade-up"
        style={{
          padding: 22,
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          gap: 24,
          alignItems: "center",
          animationDelay: "60ms",
        }}
      >
        <div style={{ display: "grid", placeItems: "center" }}>
          <RadarOverlay cands={cands} colors={radarColors} />
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            Capability overlay · {NDS.RADAR_AXES.length} dimensions
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {cands.map((c, i) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <span
                  style={{ width: 14, height: 4, borderRadius: 2, background: radarColors[i], flexShrink: 0 }}
                />
                <Avatar c={c} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--tx-2)" }}>{c.role.replace("Engineer", "Eng.")}</div>
                </div>
                <span className="mono" style={{ fontSize: 15, fontWeight: 600, color: scoreColor(c.match) }}>
                  {c.match}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel fade-up compare-matrix-scroll" style={{ overflow: "hidden", animationDelay: "120ms" }}>
        <div style={{ display: "grid", gridTemplateColumns: grid, borderBottom: "1px solid var(--line)" }}>
          <div style={{ padding: "16px 18px" }}></div>
          {cands.map((c) => (
            <div
              key={c.id}
              style={{
                padding: "16px 14px",
                textAlign: "center",
                borderLeft: "1px solid var(--line)",
                position: "relative",
              }}
            >
              <button
                onClick={() => onRemove(c.id)}
                style={{ position: "absolute", top: 10, right: 10, color: "var(--tx-3)" }}
                title="Remove"
              >
                <Icon name="x" size={14} />
              </button>
              <div
                style={{ display: "grid", placeItems: "center", gap: 7, cursor: "pointer" }}
                onClick={() => onOpen(c)}
              >
                <Avatar c={c} size={46} />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: "var(--tx-2)" }}>{c.seniority}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {rows.map((row, ri) => {
          const winId = bestId(row);
          return (
            <div
              key={row.key}
              style={{
                display: "grid",
                gridTemplateColumns: grid,
                borderBottom: ri < rows.length - 1 ? "1px solid var(--line)" : "none",
                background: ri % 2 ? "var(--bg-1)" : "transparent",
              }}
            >
              <div
                style={{
                  padding: "13px 18px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "var(--tx-2)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {row.label}
              </div>
              {cands.map((c) => {
                const isWin = winId === c.id;
                const val = row.fmt ? row.fmt(c) : null;
                return (
                  <div
                    key={c.id}
                    style={{
                      padding: "13px 14px",
                      textAlign: "center",
                      borderLeft: "1px solid var(--line)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 7,
                      background: isWin ? "var(--pos-soft)" : "transparent",
                    }}
                  >
                    {row.render ? (
                      row.render(c)
                    ) : (
                      <>
                        <span
                          className="mono"
                          style={{
                            fontSize: 14.5,
                            fontWeight: 600,
                            color: row.tone && val != null ? scoreColor(val) : "var(--tx-0)",
                          }}
                        >
                          {val}
                          {row.suffix || ""}
                        </span>
                        {isWin && <Icon name="check" size={13} stroke={2.6} style={{ color: "var(--pos)" }} />}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
