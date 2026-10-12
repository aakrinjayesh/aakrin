import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Cta } from "@/components/cta/cta";
import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/layout/section-header";
import { onboardingCopy, quizCopy } from "@/content/quiz";
import { features } from "@/lib/features";

// The onboarding page. The onboarding itself is a full-screen overlay (root layout) that
// opens on load here; this page content is the no-JavaScript fallback underneath it.
// Not indexed and not in the sitemap: it is an interaction, not content.
export const metadata: Metadata = {
  title: quizCopy.dialogLabel,
  robots: { index: false, follow: true },
  alternates: { canonical: "/start" },
};

export default function StartPage() {
  if (!features.quiz) notFound();

  return (
    <Section tone="surface" aria-labelledby="start-title" className="border-t-0">
      <SectionHeader
        as="h1"
        id="start-title"
        eyebrow={onboardingCopy.guideName}
        title={quizCopy.dialogLabel}
        description={<p>{onboardingCopy.greeting.replace(/\s*👋/u, "")}</p>}
      />
      <div className="flex flex-wrap items-center gap-4">
        <Cta kind="book" placement="final" event="cta_final_book" className="max-sm:w-full" />
        <Cta kind="exploreServices" />
      </div>
    </Section>
  );
}
