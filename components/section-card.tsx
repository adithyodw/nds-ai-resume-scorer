"use client";

import type { CSSProperties, ReactNode } from "react";

export function SectionCard({
  title,
  sub,
  action,
  children,
  style = {},
  delay = 0,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
  delay?: number;
}) {
  return (
    <div
      className="panel fade-up"
      style={{ padding: 20, display: "flex", flexDirection: "column", animationDelay: `${delay}ms`, ...style }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <h3 style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: "-0.01em" }}>{title}</h3>
          {sub && <p style={{ fontSize: 12, color: "var(--tx-2)", marginTop: 2 }}>{sub}</p>}
        </div>
        {action && <div style={{ marginLeft: "auto" }}>{action}</div>}
      </div>
      {children}
    </div>
  );
}
