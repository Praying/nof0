"use client";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { getModelColor, getModelName } from "@/lib/model/meta";
import { useModelEquitySeries } from "@/lib/api/hooks/useModelEquitySeries";
import { fmtUSD, pnlClass, withSign } from "@/lib/utils/formatters";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import ErrorBanner from "@/components/ui/ErrorBanner";

const BASE = 10000; // 每模型初始资金

/**
 * 模型净值曲线（Equity Curve）：用户最关心的视图，置于模型页顶部。
 */
export default function ModelEquityCurve({ modelId }: { modelId: string }) {
  const { points, values, isLoading, isError } = useModelEquitySeries(modelId);
  const color = getModelColor(modelId);

  const rows = useMemo(
    () => points.map((p) => ({ t: p.t, v: p.v })),
    [points],
  );

  const stats = useMemo(() => {
    if (!values.length) return undefined;
    const first = values[0];
    const last = values[values.length - 1];
    const peak = Math.max(...values);
    const maxDrawdown = values.reduce(
      (acc, v) => Math.min(acc, ((v - peak) / peak) * 100),
      0,
    );
    return {
      first,
      last,
      changePct: first > 0 ? ((last - first) / first) * 100 : undefined,
      totalPnl: last - BASE,
      maxDrawdown,
    };
  }, [values]);

  return (
    <div className="glass-panel rise-in p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div
            className="ui-sans text-sm font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            净值曲线 · {getModelName(modelId)}
          </div>
          <div
            className="ui-sans text-[11px]"
            style={{ color: "var(--muted-text)" }}
          >
            Equity Curve — 账户净值随时间走势
          </div>
        </div>
        {stats && (
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="ui-sans text-[11px]" style={{ color: "var(--muted-text)" }}>
                最新净值{" "}
              </span>
              <span className="ui-sans font-semibold" style={{ color: "var(--foreground)" }}>
                {fmtUSD(stats.last)}
              </span>
            </div>
            <div>
              <span className="ui-sans text-[11px]" style={{ color: "var(--muted-text)" }}>
                区间变化{" "}
              </span>
              <span className={`ui-sans font-semibold ${pnlClass(stats.changePct)}`}>
                {stats.changePct != null ? `${withSign(stats.changePct, 2)}%` : "—"}
              </span>
            </div>
            <div>
              <span className="ui-sans text-[11px]" style={{ color: "var(--muted-text)" }}>
                最大回撤{" "}
              </span>
              <span className="ui-sans font-semibold pnl-down">
                {stats.maxDrawdown < 0 ? `${stats.maxDrawdown.toFixed(1)}%` : "0%"}
              </span>
            </div>
          </div>
        )}
      </div>

      <ErrorBanner message={isError ? "净值数据暂时不可用。" : undefined} />

      {isLoading && rows.length < 2 ? (
        <SkeletonBlock className="h-[220px] w-full" />
      ) : rows.length < 2 ? (
        <div
          className="ui-sans flex h-[220px] items-center justify-center text-sm"
          style={{ color: "var(--muted-text)" }}
        >
          暂无净值数据
        </div>
      ) : (
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={rows}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id={`eq-fill-${modelId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="var(--grid-stroke)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="t"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(t: number) => format(t, "MM-dd HH:mm")}
                tick={{ fill: "var(--axis-tick)", fontSize: 10 }}
                axisLine={{ stroke: "var(--grid-stroke)" }}
                tickLine={false}
                minTickGap={48}
              />
              <YAxis
                domain={["auto", "auto"]}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
                tick={{ fill: "var(--axis-tick)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--tooltip-bg)",
                  border: "1px solid var(--tooltip-border)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--tooltip-fg)",
                }}
                labelFormatter={(t: number) => format(t, "yyyy-MM-dd HH:mm")}
                formatter={(v: number) => [fmtUSD(v), "净值"]}
              />
              <Area
                type="monotone"
                dataKey="v"
                stroke={color}
                strokeWidth={2}
                fill={`url(#eq-fill-${modelId})`}
                isAnimationActive={false}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
