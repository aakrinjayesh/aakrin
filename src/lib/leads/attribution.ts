import type { Attribution } from "./types";

// First-touch attribution for the current browser session, attached to leads (never to analytics).

const STORAGE_KEY = "aakrin_attribution";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

function clean(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 120) : undefined;
}

/** Records UTM parameters, landing page and referrer once per session. */
export function captureAttribution(): void {
  try {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    const params = new URLSearchParams(window.location.search);
    const data: Attribution = { landing_page: window.location.pathname };
    for (const key of UTM_KEYS) {
      const value = clean(params.get(key));
      if (value) data[key] = value;
    }
    if (document.referrer) {
      const host = new URL(document.referrer).host;
      if (host && host !== window.location.host) data.referrer = host;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage can be unavailable (private mode, blocked); attribution is best-effort.
  }
}

export function getAttribution(): Attribution {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Attribution;
  } catch {
    // Fall through
  }
  return { landing_page: window.location.pathname };
}
