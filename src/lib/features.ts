import { env } from "./env";

// Feature switches, read on the server at build time. A CTA whose destination isn't
// switched on is not rendered, so visitors never meet a dead button.
// Server-only: client components receive what they need as props.

export const features = {
  /** The 3-step qualification quiz behind "Tell us what you need" (FEATURE_QUIZ=true). */
  quiz: env.featureQuiz,
} as const;
