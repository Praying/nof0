"use client";
import { useMemo } from "react";
import { getModelName } from "@/lib/model/meta";
import { ModelLogoChip } from "@/components/shared/ModelLogo";
import Sparkline from "@/components/ui/Sparkline";
import { useModelEquitySeries } from "@/lib/api/hooks/useModelEquitySeries";
import { fmtUSD, pnlClass, withSign } from "@/lib/utils/formatters";

/**
 * 本期冠军 Hero Card：排行榜第一视觉焦点。
 * 排名徽章 + 渐变背景 + 大号净值 + 收益率 + 全市场总资金 + 净值火花线。
 */
export default function ChampionCard({
  id,
  equity,
  returnPct,
  totalEquity,
}: {
  id?: string;
  equity?: number;
  returnPct?: number;
  totalEquity?: number;
}) {
  const { values } = useModelEquitySeries(id);

  const toneCls = pnlClass(returnPct);
  const gradient = useMemo(() => {
    if (returnPct == null) return "var(--panel-bg)";
    return returnPct >= 0
      ? "linear-gradient(135deg, color-mix(in oklab, var(--pnl-up) 14%, var(--panel-bg)), var(--panel-bg) 62%)"
      : "linear-gradient(135deg, color-mix(in oklab, var(--pnl-down) 12%, var(--panel-bg)), var(--panel-bg) 62%)";
  }, [returnPct]);

  return (
    <div
      className="glass-panel relative overflow-hidden px-5 py-4"
      style={{ background: gradient }}
    >
      {/* 冠军光晕 */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--pnl-up) 18%, transparent), transparent 70%)",
          opacity: returnPct != null && returnPct < 0 ? 0.3 : 1,
        }}
      />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {/* 左：徽章 + 模型 */}
        <div className="flex items-center gap-3">
          <div className="rank-badge rank-gold h-11 w-11 text-base">🏆</div>
          <div>
            <div
              className="ui-sans text-[11px] tracking-[0.18em] uppercase"
              style={{ color: "var(--muted-text)" }}
            >
              本期冠军
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              {id && <ModelLogoChip modelId={id} size="md" />}
              <div
                className="ui-sans text-xl font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                {id ? getModelName(id) : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* 中：净值 + 收益率 */}
        <div className="flex items-end gap-6">
          <div>
            <div
              className="ui-sans text-[11px] tracking-[0.14em] uppercase"
              style={{ color: "var(--muted-text)" }}
            >
              账户净值
            </div>
            <div
              className="ui-sans text-3xl font-semibold leading-tight"
              style={{ color: "var(--foreground)" }}
            >
              {equity != null ? fmtUSD(equity) : "—"}
            </div>
          </div>
          <div>
            <div
              className="ui-sans text-[11px] tracking-[0.14em] uppercase"
              style={{ color: "var(--muted-text)" }}
            >
              收益率
            </div>
            <div className={`ui-sans text-3xl font-semibold leading-tight ${toneCls}`}>
              {returnPct != null ? `${withSign(returnPct, 2)}%` : "—"}
            </div>
          </div>
          {totalEquity != null && (
            <div>
              <div
                className="ui-sans text-[11px] tracking-[0.14em] uppercase"
                style={{ color: "var(--muted-text)" }}
              >
                总资金
              </div>
              <div
                className="ui-sans text-3xl font-semibold leading-tight"
                style={{ color: "var(--foreground)" }}
              >
                {fmtUSD(totalEquity)}
              </div>
            </div>
          )}
        </div>

        {/* 右：净值火花线 */}
        <div className="ml-auto flex flex-col items-end">
          <div
            className="ui-sans text-[11px] tracking-[0.14em] uppercase"
            style={{ color: "var(--muted-text)" }}
          >
            净值趋势
          </div>
          <div className="mt-1">
            <Sparkline values={values} width={140} height={36} />
          </div>
        </div>
      </div>
    </div>
  );
}
