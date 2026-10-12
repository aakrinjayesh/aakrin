import type { AnalyticsEvent, AnalyticsProps } from "./events";

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

export interface AnalyticsProvider {
  name: string;
  track(event: AnalyticsEvent, props: AnalyticsProps): void;
}

/**
 * Microsoft Clarity. Only active when the Clarity script is loaded
 * (CLARITY_PROJECT_ID set); otherwise window.clarity is undefined and this is a no-op.
 * Props become Clarity custom tags so sessions can be filtered by them.
 */
const clarity: AnalyticsProvider = {
  name: "clarity",
  track(event, props) {
    const clarityFn = window.clarity;
    if (typeof clarityFn !== "function") return;
    for (const [key, value] of Object.entries(props)) clarityFn("set", key, value);
    clarityFn("event", event);
  },
};

/** Logs events in development so tracking can be checked without any provider. */
const devConsole: AnalyticsProvider = {
  name: "console",
  track(event, props) {
    console.info("[analytics]", event, props);
  },
};

// Apollo is loaded as a visitor-identification script only; it has no event API to call.
export const providers: readonly AnalyticsProvider[] =
  process.env.NODE_ENV === "development" ? [clarity, devConsole] : [clarity];
