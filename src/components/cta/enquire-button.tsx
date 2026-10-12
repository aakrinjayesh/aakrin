"use client";

import type { ReactNode } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics";

/** Fired on window to open the quiz. The quiz (Stage 3) listens for it. */
export const OPEN_QUIZ_EVENT = "aakrin:open-quiz";

export type OpenQuizDetail = { placement: string };

type EnquireButtonProps = {
  placement: string;
  event?: AnalyticsEvent;
  className?: string;
  children: ReactNode;
};

export function EnquireButton({ placement, event, className, children }: EnquireButtonProps) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      className={className}
      onClick={() => {
        if (event) track(event, { placement });
        window.dispatchEvent(
          new CustomEvent<OpenQuizDetail>(OPEN_QUIZ_EVENT, { detail: { placement } }),
        );
      }}
    >
      {children}
    </button>
  );
}
