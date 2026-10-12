import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/layout/section-header";
import { MetaLabel, indexLabel } from "@/components/ui/meta-label";
import { servicesSection } from "@/content/home";
import { lifecycleStages, services } from "@/content/services";
import { confirmed } from "@/content/types";

/** Services organised by the approved lifecycle: each stage lists the services that deliver it. */
export function ServicesSection() {
  const confirmedServices = new Map(confirmed(services).map((service) => [service.id, service]));
  const stages = lifecycleStages
    .map((stage) => ({
      ...stage,
      services: stage.serviceIds.flatMap((id) => confirmedServices.get(id) ?? []),
    }))
    .filter((stage) => stage.services.length > 0);

  return (
    <Section id="services" aria-labelledby="services-title">
      <SectionHeader
        id="services-title"
        eyebrow={servicesSection.eyebrow}
        title={servicesSection.title}
        description={<p>{servicesSection.description}</p>}
      />

      {/* Lifecycle at a glance; the list below carries the same stages for assistive tech */}
      <div
        aria-hidden="true"
        className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1.5 font-mono text-[0.8125rem] text-ink"
      >
        {stages.map((stage, i) => (
          <span key={stage.id} className="flex items-center gap-2">
            <span className="rounded-md border border-line bg-surface px-2 py-1">
              {stage.label}
            </span>
            {i < stages.length - 1 && <span className="text-accent">→</span>}
          </span>
        ))}
      </div>

      <ol className="overflow-hidden rounded-card border border-line bg-surface">
        {stages.map((stage, i) => (
          <li
            key={stage.id}
            className="grid gap-x-8 gap-y-3 border-t border-line p-5 first:border-t-0 sm:p-6 md:grid-cols-[minmax(150px,0.7fr)_1.4fr_1.3fr] md:items-start"
          >
            <h3 className="flex items-baseline gap-3 text-xl">
              <MetaLabel tone="accent">{indexLabel(i)}</MetaLabel>
              {stage.label}
            </h3>
            <p className="text-sm md:pt-1">{stage.summary}</p>
            <ul className="flex flex-wrap gap-1.5 md:pt-0.5" aria-label={`${stage.label} services`}>
              {stage.services.map((service) => (
                <li
                  key={service.id}
                  className="rounded-md bg-canvas px-2.5 py-1 text-xs font-medium text-ink"
                >
                  {service.title}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </Section>
  );
}
