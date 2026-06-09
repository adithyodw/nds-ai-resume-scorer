"use client";

import { useEffect, useState } from "react";
import { scoreColor } from "./primitives";

export function RadarChart({
  data,
  axes,
  size = 280,
  color = "var(--ac)",
  compare = null,
  compareColor = "var(--info)",
  animate = true,
}: {
  data: number[];
  axes: readonly string[];
  size?: number;
  color?: string;
  compare?: number[] | null;
  compareColor?: string;
  animate?: boolean;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 38;
  const n = axes.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (val: number, i: number, rad = R) => {
    const r = (val / 100) * rad;
    return [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r];
  };
  const poly = (vals: number[]) => vals.map((v, i) => pt(v, i).join(",")).join(" ");
  const [shown, setShown] = useState(!animate);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 60);
    return () => clearTimeout(t);
  }, []);
  const rings = [25, 50, 75, 100];
  return (
    <svg width={size} height={size} style={{ overflow: "visible" }}>
      {rings.map((rr) => (
        <polygon
          key={rr}
          points={axes.map((_, i) => pt(rr, i).join(",")).join(" ")}
          fill="none"
          stroke="var(--line)"
          strokeWidth="1"
          opacity={rr === 100 ? 0.9 : 0.5}
        />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pt(100, i);
        return (
          <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" strokeWidth="1" opacity="0.5" />
        );
      })}
      {compare && (
        <polygon
          points={poly(compare)}
          fill="color-mix(in srgb, var(--info) 12%, transparent)"
          stroke={compareColor}
          strokeWidth="1.5"
          strokeDasharray="4 3"
          style={{
            transition: "all 1s cubic-bezier(.2,.7,.2,1)",
            transformOrigin: "center",
            transform: shown ? "scale(1)" : "scale(0.1)",
            opacity: shown ? 1 : 0,
          }}
        />
      )}
      <polygon
        points={poly(data)}
        fill="color-mix(in srgb, var(--ac) 18%, transparent)"
        stroke={color}
        strokeWidth="2"
        style={{
          transition: "all 1.1s cubic-bezier(.2,.7,.2,1)",
          transformOrigin: "center",
          transform: shown ? "scale(1)" : "scale(0.1)",
          opacity: shown ? 1 : 0,
        }}
      />
      {data.map((v, i) => {
        const [x, y] = pt(v, i);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="3.2"
            fill={color}
            style={{
              transition: "all 1.1s cubic-bezier(.2,.7,.2,1)",
              opacity: shown ? 1 : 0,
              filter: `drop-shadow(0 0 4px ${color})`,
            }}
          />
        );
      })}
      {axes.map((ax, i) => {
        const [x, y] = pt(118, i);
        const anchor =
          Math.abs(Math.cos(angle(i))) < 0.3 ? "middle" : Math.cos(angle(i)) > 0 ? "start" : "end";
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            style={{ fontSize: 10.5, fontWeight: 600, fill: "var(--tx-2)" }}
          >
            {ax.split(" / ")[0].length > 14 ? ax.split(" ")[0] : ax}
          </text>
        );
      })}
    </svg>
  );
}

export function ScoreBar({
  label,
  value,
  max = 100,
  delay = 0,
  showVal = true,
  height = 8,
  sublabel = null,
}: {
  label: string;
  value: number;
  max?: number;
  delay?: number;
  showVal?: boolean;
  height?: number;
  sublabel?: string | null;
}) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW((value / max) * 100), 80 + delay);
    return () => clearTimeout(t);
  }, [value, max, delay]);
  const col = scoreColor(value);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--tx-1)" }}>{label}</span>
        {showVal && (
          <span className="mono" style={{ fontSize: 13.5, fontWeight: 600, color: col }}>
            {value}
          </span>
        )}
      </div>
      <div style={{ height, background: "var(--bg-4)", borderRadius: 99, overflow: "hidden" }}>
        <div
          style={{
            width: `${w}%`,
            height: "100%",
            borderRadius: 99,
            background: `linear-gradient(90deg, color-mix(in srgb, ${col} 70%, transparent), ${col})`,
            transition: "width 1s cubic-bezier(.2,.7,.2,1)",
            boxShadow: `0 0 10px color-mix(in srgb, ${col} 50%, transparent)`,
          }}
        />
      </div>
      {sublabel && <div style={{ fontSize: 11.5, color: "var(--tx-3)", marginTop: 5 }}>{sublabel}</div>}
    </div>
  );
}

export function FunnelChart({ data }: { data: { stage: string; value: number }[] }) {
  const maxV = data[0].value;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.map((d, i) => {
        const pct = (d.value / maxV) * 100;
        const conv = i === 0 ? 100 : Math.round((d.value / data[i - 1].value) * 100);
        const hue = 245 - i * 6;
        return (
          <div key={d.stage} style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 96,
                fontSize: 12.5,
                fontWeight: 600,
                color: "var(--tx-1)",
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              {d.stage}
            </div>
            <div style={{ flex: 1, position: "relative", height: 34 }}>
              <div
                className="fade-up"
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  borderRadius: 7,
                  minWidth: 56,
                  background: `linear-gradient(90deg, hsl(${hue} 65% 42%), hsl(${hue} 70% 58%))`,
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: 12,
                  animationDelay: `${i * 80}ms`,
                }}
              >
                <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                  {d.value}
                </span>
              </div>
            </div>
            <div
              className="mono"
              style={{
                width: 44,
                fontSize: 12,
                fontWeight: 600,
                color: i === 0 ? "var(--tx-3)" : "var(--tx-2)",
                flexShrink: 0,
              }}
            >
              {i === 0 ? "—" : conv + "%"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Sparkline({
  data,
  width = 220,
  height = 56,
  color = "var(--ac)",
  fill = true,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 4;
  const xs = (i: number) => pad + (i / (data.length - 1)) * (width - pad * 2);
  const ys = (v: number) => height - pad - ((v - min) / range) * (height - pad * 2);
  const line = data
    .map((v, i) => `${i === 0 ? "M" : "L"}${xs(i).toFixed(1)},${ys(v).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${xs(data.length - 1)},${height} L${xs(0)},${height} Z`;
  const gid = "spark" + Math.round(min * 1000 + max);
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={xs(data.length - 1)}
        cy={ys(data[data.length - 1])}
        r="3.5"
        fill={color}
        style={{ filter: `drop-shadow(0 0 5px ${color})` }}
      />
    </svg>
  );
}

export function CertHeatmap({ data }: { data: { cert: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(78px, 1fr))", gap: 8 }}>
      {data.map((d) => {
        const t = d.count / max;
        const alpha = 0.12 + t * 0.78;
        return (
          <div
            key={d.cert}
            style={{
              padding: "12px 10px",
              borderRadius: 9,
              textAlign: "center",
              background: `color-mix(in srgb, var(--ac) ${alpha * 100}%, var(--bg-3))`,
              border: "1px solid var(--line)",
            }}
          >
            <div
              className="mono"
              style={{ fontSize: 18, fontWeight: 600, color: t > 0.5 ? "#fff" : "var(--tx-0)" }}
            >
              {d.count}
            </div>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: t > 0.5 ? "rgba(255,255,255,.85)" : "var(--tx-2)",
                marginTop: 2,
              }}
            >
              {d.cert}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MiniDonut({
  value,
  size = 44,
  stroke = 5,
  color,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const col = color || scoreColor(value);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-4)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={col}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - value / 100)}
      />
    </svg>
  );
}
