import { caseStudies } from "./proof";
import { confirmed } from "./types";

// Top navigation from docs/05-INFORMATION-ARCHITECTURE.md.
// "Insights" is intentionally omitted: blog/insights are out of scope for v1.
// Every item targets a homepage section. "Why Aakrin" keeps the #about anchor.

export interface NavItem {
  label: string;
  href: string;
}

/** The Results section only renders once a case study is confirmed; so does its nav item. */
export const hasResults = confirmed(caseStudies).length > 0;

const allNav: readonly NavItem[] = [
  { label: "Services", href: "/#services" },
  { label: "Salesforce", href: "/#salesforce" },
  { label: "Industries", href: "/#industries" },
  { label: "Results", href: "/#results" },
  { label: "Why Aakrin", href: "/#about" },
];

export const primaryNav: readonly NavItem[] = allNav.filter(
  (item) => item.href !== "/#results" || hasResults,
);
