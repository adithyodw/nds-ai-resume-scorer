/* ============================================================
   NDS TalentScore — App root (state · routing · responsive)
   ============================================================ */

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("nds-theme") || "dark");
  const [view, setView] = useState("dashboard");
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState(NDS.candidates);
  const [active, setActive] = useState(null);        // open candidate (report)
  const [prevView, setPrevView] = useState("database");
  const [compareSet, setCompareSet] = useState([]);
  const [drawer, setDrawer] = useState(false);
  const mainRef = useRef(null);

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); localStorage.setItem("nds-theme", theme); }, [theme]);
  useEffect(() => { if (mainRef.current) mainRef.current.scrollTop = 0; }, [view, active]);

  // ⌘K focuses search
  useEffect(() => {
    const h = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); document.querySelector(".topbar-search input")?.focus(); } };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, []);

  const openCandidate = useCallback((c) => { setPrevView(view === "report" ? prevView : view); setActive(c); setView("report"); }, [view, prevView]);

  const setStatus = useCallback((id, status) => {
    setCandidates((cs) => cs.map((c) => c.id === id ? { ...c, status } : c));
    setActive((a) => a && a.id === id ? { ...a, status } : a);
  }, []);

  const toggleSel = useCallback((id) => {
    setCompareSet((s) => s.includes(id) ? s.filter((x) => x !== id) : s.length >= 3 ? s : [...s, id]);
  }, []);

  const completeUpload = useCallback((cand) => {
    setCandidates((cs) => cs.some((c) => c.id === cand.id) ? cs : [cand, ...cs]);
    openCandidate(cand);
  }, [openCandidate]);

  function goCompare() { setView("compare"); }

  let content;
  if (view === "dashboard") content = <Dashboard candidates={candidates} onOpen={openCandidate} setView={setView} />;
  else if (view === "upload") content = <UploadCenter onComplete={completeUpload} />;
  else if (view === "database") content = <Database candidates={candidates} query={query} onOpen={openCandidate} onStatus={setStatus} compareSet={compareSet} onToggleSel={toggleSel} onCompare={goCompare} setView={setView} />;
  else if (view === "compare") content = <CompareView compareSet={compareSet} allCandidates={candidates} onOpen={openCandidate} onRemove={toggleSel} onAdd={toggleSel} setView={setView} />;
  else if (view === "analytics") content = <Analytics candidates={candidates} />;
  else if (view === "settings") content = <SettingsView />;
  else if (view === "report" && active) content = <Report c={active} onBack={() => setView(prevView)} onStatus={setStatus} onCompare={(id) => { if (!compareSet.includes(id)) toggleSel(id); }} compareSet={compareSet} />;
  else content = <Dashboard candidates={candidates} onOpen={openCandidate} setView={setView} />;

  return (
    <div className="app-root">
      {/* desktop sidebar */}
      <div className="sidebar-desktop"><Sidebar view={view} setView={setView} counts={candidates.length} /></div>

      {/* mobile drawer */}
      {drawer && (
        <div className="drawer-overlay" onClick={() => setDrawer(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 90 }}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()} style={{ width: "var(--sidebar-w)", height: "100%", animation: "slideIn .25s ease" }}>
            <Sidebar view={view} setView={setView} counts={candidates.length} onMobileClose={() => setDrawer(false)} />
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, height: "100%" }}>
        <Topbar view={view} theme={theme} setTheme={setTheme} query={query} onSearch={(q) => { setQuery(q); if (q && view !== "database") setView("database"); }}
          onMenu={() => setDrawer(true)} onUpload={() => setView("upload")} />
        <main ref={mainRef} className="scrollarea" style={{ flex: 1, padding: "26px 28px 60px" }}>
          <div key={view + (active?.id || "")} style={{ maxWidth: 1320, margin: "0 auto" }}>{content}</div>
        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
