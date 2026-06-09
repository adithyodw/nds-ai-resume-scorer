/* ============================================================
   NDS TalentScore — Résumé Upload Center (animated AI pipeline)
   ============================================================ */

const PARSE_STAGES = [
  { key: "ocr", label: "Reading document", detail: "OCR · layout analysis · text extraction", icon: "doc", ms: 1200 },
  { key: "entities", label: "Extracting entities", detail: "Skills · certifications · employers · tenure", icon: "search", ms: 1500 },
  { key: "match", label: "Matching role model", detail: "SI scoring model v4.2 · Presales Network Security", icon: "sparkle", ms: 1400 },
  { key: "score", label: "Scoring dimensions", detail: "Technical · Certification · Experience · Communication", icon: "bolt", ms: 1600 },
  { key: "rec", label: "Generating recommendation", detail: "Fit analysis · risk · salary band · summary", icon: "award", ms: 1200 },
];

// streamed extraction tokens revealed during the "entities" stage
const STREAM_TOKENS = [
  { t: "skill", v: "Fortinet FortiGate" }, { t: "skill", v: "Palo Alto PAN-OS" },
  { t: "cert", v: "PCNSE" }, { t: "skill", v: "BGP / OSPF" }, { t: "cert", v: "NSE 7" },
  { t: "skill", v: "SD-WAN" }, { t: "exp", v: "8.5 yrs experience" }, { t: "skill", v: "Zero Trust" },
  { t: "cert", v: "CCNP Security" }, { t: "skill", v: "Firewall Migration" }, { t: "skill", v: "Python" },
];

function makeUploadedCandidate() {
  return {
    id: "c-new-" + Date.now(),
    name: "Andi Saputra", initials: "AS", title: "Network Security Engineer",
    role: "Presales Network Security Engineer", location: "Jakarta, ID",
    experience: 8, noticeDays: 30, salaryExpect: 34, status: "new", appliedAgo: "now",
    match: 91, recommendation: "STRONG", confidence: 93, seniority: "Senior", salaryBand: "30–40 jt",
    scores: { technical: 92, certification: 90, experience: 88, communication: 86, quality: 90 },
    radar: [86, 94, 78, 80, 88, 72],
    certs: [{ name: "Fortinet NSE 7", level: "Expert", active: true }, { name: "PCNSE", level: "Professional", active: true }, { name: "CCNP Security", level: "Professional", active: true }],
    skills: ["Fortinet FortiGate", "Palo Alto", "BGP/OSPF", "SD-WAN", "Zero Trust", "Firewall Migration", "Python"],
    highlights: ["Led FortiGate-to-Palo Alto migration for insurance group", "Presales support on 9 enterprise security bids", "Designed segmentation architecture for hospital network"],
    gaps: ["Cloud security (CSPM) exposure limited", "No CISSP yet"],
    summary: "Strong presales security candidate with deep multi-vendor firewall expertise and active enterprise certifications. Well-matched to the Presales Network Security Engineer model; cloud security is the primary development area.",
    isNew: true,
  };
}

