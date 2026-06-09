"use client";

import { Avatar, Icon } from "./primitives";

const NAV = [
  { id: "dashboard", label: "Overview", icon: "dashboard" },
  { id: "upload", label: "Upload Center", icon: "upload" },
  { id: "database", label: "Candidates", icon: "database" },
  { id: "compare", label: "Comparison", icon: "compare" },
  { id: "analytics", label: "Analytics", icon: "analytics" },
];
const NAV_SECONDARY = [{ id: "settings", label: "AI & Settings", icon: "settings" }];

function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          flexShrink: 0,
          position: "relative",
          background: "linear-gradient(150deg, var(--ac-hi), var(--ac-lo))",
          display: "grid",
          placeItems: "center",
          boxShadow: "0 4px 16px -4px var(--ac-glow)",
        }}
      >
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 18V7l8 6 8-6v11" />
        </svg>
      </div>
      {!collapsed && (
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontSize: 15.5, fontWeight: 700, letterSpacing: "-0.02em" }}>TalentScore</div>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.1em", color: "var(--tx-2)" }}>
            NDS · AI HIRING
          </div>
        </div>
      )}
    </div>
  );
}

export function Sidebar({
  view,
  setView,
  counts,
  onMobileClose,
}: {
  view: string;
  setView: (v: string) => void;
  counts: number;
  onMobileClose?: () => void;
}) {
  const NavItem = ({ item }: { item: (typeof NAV)[number] }) => {
    const active = view === item.id;
    return (
      <button
        onClick={() => {
          setView(item.id);
          onMobileClose?.();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          width: "100%",
          padding: "10px 12px",
          borderRadius: 9,
          position: "relative",
          color: active ? "var(--tx-0)" : "var(--tx-2)",
          background: active ? "var(--bg-3)" : "transparent",
          fontWeight: active ? 600 : 500,
          fontSize: 13.5,
          transition: "background .15s, color .15s",
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.background = "var(--bg-2)";
            e.currentTarget.style.color = "var(--tx-1)";
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--tx-2)";
          }
        }}
      >
        {active && (
          <span
            style={{
              position: "absolute",
              left: -12,
              top: "50%",
              transform: "translateY(-50%)",
              width: 3,
              height: 20,
              borderRadius: 99,
              background: "var(--ac)",
            }}
          />
        )}
        <Icon name={item.icon} size={18} stroke={active ? 2 : 1.7} style={{ color: active ? "var(--ac-hi)" : "inherit" }} />
        <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
        {item.id === "database" && (
          <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: "var(--tx-3)" }}>
            {counts}
          </span>
        )}
      </button>
    );
  };
  return (
    <aside
      style={{
        background: "var(--bg-1)",
        borderRight: "1px solid var(--line)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "18px 16px",
      }}
    >
      <div style={{ padding: "2px 4px 20px" }}>
        <Logo />
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <div className="eyebrow" style={{ padding: "8px 12px 6px" }}>
          Workspace
        </div>
        {NAV.map((it) => (
          <NavItem key={it.id} item={it} />
        ))}
      </nav>
      <nav style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 14 }}>
        <div className="eyebrow" style={{ padding: "8px 12px 6px" }}>
          Configure
        </div>
        {NAV_SECONDARY.map((it) => (
          <NavItem key={it.id} item={it} />
        ))}
      </nav>
      <div style={{ marginTop: "auto" }}>
        <div
          style={{
            padding: 14,
            borderRadius: 12,
            background: "var(--bg-2)",
            border: "1px solid var(--line)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Icon name="sparkle" size={15} style={{ color: "var(--ac-hi)" }} />
            <span style={{ fontSize: 12.5, fontWeight: 700 }}>AI Engine</span>
            <span
              style={{
                marginLeft: "auto",
                width: 7,
                height: 7,
                borderRadius: 99,
                background: "var(--pos)",
                boxShadow: "0 0 8px var(--pos)",
              }}
            />
          </div>
          <div style={{ fontSize: 11.5, color: "var(--tx-2)", lineHeight: 1.4 }}>
            SI scoring model <b style={{ color: "var(--tx-1)" }}>v4.2</b> active. Zero-cost rule engine.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 6px 2px" }}>
          <Avatar c={{ initials: "FR" }} size={32} />
          <div style={{ lineHeight: 1.2, flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Farah Indrawati
            </div>
            <div style={{ fontSize: 11, color: "var(--tx-2)" }}>HR Lead · NDS</div>
          </div>
          <Icon name="logout" size={16} style={{ color: "var(--tx-3)" }} />
        </div>
      </div>
    </aside>
  );
}

export function Topbar({
  view,
  theme,
  setTheme,
  onSearch,
  query,
  onMenu,
  onUpload,
}: {
  view: string;
  theme: string;
  setTheme: (t: string) => void;
  onSearch: (q: string) => void;
  query: string;
  onMenu: () => void;
  onUpload: () => void;
}) {
  const titles: Record<string, string> = {
    dashboard: "Hiring Overview",
    upload: "Résumé Upload Center",
    database: "Candidate Database",
    compare: "Candidate Comparison",
    analytics: "Hiring Analytics",
    settings: "AI & Settings",
    report: "Candidate Report",
  };
  return (
    <header
      style={{
        height: "var(--topbar-h)",
        borderBottom: "1px solid var(--line)",
        background: "color-mix(in srgb, var(--bg-1) 86%, transparent)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <button className="mobile-menu-btn" onClick={onMenu} style={{ display: "none", color: "var(--tx-1)" }}>
        <Icon name="grid" size={20} />
      </button>
      <div style={{ minWidth: 0 }}>
        <h1 style={{ fontSize: 16.5, fontWeight: 700, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
          {titles[view] || "TalentScore"}
        </h1>
      </div>
      <div
        className="topbar-search"
        style={{
          marginLeft: 20,
          flex: 1,
          maxWidth: 420,
          display: "flex",
          alignItems: "center",
          gap: 9,
          height: 38,
          padding: "0 14px",
          background: "var(--bg-3)",
          border: "1px solid var(--line)",
          borderRadius: 9,
        }}
      >
        <Icon name="search" size={16} style={{ color: "var(--tx-3)" }} />
        <input
          value={query}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search candidates, roles, certifications…"
          style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--tx-0)", fontSize: 13.5 }}
        />
        <kbd
          className="mono"
          style={{
            fontSize: 10.5,
            color: "var(--tx-3)",
            border: "1px solid var(--line-2)",
            borderRadius: 5,
            padding: "1px 5px",
          }}
        >
          ⌘K
        </kbd>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title="Toggle theme"
          style={{ width: 38, padding: 0 }}
        >
          <Icon name={theme === "dark" ? "sun" : "moon"} size={17} />
        </button>
        <button className="btn btn-ghost btn-sm icon-btn" style={{ width: 38, padding: 0, position: "relative" }}>
          <Icon name="bell" size={17} />
          <span
            style={{
              position: "absolute",
              top: 7,
              right: 8,
              width: 7,
              height: 7,
              borderRadius: 99,
              background: "var(--neg)",
              border: "2px solid var(--bg-3)",
            }}
          />
        </button>
        <button className="btn btn-primary btn-sm upload-cta" onClick={onUpload}>
          <Icon name="plus" size={16} /> Upload CV
        </button>
      </div>
    </header>
  );
}
