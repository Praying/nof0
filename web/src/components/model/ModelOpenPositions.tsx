"use client";
import clsx from "clsx";
import { Fragment, useMemo, useState } from "react";
import { usePositions } from "@/lib/api/hooks/usePositions";
import { fmtUSD, pnlClass } from "@/lib/utils/formatters";
import { SideBadge, PnlMeter, PnlArrow } from "@/components/ui/PositionSide";
import { getModelName } from "@/lib/model/meta";
import CoinIcon from "@/components/shared/CoinIcon";

function fmtTime(sec?: number) {
  if (!sec) return "—";
  const d = new Date(sec > 1e12 ? sec : sec * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function fmtNumber(n?: number | null, digits = 2) {
  if (n == null || Number.isNaN(n)) return "--";
  const sign = n < 0 ? "-" : "";
  const v = Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return `${sign}${v}`;
}

export default function ModelOpenPositions({ modelId }: { modelId: string }) {
  const { positionsByModel } = usePositions();
  const model = positionsByModel.find((m) => m.id === modelId);
  const positionsRaw = Object.values(model?.positions || {});
  const positions = useMemo(
    () =>
      positionsRaw.map((p: any) => ({
        ...p,
        side: p.quantity > 0 ? ("LONG" as const) : ("SHORT" as const),
      })),
    [positionsRaw],
  );
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // 顶部小计
  const totalUnreal = positions.reduce(
    (acc, p: any) => acc + (p.unrealized_pnl || 0),
    0,
  );
  // 组内最大绝对盈亏，用作盈亏进度条的标尺
  const maxAbsPnl = positions.reduce(
    (acc, p: any) => Math.max(acc, Math.abs(p.unrealized_pnl || 0)),
    0,
  );

  const toggleRow = (i: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  if (!positions.length)
    return (
      <div>
        <div
          className="ui-sans mb-2 text-sm font-semibold"
          style={{ color: "var(--foreground)" }}
        >
          当前持仓 · {getModelName(modelId)}
        </div>
        <div className={`text-sm`} style={{ color: "var(--muted-text)" }}>
          暂无持仓。
        </div>
      </div>
    );

  return (
    <div>
      <div className="ui-sans mb-2 flex items-center justify-between">
        <div
          className="text-sm font-semibold"
          style={{ color: "var(--foreground)" }}
        >
          当前持仓 · {getModelName(modelId)}
        </div>
        <div className="text-xs" style={{ color: "var(--muted-text)" }}>
          未实现盈亏合计：
          <span className={pnlClass(totalUnreal)}>
            <PnlArrow value={totalUnreal} /> {fmtUSD(totalUnreal)}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[12px] terminal-text">
          <thead
            className={clsx("sticky top-0 z-10 ui-sans")}
            style={{
              background: "var(--panel-bg)",
              color: "var(--muted-text)",
            }}
          >
            <tr
              className={clsx("border-b")}
              style={{ borderColor: "var(--panel-border)" }}
            >
              {/* 默认只显示核心四列，其余折叠到行内详情 */}
              <th className="w-6 py-1.5 pr-1" aria-label="展开详情" />
              <th className="py-1.5 pr-3">币种</th>
              <th className="py-1.5 pr-3">方向</th>
              <th className="py-1.5 pr-3">杠杆</th>
              <th className="py-1.5 pr-3">未实现盈亏</th>
            </tr>
          </thead>
          <tbody style={{ color: "var(--foreground)" }}>
            {positions.map((p: any, i: number) => {
              const isLong = p.quantity > 0;
              const isOpen = expanded.has(i);
              return (
                <Fragment key={`pos-${i}`}>
                  <tr
                    className={clsx("border-b cursor-pointer")}
                    style={{
                      borderColor:
                        "color-mix(in oklab, var(--panel-border) 50%, transparent)",
                    }}
                    onClick={() => toggleRow(i)}
                  >
                    <td className="py-1.5 pr-1" style={{ color: "var(--muted-text)" }}>
                      <span
                        className="inline-block transition-transform"
                        style={{
                          transform: isOpen ? "rotate(90deg)" : "none",
                          fontSize: 9,
                        }}
                        aria-hidden="true"
                      >
                        ▶
                      </span>
                    </td>
                    <td className="py-1.5 pr-3">
                      <span className="inline-flex items-center gap-1">
                        <CoinIcon symbol={p.symbol} size={16} />
                        <span className="ui-sans">{p.symbol?.toUpperCase()}</span>
                      </span>
                    </td>
                    <td className="py-1.5 pr-3">
                      <SideBadge side={isLong ? "LONG" : "SHORT"} />
                    </td>
                    <td className="py-1.5 pr-3">{p.leverage}X</td>
                    <td className="py-1.5 pr-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={clsx(
                            "tabular-nums",
                            pnlClass(p.unrealized_pnl),
                          )}
                        >
                          <PnlArrow value={p.unrealized_pnl} />{" "}
                          {fmtUSD(p.unrealized_pnl)}
                        </span>
                        <PnlMeter
                          pnl={p.unrealized_pnl}
                          scale={maxAbsPnl}
                          width={56}
                        />
                      </div>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-b">
                      <td colSpan={5} className="px-1 py-2">
                        <PositionDetail p={p} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** 行内折叠详情：入场/仓位/强平/退出计划 */
function PositionDetail({ p }: { p: any }) {
  const notional = Math.abs(p.quantity) * (p.current_price ?? 0);
  return (
    <div
      className="ui-sans rounded-md border px-3 py-2 text-[11px]"
      style={{
        borderColor: "var(--panel-border)",
        background: "color-mix(in oklab, var(--panel-bg) 60%, transparent)",
      }}
    >
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
        <DetailItem label="入场时间" value={fmtTime(p.entry_time)} />
        <DetailItem label="入场价" value={fmtUSD(p.entry_price)} />
        <DetailItem label="数量" value={fmtNumber(Math.abs(p.quantity), 2)} />
        <DetailItem label="名义金额" value={fmtUSD(notional)} />
        <DetailItem label="保证金" value={fmtUSD(p.margin)} />
        <DetailItem label="强平价" value={fmtUSD(p.liquidation_price)} />
      </div>
      <div className="mt-2 border-t pt-2" style={{ borderColor: "var(--panel-border)" }}>
        <ExitPlanBadges plan={p.exit_plan} />
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ color: "var(--muted-text)" }}>{label}：</span>
      <span className="tabular-nums" style={{ color: "var(--foreground)" }}>
        {value}
      </span>
    </div>
  );
}

/** Exit Plan 可视化：🎯 目标价 / 🛑 止损价 胶囊 */
function ExitPlanBadges({ plan }: { plan?: any }) {
  const hasPlan =
    plan &&
    (plan.profit_target || plan.stop_loss || plan.invalidation_condition);
  if (!hasPlan) {
    return (
      <span className="ui-sans" style={{ color: "var(--muted-text)" }}>
        退出计划：—
      </span>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span style={{ color: "var(--muted-text)" }}>退出计划：</span>
      {plan?.profit_target != null && (
        <span
          className="side-badge"
          style={{
            background: "var(--pnl-up-soft)",
            color: "var(--pnl-up)",
            gap: 4,
          }}
        >
          🎯 目标价 {fmtUSD(plan.profit_target)}
        </span>
      )}
      {plan?.stop_loss != null && (
        <span
          className="side-badge"
          style={{
            background: "var(--pnl-down-soft)",
            color: "var(--pnl-down)",
            gap: 4,
          }}
        >
          🛑 止损价 {fmtUSD(plan.stop_loss)}
        </span>
      )}
      {plan?.invalidation_condition && (
        <span
          className="ui-sans text-[11px]"
          style={{ color: "var(--muted-text)" }}
        >
          失效条件：{plan.invalidation_condition}
        </span>
      )}
    </div>
  );
}
