// Enquiry form copy. The form is shared: the quiz's step 3 is its first use.

export const enquiryCopy = {
  fields: {
    name: "Name",
    email: "Work email",
    company: "Company",
    phone: "Phone",
    country: "Country",
    state: "State / province",
    industry: "Industry",
    timing: "When are you looking to start?",
    message: "Tell us a little about what you need",
  },
  optional: "(optional)",
  countryPlaceholder: "Choose a country",
  statePlaceholder: "Choose a state",
  industryPlaceholder: "Choose an industry",
  timingPlaceholder: "Choose a timeframe",
  errorSummary: "Please check the highlighted fields.",
  submit: "Send enquiry",
  submitting: "Sending…",
} as const;
