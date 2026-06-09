"use client";

import { useEffect, useRef, useState } from "react";
import type { Candidate } from "@/lib/types";
import { ROLES } from "@/lib/rubrics";
import { uploadResumes } from "@/lib/api-client";
import { Icon, ScoreRing, RecBadge, scoreColor } from "./primitives";

const PARSE_STAGES = [
  { key: "ocr", label: "Reading document", detail: "PDF/DOCX parsing · text extraction", icon: "doc", ms: 900 },
  { key: "entities", label: "Extracting entities", detail: "Skills · certifications · employers · tenure", icon: "search", ms: 1100 },
  { key: "match", label: "Matching role model", detail: "SI scoring model v4.2 · role benchmark", icon: "sparkle", ms: 1000 },
  { key: "score", label: "Scoring dimensions", detail: "Technical · Certification · Experience · Communication", icon: "bolt", ms: 1200 },
  { key: "rec", label: "Generating recommendation", detail: "Fit analysis · risk · salary band · summary", icon: "award", ms: 900 },
];

const ROLE_GROUPS: { label: string; roles: string[] }[] = [
  {
    label: "Presales",
    roles: [
      "Presales Network Security Engineer",
      "Presales Network Engineer",
      "Presales Security Consultant",
      "Presales Team Lead",
    ],
  },
  {
    label: "Post-Sales / Delivery",
    roles: [
      "Post-Sales Network Engineer",
      "Post-Sales Security Engineer",
      "Field Engineer",
      "Network Operations Engineer",
    ],
  },
  {
    label: "Security & Cloud",
    roles: ["SOC Engineer", "Cloud Engineer", "Data Center Engineer", "Infrastructure Engineer"],
  },
  {
    label: "Leadership",
    roles: [
      "Network Engineer Team Lead",
      "Security Team Lead",
      "Infrastructure Manager",
      "Technical Project Lead",
    ],
  },
  {
    label: "Business",
    roles: ["Sales Executive", "Account Manager", "Solution Sales Specialist", "HR Recruiter"],
  },
];

