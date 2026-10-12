"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { OPEN_QUIZ_EVENT } from "@/components/cta/enquire-button";
import type { NavItem } from "@/content/navigation";
import { cn } from "@/lib/cn";

type PrimaryNavProps = {
  items: readonly NavItem[];
  /** CTAs shown inline with the links on wide screens (the `nav` breakpoint and up) */
  desktopActions: ReactNode;
  /** CTAs kept in the header bar next to the menu button below the `nav` breakpoint */
  barActions: ReactNode;
  /** CTAs at the bottom of the menu panel below the `nav` breakpoint */
  menuActions: ReactNode;
};

// Must match --breakpoint-nav in globals.css
const NAV_BREAKPOINT = "(min-width: 75rem)";

/** Main navigation: inline on wide screens, a disclosure panel below that. */
export function PrimaryNav({ items, desktopActions, barActions, menuActions }: PrimaryNavProps) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  // Opening the quiz from a menu CTA closes the menu behind it
  useEffect(() => {
    const onOpenQuiz = () => setOpen(false);
    window.addEventListener(OPEN_QUIZ_EVENT, onOpenQuiz);
    return () => window.removeEventListener(OPEN_QUIZ_EVENT, onOpenQuiz);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    // Close if the viewport grows past the breakpoint while the panel is open
    const wide = window.matchMedia(NAV_BREAKPOINT);
    function onWide(event: MediaQueryListEvent) {
      if (event.matches) setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    wide.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      wide.removeEventListener("change", onWide);
    };
  }, [open]);

  return (
    <nav aria-label="Main" className="flex items-center gap-3">
      <div className="hidden items-center gap-2 sm:flex nav:hidden">{barActions}</div>

      <button
        ref={toggleRef}
        type="button"
        className="inline-flex size-11 cursor-pointer items-center justify-center rounded-lg border border-line bg-surface text-ink nav:hidden"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      <div
        id={menuId}
        className={cn(
          // Below the nav breakpoint: a panel under the header, shown only when open
          "absolute inset-x-0 top-full border-b border-line bg-surface px-(--gutter) pt-2 pb-5 shadow-[0_20px_30px_-20px_rgba(22,19,29,0.3)]",
          open ? "block" : "hidden",
          // From the nav breakpoint: always inline
          "nav:static nav:flex nav:items-center nav:gap-2 nav:border-0 nav:bg-transparent nav:p-0 nav:shadow-none",
        )}
      >
        <ul className="flex flex-col nav:flex-row nav:items-center nav:gap-1">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block border-b border-line px-1 py-3.5 text-md font-medium text-ink no-underline hover:text-accent-strong nav:rounded-md nav:border-0 nav:px-3 nav:py-2.5 nav:text-sm nav:hover:bg-canvas nav:hover:text-ink"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid gap-3 empty:hidden nav:hidden">{menuActions}</div>
        <div className="hidden nav:ml-2 nav:flex nav:items-center nav:gap-2">{desktopActions}</div>
      </div>
    </nav>
  );
}
