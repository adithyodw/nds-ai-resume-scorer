/* ============================================================
   NDS TalentScore — Candidate Report (AI score detail)
   ============================================================ */

const SCORE_DIMS = [
  { key: "technical", label: "Technical Skills", weight: "30%", icon: "bolt" },
  { key: "certification", label: "Certifications", weight: "20%", icon: "award" },
  { key: "experience", label: "Experience", weight: "25%", icon: "briefcase" },
  { key: "communication", label: "Communication & Leadership", weight: "15%", icon: "user" },
  { key: "quality", label: "Résumé Quality", weight: "10%", icon: "doc" },
];

function Stat({ label, value, icon, tone }) {
  return (
    <div style={{ flex: 1, minWidth: 120 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "var(--tx-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
        <Icon name={icon} size={13} />{label}
      </div>
      <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: tone || "var(--tx-0)" }}>{value}</div>
    </div>
  );
}

function ReportHeader({ c, onBack, onStatus, onCompare, inCompare }) {
  return (
    <div className="fade-up" style={{ display: "flex", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
      <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ width: 36, padding: 0 }}><Icon name="chevL" size={16} /></button>
      <Avatar c={c} size={64} ring />
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>{c.name}</h2>
          <StatusPill status={c.status} />
          {c.isNew && <span style={{ fontSize: 10, fontWeight: 700, color: "var(--ac-hi)", background: "var(--ac-soft)", padding: "2px 8px", borderRadius: 6 }}>JUST SCORED</span>}
        </div>
        <div style={{ fontSize: 13.5, color: "var(--tx-2)", marginTop: 4, display: "flex", gap: 14, flexWrap: "wrap" }}>
          <span>{c.title}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="mapPin" size={13} />{c.location}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="briefcase" size={13} />Applied for {c.role}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
        <button className="btn btn-ghost" onClick={() => onCompare(c.id)}>
          <Icon name="compare" size={16} /> {inCompare ? "In comparison" : "Compare"}
        </button>
        <button className="btn btn-ghost"><Icon name="download" size={16} /> Export</button>
        <button className="btn btn-ghost" onClick={() => onStatus(c.id, "rejected")} style={{ color: "var(--neg)" }}><Icon name="x" size={16} /> Reject</button>
        <button className="btn btn-primary" onClick={() => onStatus(c.id, "shortlisted")}><Icon name="star" size={16} /> Shortlist</button>
      </div>
    </div>
  );
}

/* AI assistant items reveal sequentially */
function RevealList({ items, render, stagger = 90 }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    let i = 0; const iv = setInterval(() => { i++; setN(i); if (i >= items.length) clearInterval(iv); }, stagger);
    return () => clearInterval(iv);
  }, [items]);
  return <>{items.slice(0, n).map((it, i) => <div key={i} className="pop-in">{render(it, i)}</div>)}</>;
}

