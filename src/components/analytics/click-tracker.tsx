"use client";

import { useEffect } from "react";
import { isAnalyticsEvent, track } from "@/lib/analytics";

/**
 * One document-level listener for elements marked with trackAttributes().
 * Elements marked as booking CTAs also emit booking_cta_clicked.
 */
export function ClickTracker() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const el = target.closest<HTMLElement>("[data-track]");
      if (!el) return;

      const name = el.dataset.track ?? "";
      const placement = el.dataset.trackPlacement;
      if (isAnalyticsEvent(name)) track(name, { placement });
      if (el.hasAttribute("data-track-booking")) track("booking_cta_clicked", { placement });
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
