# Legacy reference material

Not part of the application build. Kept for reference only; `docs/` is the source of truth.

| File | Role |
| --- | --- |
| `legacy-site/version-a.html` | The previous live site (git `main` before v2). Legacy reference only. |
| `legacy-site/version-b.html` | Snapshot taken 2026-10-06. **Functional** reference: Salesforce Web-to-Lead, `createEnquiryForm()`, quiz-to-form context. |
| `legacy-site/version-c.html` | Snapshot taken 2026-10-06. **Visual** reference: tokens, type, spacing, accessibility, header, cards. |

Do not copy information architecture, positioning, messaging, CTA structure or quiz questions from these files.

Version B hard-codes `debugEmail` in its Web-to-Lead config, which sends Salesforce debug
emails on every submission. Do not carry that over; Stage 3 implements the approved
Web-to-Lead architecture.
