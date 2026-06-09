"use client";

import type { Candidate } from "@/lib/types";
import { NDS } from "@/lib/nds-data";
import { Icon, Avatar, RecBadge, toneColor, scoreColor } from "./primitives";
import { FunnelChart, Sparkline, CertHeatmap, MiniDonut } from "./charts";
import { SectionCard } from "./section-card";

function KpiTile({
  icon,
  label,
  value,
  suffix,
  delta,
  deltaTone = "pos",
  spark,
  delay = 0,
}: {
  icon: string;
  label: string;
  value: number | string;
  suffix?: string;
  delta?: string;
  deltaTone?: string;
  spark?: number[];
  delay?: number;
}) {
  return (
    <div className="panel fade-up" style={{ padding: 18, animationDelay: `${delay}ms` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            display: "grid",
            placeItems: "center",
            background: "var(--ac-soft)",
            color: "var(--ac-hi)",
          }}
        >
          <Icon name={icon} size={16} />
        </div>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--tx-2)" }}>{label}</span>
        {delta && (
          <span
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              fontSize: 11.5,
              fontWeight: 700,
              color: toneColor(deltaTone),
            }}
          >
            <Icon name={deltaTone === "pos" ? "arrowUp" : "arrowDown"} size={12} stroke={2.2} />
            {delta}
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
        <div className="mono" style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1 }}>
          {value}
          {suffix && <span style={{ fontSize: 16, color: "var(--tx-2)", marginLeft: 2 }}>{suffix}</span>}
        </div>
        {spark && <Sparkline data={spark} width={92} height={34} fill={false} color="var(--ac-hi)" />}
      </div>
    </div>
  );
}

export function Dashboard({
  candidates,
  onOpen,
  setView,
}: {
  candidates: Candidate[];
  onOpen: (c: Candidate) => void;
  setView: (v: string) => void;
}) {
  const k = NDS.kpis;
  const top = [...candidates].sort((a, b) => b.match - a.match).slice(0, 5);
  const newCount = candidates.filter((c) => c.status === "new").length;
  const strongCount = candidates.filter((c) => c.recommendation === "STRONG").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="fade-up" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>
            Tuesday · 9 June 2026
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em" }}>Good morning, Farah</h2>
          <p style={{ fontSize: 13.5, color: "var(--tx-2)", marginTop: 3 }}>
            <b style={{ color: "var(--pos)" }}>{newCount} new candidates</b> in pipeline ·{" "}
            <b style={{ color: "var(--pos)" }}>{strongCount}</b> flagged as Strong Hire for review.
          </p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 9 }}>
          <button className="btn btn-ghost" onClick={() => setView("analytics")}>
            <Icon name="analytics" size={16} /> Analytics
          </button>
          <button className="btn btn-primary" onClick={() => setView("upload")}>
            <Icon name="upload" size={16} /> Upload résumés
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
        <KpiTile icon="user" label="Candidates" value={candidates.length || k.candidates} delta="+12" delay={0} />
        <KpiTile
          icon="star"
          label="Shortlisted"
          value={candidates.filter((c) => c.status === "shortlisted").length || k.shortlisted}
          delta="+5"
          delay={50}
        />
        <KpiTile
          icon="bolt"
          label="Avg AI Match"
          value={
            candidates.length
              ? Math.round(candidates.reduce((s, c) => s + c.match, 0) / candidates.length)
              : k.avgScore
          }
          suffix="%"
          delta="+4%"
          spark={NDS.qualityTrend}
          delay={100}
        />
        <KpiTile icon="clock" label="Time to Shortlist" value={k.timeToShortlist} suffix="d" delta="-0.6d" delay={150} />
        <KpiTile icon="briefcase" label="Open Roles" value={k.openRoles} delta="+2" deltaTone="neg" delay={200} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 18 }} className="dash-grid">
        <SectionCard
          title="Hiring Funnel"
          sub="Pipeline conversion across all open roles"
          delay={120}
          action={
            <span className="chip">
              <Icon name="trend" size={13} style={{ color: "var(--pos)" }} /> 1.2% hire rate
            </span>
          }
        >
          <FunnelChart data={NDS.funnel} />
        </SectionCard>

        <SectionCard title="Candidate Quality" sub="Avg AI match of incoming résumés" delay={160}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <div className="mono" style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1 }}>
              82<span style={{ fontSize: 18, color: "var(--tx-2)" }}>%</span>
            </div>
            <div style={{ whiteSpace: "nowrap" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: "var(--pos)",
                }}
              >
                <Icon name="arrowUp" size={13} stroke={2.2} /> +10 pts
              </div>
              <div style={{ fontSize: 11.5, color: "var(--tx-2)" }}>vs. 7 months ago</div>
            </div>
          </div>
          <Sparkline data={NDS.qualityTrend} width={300} height={70} color="var(--pos)" />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
              fontSize: 10.5,
              color: "var(--tx-3)",
            }}
          >
            <span>Dec</span>
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
          </div>
        </SectionCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 18 }} className="dash-grid">
        <SectionCard
          title="Top Candidates"
          sub="Highest AI match across active pipelines"
          delay={180}
          action={
            <button className="btn btn-ghost btn-sm" onClick={() => setView("database")}>
              View all <Icon name="chevR" size={14} />
            </button>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {top.map((c, i) => (
              <button
                key={c.id}
                onClick={() => onOpen(c)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 13,
                  padding: "11px 10px",
                  borderRadius: 10,
                  textAlign: "left",
                  transition: "background .15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-3)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span
                  className="mono"
                  style={{
                    width: 18,
                    fontSize: 13,
                    fontWeight: 600,
                    color: i < 3 ? "var(--ac-hi)" : "var(--tx-3)",
                  }}
                >
                  {i + 1}
                </span>
                <Avatar c={c} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "var(--tx-2)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.title} · {c.experience}y
                  </div>
                </div>
                <div className="dash-hide-sm" style={{ flexShrink: 0 }}>
                  <RecBadge rec={c.recommendation} size="sm" />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <MiniDonut value={c.match} size={34} stroke={4} />
                  <span className="mono" style={{ fontSize: 14, fontWeight: 600, width: 30, color: scoreColor(c.match) }}>
                    {c.match}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Role Demand" sub="Open requisitions by pipeline" delay={220}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {NDS.roleDemand.map((r) => (
              <div key={r.role}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 10,
                    marginBottom: 7,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: "var(--tx-1)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r.role}
                  </span>
                  <span className="mono" style={{ fontSize: 11.5, color: "var(--tx-2)", flexShrink: 0 }}>
                    {r.open} open
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, height: 6, background: "var(--bg-4)", borderRadius: 99, overflow: "hidden" }}>
                    <div
                      className="fade-up"
                      style={{
                        width: `${r.avg}%`,
                        height: "100%",
                        borderRadius: 99,
                        background: scoreColor(r.avg),
                      }}
                    />
                  </div>
                  <span className="mono" style={{ fontSize: 11.5, color: "var(--tx-3)", width: 64, textAlign: "right" }}>
                    {r.candidates} appl.
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Certification Coverage" sub="Frequency across the active candidate pool" delay={260}>
        <CertHeatmap data={NDS.certHeat} />
      </SectionCard>
    </div>
  );
}
