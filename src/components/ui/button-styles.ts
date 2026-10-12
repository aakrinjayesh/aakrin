import { cn } from "@/lib/cn";

// Button styles from the Version C reference. Anything styled as a button must be
// a real <a href> or <button>.

export type ButtonVariant = "primary" | "secondary" | "secondary-on-dark";
export type ButtonSize = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg border-[1.5px] border-transparent text-center font-semibold leading-tight no-underline transition-[background-color,border-color,color,transform] duration-150 active:translate-y-px cursor-pointer";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent-strong text-white hover:bg-accent-hover",
  secondary: "border-ink bg-transparent text-ink hover:bg-ink hover:text-on-dark",
  "secondary-on-dark": "border-on-dark bg-transparent text-on-dark hover:bg-on-dark hover:text-ink",
};

const sizes: Record<ButtonSize, string> = {
  md: "min-h-12 px-[22px] py-3 text-sm",
  sm: "min-h-[42px] px-[18px] py-2.5 text-sm",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return cn(base, variants[variant], sizes[size], className);
}

export const linkArrowClasses =
  "group inline-flex items-center gap-1.5 font-semibold text-accent-strong no-underline hover:text-accent-hover";
