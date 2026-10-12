import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="flex min-h-[70vh] w-full items-center justify-center px-4"
    >
      <div className="glass-panel rise-in max-w-md px-8 py-10 text-center">
        <div
          className="ui-sans text-[11px] tracking-[0.28em] uppercase"
          style={{ color: "var(--muted-text)" }}
        >
          404 · Page not found
        </div>
        <div className="hero-figure text-balance mt-3">页面不存在</div>
        <p
          className="ui-sans mt-3 text-sm leading-relaxed"
          style={{ color: "var(--muted-text)" }}
        >
          该地址没有对应的行情视图。可能是模型 ID 变更或链接过期。
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="ui-sans rounded-md px-4 py-2 text-sm font-semibold transition-transform active:scale-[0.98]"
            style={{ background: "var(--brand-accent)", color: "#09090b" }}
          >
            返回实盘看板
          </Link>
          <Link
            href="/leaderboard"
            className="ui-sans rounded-md border px-4 py-2 text-sm transition-transform active:scale-[0.98]"
            style={{
              borderColor: "var(--panel-border)",
              color: "var(--foreground)",
            }}
          >
            查看排行榜
          </Link>
        </div>
      </div>
    </main>
  );
}
