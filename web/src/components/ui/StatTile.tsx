"use client";

/**
 * KPI 统计卡片（dataviz stat tile 约定）
 * label：句子式标题，无尾冒号 · value：无衬线半粗 · delta：带符号、按方向着色 · 可插槽 trend 火花线
 */
export default function StatTile({
  label,
  value,
  delta,
  deltaCaption,
  footnote,
  children,
}: {
  label: string;
  value: React.ReactNode;
  delta?: React.ReactNode;
  deltaCaption?: string;
  footnote?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="glass-panel px-4 py-3">
      <div
        className="ui-sans text-[11px] tracking-[0.14em] uppercase"
        style={{ color: "var(--muted-text)" }}
      >
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <div
          className="ui-sans text-xl font-semibold leading-tight"
          style={{ color: "var(--foreground)" }}
        >
          {value}
        </div>
        {delta != null && (
          <div className="ui-sans text-sm font-semibold">{delta}</div>
        )}
        {deltaCaption && (
          <div
            className="ui-sans text-[11px]"
            style={{ color: "var(--muted-text)" }}
          >
            {deltaCaption}
          </div>
        )}
      </div>
      {children}
      {footnote && (
        <div
          className="mt-1 ui-sans text-[11px]"
          style={{ color: "var(--muted-text)" }}
        >
          {footnote}
        </div>
      )}
    </div>
  );
}
