"use client";
import { pnlTone } from "@/lib/utils/formatters";

/** 多空胶囊标签：LONG 绿 / SHORT 红（标签文字承载方向，不依赖颜色单独编码） */
export function SideBadge({ side }: { side: "LONG" | "SHORT" }) {
  return (
    <span className={`side-badge ${side === "LONG" ? "side-long" : "side-short"}`}>
      {side === "LONG" ? "LONG 多" : "SHORT 空"}
    </span>
  );
}

/** 盈亏方向箭头：▲ 盈利 / ▼ 亏损 / · 持平（配合数字加速扫读） */
export function PnlArrow({ value }: { value?: number | null }) {
  const tone = pnlTone(value);
  const mark = tone === "up" ? "▲" : tone === "down" ? "▼" : "·";
  return (
    <span
      aria-hidden="true"
      className={tone === "up" ? "pnl-up" : tone === "down" ? "pnl-down" : "pnl-neutral"}
    >
      {mark}
    </span>
  );
}

/**
 * 盈亏进度条（meter 约定：填充表幅度，底轨为同色浅阶）。
 * scale 为组内最大绝对盈亏；fill 宽度 = |pnl| / scale。
 */
export function PnlMeter({
  pnl,
  scale,
  width = 56,
}: {
  pnl?: number | null;
  scale: number;
  width?: number;
}) {
  const tone = pnlTone(pnl);
  if (tone === "neutral" || !scale || scale <= 0) {
    return <div style={{ width }} aria-hidden="true" />;
  }
  const ratio = Math.max(0.08, Math.min(Math.abs(pnl as number) / scale, 1));
  return (
    <div
      className={`pnl-meter ${tone === "up" ? "pnl-meter-track-up" : "pnl-meter-track-down"}`}
      style={{ width }}
      aria-hidden="true"
    >
      <div
        className={tone === "up" ? "pnl-meter-fill-up" : "pnl-meter-fill-down"}
        style={{ width: `${(ratio * 100).toFixed(0)}%` }}
      />
    </div>
  );
}
