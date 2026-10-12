import { format } from "date-fns";
import numeral from "numeral";

export const fmtUSD = (n?: number | null) =>
  n == null ? "--" : numeral(n).format("$0,0.00");

export const fmtPct = (n?: number | null) =>
  n == null ? "--" : numeral(n).format("0.00%");

export const fmtInt = (n?: number | null) =>
  n == null ? "--" : numeral(n).format("0,0");

export const fmtTs = (unixSeconds?: number | null) =>
  unixSeconds == null
    ? "--"
    : format(unixSeconds * 1000, "yyyy-MM-dd HH:mm:ss");

// 收益方向：up=盈利 / down=亏损 / neutral=持平或缺失
export type PnlTone = "up" | "down" | "neutral";

export const pnlTone = (n?: number | null): PnlTone =>
  n == null || Number.isNaN(n) ? "neutral" : n > 0 ? "up" : n < 0 ? "down" : "neutral";

// 统一收益/亏损配色（globals.css 设计令牌）
export const pnlClass = (n?: number | null) => {
  const tone = pnlTone(n);
  return tone === "up" ? "pnl-up" : tone === "down" ? "pnl-down" : "pnl-neutral";
};

export const withSign = (n?: number | null, digits = 2) =>
  n == null
    ? "--"
    : `${n > 0 ? "+" : n < 0 ? "-" : ""}${Math.abs(n).toFixed(digits)}`;
