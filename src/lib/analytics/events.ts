// Event catalogue from docs/10-ANALYTICS.md and docs/08-QUIZ.md.
// Components may only emit names from this list.
//
// Lead outcomes are three different things. Only the first two are observable here:
//   1. Submission attempt   — quiz_form_submitted: a valid form was sent to Web-to-Lead.
//   2. Website completion   — quiz_completed: the confirmation state was shown to the visitor.
//   3. Salesforce Lead created — NOT tracked. Web-to-Lead posts into a cross-origin iframe,
//      so the site cannot know whether Salesforce created a record. Measure this in
//      Salesforce (Lead Source / Description context), never from website analytics.

export const ANALYTICS_EVENTS = [
  // CTAs
  "cta_book_hero",
  "cta_enquire_hero",
  "cta_book_header",
  "cta_audience_partner",
  "cta_audience_business",
  "cta_final_book",
  "cta_final_enquire",

  // Quiz
  "quiz_open",
  "quiz_question_1",
  "quiz_question_2",
  "quiz_contact_step",
  /** Website completion: confirmation state shown. Not Salesforce Lead creation. */
  "quiz_completed",
  "quiz_abandoned_question_1",
  "quiz_abandoned_question_2",
  "quiz_form_started",
  /** Submission attempt: a valid form was posted to Web-to-Lead. Not delivery or Lead creation. */
  "quiz_form_submitted",

  // Enquiry form
  "form_started",
  "form_validation_error",
  // Means "submission attempted": Web-to-Lead posts into a hidden iframe, so delivery
  // can't be confirmed. form_submission_success / form_submission_error are deliberately
  // absent until the backend can actually report the result (approved decision 15).
  "form_submitted",

  // Services
  "service_view",
  "service_cta",

  // Booking. Calendly stays an external, new-tab destination in v1, so only the CTA
  // click is tracked. booking_flow_opened / booking_completed are deliberately absent.
  "booking_cta_clicked",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export function isAnalyticsEvent(name: string): name is AnalyticsEvent {
  return (ANALYTICS_EVENTS as readonly string[]).includes(name);
}

/**
 * Properties are an allowlist of non-identifying context. Never put names, emails,
 * phone numbers or free text from forms here (docs/10-ANALYTICS.md, Privacy).
 */
export const ANALYTICS_PROPERTY_KEYS = [
  "placement",
  "source",
  "step",
  /** Quiz step 1 answer id (e.g. "consulting-partner"), never the label */
  "situation",
  /** Quiz step 2 answer id (e.g. "integrations"), never the label */
  "requirement",
  "service",
  "platform",
  "field",
] as const;

export type AnalyticsPropertyKey = (typeof ANALYTICS_PROPERTY_KEYS)[number];
export type AnalyticsProps = Partial<Record<AnalyticsPropertyKey, string>>;
