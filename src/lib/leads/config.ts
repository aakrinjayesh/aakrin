import { env } from "@/lib/env";
import { LEAD_CONTEXT_KEYS, type LeadContextKey } from "./types";

/**
 * Web-to-Lead settings, resolved on the server and passed to the client form as props.
 * Web-to-Lead has no secrets: the org id travels in every form post by design.
 */
export interface WebToLeadConfig {
  action: string;
  orgId: string;
  /** Salesforce redirects the hidden frame here after a post; a tiny file keeps it cheap. */
  returnUrl: string;
  leadSource: string;
  /** Salesforce debug email. Only ever set outside production (see below). */
  debugEmail?: string;
  /** Optional Lead custom field ids for structured context */
  contextFields: Partial<Record<LeadContextKey, string>>;
}

export function webToLeadConfig(): WebToLeadConfig {
  const { orgId, debugEmail, contextFields } = env.webToLead;

  return {
    action: `https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8&orgId=${encodeURIComponent(orgId)}`,
    orgId,
    returnUrl: `${env.siteUrl}/favicon.svg`,
    leadSource: "Web",
    // Debug mode is environment-controlled and can never be on for the production
    // (indexable) site, even if WEB_TO_LEAD_DEBUG_EMAIL is set by mistake.
    debugEmail: env.allowIndexing ? undefined : debugEmail,
    contextFields: Object.fromEntries(
      Object.entries(contextFields).filter(
        ([key, id]) =>
          (LEAD_CONTEXT_KEYS as readonly string[]).includes(key) &&
          /^00N[0-9A-Za-z]{12,15}$/.test(id),
      ),
    ),
  };
}
