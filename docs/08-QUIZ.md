# Aakrin — Lead Qualification Quiz

## Purpose

The quiz is primarily for **lead qualification**.

It should help Aakrin understand what the visitor needs and route them toward an appropriate conversation.

It should NOT feel like a generic personality quiz.

## Hard constraints

- Maximum 3 questions.
- Question 3 is always the lead notification/contact step.
- The existing enquiry form will be reused/shown for the final contact step.
- Do not create a second competing lead form if the existing form can be reused.
- Do not auto-open the quiz on first visit.
- The quiz should be intentionally opened by the visitor.

## Recommended structure

### Question 1 — Who are you / why are you here?

The first question should identify the visitor's context rather than asking their industry.

Potential choices:

- I am a Salesforce consulting partner
- We are implementing Salesforce
- We already use Salesforce and need help
- We need to extend/customize Salesforce
- We need integrations or data work
- We want to explore Agentforce / AI

The exact options can be refined during UX implementation.

The key requirement is that the question should identify the commercial situation.

### Question 2 — What do you need help with?

This question should adapt to Question 1 where useful.

Potential categories:

- Salesforce implementation
- Development / customization
- Integration
- Data migration / Data Cloud
- Service / support
- Optimization / health check
- Agentforce / AI
- Additional engineering capacity for a consulting partner

The options must map to real Aakrin capabilities.

### Question 3 — Contact / notification

Always show the existing enquiry form.

Context should say something like:

> Want us to help with this?

or

> Get a recommendation from the Aakrin team.

The exact copy should remain concise.

The form should carry the quiz answers as hidden context/metadata so the lead team knows what the visitor selected.

## Result / routing behavior

The quiz may show a concise recommendation before the form, e.g.:

> Based on your answers, Aakrin can help with Salesforce integration and engineering support.

Do not make the visitor go through a long results screen.

## Quiz UX

- Progress indicator: 1 of 3, 2 of 3, 3 of 3
- Fast interaction
- Large answer targets
- Back button
- Clear selected state
- No unnecessary animation
- Keyboard accessible
- Mobile-first

## Do not ask

Do not waste one of the first two questions on:

- Industry
- Company size
- Timeline

Those can be captured in the enquiry form if required.

The first two questions should qualify intent and capability need.

## Analytics

Track:

- quiz_open
- quiz_question_1
- quiz_question_2
- quiz_contact_step
- quiz_completed
- quiz_abandoned_question_1
- quiz_abandoned_question_2
- quiz_form_started
- quiz_form_submitted

Do not track sensitive form values as analytics event names.

## Product decision: onboarding with Nova (2026-10-07)

Approved by the product owner. This supersedes the "Do not auto-open the quiz on first visit" constraint above and the Stage 3 "no mascot / speech / sound / typing" constraints.

- The quiz is presented as a full-screen onboarding page with **Nova · Aakrin guide** (a scripted guide, not an AI system; the avatar artwork is kept as supplied, including its Salesforce badge).
- It opens automatically on **every visit to the homepage** (updated 2026-10-09: Nova is the default landing experience, not only for first-time visitors), at **/start**, and from every "Tell us what you need" CTA. Each page load plays the full fly-in. "Skip & explore" (and "I'd rather explore the website myself") closes it and shows the website. Search crawlers and link-preview bots are not shown the overlay.
- **Skip & explore** is always visible, plus "I'd rather explore the website myself" in the conversation. Since 2026-10-09 skipping, closing or finishing no longer stops it opening on the next visit; it only means a later reopen from a button skips the fly-in.
- Nova arrives on a paper plane, follows the cursor, types and speaks each line (browser speech synthesis, with a sound toggle and Replay). All motion and typing are disabled for reduced-motion users; screen readers get each line in full.
- Still exactly three steps: situation → requirement → details. **Industry** and **timing** are optional fields inside the details form, consistent with "Do not ask" above. Industry uses the Salesforce standard Lead Industry picklist values and is sent to the standard `industry` field (updated 2026-10-07); choosing one makes no claim of expertise. Timing is sent in the Description context block.
- Required contact fields: name, email, phone. Company is optional.
- Analytics are unchanged (see 10-ANALYTICS.md); placement values include `page_load` (was `first_visit` before 2026-10-09), `start_page` and `url`.

## Product decision: problem-first questions (2026-10-12)

Approved by the product owner. Supersedes the "Recommended structure" questions above. Visitors now start from the problem that brought them here, and step 2 narrows down the help they need. The partner/business split is no longer asked. The step 3 form is unchanged.

Step names: **Your challenge → Help needed → Your details**. Content and ids live in `src/content/quiz.ts`; in code and in the lead's Description the step 1 answer is still called the "situation".

**Step 1: "What are you looking to solve?"** (hint: "Tell us what brings you here.") Each answer gets its own short reply from Nova.

| id | Option |
|---|---|
| `more-people` | We need more Salesforce people on our projects |
| `new-implementation` | We're starting a new Salesforce implementation |
| `changes-features` | Our Salesforce needs changes or new features |
| `connections-data` | We need Salesforce connected to other systems, or data moved in |
| `agentforce-ai` | We're exploring Agentforce / AI |
| `ongoing-support` | We need ongoing Salesforce support |

**Step 2: "How can Aakrin help?"** (hint: "Choose the closest match.") The list depends on the step 1 answer; every list ends with "Something else" (`other`).

- `more-people`: Developers (`developers`), Admins (`admins`), Architects (`architects`), CPQ specialists (`cpq-specialists`), A full delivery team (`delivery-team`)
- `new-implementation`: Help choosing the right setup (`choosing-setup`), End-to-end implementation (`end-to-end`), Moving data from our old system (`data-migration`), Connecting it to our other systems (`integrations`)
- `changes-features`: Custom development (`custom-development`), Automating manual processes (`automation`), Improving what we already have (`improvements`)
- `connections-data`: Connecting Salesforce to other apps (`app-integrations`), Moving data into Salesforce (`data-migration`), Cleaning up messy data (`data-cleanup`), Keeping data in sync between systems (`data-sync`)
- `agentforce-ai`: Finding where AI fits (`ai-discovery`), Building and launching AI agents (`ai-agents`), Connecting AI to our data (`ai-data`)
- `ongoing-support`: Day-to-day admin and support (`admin-support`), Fixing performance or usability issues (`performance-usability`), Ongoing development (`ongoing-development`)

Step 2 ids are unique within their list (e.g. `data-migration` appears under two problems); read them together with the step 1 id.

Before the form, the card shows "Based on your answers, Aakrin can help with …" using the option's summary phrase. "Something else" shows "Tell us a bit more in the form below and our team will take it from there." instead. The step 3 hint is "Share your details and we'll take it from here."
