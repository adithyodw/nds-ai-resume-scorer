"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Candidate, CandidateStatus } from "@/lib/types";
import {
  updateCandidateStatus,
  deleteCandidates,
  scheduleCandidateInterview,
  notifyWhatsApp,
  restoreCandidates,
} from "@/lib/api-client";
import { readClientCache, writeClientCache } from "@/lib/client-cache";
import { buildWhatsAppUrl, buildShortlistScheduleMessage, NOTIFY_PHONE } from "@/lib/whatsapp";
import { Sidebar, Topbar } from "./shell";
import { Dashboard } from "./dashboard";
import { UploadCenter } from "./upload";
import { Database } from "./database";
import { CompareView } from "./compare";
import { Analytics, SettingsView } from "./extras";
import { Report } from "./report";

export function TalentScoreApp() {
  const [theme, setTheme] = useState("dark");
  const [view, setView] = useState("dashboard");
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Candidate | null>(null);
  const [prevView, setPrevView] = useState("database");
  const [compareSet, setCompareSet] = useState<string[]>([]);
  const [drawer, setDrawer] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const loadCandidates = useCallback(async () => {
    const cached = readClientCache();
    try {
      const res = await fetch("/api/candidates", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load candidates");
      const data = await res.json();
      let list = data.candidates as Candidate[];

      if (list.length === 0 && cached.length > 0) {
        list = cached;
        try {
          await restoreCandidates(cached);
          const retry = await fetch("/api/candidates", { cache: "no-store" });
          if (retry.ok) {
            const retryData = await retry.json();
            if (retryData.candidates?.length) list = retryData.candidates as Candidate[];
          }
        } catch {
          /* show cached list until server recovers */
        }
      }

      setCandidates(list);
      if (list.length) writeClientCache(list);
      return list;
    } catch {
      if (cached.length) {
        setCandidates(cached);
        return cached;
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const deepLinkHandled = useRef(false);
  useEffect(() => {
    if (deepLinkHandled.current || loading) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("candidate");
    if (!id) return;
    const found = candidates.find((c) => c.id === id);
    if (found) {
      deepLinkHandled.current = true;
      setPrevView("database");
      setActive(found);
      setView("report");
    }
  }, [candidates, loading]);

  useEffect(() => {
    if (candidates.length) writeClientCache(candidates);
  }, [candidates]);

  // Refresh live data when returning to data-heavy views.
  useEffect(() => {
    if (view === "dashboard" || view === "database" || view === "analytics") {
      loadCandidates();
    }
  }, [view, loadCandidates]);

  useEffect(() => {
    const stored = localStorage.getItem("nds-theme") || "dark";
    setTheme(stored);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("nds-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [view, active?.id]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.querySelector<HTMLInputElement>(".topbar-search input")?.focus();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const openCandidate = useCallback(
    (c: Candidate) => {
      setPrevView(view === "report" ? prevView : view);
      setActive(c);
      setView("report");
    },
    [view, prevView]
  );

  const mergeCandidate = useCallback((updated: Candidate) => {
    setCandidates((cs) => cs.map((c) => (c.id === updated.id ? updated : c)));
    setActive((a) => (a && a.id === updated.id ? updated : a));
  }, []);

  const setStatus = useCallback(
    async (id: string, status: CandidateStatus) => {
      const now = new Date().toISOString();
      setCandidates((cs) =>
        cs.map((c) =>
          c.id === id
            ? {
                ...c,
                status,
                shortlistedAt: status === "shortlisted" ? c.shortlistedAt ?? now : c.shortlistedAt,
              }
            : c
        )
      );
      setActive((a) =>
        a && a.id === id
          ? {
              ...a,
              status,
              shortlistedAt: status === "shortlisted" ? a.shortlistedAt ?? now : a.shortlistedAt,
            }
          : a
      );
      try {
        const updated = await updateCandidateStatus(id, status);
        mergeCandidate(updated);
      } catch {
        loadCandidates();
      }
    },
    [loadCandidates, mergeCandidate]
  );

  const scheduleInterview = useCallback(
    async (id: string) => {
      const base = candidates.find((c) => c.id === id) ?? active;
      if (!base) return;

      const now = new Date().toISOString();
      const origin = window.location.origin;
      const preview: Candidate = {
        ...base,
        status: "shortlisted",
        shortlistedAt: base.shortlistedAt ?? now,
        scheduledAt: now,
      };

      const waUrl = buildWhatsAppUrl(NOTIFY_PHONE, buildShortlistScheduleMessage(preview, origin));
      window.open(waUrl, "_blank", "noopener,noreferrer");

      setCandidates((cs) => cs.map((c) => (c.id === id ? preview : c)));
      setActive((a) => (a && a.id === id ? preview : a));

      try {
        const updated = await scheduleCandidateInterview(id);
        setCandidates((cs) => {
          const next = cs.map((c) => (c.id === id ? updated : c));
          writeClientCache(next);
          return next;
        });
        setActive((a) => (a && a.id === id ? updated : a));
        void notifyWhatsApp(id, origin);
      } catch {
        loadCandidates();
      }
    },
    [candidates, active, loadCandidates, mergeCandidate]
  );

  const toggleSel = useCallback((id: string) => {
    setCompareSet((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }, []);

  const setSelection = useCallback((ids: string[]) => {
    setCompareSet(ids);
  }, []);

  const clearSelection = useCallback(() => {
    setCompareSet([]);
  }, []);

  const deleteSelected = useCallback(async () => {
    const ids = [...compareSet];
    if (!ids.length) return;
    const n = ids.length;
    if (!window.confirm(`Delete ${n} résumé${n > 1 ? "s" : ""}? This cannot be undone.`)) return;

    setCandidates((cs) => cs.filter((c) => !ids.includes(c.id)));
    setCompareSet([]);
    if (active && ids.includes(active.id)) {
      setActive(null);
      setView("database");
    }
    try {
      await deleteCandidates(ids);
    } catch {
      loadCandidates();
    }
  }, [compareSet, active, loadCandidates]);

  const completeUpload = useCallback(
    async (added: Candidate[]) => {
      if (!added.length) return;

      setCandidates((cs) => {
        const ids = new Set(cs.map((c) => c.id));
        const fresh = added.filter((c) => !ids.has(c.id));
        const next = [...fresh, ...cs];
        writeClientCache(next);
        return next;
      });

      if (added.length === 1) {
        setPrevView("upload");
        setActive(added[0]);
        setView("report");
      } else {
        setView("database");
      }

      const list = await loadCandidates();
      if (added.length === 1 && list?.length) {
        const synced = list.find((c) => c.id === added[0].id) ?? added[0];
        setActive(synced);
      }
    },
    [loadCandidates]
  );

  function goCompare() {
    setView("compare");
  }

  let content;
  if (loading) {
    content = (
      <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: 40 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />
        ))}
      </div>
    );
  } else if (view === "dashboard") {
    content = <Dashboard candidates={candidates} onOpen={openCandidate} setView={setView} />;
  } else if (view === "upload") {
    content = <UploadCenter onComplete={completeUpload} />;
  } else if (view === "database") {
    content = (
      <Database
        candidates={candidates}
        query={query}
        onOpen={openCandidate}
        onStatus={setStatus}
        selectedIds={compareSet}
        onToggleSel={toggleSel}
        onSetSelection={setSelection}
        onClearSelection={clearSelection}
        onDeleteSelected={deleteSelected}
        onCompare={goCompare}
        setView={setView}
      />
    );
  } else if (view === "compare") {
    content = (
      <CompareView
        compareSet={compareSet}
        allCandidates={candidates}
        onOpen={openCandidate}
        onRemove={toggleSel}
        onAdd={toggleSel}
        setView={setView}
      />
    );
  } else if (view === "analytics") {
    content = <Analytics candidates={candidates} />;
  } else if (view === "settings") {
    content = <SettingsView />;
  } else if (view === "report" && active) {
    content = (
      <Report
        c={active}
        onBack={() => setView(prevView)}
        onStatus={setStatus}
        onSchedule={scheduleInterview}
        onCompare={(id) => {
          if (!compareSet.includes(id)) toggleSel(id);
        }}
        compareSet={compareSet}
      />
    );
  } else {
    content = <Dashboard candidates={candidates} onOpen={openCandidate} setView={setView} />;
  }

  return (
    <div className="app-root">
      <div className="sidebar-desktop">
        <Sidebar view={view} setView={setView} counts={candidates.length} />
      </div>

      {drawer && (
        <div
          className="drawer-overlay"
          onClick={() => setDrawer(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 90 }}
        >
          <div
            className="drawer-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ width: "var(--sidebar-w)", height: "100%", animation: "slideIn .25s ease" }}
          >
            <Sidebar
              view={view}
              setView={setView}
              counts={candidates.length}
              onMobileClose={() => setDrawer(false)}
            />
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, height: "100%" }}>
        <Topbar
          view={view}
          theme={theme}
          setTheme={setTheme}
          query={query}
          onSearch={(q) => {
            setQuery(q);
            if (q && view !== "database") setView("database");
          }}
          onMenu={() => setDrawer(true)}
          onUpload={() => setView("upload")}
        />
        <main ref={mainRef} className="scrollarea" style={{ flex: 1, padding: "26px 28px 60px" }}>
          <div key={view + (active?.id || "")} style={{ maxWidth: 1320, margin: "0 auto" }}>
            {content}
          </div>
        </main>
      </div>
    </div>
  );
}
