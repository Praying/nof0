"use client";
import { useMemo } from "react";
import { useAccountValueSeries } from "./useAccountValueSeries";

/** 单模型净值时间线（用于模型页净值曲线 / 排行榜火花线） */
export function useModelEquitySeries(modelId?: string) {
  const { series, isLoading, isError } = useAccountValueSeries();
  const points = useMemo(() => {
    if (!modelId) return [] as { t: number; v: number }[];
    const out: { t: number; v: number }[] = [];
    for (const p of series) {
      const v = p[modelId];
      if (typeof v === "number" && Number.isFinite(v)) out.push({ t: p.timestamp, v });
    }
    return out;
  }, [series, modelId]);
  const values = useMemo(() => points.map((p) => p.v), [points]);
  return { points, values, isLoading, isError };
}
