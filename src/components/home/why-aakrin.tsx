import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/layout/section-header";
import { MetaLabel, indexLabel } from "@/components/ui/meta-label";
import { differentiators, whySection } from "@/content/home";

/** "Why Aakrin": the engineering advantage. Target of the "Why Aakrin" nav link (#about). */
export function WhyAakrin() {
  return (
    <Section id="about" tone="ink" aria-labelledby="about-title">
      <SectionHeader
        id="about-title"
        eyebrow={whySection.eyebrow}
        title={whySection.title}
        description={<p>{whySection.description}</p>}
        onDark
      />
      <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {differentiators.map((item, i) => (
          <li
            key={item.title}
            className="grid content-start gap-3 border-t border-on-dark-line pt-5"
          >
            <MetaLabel tone="accent-on-dark">{indexLabel(i)}</MetaLabel>
            <h3 className="text-lg text-on-dark">{item.title}</h3>
            <p className="text-sm">{item.summary}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
