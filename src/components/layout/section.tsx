import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";
import { Container } from "./container";

export type SectionTone = "canvas" | "surface" | "ink";

const tones: Record<SectionTone, string> = {
  canvas: "bg-canvas",
  surface: "border-y border-line bg-surface",
  ink: "bg-ink text-on-dark-muted",
};

type SectionProps = ComponentPropsWithoutRef<"section"> & {
  tone?: SectionTone;
  /** Vertical padding: "default" for content sections, "compact" for bands such as a logo strip. */
  spacing?: "default" | "compact";
  containerClassName?: string;
};

/**
 * A page section with consistent vertical rhythm. Pass `aria-labelledby` pointing at
 * the SectionHeader title id so the region is announced by name.
 */
export function Section({
  tone = "canvas",
  spacing = "default",
  className,
  containerClassName,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        tones[tone],
        spacing === "default" ? "py-[clamp(64px,9vw,112px)]" : "py-10 md:py-12",
        className,
      )}
      {...props}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}
