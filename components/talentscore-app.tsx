"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Candidate, CandidateStatus } from "@/lib/types";
import { fetchCandidates, updateCandidateStatus } from "@/lib/api-client";
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
    try {
      const list = await fetchCandidates();
      setCandidates(list);
    } catch {
      /* keep existing list on transient errors */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

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

  const setStatus = useCallback(async (id: string, status: CandidateStatus) => {
    setCandidates((cs) => cs.map((c) => (c.id === id ? { ...c, status } : c)));
    setActive((a) => (a && a.id === id ? { ...a, status } : a));
    try {
      await updateCandidateStatus(id, status);
    } catch {
      loadCandidates();
    }
  }, [loadCandidates]);

  const toggleSel = useCallback((id: string) => {
    setCompareSet((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 3 ? s : [...s, id]));
  }, []);

  const completeUpload = useCallback(
    (added: Candidate[]) => {
      setCandidates((cs) => {
        const ids = new Set(cs.map((c) => c.id));
        const fresh = added.filter((c) => !ids.has(c.id));
        return [...fresh, ...cs];
      });
      if (added[0]) openCandidate(added[0]);
    },
    [openCandidate]
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
        compareSet={compareSet}
        onToggleSel={toggleSel}
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