function CardBox({ title, sub, icon, iconTone, children, action }) {
  return (
    <div className="panel" style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        {icon && <div style={{ width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center", background: `color-mix(in srgb, ${iconTone || "var(--ac)"} 14%, transparent)`, color: iconTone || "var(--ac-hi)" }}><Icon name={icon} size={15} /></div>}
        <div>
          <h3 style={{ fontSize: 14.5, fontWeight: 700 }}>{title}</h3>
          {sub && <p style={{ fontSize: 11.5, color: "var(--tx-2)" }}>{sub}</p>}
        </div>
        {action && <div style={{ marginLeft: "auto" }}>{action}</div>}
      </div>
      {children}
    </div>
  );
}

function Report({ c, onBack, onStatus, onCompare, compareSet }) {
  const suggestions = [
    { type: "add", text: `Add a quantified enterprise firewall migration project (e.g. site count, downtime, vendor) to strengthen the Presales Security profile.` },
    { type: "cert", text: `Pursue CISSP — it is the highest-weighted missing certification for senior security presales and would lift the Certification score by ~6 points.` },
    { type: "kw", text: `Surface cloud security keywords (CSPM, CNAPP, Prisma Cloud) — currently absent and required for hybrid engagements.` },
    { type: "word", text: `Reframe 3 bullet points from task-based to achievement-based ("reduced incident MTTR by 42%") to improve résumé quality and ATS ranking.` },
  ];
  const sugMeta = { add: { icon: "plus", tone: "var(--ac)", label: "Project" }, cert: { icon: "award", tone: "var(--warn)", label: "Certification" }, kw: { icon: "search", tone: "var(--info)", label: "Keywords" }, word: { icon: "doc", tone: "var(--pos)", label: "Wording" } };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <ReportHeader c={c} onBack={onBack} onStatus={onStatus} onCompare={onCompare} inCompare={compareSet.includes(c.id)} />

      {/* verdict banner */}
      <div className="panel fade-up" style={{ padding: 24, display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap", animationDelay: "60ms",
        background: "linear-gradient(120deg, var(--bg-2), color-mix(in srgb, var(--ac) 6%, var(--bg-2)))" }}>
        <ScoreRing value={c.match} size={128} stroke={11} label="AI MATCH" />
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
            <RecBadge rec={c.recommendation} />
            <span className="chip"><Icon name="sparkle" size={13} style={{ color: "var(--ac-hi)" }} /> {c.confidence}% confidence</span>
            <span className="chip">{c.seniority} level</span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--tx-1)", maxWidth: 620 }}>{c.summary}</p>
        </div>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap", paddingLeft: 8, borderLeft: "1px solid var(--line)", flex: "0 0 auto" }}>
          <Stat label="Experience" value={`${c.experience} yrs`} icon="briefcase" />
          <Stat label="Salary band" value={c.salaryBand} icon="cash" />
          <Stat label="Notice" value={`${c.noticeDays} days`} icon="clock" tone={c.noticeDays > 45 ? "var(--warn)" : "var(--tx-0)"} />
        </div>
      </div>

      {/* two-col body */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18 }} className="report-grid">
        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <CardBox title="Score Breakdown" sub="Weighted across the SI scoring model" icon="bolt"
            action={<span className="chip mono">{c.match}/100 overall</span>}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {SCORE_DIMS.map((d, i) => (
                <ScoreBar key={d.key} label={d.label} value={c.scores[d.key]} delay={i * 90}
                  sublabel={`Weight ${d.weight}`} />
              ))}
            </div>
          </CardBox>

          <CardBox title="AI Improvement Assistant" sub="Targeted recommendations to raise this candidate's fit" icon="sparkle" iconTone="var(--ac)">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <RevealList items={suggestions} render={(s) => {
                const m = sugMeta[s.type];
                return (
                  <div style={{ display: "flex", gap: 12, padding: 13, borderRadius: 10, background: "var(--bg-3)", border: "1px solid var(--line)", marginBottom: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: "grid", placeItems: "center", background: `color-mix(in srgb, ${m.tone} 14%, transparent)`, color: m.tone }}>
                      <Icon name={m.icon} size={15} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: m.tone, marginBottom: 3 }}>{m.label}</div>
                      <div style={{ fontSize: 13, color: "var(--tx-1)", lineHeight: 1.5 }}>{s.text}</div>
                    </div>
                  </div>
                );
              }} />
            </div>
          </CardBox>

          {/* strengths + gaps */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }} className="sg-grid">
            <CardBox title="Strengths" icon="check" iconTone="var(--pos)">
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {c.highlights.map((h, i) => (
                  <div key={i} style={{ display: "flex", gap: 9, fontSize: 12.5, color: "var(--tx-1)", lineHeight: 1.45 }}>
                    <Icon name="check" size={15} stroke={2.4} style={{ color: "var(--pos)", flexShrink: 0, marginTop: 1 }} />{h}
                  </div>
                ))}
              </div>
            </CardBox>
            <CardBox title="Gaps & Risks" icon="flag" iconTone="var(--warn)">
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {c.gaps.map((g, i) => (
                  <div key={i} style={{ display: "flex", gap: 9, fontSize: 12.5, color: "var(--tx-1)", lineHeight: 1.45 }}>
                    <Icon name="flag" size={14} style={{ color: "var(--warn)", flexShrink: 0, marginTop: 1 }} />{g}
                  </div>
                ))}
              </div>
            </CardBox>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <CardBox title="Capability Radar" sub="Profile vs. role benchmark" icon="analytics">
            <div style={{ display: "grid", placeItems: "center", padding: "4px 0 10px" }}>
              <RadarChart data={c.radar} axes={NDS.RADAR_AXES} size={272} compare={[80, 85, 70, 65, 80, 70]} />
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 18, fontSize: 11.5, color: "var(--tx-2)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 3, borderRadius: 2, background: "var(--ac)" }} />Candidate</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 0, borderTop: "2px dashed var(--info)" }} />Role benchmark</span>
            </div>
          </CardBox>

          <CardBox title="Certifications" sub={`${c.certs.filter(x => x.active).length} active · ${c.certs.filter(x => !x.active).length} expired`} icon="award" iconTone="var(--warn)">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {c.certs.map((ct, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 9, background: "var(--bg-3)", border: "1px solid var(--line)", opacity: ct.active ? 1 : 0.6 }}>
                  <Icon name="award" size={16} style={{ color: ct.active ? "var(--warn)" : "var(--tx-3)" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{ct.name}</div>
                    <div style={{ fontSize: 11, color: "var(--tx-3)" }}>{ct.level}</div>
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 5, color: ct.active ? "var(--pos)" : "var(--neg)", background: ct.active ? "var(--pos-soft)" : "var(--neg-soft)" }}>
                    {ct.active ? "ACTIVE" : "EXPIRED"}
                  </span>
                </div>
              ))}
            </div>
          </CardBox>

          <CardBox title="Detected Skills" sub="Extracted & matched to role taxonomy" icon="search" iconTone="var(--info)">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {c.skills.map((s, i) => <span key={i} className="chip">{s}</span>)}
            </div>
          </CardBox>

          <CardBox title="Interview Recommendation" icon="user" iconTone="var(--ac)">
            <p style={{ fontSize: 12.5, color: "var(--tx-1)", lineHeight: 1.55 }}>
              Recommend a <b style={{ color: "var(--tx-0)" }}>technical panel + presales scenario</b>. Probe cloud security depth and a live solution-design walkthrough. Validate the firewall migration project claims.
            </p>
            <div style={{ display: "flex", gap: 9, marginTop: 16 }}>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1 }}><Icon name="clock" size={14} /> Schedule</button>
              <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => onStatus(c.id, "shortlisted")}><Icon name="star" size={14} /> Move to shortlist</button>
            </div>
          </CardBox>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Report });
