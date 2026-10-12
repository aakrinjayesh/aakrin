import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/layout/section-header";
import { MetaLabel } from "@/components/ui/meta-label";
import { resultsSection } from "@/content/home";
import { platforms } from "@/content/platforms";
import { caseStudies } from "@/content/proof";
import { confirmed } from "@/content/types";

/**
 * Confirmed case studies only. With none confirmed the section is not rendered at all
 * (no placeholder), and the "Results" nav item is hidden (content/navigation.ts).
 */
export function ResultsSection() {
  const list = confirmed(caseStudies);
  if (list.length === 0) return null;

  const platformName = new Map(platforms.map((platform) => [platform.id, platform.name]));

  return (
    <Section id="results" tone="surface" aria-labelledby="results-title">
      <SectionHeader
        id="results-title"
        eyebrow={resultsSection.eyebrow}
        title={resultsSection.title}
      />
      <ul className="grid gap-4 lg:grid-cols-2">
        {list.map((study) => {
          const facts = [
            { term: "The problem", detail: study.problem },
            { term: "What we built", detail: study.solution },
            { term: "Outcome", detail: study.outcome },
          ].filter((fact) => fact.detail);

          return (
            <li
              key={study.id}
              className="grid content-start gap-4 rounded-card border border-line p-6"
            >
              <MetaLabel>
                {study.platformIds.map((id) => platformName.get(id) ?? id).join(" · ")}
              </MetaLabel>
              <h3 className="text-xl">{study.title}</h3>
              <dl className="grid gap-3">
                {facts.map((fact) => (
                  <div key={fact.term} className="grid gap-1 border-t border-line pt-3">
                    <dt className="text-xs font-semibold tracking-[0.1em] text-ink uppercase">
                      {fact.term}
                    </dt>
                    <dd className="text-sm">{fact.detail}</dd>
                  </div>
                ))}
              </dl>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
