"use client";
import { useMemo } from "react";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import ChampionCard from "@/components/leaderboard/ChampionCard";
import { useState } from "react";
import { useLeaderboard } from "@/lib/api/hooks/useLeaderboard";
import { useAccountTotals } from "@/lib/api/hooks/useAccountTotals";
import { usePositions } from "@/lib/api/hooks/usePositions";
import { useTradesCountMap } from "@/lib/api/hooks/useTradesCount";
import { useSharpeMap } from "@/lib/api/hooks/useSharpeMap";
import { useAnalyticsMap } from "@/lib/api/hooks/useAnalyticsMap";
import { getModelName, getModelColor, getModelIcon } from "@/lib/model/meta";
import { ModelLogoChip } from "@/components/shared/ModelLogo";
import CoinIcon from "@/components/shared/CoinIcon";
import { fmtUSD, pnlClass, withSign } from "@/lib/utils/formatters";
import { useLatestEquityMap } from "@/lib/api/hooks/useModelSnapshots";

export default function LeaderboardOverview({
  mode: _mode,
}: {
  mode?: "overall" | "advanced";
}) {
  const [tab, setTab] = useState<"overall" | "advanced">(_mode || "overall");
  const { rows } = useLeaderboard();
  const { map: equityMap } = useLatestEquityMap();
  const { map: tradeCount } = useTradesCountMap();
  const { map: sharpeMap } = useSharpeMap();
  const { map: analyticsMap } = useAnalyticsMap();
  // 与 LeaderboardTable 同口径增强：净值/收益率按 $10,000 初始资金推导，
  // 交易数/夏普/胜率取各自增强数据源，避免两处数字打架
  const rowsWithEq = rows.map((r) => {
    const equity = equityMap[r.id] ?? r.equity;
    const BASE_EQ = 10000;
    return {
      ...r,
      equity,
      return_pct:
        equity != null ? ((equity - BASE_EQ) / BASE_EQ) * 100 : r.return_pct,
      num_trades: tradeCount[r.id] ?? r.num_trades,
      sharpe: sharpeMap[r.id] ?? r.sharpe,
      win_rate: analyticsMap[r.id]?.winners_losers_breakdown_table
        ?.win_rate as number | undefined,
      avg_leverage: (analyticsMap[r.id]?.overall_trades_overview_table as any)
        ?.avg_convo_leverage as number | undefined,
    };
  });
  const top =
    rowsWithEq && rowsWithEq.length
      ? rowsWithEq
          .slice()
          .sort((a, b) => (Number(b.equity) || 0) - (Number(a.equity) || 0))[0]
      : undefined;

  const { data: totalsData } = useAccountTotals();
  const latestByModel = useMemo(() => {
    const map = new Map<string, any>();
    const arr = (totalsData?.accountTotals ?? []) as any[];
    for (const r of arr) {
      const id = String(r.model_id || r.id || "");
      const ts = Number(r.timestamp || 0);
      const prev = map.get(id);
      if (!prev || (prev.timestamp || 0) <= ts) map.set(id, r);
    }
    return Array.from(map.values());
  }, [totalsData]);

  const totalEquity = useMemo(() => {
    return latestByModel.reduce(
      (sum, r: any) =>
        sum + Number(r.equity || r.account_value || r.dollar_equity || 0),
      0,
    );
  }, [latestByModel]);

  const { positionsByModel } = usePositions();
  const avgReturnPct = useMemo(() => {
    const vals = rowsWithEq
      .map((r) => r.return_pct)
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    if (!vals.length) return undefined;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [rowsWithEq]);
  const activeSymbols = useMemo(() => {
    const set = new Set<string>();
    for (const m of positionsByModel) {
      for (const sym of Object.keys(m.positions || {}))
        set.add(sym.toUpperCase());
    }
    return Array.from(set.values()).slice(0, 8);
  }, [positionsByModel]);

  return (
    <div className="space-y-3">
      {/* 冠军 Hero Card：第一视觉焦点（含全市场总资金） */}
      <ChampionCard
        id={top?.id}
        equity={top?.equity}
        returnPct={top?.return_pct}
        totalEquity={totalEquity || undefined}
      />

      {/* 成就标签：趣味性 + 可读性 */}
      <AchievementTags rows={rowsWithEq} />

      {/* 控制区：视图切换 + 高级分析中心入口 */}
      <div className="flex flex-wrap items-stretch gap-2">
        <TabButton active={tab === "overall"} onClick={() => setTab("overall")}>
          总体统计
        </TabButton>
        <TabButton
          active={tab === "advanced"}
          onClick={() => setTab("advanced")}
        >
          高级分析
        </TabButton>
        <button
          onClick={() => setTab("advanced")}
          className="glass-panel chip-btn ml-auto flex min-w-[220px] items-center gap-3 px-4 py-2 text-left"
          style={{
            background:
              tab === "advanced"
                ? "color-mix(in oklab, var(--brand-accent) 14%, var(--panel-bg))"
                : undefined,
          }}
        >
          <span className="text-xl">📊</span>
          <span className="flex-1">
            <span
              className="ui-sans block text-sm font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              高级分析中心
            </span>
            <span
              className="ui-sans block text-[11px]"
              style={{ color: "var(--muted-text)" }}
            >
              查看回测 · 风险 · 夏普率
            </span>
          </span>
          <span className="ui-sans text-lg" style={{ color: "var(--brand-accent)" }}>
            →
          </span>
        </button>
      </div>
      {/* 排行榜表格 */}
      <LeaderboardTable mode={tab} />

      {/* 摘要区块（总资金已上移至冠军 Hero 区） */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <SummaryCard
          title="平均收益率"
          value={
            avgReturnPct != null ? `${withSign(avgReturnPct, 2)}%` : "—"
          }
          extra={
            avgReturnPct != null ? (
              <span className={`ui-sans text-xs font-semibold ${pnlClass(avgReturnPct)}`}>
                {avgReturnPct >= 0 ? "▲" : "▼"} 全体模型均值
              </span>
            ) : null
          }
        />
        <SummaryCard
          title="初始资金合计"
          value={fmtUSD(10000 * (rowsWithEq.length || 0))}
          extra={
            <span className="ui-sans text-xs" style={{ color: "var(--muted-text)" }}>
              每模型 $10,000
            </span>
          }
        />
        <ActivePositions symbols={activeSymbols} />
      </div>

      {/* 条形图：各模型账户价值 */}
      {!!rows?.length && <Bars rows={rowsWithEq} />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="ui-sans rounded-md border px-3 py-1 text-xs"
      style={{
        background: active ? "var(--panel-bg)" : "transparent",
        borderColor: "var(--panel-border)",
        color: active ? "var(--foreground)" : "var(--muted-text)",
      }}
    >
      {children}
    </button>
  );
}

/** 成就标签：收益冠军 / 最稳健 / 交易之王 / 最准预测 */
function AchievementTags({
  rows,
}: {
  rows: {
    id: string;
    equity: number;
    return_pct?: number;
    sharpe?: number;
    num_trades?: number;
    win_rate?: number;
    avg_leverage?: number;
  }[];
}) {
  const tags = useMemo(() => {
    if (!rows.length) return [];
    const pick = (
      label: string,
      emoji: string,
      score: (r: (typeof rows)[number]) => number | undefined,
      fmt: (v: number) => string,
    ) => {
      let best: { id: string; v: number } | undefined;
      for (const r of rows) {
        const v = score(r);
        if (v == null || !Number.isFinite(v)) continue;
        if (!best || v > best.v) best = { id: r.id, v };
      }
      return best ? { label, emoji, id: best.id, detail: fmt(best.v) } : undefined;
    };
    return [
      pick(
        "收益冠军",
        "🏆",
        (r) => r.return_pct,
        (v) => `${withSign(v, 2)}%`,
      ),
      pick(
        "最稳健",
        "🛡",
        (r) => (r.sharpe != null && r.sharpe !== 0 ? r.sharpe : undefined),
        (v) => `Sharpe ${v.toFixed(2)}`,
      ),
      pick(
        "交易之王",
        "⚡",
        (r) => r.num_trades,
        (v) => `${v} 笔`,
      ),
      pick(
        "最准预测",
        "🎯",
        (r) =>
          r.win_rate != null && Number.isFinite(r.win_rate)
            ? r.win_rate
            : undefined,
        // API winners_losers_breakdown_table.win_rate 为 0–100 口径，直接拼接 %
        (v) => `胜率 ${v.toFixed(0)}%`,
      ),
      pick(
        "风险偏好最高",
        "🔥",
        (r) =>
          r.avg_leverage != null && Number.isFinite(r.avg_leverage)
            ? r.avg_leverage
            : undefined,
        (v) => `平均杠杆 ${v.toFixed(1)}x`,
      ),
    ].filter(Boolean) as { label: string; emoji: string; id: string; detail: string }[];
  }, [rows]);

  if (!tags.length) return null;
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
      {tags.map((t) => (
        <div key={t.label} className="glass-panel flex items-center gap-2.5 px-3 py-2">
          <span className="text-lg">{t.emoji}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className="ui-sans text-[11px] font-semibold tracking-wide"
                style={{ color: "var(--brand-accent)" }}
              >
                {t.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <ModelLogoChip modelId={t.id} size="sm" />
              <span
                className="ui-sans truncate text-xs font-medium"
                style={{ color: "var(--foreground)" }}
              >
                {getModelName(t.id)}
              </span>
              <span
                className="tabular-nums text-[11px]"
                style={{ color: "var(--muted-text)" }}
              >
                {t.detail}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  extra,
}: {
  title: string;
  value?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-md border p-3"
      style={{
        background: "var(--panel-bg)",
        borderColor: "var(--panel-border)",
      }}
    >
      <div className="ui-sans text-xs" style={{ color: "var(--muted-text)" }}>
        {title}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-sm" style={{ color: "var(--foreground)" }}>
          {value ?? "—"}
        </div>
        {extra}
      </div>
    </div>
  );
}

function ActivePositions({ symbols }: { symbols: string[] }) {
  return (
    <div
      className="rounded-md border p-3"
      style={{
        background: "var(--panel-bg)",
        borderColor: "var(--panel-border)",
      }}
    >
      <div className="ui-sans text-xs" style={{ color: "var(--muted-text)" }}>
        持仓概览
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {symbols.length ? (
          symbols.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px]"
              style={{ borderColor: "var(--panel-border)" }}
            >
              <CoinIcon symbol={s} size={16} />
              <span className="ui-sans" style={{ color: "var(--foreground)" }}>
                {s}
              </span>
            </span>
          ))
        ) : (
          <span className="text-xs" style={{ color: "var(--muted-text)" }}>
            暂无持仓
          </span>
        )}
      </div>
    </div>
  );
}

function Bars({ rows }: { rows: { id: string; equity: number }[] }) {
  const FULL = 120; // 固定容器高度
  // 自适应刻度：向上取整到最近的 2k 档，并至少 12k
  const maxEq = Math.max(...rows.map((r) => Number(r.equity || 0)), 1);
  const SCALE = Math.max(12000, Math.ceil(maxEq / 2000) * 2000);
  return (
    <div
      className="rounded-md border p-3"
      style={{
        background: "var(--panel-bg)",
        borderColor: "var(--panel-border)",
      }}
    >
      <div className="ui-sans text-xs" style={{ color: "var(--muted-text)" }}>
        账户价值
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6 md:grid-cols-6">
        {rows.map((r) => {
          const color = getModelColor(r.id);
          const eq = Number(r.equity || 0);
          const pct = Math.max(0, Math.min(eq / SCALE, 1));
          const fill = Math.max(2, Math.round(pct * FULL));
          const icon = getModelIcon(r.id);
          const ICON = 16; // logo 直径
          return (
            <div key={r.id} className="flex flex-col items-center gap-1">
              <div
                className="tabular-nums text-[11px]"
                style={{ color: "var(--foreground)" }}
              >
                {fmtUSD(r.equity)}
              </div>
              <div className="relative w-10" style={{ height: FULL }}>
                <div
                  className="absolute inset-0 rounded-sm border"
                  style={{
                    background:
                      "color-mix(in oklab, var(--panel-border) 22%, transparent)",
                    borderColor:
                      "color-mix(in oklab, var(--panel-border) 60%, transparent)",
                  }}
                />
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-b-sm"
                  style={{
                    height: fill,
                    background: color,
                  }}
                />
                {icon && fill >= ICON + 6 ? (
                  <div
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 overflow-hidden rounded-sm"
                    style={{ width: ICON, height: ICON }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={icon}
                      alt=""
                      width={ICON}
                      height={ICON}
                      style={{
                        objectFit: "contain",
                        filter: "brightness(0) invert(1)",
                      }}
                    />
                  </div>
                ) : null}
              </div>
              <div
                className="ui-sans text-[11px] text-center"
                style={{ color: "var(--muted-text)" }}
              >
                {getModelName(r.id)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