export function UploadCenter({ onComplete }: { onComplete: (added: Candidate[]) => void }) {
  const [phase, setPhase] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [stageIdx, setStageIdx] = useState(0);
  const [stageProg, setStageProg] = useState(0);
  const [fileName, setFileName] = useState("");
  const [drag, setDrag] = useState(false);
  const [results, setResults] = useState<Candidate[]>([]);
  const [failedCount, setFailedCount] = useState(0);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [targetRole, setTargetRole] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const rafRef = useRef(0);
  const startRef = useRef(0);

  async function start(files?: FileList | File[]) {
    const list = files ? Array.from(files) : [];
    if (list.length === 0) {
      setError("No files selected.");
      return;
    }
    setFileName(list.length === 1 ? list[0].name : `${list.length} files`);
    setPhase("processing");
    setStageIdx(0);
    setStageProg(0);
    setError("");
    setResults([]);
    setFailedCount(0);
    startRef.current = performance.now();

    try {
      const res = await uploadResumes(list, targetRole || undefined);
      cancelAnimationFrame(rafRef.current);
      setElapsed(Math.round((performance.now() - startRef.current) / 100) / 10);

      if (res.added.length === 0) {
        const firstErr = res.results.find((r) => !r.ok)?.error || "No résumés could be scored.";
        setError(firstErr);
        setPhase("error");
        return;
      }

      setStageIdx(PARSE_STAGES.length - 1);
      setStageProg(1);
      setResults(res.added);
      setFailedCount(res.summary.failed);
      setPhase("done");
    } catch (e) {
      cancelAnimationFrame(rafRef.current);
      setError(e instanceof Error ? e.message : "Upload failed");
      setPhase("error");
    }
  }

  useEffect(() => {
    if (phase !== "processing") return;
    let cancelled = false;
    const stage = PARSE_STAGES[stageIdx];
    if (!stage) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      if (cancelled || phase !== "processing") return;
      const p = Math.min(1, (now - t0) / stage.ms);
      setStageProg(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else if (stageIdx < PARSE_STAGES.length - 1) {
        setStageIdx((i) => i + 1);
        setStageProg(0);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [phase, stageIdx]);

  function reset() {
    setPhase("idle");
    setResults([]);
    setError("");
    setStageIdx(0);
    if (fileRef.current) fileRef.current.value = "";
  }

  const roleSelector = (
    <div className="panel fade-up" style={{ padding: 16, animationDelay: "40ms" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <Icon name="briefcase" size={18} style={{ color: "var(--ac-hi)" }} />
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>Target role for scoring</div>
          <div style={{ fontSize: 12, color: "var(--tx-2)", marginTop: 2 }}>
            Score all uploaded résumés against this role model. Leave auto-detect to let AI infer the best fit.
          </div>
        </div>
      </div>
      <select
        value={targetRole}
        onChange={(e) => setTargetRole(e.target.value)}
        style={{
          width: "100%",
          height: 40,
          padding: "0 12px",
          borderRadius: 9,
          border: "1px solid var(--line-2)",
          background: "var(--bg-3)",
          color: "var(--tx-0)",
          fontSize: 13.5,
          fontWeight: 500,
        }}
      >
        <option value="">Auto-detect best role (recommended)</option>
        {ROLE_GROUPS.map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </optgroup>
        ))}
        {ROLES.filter((r) => !ROLE_GROUPS.some((g) => g.roles.includes(r))).map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </div>
  );

  if (phase === "idle" || phase === "error") {
    return (
      <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="fade-up">
          <h2 style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-0.02em" }}>Upload résumés for AI scoring</h2>
          <p style={{ fontSize: 13.5, color: "var(--tx-2)", marginTop: 4 }}>
            Drop PDF, DOCX, or ZIP files. Select a target role, then the SI engine scores each résumé across 5 dimensions.
          </p>
        </div>

        {roleSelector}

        {error && (
          <div
            className="panel"
            style={{
              padding: 14,
              borderColor: "color-mix(in srgb, var(--neg) 40%, transparent)",
              background: "var(--neg-soft)",
              color: "var(--neg)",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <div
          className="fade-up"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            if (e.dataTransfer.files.length) start(e.dataTransfer.files);
          }}
          style={{
            border: `1.5px dashed ${drag ? "var(--ac)" : "var(--line-2)"}`,
            borderRadius: 16,
            background: drag ? "var(--ac-soft)" : "var(--bg-2)",
            padding: "54px 30px",
            textAlign: "center",
            cursor: "pointer",
            transition: "all .2s",
            animationDelay: "60ms",
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.zip"
            multiple
            hidden
            onChange={(e) => e.target.files && start(e.target.files)}
          />
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
            <Icon name="upload" size={28} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Drag & drop résumés here</div>
          <div style={{ fontSize: 13, color: "var(--tx-2)", marginTop: 5 }}>
            or click to browse · PDF, DOCX, ZIP up to 25MB · bulk upload supported
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }} className="upload-feats">
          {[
            { i: "doc", t: "Multi-format parsing", d: "PDF, DOCX & ZIP batch expansion" },
            { i: "shield", t: "Secure processing", d: "Local rule engine · no paid API required" },
            { i: "bolt", t: "~6s per résumé", d: "Scored against the selected role model" },
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

  if (phase === "processing") {
    const overall = (stageIdx + stageProg) / PARSE_STAGES.length;
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="panel" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 11,
                display: "grid",
                placeItems: "center",
                background: "var(--ac-soft)",
                color: "var(--ac-hi)",
              }}
            >
              <Icon name="doc" size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700 }}>{fileName}</div>
              <div style={{ fontSize: 12, color: "var(--tx-2)" }}>
                {targetRole ? `Scoring against: ${targetRole}` : "Auto-detecting best role fit"}
              </div>
            </div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 600, color: "var(--ac-hi)" }}>
              {Math.round(overall * 100)}%
            </div>
          </div>
          <div style={{ height: 5, background: "var(--bg-4)", borderRadius: 99, overflow: "hidden", marginBottom: 22 }}>
            <div
              style={{
                width: `${overall * 100}%`,
                height: "100%",
                background: "linear-gradient(90deg, var(--ac-lo), var(--ac-hi))",
                borderRadius: 99,
                transition: "width .1s linear",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {PARSE_STAGES.map((s, i) => {
              const done = i < stageIdx;
              const active = i === stageIdx;
              return (
                <div
                  key={s.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 13,
                    padding: "10px 8px",
                    opacity: i > stageIdx ? 0.4 : 1,
                    transition: "opacity .3s",
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      flexShrink: 0,
                      display: "grid",
                      placeItems: "center",
                      background: done ? "var(--pos-soft)" : active ? "var(--ac-soft)" : "var(--bg-3)",
                      color: done ? "var(--pos)" : active ? "var(--ac-hi)" : "var(--tx-3)",
                    }}
                  >
                    {done ? (
                      <Icon name="check" size={16} stroke={2.4} />
                    ) : active ? (
                      <span
                        style={{
                          width: 15,
                          height: 15,
                          border: "2px solid var(--ac-hi)",
                          borderTopColor: "transparent",
                          borderRadius: 99,
                          animation: "spin .7s linear infinite",
                        }}
                      />
                    ) : (
                      <Icon name={s.icon} size={15} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: active || done ? "var(--tx-0)" : "var(--tx-2)",
                      }}
                    >
                      {s.label}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--tx-3)" }}>{s.detail}</div>
                  </div>
                  {active && (
                    <span className="mono" style={{ fontSize: 11.5, color: "var(--ac-hi)" }}>
                      {Math.round(stageProg * 100)}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (results.length === 0) return null;

  const single = results.length === 1;
  const top = results[0];

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="panel pop-in" style={{ padding: 28, textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "5px 12px",
            borderRadius: 99,
            background: "var(--pos-soft)",
            color: "var(--pos)",
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 20,
          }}
        >
          <Icon name="check" size={14} stroke={2.4} />
          {results.length} résumé{results.length > 1 ? "s" : ""} scored · {elapsed || "—"}s
          {failedCount > 0 && ` · ${failedCount} failed`}
        </div>

        {single ? (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
              <ScoreRing value={top.match} size={120} stroke={10} label="AI MATCH" />
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{top.name}</div>
                <div style={{ fontSize: 13.5, color: "var(--tx-2)", marginBottom: 10 }}>
                  {top.title} · {top.location}
                </div>
                <RecBadge rec={top.recommendation} />
                <div style={{ fontSize: 12, color: "var(--tx-3)", marginTop: 8 }}>Role: {top.role}</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "var(--tx-1)", lineHeight: 1.5, maxWidth: 520, margin: "22px auto 0" }}>
              {top.summary}
            </p>
          </>
        ) : (
          <p style={{ fontSize: 13.5, color: "var(--tx-2)", marginBottom: 8 }}>
            All candidates are in the database. Review scores below or open the full list.
          </p>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
          <button className="btn btn-ghost" onClick={reset}>
            <Icon name="upload" size={16} /> Upload more
          </button>
          {single ? (
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => void onComplete(results)}
            >
              <Icon name="eye" size={16} /> View full report
            </button>
          ) : (
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => void onComplete(results)}
            >
              <Icon name="database" size={16} /> View all in database
            </button>
          )}
        </div>
      </div>

      {!single && (
        <div className="panel" style={{ padding: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Scored candidates</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 360, overflowY: "auto" }} className="scrollarea">
            {results.map((c) => (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 9,
                  background: "var(--bg-3)",
                  border: "1px solid var(--line)",
                }}
              >
                <span className="mono" style={{ fontSize: 14, fontWeight: 600, color: scoreColor(c.match), width: 36 }}>
                  {c.match}%
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--tx-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.role}
                  </div>
                </div>
                <RecBadge rec={c.recommendation} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
