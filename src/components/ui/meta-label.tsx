import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type MetaLabelTone = "muted" | "accent" | "on-dark" | "accent-on-dark";

const tones: Record<MetaLabelTone, string> = {
  muted: "text-muted",
  accent: "text-accent-strong",
  "on-dark": "text-on-dark-muted",
  "accent-on-dark": "text-accent",
};

/** Small monospaced metadata label: indices, categories, technical annotations. */
export function MetaLabel({
  children,
  tone = "muted",
  as: Component = "span",
  className,
}: {
  children: ReactNode;
  tone?: MetaLabelTone;
  as?: "span" | "p";
  className?: string;
}) {
  return (
    <Component
      className={cn("font-mono text-[0.75rem] tracking-[0.06em] uppercase", tones[tone], className)}
    >
      {children}
    </Component>
  );
}

/** Two-digit index for numbered items: 1 → "01". */
export function indexLabel(index: number): string {
  return String(index + 1).padStart(2, "0");
}
