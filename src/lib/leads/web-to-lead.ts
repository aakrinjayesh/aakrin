import type { WebToLeadConfig } from "./config";
import type { EnquiryValues, LeadContext, LeadContextKey } from "./types";

/**
 * Salesforce Web-to-Lead. Builds the field list for a lead and posts it into a hidden
 * iframe so the visitor stays on the page.
 *
 * Limitation: the response is cross-origin, so the page cannot read it. What is observable:
 * Salesforce accepted the post and redirected the frame to retURL on this site. Whether a
 * Lead record was created is not observable (that is measured in Salesforce).
 */

const FRAME_NAME = "aakrin-web-to-lead";
const SUBMIT_TIMEOUT_MS = 8000;

/** Salesforce requires Last Name, so a single-word name goes there. */
export function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first: "", last: (parts[0] ?? "").slice(0, 80) };
  return {
    first: parts.slice(0, -1).join(" ").slice(0, 40),
    last: parts[parts.length - 1].slice(0, 80),
  };
}

function contextValues(context: LeadContext): Partial<Record<LeadContextKey, string>> {
  return {
    source: context.source,
    placement: context.placement,
    situation: context.situation?.id,
    requirement: context.requirement?.id,
    timing: context.timing?.id,
    ...context.attribution,
  };
}

/** Human-readable but consistently keyed block, so the context survives without custom fields. */
export function buildDescription(message: string, context: LeadContext): string {
  const lines = [
    message.trim() || "(No message provided)",
    "",
    "--- Website enquiry context ---",
    `Source: ${context.source}${context.placement ? ` (placement: ${context.placement})` : ""}`,
  ];
  if (context.situation)
    lines.push(`Situation: ${context.situation.label} [${context.situation.id}]`);
  if (context.requirement)
    lines.push(`Requirement: ${context.requirement.label} [${context.requirement.id}]`);
  if (context.timing) lines.push(`Timing: ${context.timing.label} [${context.timing.id}]`);
  for (const [key, value] of Object.entries(context.attribution)) {
    if (value) lines.push(`${key}: ${value}`);
  }
  return lines.join("\n");
}

export function buildWebToLeadFields(
  config: WebToLeadConfig,
  values: EnquiryValues,
  context: LeadContext,
): [string, string][] {
  const { first, last } = splitName(values.name);
  const fields: [string, string][] = [
    ["oid", config.orgId],
    ["retURL", config.returnUrl],
    ["lead_source", config.leadSource],
    ["first_name", first],
    ["last_name", last],
    ["email", values.email.trim()],
    ["company", values.company.trim()],
    // Standard Lead Industry picklist: the value is an exact picklist value (content/quiz.ts)
    ["industry", values.industry],
    ["mobile", values.phone.trim()],
    ["country_code", values.country],
    ["state_code", values.state],
    ["description", buildDescription(values.message, context)],
  ];

  // Structured context in Lead custom fields, where the org has them configured
  const ctx = contextValues(context);
  for (const [key, fieldId] of Object.entries(config.contextFields) as [LeadContextKey, string][]) {
    const value = ctx[key];
    if (value) fields.push([fieldId, value]);
  }

  if (config.debugEmail) {
    fields.push(["debug", "1"], ["debugEmail", config.debugEmail]);
  }
  return fields.filter(([, value]) => value !== "");
}

/** The hidden frame that receives the post. Created ahead of time so its initial load is done. */
export function ensureLeadFrame(): HTMLIFrameElement {
  let frame = document.querySelector<HTMLIFrameElement>(`iframe[name="${FRAME_NAME}"]`);
  if (!frame) {
    frame = document.createElement("iframe");
    frame.name = FRAME_NAME;
    frame.title = "Enquiry submission";
    frame.hidden = true;
    frame.tabIndex = -1;
    frame.setAttribute("aria-hidden", "true");
    document.body.appendChild(frame);
  }
  return frame;
}

/**
 * retURL on the site the visitor is actually on (production, a preview, or local), so the page
 * can see the frame arrive there after Salesforce accepts the post.
 */
export function sameOriginReturnUrl(config: WebToLeadConfig): string {
  try {
    return new URL(new URL(config.returnUrl).pathname, window.location.origin).href;
  } catch {
    return config.returnUrl;
  }
}

/**
 * Posts the lead. Resolves true once Salesforce has redirected the frame to retURL (the post
 * was accepted; this is not Lead creation), or false after a timeout (offline, blocked, or no
 * redirect). Only same-origin pages can be read, so Salesforce's own pages never count.
 */
export function submitWebToLead(
  config: WebToLeadConfig,
  fields: [string, string][],
): Promise<boolean> {
  const frame = ensureLeadFrame();
  const form = document.createElement("form");
  form.method = "POST";
  form.action = config.action;
  form.target = FRAME_NAME;
  form.acceptCharset = "UTF-8";
  form.hidden = true;
  for (const [name, value] of fields) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  const returnUrl = fields.find(([name]) => name === "retURL")?.[1] ?? "";

  return new Promise((resolve) => {
    let settled = false;
    const finish = (confirmed: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      frame.removeEventListener("load", onLoad);
      form.remove();
      resolve(confirmed);
    };
    const onLoad = () => {
      try {
        if (frame.contentWindow?.location.href.split(/[?#]/)[0] === returnUrl) finish(true);
      } catch {
        // Another origin (Salesforce's reply page or a browser error page): keep waiting
      }
    };
    const timer = window.setTimeout(() => finish(false), SUBMIT_TIMEOUT_MS);
    frame.addEventListener("load", onLoad);
    document.body.appendChild(form);
    form.submit();
  });
}
