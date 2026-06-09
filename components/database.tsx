"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Candidate, CandidateStatus } from "@/lib/types";
import { NDS } from "@/lib/nds-data";
import { Icon, Avatar, RecBadge, scoreColor } from "./primitives";
import { MiniDonut } from "./charts";

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        padding: 3,
        background: "var(--bg-3)",
        border: "1px solid var(--line)",
        borderRadius: 9,
        gap: 2,
      }}
    >
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            fontSize: 12.5,
            fontWeight: 600,
            color: value === o.value ? "var(--tx-0)" : "var(--tx-2)",
            background: value === o.value ? "var(--bg-1)" : "transparent",
            boxShadow: value === o.value ? "var(--shadow-sm)" : "none",
            transition: "all .15s",
            whiteSpace: "nowrap",
          }}
        >
          {o.label}
          {o.count != null && (
            <span className="mono" style={{ marginLeft: 6, opacity: 0.6 }}>
              {o.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function Dropdown({
  label,
  value,
  options,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  options: { value: string; label: string; count?: number }[];
  onChange: (v: string) => void;
  icon?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const cur = options.find((o) => o.value === value);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen((o) => !o)} style={{ height: 36 }}>
        {icon && <Icon name={icon} size={15} style={{ color: "var(--tx-2)" }} />}
        <span style={{ color: "var(--tx-2)", fontWeight: 500 }}>{label}:</span> {cur?.label || "All"}
        <Icon name="chevD" size={14} style={{ color: "var(--tx-3)" }} />
      </button>
      {open && (
        <div
          className="pop-in panel"
          style={{
            position: "absolute",
            top: 42,
            left: 0,
            zIndex: 50,
            minWidth: 220,
            padding: 6,
            boxShadow: "var(--shadow-pop)",
            background: "var(--bg-2)",
          }}
        >
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "8px 10px",
                borderRadius: 7,
                textAlign: "left",
                fontSize: 13,
                fontWeight: value === o.value ? 600 : 500,
                color: value === o.value ? "var(--tx-0)" : "var(--tx-1)",
                background: value === o.value ? "var(--bg-3)" : "transparent",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-3)")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = value === o.value ? "var(--bg-3)" : "transparent")
              }
            >
              <span style={{ flex: 1 }}>{o.label}</span>
              {o.count != null && (
                <span className="mono" style={{ fontSize: 11.5, color: "var(--tx-3)" }}>
                  {o.count}
                </span>
              )}
              {value === o.value && <Icon name="check" size={14} style={{ color: "var(--ac-hi)" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CandidateRow({
  c,
  rank,
  onOpen,
  onStatus,
  selected,
  onToggleSel,
}: {
  c: Candidate;
  rank: number;
  onOpen: (c: Candidate) => void;
  onStatus: (id: string, status: CandidateStatus) => void;
  selected: boolean;
  onToggleSel: (id: string) => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      className="cand-row"
      onClick={() => onOpen(c)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "26px 38px 1.7fr 1.3fr 70px 90px 130px 96px",
        alignItems: "center",
        gap: 14,
        padding: "13px 16px",
        borderRadius: 11,
        cursor: "pointer",
        background: selected ? "var(--ac-soft)" : hover ? "var(--bg-3)" : "var(--bg-2)",
        border: `1px solid ${selected ? "color-mix(in srgb, var(--ac) 40%, transparent)" : "var(--line)"}`,
        transition: "background .14s, border-color .14s",
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleSel(c.id);
        }}
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          border: `1.5px solid ${selected ? "var(--ac)" : "var(--line-2)"}`,
          background: selected ? "var(--ac)" : "transparent",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
        title="Add to comparison"
      >
        {selected && <Icon name="check" size={12} stroke={3} style={{ color: "#fff" }} />}
      </button>
      <span
        className="mono"
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: rank <= 3 ? "var(--ac-hi)" : "var(--tx-3)",
          textAlign: "center",
        }}
      >
        {rank}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
        <Avatar c={c} size={38} />
        <div style={{ minWidth: 0 }}>
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
            {c.isNew && (
              <span
                style={{
                  marginLeft: 7,
                  fontSize: 9.5,
                  fontWeight: 700,
                  color: "var(--ac-hi)",
                  background: "var(--ac-soft)",
                  padding: "1px 6px",
                  borderRadius: 5,
                  verticalAlign: "middle",
                }}
              >
                NEW
              </span>
            )}
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
            {c.title}
          </div>
        </div>
      </div>
      <div className="col-role" style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 12.5,
            color: "var(--tx-1)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {c.role}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--tx-3)",
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginTop: 2,
          }}
        >
          <Icon name="mapPin" size={11} />
          {c.location}
        </div>
      </div>
      <div className="col-exp mono" style={{ fontSize: 13, color: "var(--tx-1)", textAlign: "center" }}>
        {c.experience}y
      </div>
      <div className="col-certs" style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <Icon name="award" size={14} style={{ color: "var(--warn)" }} />
        <span className="mono" style={{ fontSize: 12.5, color: "var(--tx-1)" }}>
          {c.certs.length}
        </span>
        <span style={{ fontSize: 11, color: "var(--tx-3)" }}>certs</span>
      </div>
      <div className="col-rec">
        <RecBadge rec={c.recommendation} size="sm" />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 9 }}>
        {hover ? (
          <div className="fade-in" style={{ display: "flex", gap: 6 }}>
            <button
              className="btn btn-ghost btn-sm"
              title="Shortlist"
              onClick={(e) => {
                e.stopPropagation();
                onStatus(c.id, "shortlisted");
              }}
              style={{ width: 32, padding: 0, color: "var(--pos)" }}
            >
              <Icon name="star" size={15} />
            </button>
            <button
              className="btn btn-ghost btn-sm"
              title="Reject"
              onClick={(e) => {
                e.stopPropagation();
                onStatus(c.id, "rejected");
              }}
              style={{ width: 32, padding: 0, color: "var(--neg)" }}
            >
              <Icon name="x" size={15} />
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MiniDonut value={c.match} size={32} stroke={4} />
            <span className="mono" style={{ fontSize: 14.5, fontWeight: 600, width: 26, color: scoreColor(c.match) }}>
              {c.match}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function Database({
  candidates,
  query,
  onOpen,
  onStatus,
  compareSet,
  onToggleSel,
  onCompare,
  setView,
}: {
  candidates: Candidate[];
  query: string;
  onOpen: (c: Candidate) => void;
  onStatus: (id: string, status: CandidateStatus) => void;
  compareSet: string[];
  onToggleSel: (id: string) => void;
  onCompare: () => void;
  setView: (v: string) => void;
}) {
  const [role, setRole] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [sort, setSort] = useState("match");
  const [minExp, setMinExp] = useState("all");

  const roleOpts = useMemo(() => {
    const counts: Record<string, number> = {};
    candidates.forEach((c) => {
      counts[c.role] = (counts[c.role] || 0) + 1;
    });
    return [
      { value: "all", label: "All roles", count: candidates.length },
      ...NDS.ROLES.filter((r) => counts[r]).map((r) => ({
        value: r,
        label: r.replace("Engineer", "Eng."),
        count: counts[r],
      })),
    ];
  }, [candidates]);

  const expOpts = [
    { value: "all", label: "Any" },
    { value: "3", label: "3+ years" },
    { value: "5", label: "5+ years" },
    { value: "8", label: "8+ years" },
    { value: "10", label: "10+ years" },
  ];
  const sortOpts = [
    { value: "match", label: "AI Match" },
    { value: "experience", label: "Experience" },
    { value: "certs", label: "Certifications" },
    { value: "salary", label: "Salary (low→high)" },
    { value: "notice", label: "Notice period" },
  ];

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { all: candidates.length, new: 0, review: 0, shortlisted: 0, rejected: 0 };
    candidates.forEach((x) => c[x.status]++);
    return c;
  }, [candidates]);

  const filtered = useMemo(() => {
    let list = candidates.filter((c) => {
      if (role !== "all" && c.role !== role) return false;
      if (statusF !== "all" && c.status !== statusF) return false;
      if (minExp !== "all" && c.experience < +minExp) return false;
      if (query) {
        const q = query.toLowerCase();
        const hay = (c.name + c.title + c.role + c.skills.join(" ") + c.certs.map((x) => x.name).join(" ")).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const dir = { match: -1, experience: -1, certs: -1, salary: 1, notice: 1 }[sort] ?? -1;
    list.sort((a, b) => {
      const get = (c: Candidate) =>
        ({ match: c.match, experience: c.experience, certs: c.certs.length, salary: c.salaryExpect, notice: c.noticeDays } as Record<
          string,
          number
        >)[sort];
      return (get(a) - get(b)) * dir;
    });
    return list;
  }, [candidates, role, statusF, minExp, sort, query]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="fade-up" style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <Segmented
          value={statusF}
          onChange={setStatusF}
          options={[
            { value: "all", label: "All", count: statusCounts.all },
            { value: "new", label: "New", count: statusCounts.new },
            { value: "shortlisted", label: "Shortlisted", count: statusCounts.shortlisted },
            { value: "rejected", label: "Rejected", count: statusCounts.rejected },
          ]}
        />
        <div style={{ flex: 1 }} />
        <Dropdown label="Role" icon="briefcase" value={role} options={roleOpts} onChange={setRole} />
        <Dropdown label="Exp" icon="clock" value={minExp} options={expOpts} onChange={setMinExp} />
        <Dropdown label="Sort" icon="filter" value={sort} options={sortOpts} onChange={setSort} />
      </div>

      {compareSet.length > 0 && (
        <div
          className="pop-in"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "12px 18px",
            borderRadius: 12,
            background: "var(--ac-soft)",
            border: "1px solid color-mix(in srgb, var(--ac) 40%, transparent)",
          }}
        >
          <Icon name="compare" size={18} style={{ color: "var(--ac-hi)" }} />
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>
            {compareSet.length} candidate{compareSet.length > 1 ? "s" : ""} selected for comparison
          </span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 9 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => compareSet.forEach((id) => onToggleSel(id))}
            >
              Clear
            </button>
            <button
              className="btn btn-primary btn-sm"
              disabled={compareSet.length < 2}
              onClick={onCompare}
              style={{ opacity: compareSet.length < 2 ? 0.5 : 1 }}
            >
              Compare <Icon name="chevR" size={14} />
            </button>
          </div>
        </div>
      )}

      <div
        className="cand-head"
        style={{
          display: "grid",
          gridTemplateColumns: "26px 38px 1.7fr 1.3fr 70px 90px 130px 96px",
          gap: 14,
          padding: "0 16px",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--tx-3)",
        }}
      >
        <span></span>
        <span style={{ textAlign: "center" }}>#</span>
        <span>Candidate</span>
        <span>Role · Location</span>
        <span style={{ textAlign: "center" }}>Exp</span>
        <span>Certs</span>
        <span>AI Verdict</span>
        <span style={{ textAlign: "right" }}>Match</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length === 0 && (
          <div className="panel" style={{ padding: 40, textAlign: "center", color: "var(--tx-2)" }}>
            <Icon name="search" size={28} style={{ color: "var(--tx-3)", marginBottom: 10 }} />
            <div style={{ fontSize: 14, fontWeight: 600 }}>No candidates match these filters</div>
            <div style={{ fontSize: 12.5, marginTop: 3 }}>Try clearing the role or status filter.</div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setView("upload")}>
              <Icon name="upload" size={16} /> Upload résumés
            </button>
          </div>
        )}
        {filtered.map((c, i) => (
          <CandidateRow
            key={c.id}
            c={c}
            rank={i + 1}
            onOpen={onOpen}
            onStatus={onStatus}
            selected={compareSet.includes(c.id)}
            onToggleSel={onToggleSel}
          />
        ))}
      </div>
    </div>
  );
}
