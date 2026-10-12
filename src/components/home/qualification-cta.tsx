import { Cta } from "@/components/cta/cta";
import { Section } from "@/components/layout/section";
import { MetaLabel } from "@/components/ui/meta-label";
import { qualificationSection } from "@/content/home";
import { features } from "@/lib/features";

/**
 * Entry point to the 3-step qualification quiz (situation → need → enquiry form).
 * Not rendered while the quiz feature is off, so the page never advertises a quiz
 * that isn't available yet.
 */
export function QualificationCta() {
  if (!features.quiz) return null;

  const { steps } = qualificationSection;

  return (
    <Section aria-labelledby="qualification-title">
      <div className="grid gap-8 rounded-card border border-accent/30 bg-accent-tint p-[clamp(24px,4vw,48px)] lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div className="grid gap-4">
          <p className="text-xs font-semibold tracking-[0.12em] text-accent-hover uppercase">
            {qualificationSection.eyebrow}
          </p>
          <h2 id="qualification-title" className="text-2xl">
            {qualificationSection.title}
          </h2>
          <p className="max-w-[52ch]">{qualificationSection.description}</p>
          <div className="pt-2">
            <Cta kind="enquire" placement="qualification" className="max-sm:w-full" />
          </div>
        </div>
        <ol className="grid gap-2.5">
          {steps.map((step, i) => (
            <li
              key={step}
              className="flex items-center gap-4 rounded-lg border border-accent/20 bg-surface px-4 py-3.5 text-ink"
            >
              <MetaLabel className="text-accent-hover">
                {i + 1} / {steps.length}
              </MetaLabel>
              <span className="font-medium">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
