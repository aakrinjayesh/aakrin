// Shared lead types. Kept free of Salesforce specifics so the form doesn't depend on them.

export interface EnquiryValues {
  name: string;
  email: string;
  company: string;
  phone: string;
  /** ISO country code accepted by the org's country picklist, or "" */
  country: string;
  /** State code for countries with a state picklist, or "" */
  state: string;
  /** Optional Salesforce Industry picklist value (content/quiz.ts), or "" */
  industry: string;
  /** Optional timing option id (content/quiz.ts), or "" */
  timing: string;
  message: string;
}

export type EnquiryField = keyof EnquiryValues;

export const emptyEnquiry: EnquiryValues = {
  name: "",
  email: "",
  company: "",
  phone: "",
  country: "",
  state: "",
  industry: "",
  timing: "",
  message: "",
};

export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  /** Path the visitor first landed on in this session */
  landing_page?: string;
  /** Referring site's host, if any */
  referrer?: string;
}

/** Structured qualification context submitted alongside the contact details. */
export interface LeadContext {
  /** Where the enquiry came from, e.g. "quiz" */
  source: string;
  /** CTA placement that opened the flow, e.g. "hero" */
  placement?: string;
  situation?: { id: string; label: string };
  requirement?: { id: string; label: string };
  /** Optional form answer, sent as context (industry goes to the standard Industry field) */
  timing?: { id: string; label: string };
  attribution: Attribution;
}

/** Keys that can be mapped to Salesforce Lead custom fields via WEB_TO_LEAD_CONTEXT_FIELDS. */
export const LEAD_CONTEXT_KEYS = [
  "source",
  "placement",
  "situation",
  "requirement",
  "timing",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "landing_page",
  "referrer",
] as const;

export type LeadContextKey = (typeof LEAD_CONTEXT_KEYS)[number];
