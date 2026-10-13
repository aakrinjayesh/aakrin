// Qualification quiz content (docs/08-QUIZ.md and the onboarding decisions).
// Exactly three steps: the problem the visitor wants to solve → the specific help they need
// (a list that depends on the problem) → the enquiry form (industry and timing are optional
// fields inside the form). Presented by Nova, the onboarding guide.
// Ids are stable values sent to Salesforce and analytics; labels are display copy only.
// In code and in the lead, the step 1 answer is still called the "situation".

export interface QuizOption<Id extends string = string> {
  id: Id;
  label: string;
}

export interface Requirement extends QuizOption {
  /**
   * Completes "Based on your answers, Aakrin can help with …". Absent for "Something else",
   * which shows quizCopy.details.somethingElse instead.
   */
  summary?: string;
}

/** Step 1 answer: the problem that brought the visitor here */
export interface Situation extends QuizOption {
  /** Nova's short reply after this answer. No claims about past work. */
  ack: string;
  /** Step 2 options for this problem */
  requirements: readonly Requirement[];
}

export const quizSteps = ["Your challenge", "Help needed", "Your details"] as const;

export const quizCopy = {
  dialogLabel: "Tell us what you need",
  situation: { title: "What are you looking to solve?", hint: "Tell us what brings you here." },
  requirement: { title: "How can Aakrin help?", hint: "Choose the closest match." },
  details: {
    title: "Want us to help with this?",
    hint: "Share your details and we'll take it from here.",
    answersLabel: "Your answers",
    recommendation: (summary: string) => `Based on your answers, Aakrin can help with ${summary}.`,
    /** Shown instead of the recommendation when the visitor picked "Something else" */
    somethingElse: "Tell us a bit more in the form below and our team will take it from there.",
  },
  done: {
    title: "Thanks — we have your details.",
    body: "Your requirement has been submitted to Aakrin. Our team will review it and get back to you.",
  },
} as const;

/** Last option of every step 2 list */
const somethingElse: Requirement = { id: "other", label: "Something else" };

export const situations: readonly Situation[] = [
  {
    id: "more-people",
    label: "We need more Salesforce people on our projects",
    ack: "More hands on deck. Let's see who you need.",
    requirements: [
      {
        id: "developers",
        label: "Developers",
        summary: "Salesforce developers for your projects",
      },
      { id: "admins", label: "Admins", summary: "Salesforce admins for your team" },
      { id: "architects", label: "Architects", summary: "Salesforce architecture expertise" },
      { id: "cpq-specialists", label: "CPQ specialists", summary: "Salesforce CPQ specialists" },
      {
        id: "delivery-team",
        label: "A full delivery team",
        summary: "a full Salesforce delivery team",
      },
      somethingElse,
    ],
  },
  {
    id: "new-implementation",
    label: "We're starting a new Salesforce implementation",
    ack: "A fresh start is the best time to get the foundations right.",
    requirements: [
      {
        id: "choosing-setup",
        label: "Help choosing the right setup",
        summary: "planning the right Salesforce setup",
      },
      {
        id: "end-to-end",
        label: "End-to-end implementation",
        summary: "your end-to-end Salesforce implementation",
      },
      {
        id: "data-migration",
        label: "Moving data from our old system",
        summary: "moving your data into Salesforce",
      },
      {
        id: "integrations",
        label: "Connecting it to our other systems",
        summary: "connecting Salesforce to your other systems",
      },
      somethingElse,
    ],
  },
  {
    id: "changes-features",
    label: "Our Salesforce needs changes or new features",
    ack: "Got it. Let's pin down what needs to change.",
    requirements: [
      {
        id: "custom-development",
        label: "Custom development",
        summary: "custom Salesforce development",
      },
      {
        id: "automation",
        label: "Automating manual processes",
        summary: "automating your processes in Salesforce",
      },
      {
        id: "improvements",
        label: "Improving what we already have",
        summary: "improving your existing Salesforce setup",
      },
      somethingElse,
    ],
  },
  {
    id: "connections-data",
    label: "We need Salesforce connected to other systems, or data moved in",
    ack: "Connections and data, noted. Let's get specific.",
    requirements: [
      {
        id: "app-integrations",
        label: "Connecting Salesforce to other apps",
        summary: "connecting Salesforce to your other apps",
      },
      {
        id: "data-migration",
        label: "Moving data into Salesforce",
        summary: "moving your data into Salesforce",
      },
      {
        id: "data-cleanup",
        label: "Cleaning up messy data",
        summary: "cleaning up your Salesforce data",
      },
      {
        id: "data-sync",
        label: "Keeping data in sync between systems",
        summary: "keeping data in sync between your systems",
      },
      somethingElse,
    ],
  },
  {
    id: "agentforce-ai",
    label: "We're exploring Agentforce / AI",
    ack: "Agentforce it is. Let's see where it fits.",
    requirements: [
      {
        id: "ai-discovery",
        label: "Finding where AI fits",
        summary: "finding where Agentforce and AI fit your business",
      },
      {
        id: "ai-agents",
        label: "Building and launching AI agents",
        summary: "building and launching AI agents on Salesforce",
      },
      {
        id: "ai-data",
        label: "Connecting AI to our data",
        summary: "connecting AI to your Salesforce data",
      },
      somethingElse,
    ],
  },
  {
    id: "ongoing-support",
    label: "We need ongoing Salesforce support",
    ack: "Ongoing support, noted. Let's see what would help most.",
    requirements: [
      {
        id: "admin-support",
        label: "Day-to-day admin and support",
        summary: "day-to-day Salesforce admin and support",
      },
      {
        id: "performance-usability",
        label: "Fixing performance or usability issues",
        summary: "fixing performance and usability issues",
      },
      {
        id: "ongoing-development",
        label: "Ongoing development",
        summary: "ongoing Salesforce development",
      },
      somethingElse,
    ],
  },
];

