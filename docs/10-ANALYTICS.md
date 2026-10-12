# Aakrin — Analytics Specification

## Principle

Track business outcomes, not just clicks.

The current project has Clarity event calls and Apollo tracking. Microsoft Clarity initialization is intentionally commented out during development and should not be treated as a current bug.

## Core funnel

Homepage visit
→ hero CTA
→ service/expertise engagement
→ CTA
→ booking/contact
→ qualified lead

## CTA events

Recommended events:

- cta_book_hero
- cta_enquire_hero
- cta_book_header
- cta_audience_partner
- cta_audience_business
- cta_final_book
- cta_final_enquire

## Quiz events

- quiz_open
- quiz_question_1
- quiz_question_2
- quiz_contact_step
- quiz_completed
- quiz_abandoned_question_1
- quiz_abandoned_question_2
- quiz_form_started
- quiz_form_submitted

## Form events

- form_started
- form_validation_error
- form_submitted
- form_submission_success
- form_submission_error

## Service events

Track meaningful service interactions, for example:

- service_view
- service_cta

Do not generate an event for every trivial hover.

## Booking

Track:

- booking_cta_clicked
- booking_flow_opened where technically possible
- booking_completed where technically possible

The implementation should preserve attribution through UTM parameters where possible.

## Privacy

Do not send raw names, emails, phone numbers, or other personally identifiable form values as analytics event properties.

## Analytics architecture

Analytics should be abstracted behind a small tracking utility so providers can be enabled/disabled without rewriting components.

## Implementation notes: lead outcome semantics (Stage 3)

The enquiry form submits through Salesforce Web-to-Lead into a hidden, cross-origin iframe. The website can observe that a request was sent and that the iframe finished loading, but it cannot read Salesforce's response. Three outcomes must therefore be kept separate:

| Outcome | Event | Meaning |
| --- | --- | --- |
| Submission attempt | `quiz_form_submitted` | The visitor submitted a valid form and the website posted it to Web-to-Lead. |
| Website completion | `quiz_completed` | The website showed the visitor its confirmation state. |
| Salesforce Lead created | none | Not observable from the website. Measure in Salesforce (Lead Source and the Description context block). |

- `quiz_completed` does not mean Salesforce confirmed or created a Lead.
- `form_submission_success`, `form_submission_error` and `booking_completed` are not implemented, because the current mechanisms cannot truthfully report them.
- Submissions rejected by the spam honeypot emit no events.
- Event properties are limited to non-PII ids: `placement`, `situation`, `requirement`, `step`, `field`.
