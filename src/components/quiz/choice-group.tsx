"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { QuizOption } from "@/content/quiz";
import { cn } from "@/lib/cn";

type ChoiceGroupProps = {
  labelledBy: string;
  describedBy?: string;
  options: readonly QuizOption[];
  value: string | undefined;
  onSelect: (id: string) => void;
  /** "grid": two columns from sm up. "list": always one column (e.g. inside a speech bubble). */
  layout?: "grid" | "list";
  /** Focus the checked (or first) option when the group appears */
  autoFocus?: boolean;
};

/**
 * Single-choice answers as an ARIA radio group with a roving tabindex.
 * Because choosing an answer advances the quiz, arrow keys only move focus;
 * Space or Enter (or a click/tap) selects. The checked state is exposed via aria-checked.
 */
export function ChoiceGroup({
  labelledBy,
  describedBy,
  options,
  value,
  onSelect,
  layout = "grid",
  autoFocus = false,
}: ChoiceGroupProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = options.findIndex((option) => option.id === value);
  const [focusIndex, setFocusIndex] = useState(selectedIndex >= 0 ? selectedIndex : 0);

  useEffect(() => {
    if (autoFocus) refs.current[selectedIndex >= 0 ? selectedIndex : 0]?.focus();
    // Only when the group first appears
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function moveFocus(index: number) {
    const next = (index + options.length) % options.length;
    setFocusIndex(next);
    refs.current[next]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const keys: Record<string, () => void> = {
      ArrowDown: () => moveFocus(index + 1),
      ArrowRight: () => moveFocus(index + 1),
      ArrowUp: () => moveFocus(index - 1),
      ArrowLeft: () => moveFocus(index - 1),
      Home: () => moveFocus(0),
      End: () => moveFocus(options.length - 1),
    };
    const action = keys[event.key];
    if (action) {
      event.preventDefault();
      action();
    }
  }

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className={cn("grid gap-2.5", layout === "grid" && "sm:grid-cols-2")}
    >
      {options.map((option, index) => {
        const checked = option.id === value;
        return (
          <button
            key={option.id}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={index === focusIndex ? 0 : -1}
            onFocus={() => setFocusIndex(index)}
            onKeyDown={(event) => onKeyDown(event, index)}
            onClick={() => onSelect(option.id)}
            className={cn(
              "flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border-[1.5px] px-4 py-3 text-left text-md font-medium text-ink transition-[border-color,background-color] duration-150",
              checked
                ? "border-accent-strong bg-accent-tint"
                : "border-line bg-surface hover:border-ink",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-full border-2",
                checked ? "border-accent-strong bg-accent-strong" : "border-line",
              )}
            >
              {checked && <span className="onb-pop size-2 rounded-full bg-white" />}
            </span>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
