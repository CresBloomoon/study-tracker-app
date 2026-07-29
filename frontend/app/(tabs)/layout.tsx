// frontend/app/(tabs)/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { TAB_NAV } from "@/lib/ui/tabNavConfig";
import { UI } from "@/lib/ui/uiTokens";
import { ThemeToggle } from "../../components/ThemeToggle";

type Line = { x: number; w: number };

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const currentPath = useMemo(() => {
    if (!pathname) return "/";
    return pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  }, [pathname]);

  const navRef = useRef<HTMLDivElement | null>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [line, setLine] = useState<Line>({ x: 0, w: 0 });
  const [reduceMotion, setReduceMotion] = useState(false);

  const items = TAB_NAV.items as readonly { href: string; label: string }[];

  const activeHref = useMemo(() => {
    const found = items.find((t) => t.href === currentPath);
    return found?.href ?? items[0]?.href ?? "/reminders";
  }, [currentPath, items]);

  const measure = () => {
    const nav = navRef.current;
    const el = linkRefs.current[activeHref];
    if (!nav || !el) return;

    const navRect = nav.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    setLine({
      x: elRect.left - navRect.left,
      w: elRect.width,
    });
  };

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  useLayoutEffect(() => {
    // activeが変わったら一旦リセットして、変なunderline残りを防ぐ
    setLine({ x: 0, w: 0 });
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHref]);

  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener("resize", onResize);

    const nav = navRef.current;
    const ro =
      nav && "ResizeObserver" in window
        ? new ResizeObserver(() => measure())
        : null;
    if (nav && ro) ro.observe(nav);

    // @ts-ignore
    const fontReady = (document as any).fonts?.ready?.then?.(() => measure());

    return () => {
      window.removeEventListener("resize", onResize);
      if (ro) ro.disconnect();
      void fontReady;
    };
  }, [activeHref]);

  const t = UI.tabs;

  return (
    <div style={{ minHeight: "100vh", background: UI.bg, color: UI.text }}>
      <header style={{ padding: `${UI.pagePadTop}px ${UI.pagePadX}px 12px` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ fontSize: 28, fontWeight: 800 }}>CPA Dashboard</div>
        <ThemeToggle />
      </div>
      <div style={{ opacity: 0.85, marginTop: 4, color: UI.subText }}>
          公認会計士の勉強進捗管理
        </div>

        <div style={{ marginTop: 16 }}>
          <div
            ref={navRef}
            style={{
              position: "relative",
              display: "flex",
              gap: t.gapPx,
              alignItems: "center",
              padding: `4px ${Math.max(10, t.gapPx / 3)}px`,
              borderRadius: 14,
              background: t.railBg,
              border: `1px solid ${t.railBorder}`,
            }}
          >
            {items.map((item) => {
              const active = item.href === activeHref;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  ref={(el) => {
                    linkRefs.current[item.href] = el;
                  }}
                  className="tabLink"
                  style={{
                    padding: `${t.padYPx}px 0`,
                    textDecoration: "none",
                    color: active ? t.colorActive : t.colorInactive,
                    fontWeight: active ? 650 : 520,
                    outline: "none",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* underline（共通1本） */}
            {line.w > 0 && (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  bottom: 4,
                  left: 0,
                  height: t.underlineHeightPx,
                  width: line.w,
                  transform: `translateX(${line.x}px)`,
                  background: t.underlineColor,
                  borderRadius: 999,
                  transition: reduceMotion
                    ? "none"
                    : `transform ${t.durationMs}ms ${t.easing}, width ${t.durationMs}ms ${t.easing}`,
                }}
              />
            )}

            <style jsx>{`
              .tabLink:hover {
                color: ${t.colorHover};
              }
              .tabLink:focus-visible {
                border-radius: 10px;
                box-shadow: 0 0 0 ${t.focusRingWidthPx}px ${UI.focus};
              }
            `}</style>
          </div>
        </div>
      </header>

      <main style={{ padding: `${UI.sectionGap}px ${UI.pagePadX}px` }}>
        {children}
      </main>
    </div>
  );
}
