// Server-side configuration. Pages are prerendered, so these are read at build time.
// See .env.example for what each value does.

function optional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function jsonRecord(value: string | undefined): Record<string, string> {
  const raw = optional(value);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== "",
      ),
    );
  } catch {
    return {};
  }
}

export const env = {
  siteUrl: (optional(process.env.SITE_URL) ?? "https://aakrin.com").replace(/\/+$/, ""),
  allowIndexing: process.env.ALLOW_INDEXING === "true",
  clarityProjectId: optional(process.env.CLARITY_PROJECT_ID),
  apolloAppId: optional(process.env.APOLLO_APP_ID),
  featureQuiz: process.env.FEATURE_QUIZ === "true",
  webToLead: {
    /** Salesforce org ID used by the approved Web-to-Lead form (public by design: it is in every form post). */
    orgId: optional(process.env.WEB_TO_LEAD_ORG_ID) ?? "00DdN00000rD67Y",
    debugEmail: optional(process.env.WEB_TO_LEAD_DEBUG_EMAIL),
    /** Optional Lead custom field ids for structured quiz context, e.g. {"situation":"00N…"} */
    contextFields: jsonRecord(process.env.WEB_TO_LEAD_CONTEXT_FIELDS),
  },
} as const;
