import type { AnalyticsEvent } from "./events";
import { providers } from "./providers";
import { sanitizeProps } from "./sanitize";

export type { AnalyticsEvent, AnalyticsProps } from "./events";
export { ANALYTICS_EVENTS, isAnalyticsEvent } from "./events";

/**
 * The single entry point for analytics. Components call this and never talk to a
 * provider directly, so providers can be switched on or off without touching them.
 * Safe to call during SSR (does nothing) and never throws.
 */
export function track(event: AnalyticsEvent, props?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const safe = sanitizeProps(props);
  for (const provider of providers) {
    try {
      provider.track(event, safe);
    } catch {
      // A failing provider must never break the page.
    }
  }
}

/**
 * Attributes for server-rendered links and buttons. ClickTracker picks these up,
 * so server components can be tracked without becoming client components.
 */
export function trackAttributes(
  event: AnalyticsEvent,
  options: { placement?: string; booking?: boolean } = {},
): Record<string, string> {
  const attrs: Record<string, string> = { "data-track": event };
  if (options.placement) attrs["data-track-placement"] = options.placement;
  if (options.booking) attrs["data-track-booking"] = "";
  return attrs;
}
