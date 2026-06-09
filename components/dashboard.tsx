"use client";

import { useMemo, type ReactNode } from "react";
import type { Candidate } from "@/lib/types";
import {
  avgMatch,
  computeFunnel,
  computeRoleDemand,
  computeCertHeat,
  uniqueRoles,
} from "@/lib/stats";
import { Icon, Avatar, RecBadge, scoreColor } from "./primitives";
import { FunnelChart, CertHeatmap, MiniDonut } from "./charts";
import { SectionCard } from "./section-card";

function KpiTile({
  icon,
  label,
  value,
  suffix,
  delay = 0,
}: {
  icon: string;
  label: string;
  value: number | string;
  suffix?: string;
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
      </div>
      <div className="mono" style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1 }}>
        {value}
        {suffix && <span style={{ fontSize: 16, color: "var(--tx-2)", marginLeft: 2 }}>{suffix}</span>}
      </div>
    </div>
  );
}

function EmptyHint({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--tx-2)" }}>
      <div style={{ fontSize: 13.5 }}>{message}</div>
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
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
  const top = useMemo(() => [...candidates].sort((a, b) => b.match - a.match).slice(0, 5), [candidates]);
  const newCount = candidates.filter((c) => c.status === "new").length;
  const strongCount = candidates.filter((c) => c.recommendation === "STRONG").length;
  const shortlisted = candidates.filter((c) => c.status === "shortlisted").length;
  const funnel = useMemo(() => computeFunnel(candidates), [candidates]);
  const roleDemand = useMemo(() => computeRoleDemand(candidates), [candidates]);
  const certHeat = useMemo(() => computeCertHeat(candidates), [candidates]);
  const avg = avgMatch(candidates);

  const hireRate =
    candidates.length > 0
      ? Math.round((shortlisted / candidates.length) * 1000) / 10
      : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="fade-up" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>
            Tuesday · 9 June 2026
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em" }}>Good morning, Mba Icha</h2>
          <p style={{ fontSize: 13.5, color: "var(--tx-2)", marginTop: 3 }}>
            {candidates.length === 0 ? (
              <>No candidates in the pipeline yet — upload résumés to get started.</>
            ) : (
              <>
                <b style={{ color: "var(--pos)" }}>{newCount} new candidates</b> in pipeline ·{" "}
                <b style={{ color: "var(--pos)" }}>{strongCount}</b> flagged as Strong Hire for review.
              </>
            )}
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
        <KpiTile icon="user" label="Candidates" value={candidates.length} delay={0} />
        <KpiTile icon="star" label="Shortlisted" value={shortlisted} delay={50} />
        <KpiTile icon="bolt" label="Avg AI Match" value={avg} suffix="%" delay={100} />
        <KpiTile icon="briefcase" label="Active Roles" value={uniqueRoles(candidates)} delay={150} />
        <KpiTile icon="sparkle" label="Strong Hire" value={strongCount} delay={200} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 18 }} className="dash-grid">
        <SectionCard
          title="Hiring Funnel"
          sub="Live pipeline from uploaded résumés"
          delay={120}
          action={
            candidates.length > 0 ? (
              <span className="chip">
                <Icon name="trend" size={13} style={{ color: "var(--pos)" }} /> {hireRate}% shortlist rate
              </span>
            ) : undefined
          }
        >
          {candidates.length === 0 ? (
            <EmptyHint message="Upload résumés to populate the funnel." />
          ) : (
            <FunnelChart data={funnel} />
          )}
        </SectionCard>

        <SectionCard title="Candidate Quality" sub="Avg AI match of current pipeline" delay={160}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <div className="mono" style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1 }}>
              {avg}
              <span style={{ fontSize: 18, color: "var(--tx-2)" }}>%</span>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--tx-2)" }}>
              Across {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}
            </div>
          </div>
          {candidates.length === 0 && (
            <EmptyHint message="No scored résumés yet." />
          )}
        </SectionCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 18 }} className="dash-grid">
        <SectionCard
          title="Top Candidates"
          sub="Highest AI match in the live pipeline"
          delay={180}
          action={
            candidates.length > 0 ? (
              <button className="btn btn-ghost btn-sm" onClick={() => setView("database")}>
                View all <Icon name="chevR" size={14} />
              </button>
            ) : undefined
          }
        >
          {top.length === 0 ? (
            <EmptyHint
              message="No candidates yet."
              action={
                <button className="btn btn-primary btn-sm" onClick={() => setView("upload")}>
                  <Icon name="upload" size={15} /> Upload résumés
                </button>
              }
            />
          ) : (
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
          )}
        </SectionCard>

        <SectionCard title="Role Breakdown" sub="Candidates by target role" delay={220}>
          {roleDemand.length === 0 ? (
            <EmptyHint message="Roles appear after résumés are scored." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {roleDemand.slice(0, 6).map((r) => (
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
                      {r.candidates} in pool
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
                      {r.avg}% avg
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Certification Coverage" sub="From the current candidate pool" delay={260}>
        {certHeat.length === 0 ? (
          <EmptyHint message="Certifications are extracted when résumés are uploaded." />
        ) : (
          <CertHeatmap data={certHeat} />
        )}
      </SectionCard>
    </div>
  );
}
