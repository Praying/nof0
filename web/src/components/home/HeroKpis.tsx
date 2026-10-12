"use client";
import { useMemo } from "react";
import { useAccountValueSeries } from "@/lib/api/hooks/useAccountValueSeries";
import { usePositions } from "@/lib/api/hooks/usePositions";
import { useTradesCountMap } from "@/lib/api/hooks/useTradesCount";
import StatTile from "@/components/ui/StatTile";
import { fmtUSD, fmtInt, pnlClass, withSign } from "@/lib/utils/formatters";

const START_CAPITAL = 10000; // 每模型初始资金，用于总盈亏/累计收益口径

/**
 * 首页 Hero 数据区：3 秒内回答“系统赚没赚钱”。
 * Hero 大数字 = 账户总资产 + 累计收益；KPI 条 = 今日收益 / 活跃模型 / 当前持仓 / 总交易数。
 */
export default function HeroKpis() {
  const { series, modelIds, isLoading } = useAccountValueSeries();
  const { positionsByModel } = usePositions();
  const { map: tradesMap } = useTradesCountMap();

  const stats = useMemo(() => {
    // 合并各模型净值为总资产时间线
    const totals: { t: number; v: number }[] = [];
    for (const p of series) {
      let sum = 0;
      for (const id of modelIds) sum += Number(p[id] ?? 0);
      if (sum > 0) totals.push({ t: p.timestamp, v: sum });
    }
    const totalEquity = totals.length ? totals[totals.length - 1].v : undefined;

    // 窗口变化（以数据最新时间为基准，纯计算，避免 render 期调用 Date.now）
    const windowChange = (hours: number) => {
      if (totals.length < 2) return undefined;
      const last = totals[totals.length - 1];
      const cutoff = last.t - hours * 3600 * 1000;
      const inWindow = totals.filter((p) => p.t >= cutoff);
      const base = (inWindow.length >= 2 ? inWindow[0] : totals[0]) ?? totals[0];
      if (!base || base.v <= 0) return undefined;
      return {
        delta: last.v - base.v,
        pct: ((last.v - base.v) / base.v) * 100,
      };
    };
    const w72 = windowChange(72);
    const changePct = w72?.pct;
    const todayPnl = windowChange(24)?.delta;

    const openPositions = positionsByModel.reduce(
      (acc, m) => acc + Object.keys(m.positions || {}).length,
      0,
    );
    const totalTrades = Object.values(tradesMap).reduce((a, b) => a + b, 0);
    const initialCapital = START_CAPITAL * modelIds.length;
    const totalPnl =
      totalEquity != null ? totalEquity - initialCapital : undefined;
    const cumulativePct =
      totalPnl != null && initialCapital > 0
        ? (totalPnl / initialCapital) * 100
        : undefined;

    return {
      totalEquity,
      changePct,
      todayPnl,
      totalPnl,
      cumulativePct,
      activeModels: modelIds.length,
      openPositions,
      totalTrades,
    };
  }, [series, modelIds, positionsByModel, tradesMap]);

  return (
    <section className="grid grid-cols-1 gap-3 lg:grid-cols-6">
      {/* 首屏级联入场由 rise-in 系列控制 */}
      {/* Hero：账户总资产 + 累计收益 */}
      <div className="glass-panel rise-in relative overflow-hidden px-5 py-4 lg:col-span-2">
        <div
          className="ui-sans text-[11px] tracking-[0.18em] uppercase"
          style={{ color: "var(--muted-text)" }}
        >
          总资产
        </div>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <div className="hero-figure text-balance">
            {isLoading && stats.totalEquity == null ? (
              <span style={{ color: "var(--muted-text)" }}>--</span>
            ) : (
              fmtUSD(stats.totalEquity ?? 0)
            )}
          </div>
          {stats.cumulativePct != null && (
            <div
              className={`ui-sans text-xl font-semibold ${pnlClass(stats.cumulativePct)}`}
            >
              {withSign(stats.cumulativePct, 1)}%
            </div>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 ui-sans text-xs">
          <span style={{ color: "var(--muted-text)" }}>累计收益</span>
          {stats.totalPnl != null && (
            <span className={`font-semibold ${pnlClass(stats.totalPnl)}`}>
              {fmtUSD(stats.totalPnl)}
            </span>
          )}
          {stats.changePct != null && (
            <>
              <span style={{ color: "var(--muted-text)" }}>· 72h</span>
              <span className={`font-semibold ${pnlClass(stats.changePct)}`}>
                {withSign(stats.changePct, 1)}%
              </span>
            </>
          )}
        </div>
        {/* 重点收益渐变装饰条 */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px]"
          style={{
            background:
              "linear-gradient(90deg, var(--pnl-up), transparent 70%)",
            opacity:
              stats.cumulativePct != null && stats.cumulativePct < 0 ? 0.25 : 0.8,
          }}
        />
      </div>

      {/* KPI 条（移动端两行两列，桌面端与 Hero 同排） */}
      <div className="rise-in-2 grid grid-cols-2 gap-3 lg:contents">
        <StatTile
          label="今日收益"
          value={
            stats.todayPnl != null ? (
              <span className={pnlClass(stats.todayPnl)}>
                {fmtUSD(stats.todayPnl)}
              </span>
            ) : (
              "--"
            )
          }
          deltaCaption="过去 24 小时"
        />
        <StatTile label="活跃模型" value={fmtInt(stats.activeModels || undefined)} />
        <StatTile label="当前持仓" value={fmtInt(stats.openPositions || undefined)} />
        <StatTile label="总交易数" value={fmtInt(stats.totalTrades || undefined)} />
      </div>
    </section>
  );
}
