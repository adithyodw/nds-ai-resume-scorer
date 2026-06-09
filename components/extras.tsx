"use client";

import { useMemo } from "react";
import type { Candidate } from "@/lib/types";
import { NDS } from "@/lib/nds-data";
import { Icon, toneColor } from "./primitives";
import { FunnelChart, Sparkline, CertHeatmap } from "./charts";
import { SectionCard } from "./section-card";

function MetricTile({
  label,
  value,
  suffix,
  sub,
  tone,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  sub?: string;
  tone?: string;
}) {
  return (
    <div className="panel fade-up" style={{ padding: 18 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--tx-2)", marginBottom: 10 }}>{label}</div>
      <div
        className="mono"
        style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.03em", color: tone || "var(--tx-0)" }}
      >
        {value}
        <span style={{ fontSize: 15, color: "var(--tx-2)" }}>{suffix}</span>
      </div>
      {sub && <div style={{ fontSize: 11.5, color: "var(--tx-3)", marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

export function Analytics({ candidates }: { candidates: Candidate[] }) {
  const recDist = useMemo(() => {
    const c: Record<string, number> = {};
    candidates.forEach((x) => {
      c[x.recommendation] = (c[x.recommendation] || 0) + 1;
    });
    return Object.entries(NDS.REC).map(([k, m]) => ({
      key: k,
      label: m.label,
      tone: m.tone,
      n: c[k] || 0,
    }));
  }, [candidates]);
  const total = candidates.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 14 }}>
        <MetricTile label="Avg time to shortlist" value="2.4" suffix="d" sub="↓ 0.6d vs last quarter" tone="var(--pos)" />
        <MetricTile label="AI screening coverage" value="100" suffix="%" sub={`${total} candidates scored`} />
        <MetricTile label="Shortlist precision" value="84" suffix="%" sub="advanced to interview" tone="var(--pos)" />
        <MetricTile label="Offer acceptance" value="71" suffix="%" sub="ASEAN benchmark 64%" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18 }} className="dash-grid">
        <SectionCard title="Hiring Funnel" sub="All open roles, last 90 days">
          <FunnelChart data={NDS.funnel} />
        </SectionCard>
        <SectionCard title="AI Verdict Distribution" sub={`Across ${total} active candidates`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {recDist.map((r) => (
              <div key={r.key}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: toneColor(r.tone) }}>{r.label}</span>
                  <span className="mono" style={{ fontSize: 12.5, color: "var(--tx-2)" }}>
                    {r.n}
                  </span>
                </div>
                <div style={{ height: 7, background: "var(--bg-4)", borderRadius: 99, overflow: "hidden" }}>
                  <div
                    className="fade-up"
                    style={{
                      width: `${total ? (r.n / total) * 100 : 0}%`,
                      height: "100%",
                      background: toneColor(r.tone),
                      borderRadius: 99,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 18 }} className="dash-grid">
        <SectionCard title="Candidate Quality Trend" sub="Avg incoming AI match">
          <Sparkline data={NDS.qualityTrend} width={320} height={90} color="var(--pos)" />
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
        <SectionCard title="Role Demand" sub="Open requisitions & pipeline depth">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {NDS.roleDemand.map((r) => (
              <div key={r.role} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 200, fontSize: 12.5, fontWeight: 600, color: "var(--tx-1)" }}>{r.role}</span>
                <div
                  style={{
                    flex: 1,
                    height: 22,
                    background: "var(--bg-4)",
                    borderRadius: 6,
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    className="fade-up"
                    style={{
                      width: `${(r.candidates / 51) * 100}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, var(--ac-lo), var(--ac-hi))",
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: 8,
                    }}
                  >
                    <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>
                      {r.candidates}
                    </span>
                  </div>
                </div>
                <span className="mono" style={{ fontSize: 12, color: "var(--warn)", width: 54, textAlign: "right" }}>
                  {r.open} open
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Certification Heatmap" sub="Frequency across the active candidate pool">
        <CertHeatmap data={NDS.certHeat} />
      </SectionCard>
    </div>
  );
}

function WeightRow({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          display: "grid",
          placeItems: "center",
          background: "var(--ac-soft)",
          color: "var(--ac-hi)",
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={15} />
      </div>
      <span style={{ width: 210, fontSize: 13, fontWeight: 600, color: "var(--tx-1)" }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: "var(--bg-4)", borderRadius: 99, overflow: "hidden" }}>
        <div className="fade-up" style={{ width: `${value}%`, height: "100%", background: "var(--ac)", borderRadius: 99 }} />
      </div>
      <span className="mono" style={{ width: 44, textAlign: "right", fontSize: 13.5, fontWeight: 600, color: "var(--ac-hi)" }}>
        {value}%
      </span>
    </div>
  );
}

export function SettingsView() {
  const roles = NDS.ROLES;
  return (
    <div style={{ maxWidth: 940, display: "flex", flexDirection: "column", gap: 18 }}>
      <SectionCard
        title="Scoring Model Weights"
        sub="Presales Network Security Engineer · model v4.2"
        action={
          <span className="chip">
            <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--pos)" }} />
            Active
          </span>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <WeightRow label="Technical Skills" value={30} icon="bolt" />
          <WeightRow label="Experience" value={25} icon="briefcase" />
          <WeightRow label="Certifications" value={20} icon="award" />
          <WeightRow label="Communication & Leadership" value={15} icon="user" />
          <WeightRow label="Résumé Quality" value={10} icon="doc" />
        </div>
      </SectionCard>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }} className="sg-grid">
        <SectionCard title="Role Scoring Models" sub={`${roles.length} active SI role models`}>
          <div
            style={{ display: "flex", flexDirection: "column", gap: 7, maxHeight: 280, overflowY: "auto" }}
            className="scrollarea"
          >
            {roles.map((r, i) => (
              <div
                key={r}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 8,
                  background: "var(--bg-3)",
                  border: "1px solid var(--line)",
                }}
              >
                <Icon name="sparkle" size={14} style={{ color: i < 3 ? "var(--ac-hi)" : "var(--tx-3)" }} />
                <span style={{ flex: 1, fontSize: 12.5, fontWeight: 500 }}>{r}</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--pos)",
                    background: "var(--pos-soft)",
                    padding: "2px 7px",
                    borderRadius: 5,
                  }}
                >
                  v4.2
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <SectionCard title="Shortlist Threshold" sub="Auto-flag above match score">
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span className="mono" style={{ fontSize: 38, fontWeight: 600, color: "var(--ac-hi)" }}>
                85
              </span>
              <span style={{ fontSize: 14, color: "var(--tx-2)" }}>% AI match</span>
            </div>
            <div style={{ height: 6, background: "var(--bg-4)", borderRadius: 99, marginTop: 14, overflow: "hidden" }}>
              <div
                style={{
                  width: "85%",
                  height: "100%",
                  background: "linear-gradient(90deg, var(--ac-lo), var(--ac-hi))",
                  borderRadius: 99,
                }}
              />
            </div>
            <p style={{ fontSize: 11.5, color: "var(--tx-3)", marginTop: 10 }}>
              Candidates above this score are auto-tagged &quot;Strong Hire&quot; for HR review.
            </p>
          </SectionCard>
          <SectionCard title="Access Control" sub="Role-based permissions">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { r: "HR Recruiter", p: "Upload · Screen · Shortlist", tone: "info" },
                { r: "Hiring Manager", p: "Review · Compare · Decide", tone: "pos" },
                { r: "Admin", p: "Full · Model config", tone: "warn" },
              ].map((x) => (
                <div
                  key={x.r}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 12px",
                    borderRadius: 8,
                    background: "var(--bg-3)",
                    border: "1px solid var(--line)",
                  }}
                >
                  <Icon name="shield" size={15} style={{ color: toneColor(x.tone) }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>{x.r}</div>
                    <div style={{ fontSize: 11, color: "var(--tx-3)" }}>{x.p}</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <SectionCard title="AI Engine Mode" sub="Zero-cost by default">
        <p style={{ fontSize: 13, color: "var(--tx-1)", lineHeight: 1.55 }}>
          The platform uses a <b>deterministic rule-based SI scoring engine</b> with no paid API dependency. Optional
          LLM narrative refinement activates only when <code>OPENAI_API_KEY</code> or <code>ANTHROPIC_API_KEY</code> is
          set — scores remain rule-based.
        </p>
      </SectionCard>
    </div>
  );
}
