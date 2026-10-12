import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/layout/section-header";
import { MetaLabel, indexLabel } from "@/components/ui/meta-label";
import { industriesSection } from "@/content/home";
import { industries } from "@/content/industries";
import { confirmed } from "@/content/types";

/** Confirmed priority industries only. */
export function IndustriesSection() {
  const list = confirmed(industries);
  if (list.length === 0) return null;

  return (
    <Section id="industries" aria-labelledby="industries-title">
      <SectionHeader
        id="industries-title"
        eyebrow={industriesSection.eyebrow}
        title={industriesSection.title}
        description={industriesSection.description && <p>{industriesSection.description}</p>}
      />
      <ul className="grid gap-4 md:grid-cols-3">
        {list.map((industry, i) => (
          <li
            key={industry.id}
            className="grid content-start gap-3 rounded-card border border-line bg-surface p-6"
          >
            <MetaLabel>{indexLabel(i)}</MetaLabel>
            <h3 className="text-xl">{industry.name}</h3>
            {industry.summary && <p className="text-sm">{industry.summary}</p>}
          </li>
        ))}
      </ul>
    </Section>
  );
}
