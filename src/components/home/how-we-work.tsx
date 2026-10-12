import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/layout/section-header";
import { MetaLabel, indexLabel } from "@/components/ui/meta-label";
import { howWeWorkSection } from "@/content/home";
import { howWeWork } from "@/content/services";

/** The engagement process (Discover → Optimize). Distinct from the services lifecycle. */
export function HowWeWork() {
  return (
    <Section id="how-we-work" tone="surface" aria-labelledby="how-we-work-title">
      <SectionHeader
        id="how-we-work-title"
        eyebrow={howWeWorkSection.eyebrow}
        title={howWeWorkSection.title}
        description={howWeWorkSection.description && <p>{howWeWorkSection.description}</p>}
      />
      <ol className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
        {howWeWork.map((step, i) => (
          <li
            key={step.label}
            className="relative grid content-start gap-2.5 border-t-2 border-line pt-5 before:absolute before:-top-0.5 before:left-0 before:h-0.5 before:w-10 before:bg-accent"
          >
            <MetaLabel tone="accent">{indexLabel(i)}</MetaLabel>
            <h3 className="text-lg">{step.label}</h3>
            <p className="text-sm">{step.summary}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