export function findSituation(id: string | undefined): Situation | undefined {
  return situations.find((situation) => situation.id === id);
}

export function requirementsFor(situationId: string | undefined): readonly Requirement[] {
  return findSituation(situationId)?.requirements ?? [];
}

/**
 * Optional form field, sent to the standard Salesforce Lead **Industry** picklist.
 * Each value must match the picklist value in the org exactly (standard values: label = API
 * name). Picking an industry is the visitor's answer, not a claim of expertise.
 */
export const industryOptions: readonly QuizOption[] = [
  {
    id: "Agriculture",
    label: "Agriculture",
  },
  {
    id: "Apparel",
    label: "Apparel",
  },
  {
    id: "Banking",
    label: "Banking",
  },
  {
    id: "Biotechnology",
    label: "Biotechnology",
  },
  {
    id: "Chemicals",
    label: "Chemicals",
  },
  {
    id: "Communications",
    label: "Communications",
  },
  {
    id: "Construction",
    label: "Construction",
  },
  {
    id: "Consulting",
    label: "Consulting",
  },
  {
    id: "Education",
    label: "Education",
  },
  {
    id: "Electronics",
    label: "Electronics",
  },
  {
    id: "Energy",
    label: "Energy",
  },
  {
    id: "Engineering",
    label: "Engineering",
  },
  {
    id: "Entertainment",
    label: "Entertainment",
  },
  {
    id: "Environmental",
    label: "Environmental",
  },
  {
    id: "Finance",
    label: "Finance",
  },
  {
    id: "Food & Beverage",
    label: "Food & Beverage",
  },
  {
    id: "Government",
    label: "Government",
  },
  {
    id: "Healthcare",
    label: "Healthcare",
  },
  {
    id: "Hospitality",
    label: "Hospitality",
  },
  {
    id: "Insurance",
    label: "Insurance",
  },
  {
    id: "Machinery",
    label: "Machinery",
  },
  {
    id: "Manufacturing",
    label: "Manufacturing",
  },
  {
    id: "Media",
    label: "Media",
  },
  {
    id: "Not For Profit",
    label: "Not For Profit",
  },
  {
    id: "Other",
    label: "Other",
  },
  {
    id: "Recreation",
    label: "Recreation",
  },
  {
    id: "Retail",
    label: "Retail",
  },
  {
    id: "Shipping",
    label: "Shipping",
  },
  {
    id: "Technology",
    label: "Technology",
  },
  {
    id: "Telecommunications",
    label: "Telecommunications",
  },
  {
    id: "Transportation",
    label: "Transportation",
  },
  {
    id: "Utilities",
    label: "Utilities",
  },
];

/** Optional form field */
export const timingOptions: readonly QuizOption[] = [
  { id: "now", label: "Immediately" },
  { id: "month", label: "Within a month" },
  { id: "quarter", label: "In 1–3 months" },
  { id: "half", label: "In 3–6 months" },
  { id: "exploring", label: "Just exploring" },
];

export function optionLabel(options: readonly QuizOption[], id: string): string | undefined {
  return options.find((option) => option.id === id)?.label;
}

/** Nova, the onboarding guide. Scripted, not an AI system, and labelled honestly. */
export const onboardingCopy = {
  guideName: "Nova · Aakrin guide",
  greeting:
    "Hi there! 👋 I'm Nova, your Aakrin guide. Tell me what you're looking to solve, and I'll help you find the right way to get started.",
  requirementAck: "Perfect, one last step.",
  skip: "Skip & explore website",
  /** The same button on phones, where the header has room for one short word */
  skipShort: "Skip",
  replay: "Replay intro",
  sound: "Sound",
  /** Sound button label while the browser holds speech back until the visitor's first tap */
  tapToHear: "Tap to hear Nova",
  goodbye: "Goodbye! See you soon.",
  /** Shown on the confirmation only when the browser couldn't confirm Salesforce accepted the post */
  unconfirmed:
    "We couldn't confirm that your enquiry reached us. If you don't hear back, please email",
  exploreSite: "Explore the website",
  startOver: "Start over",
  back: "Back",
} as const;
