"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/store/useTheme";
import SocialLinks from "./SocialLinks";

const NAV_ITEMS = [
  { href: "/", label: "实盘" },
  { href: "/leaderboard", label: "排行榜" },
  { href: "/models", label: "模型" },
] as const;

export function Header() {
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const barCls = `sticky top-0 z-50 w-full border-b backdrop-blur`;

  return (
    <header
      className={barCls}
      style={{
        background: "var(--header-bg)",
        borderColor: "var(--header-border)",
      }}
    >
      <div
        className={`ui-sans relative flex h-[var(--header-h)] w-full items-center px-3 text-xs`}
        style={{ color: "var(--foreground)" }}
      >
        {/* 左：品牌 */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link
            href="/"
            className={`font-semibold tracking-wide ui-sans flex items-center gap-1.5`}
            style={{ color: "var(--brand-accent)" }}
          >
            <span aria-hidden="true">◉</span>
            <span>nof0</span>
          </Link>
          <span
            className="ui-sans hidden text-[10px] tracking-[0.22em] uppercase sm:inline"
            style={{ color: "var(--muted-text)" }}
          >
            AI Trading Arena
          </span>
        </div>

        {/* 中：主导航（绝对居中） */}
        <nav
          className="ui-sans absolute left-1/2 -translate-x-1/2 flex items-center gap-7 text-[13px] font-medium"
          aria-label="Primary"
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="relative"
                style={{
                  color: active ? "var(--foreground)" : "var(--muted-text)",
                }}
              >
                {item.label}
                {/* 当前页指示条 */}
                {active && (
                  <span
                    className="absolute -bottom-1.5 left-0 right-0 h-[2px] rounded-full"
                    style={{ background: "var(--brand-accent)" }}
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* 右：主题切换占位，保证中间绝对定位不受挤压 */}
        <div className="flex min-w-0 flex-1 justify-end">
          <SocialLinks />
          <div className="ml-2 hidden sm:flex items-center gap-1 text-[11px]">
            <div
              className={`flex overflow-hidden rounded border`}
              style={{ borderColor: "var(--chip-border)" }}
            >
              {["dark", "light", "system"].map((t) => (
                <button
                  key={t}
                  title={t}
                  className={`px-2 py-1 capitalize chip-btn`}
                  style={
                    theme === t
                      ? {
                          background: "var(--btn-active-bg)",
                          color: "var(--btn-active-fg)",
                        }
                      : { color: "var(--btn-inactive-fg)" }
                  }
                  onClick={() => setTheme(t as any)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
