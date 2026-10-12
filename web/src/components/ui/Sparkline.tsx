"use client";
import { useMemo } from "react";
import { pnlTone } from "@/lib/utils/formatters";

/**
 * 迷你趋势火花线（纯 SVG，12 点抽样）。
 * 线色按区间方向取收益配色；末端点为当前值焦点。
 */
export default function Sparkline({
  values,
  width = 96,
  height = 28,
  strokeWidth = 2,
}: {
  values: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
}) {
  const { path, area, last, tone } = useMemo(() => {
    const pts = values.filter((v) => Number.isFinite(v));
    if (pts.length < 2) return { path: "", area: "", last: null, tone: "neutral" as const };
    // 抽样到最多 12 点
    const maxPts = 12;
    const step = Math.max(1, Math.ceil(pts.length / maxPts));
    const sampled: number[] = [];
    for (let i = 0; i < pts.length; i += step) sampled.push(pts[i]);
    const lastVal = pts[pts.length - 1];
    if (sampled[sampled.length - 1] !== lastVal) sampled.push(lastVal);

    const min = Math.min(...sampled);
    const max = Math.max(...sampled);
    const span = max - min || 1;
    const pad = strokeWidth;
    const w = width;
    const h = height - pad * 2;
    const coords = sampled.map((v, i) => {
      const x = (i / (sampled.length - 1)) * w;
      const y = pad + h - ((v - min) / span) * h;
      return [x, y] as const;
    });
    const d = coords
      .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
      .join(" ");
    const areaD = `${d} L${w},${height} L0,${height} Z`;
    const tone = pnlTone(lastVal - sampled[0]);
    return {
      path: d,
      area: areaD,
      last: coords[coords.length - 1],
      tone,
    };
  }, [values, width, height, strokeWidth]);

  if (!path) {
    return (
      <div
        className="ui-sans text-[10px]"
        style={{ color: "var(--pnl-neutral)", height, lineHeight: `${height}px` }}
      >
        —
      </div>
    );
  }

  const stroke =
    tone === "up"
      ? "var(--pnl-up)"
      : tone === "down"
        ? "var(--pnl-down)"
        : "var(--pnl-neutral)";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden="true"
    >
      <path d={area} fill={stroke} opacity={0.12} />
      <path
        d={path}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && (
        <circle cx={last[0] - strokeWidth / 2} cy={last[1]} r={strokeWidth} fill={stroke} />
      )}
    </svg>
  );
}
