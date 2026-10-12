import { ANALYTICS_PROPERTY_KEYS, type AnalyticsProps } from "./events";

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE = /\+?\d[\d\s().-]{6,}\d/;
const MAX_LENGTH = 64;

/**
 * Keeps only allowlisted keys with short, non-identifying values.
 * Anything that looks like an email or phone number is dropped.
 */
export function sanitizeProps(props: Record<string, unknown> | undefined): AnalyticsProps {
  const safe: AnalyticsProps = {};
  if (!props) return safe;

  for (const key of ANALYTICS_PROPERTY_KEYS) {
    const value = props[key];
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > MAX_LENGTH) continue;
    if (EMAIL.test(trimmed) || PHONE.test(trimmed)) continue;
    safe[key] = trimmed;
  }
  return safe;
}
