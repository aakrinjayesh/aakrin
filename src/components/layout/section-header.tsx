import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionHeaderProps = {
  /** Id for the heading, referenced by the section's aria-labelledby. */
  id: string;
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  /** Heading level. Use "h1" only once per page. */
  as?: "h1" | "h2";
  align?: "start" | "center";
  /** For sections on the dark (ink) tone. */
  onDark?: boolean;
  className?: string;
  children?: ReactNode;
};

export function SectionHeader({
  id,
  title,
  eyebrow,
  description,
  as: Heading = "h2",
  align = "start",
  onDark = false,
  className,
  children,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-[clamp(32px,5vw,56px)] grid max-w-[46rem] gap-3.5",
        align === "center" && "mx-auto justify-items-center text-center",
        className,
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            "text-xs font-semibold tracking-[0.12em] uppercase",
            onDark ? "text-accent" : "text-accent-strong",
          )}
        >
          {eyebrow}
        </p>
      )}
      <Heading
        id={id}
        className={cn(Heading === "h1" ? "text-hero" : "text-2xl", onDark && "text-on-dark")}
      >
        {title}
      </Heading>
      {description && (
        <div className={cn("max-w-[62ch]", onDark ? "text-on-dark-muted" : "text-body")}>
          {description}
        </div>
      )}
      {children}
    </div>
  );
}