function UploadCenter({ onComplete }) {
  const [phase, setPhase] = useState("idle"); // idle | processing | done
  const [stageIdx, setStageIdx] = useState(0);
  const [stageProg, setStageProg] = useState(0);
  const [tokens, setTokens] = useState([]);
  const [fileName, setFileName] = useState("");
  const [drag, setDrag] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);
  const rafRef = useRef(null);

  const queue = [
    { name: "Arif_Rahmansyah_CV_2026.pdf", size: "412 KB" },
  ];

  function start(name) {
    setFileName(name || "Arif_Rahmansyah_CV_2026.pdf");
    setPhase("processing"); setStageIdx(0); setStageProg(0); setTokens([]);
  }

  // drive the staged animation
  useEffect(() => {
    if (phase !== "processing") return;
    let cancelled = false;
    const stage = PARSE_STAGES[stageIdx];
    const t0 = performance.now();
    const tick = (now) => {
      if (cancelled) return;
      const p = Math.min(1, (now - t0) / stage.ms);
      setStageProg(p);
      if (p < 1) { rafRef.current = requestAnimationFrame(tick); }
      else {
        if (stageIdx < PARSE_STAGES.length - 1) {
          setStageIdx((i) => i + 1); setStageProg(0);
        } else {
          const r = makeUploadedCandidate();
          setResult(r); setPhase("done");
        }
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { cancelled = true; cancelAnimationFrame(rafRef.current); };
  }, [phase, stageIdx]);

  // stream tokens during entities stage
  useEffect(() => {
    if (phase !== "processing" || PARSE_STAGES[stageIdx].key !== "entities") return;
    let i = 0;
    const iv = setInterval(() => {
      i++; setTokens(STREAM_TOKENS.slice(0, i));
      if (i >= STREAM_TOKENS.length) clearInterval(iv);
    }, 120);
    return () => clearInterval(iv);
  }, [phase, stageIdx]);

  function reset() { setPhase("idle"); setResult(null); setTokens([]); setStageIdx(0); }

  /* ---------- IDLE ---------- */
  if (phase === "idle") {
    return (
      <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="fade-up">
          <h2 style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-0.02em" }}>Upload résumés for AI scoring</h2>
          <p style={{ fontSize: 13.5, color: "var(--tx-2)", marginTop: 4 }}>
            Drop PDF or DOCX files. The SI scoring engine parses, scores across 5 dimensions, and recommends a role fit in seconds.
          </p>
        </div>

        <div className="fade-up" onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); start(e.dataTransfer.files[0]?.name); }}
          style={{
            border: `1.5px dashed ${drag ? "var(--ac)" : "var(--line-2)"}`, borderRadius: 16,
            background: drag ? "var(--ac-soft)" : "var(--bg-2)", padding: "54px 30px", textAlign: "center",
            cursor: "pointer", transition: "all .2s", animationDelay: "60ms",
          }}>
          <input ref={fileRef} type="file" accept=".pdf,.docx" hidden onChange={(e) => start(e.target.files[0]?.name)} />
          <div style={{ width: 60, height: 60, borderRadius: 16, margin: "0 auto 18px", display: "grid", placeItems: "center",
            background: "var(--ac-soft)", color: "var(--ac-hi)" }}>
            <Icon name="upload" size={28} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Drag & drop résumés here</div>
          <div style={{ fontSize: 13, color: "var(--tx-2)", marginTop: 5 }}>or click to browse · PDF, DOCX up to 10MB · batch upload supported</div>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={(e) => { e.stopPropagation(); start(); }}>
            <Icon name="sparkle" size={16} /> Try a sample résumé
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }} className="upload-feats">
          {[
            { i: "doc", t: "Multi-format parsing", d: "PDF, DOCX & scanned CVs via OCR" },
            { i: "shield", t: "Encrypted at rest", d: "GDPR-style handling · audit logged" },
            { i: "bolt", t: "~6s per résumé", d: "Scored against the SI role model" },
          ].map((f, i) => (
            <div key={i} className="panel fade-up" style={{ padding: 16, animationDelay: `${120 + i * 60}ms` }}>
              <Icon name={f.i} size={18} style={{ color: "var(--ac-hi)" }} />
              <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 10 }}>{f.t}</div>
              <div style={{ fontSize: 12, color: "var(--tx-2)", marginTop: 3 }}>{f.d}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---------- PROCESSING ---------- */
  if (phase === "processing") {
    const overall = (stageIdx + stageProg) / PARSE_STAGES.length;
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="panel" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
            <div style={{ width: 46, height: 46, borderRadius: 11, display: "grid", placeItems: "center", background: "var(--neg-soft)", color: "var(--neg)" }}>
              <Icon name="doc" size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700 }}>{fileName}</div>
              <div style={{ fontSize: 12, color: "var(--tx-2)" }}>Analyzing with SI scoring model v4.2</div>
            </div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 600, color: "var(--ac-hi)" }}>{Math.round(overall * 100)}%</div>
          </div>

          {/* overall progress */}
          <div style={{ height: 5, background: "var(--bg-4)", borderRadius: 99, overflow: "hidden", marginBottom: 22 }}>
            <div style={{ width: `${overall * 100}%`, height: "100%", background: "linear-gradient(90deg, var(--ac-lo), var(--ac-hi))", borderRadius: 99, transition: "width .1s linear" }} />
          </div>

          {/* stages */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {PARSE_STAGES.map((s, i) => {
              const done = i < stageIdx, active = i === stageIdx;
              return (
                <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 13, padding: "10px 8px", opacity: i > stageIdx ? 0.4 : 1, transition: "opacity .3s" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: "grid", placeItems: "center",
                    background: done ? "var(--pos-soft)" : active ? "var(--ac-soft)" : "var(--bg-3)",
                    color: done ? "var(--pos)" : active ? "var(--ac-hi)" : "var(--tx-3)" }}>
                    {done ? <Icon name="check" size={16} stroke={2.4} /> : active ? <span style={{ width: 15, height: 15, border: "2px solid var(--ac-hi)", borderTopColor: "transparent", borderRadius: 99, animation: "spin .7s linear infinite" }} /> : <Icon name={s.icon} size={15} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: active || done ? "var(--tx-0)" : "var(--tx-2)" }}>{s.label}</div>
                    <div style={{ fontSize: 11.5, color: "var(--tx-3)" }}>{s.detail}</div>
                  </div>
                  {active && <span className="mono" style={{ fontSize: 11.5, color: "var(--ac-hi)" }}>{Math.round(stageProg * 100)}%</span>}
                </div>
              );
            })}
          </div>

          {/* streamed tokens */}
          {tokens.length > 0 && (
            <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--line)" }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Extracted in real time</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {tokens.map((tk, i) => {
                  const col = tk.t === "cert" ? "var(--warn)" : tk.t === "exp" ? "var(--info)" : "var(--ac-hi)";
                  return (
                    <span key={i} className="pop-in chip" style={{ borderColor: `color-mix(in srgb, ${col} 40%, transparent)`, color: col, background: `color-mix(in srgb, ${col} 10%, transparent)` }}>
                      <span style={{ width: 5, height: 5, borderRadius: 99, background: col }} />{tk.v}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ---------- DONE ---------- */
  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="panel pop-in" style={{ padding: 28, textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 12px", borderRadius: 99, background: "var(--pos-soft)", color: "var(--pos)", fontSize: 12, fontWeight: 700, marginBottom: 20 }}>
          <Icon name="check" size={14} stroke={2.4} /> Scoring complete · 5.4s
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
          <ScoreRing value={result.match} size={120} stroke={10} label="AI MATCH" />
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{result.name}</div>
            <div style={{ fontSize: 13.5, color: "var(--tx-2)", marginBottom: 10 }}>{result.title} · {result.location}</div>
            <RecBadge rec={result.recommendation} />
            <div style={{ display: "flex", gap: 16, marginTop: 14 }}>
              {Object.entries(result.scores).slice(0, 3).map(([k, v]) => (
                <div key={k}>
                  <div className="mono" style={{ fontSize: 17, fontWeight: 600, color: scoreColor(v) }}>{v}</div>
                  <div style={{ fontSize: 10.5, color: "var(--tx-3)", textTransform: "capitalize" }}>{k}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p style={{ fontSize: 13, color: "var(--tx-1)", lineHeight: 1.5, maxWidth: 520, margin: "22px auto 0" }}>{result.summary}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24 }}>
          <button className="btn btn-ghost" onClick={reset}><Icon name="upload" size={16} /> Upload another</button>
          <button className="btn btn-primary" onClick={() => onComplete(result)}><Icon name="eye" size={16} /> View full report</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { UploadCenter });
