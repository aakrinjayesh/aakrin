import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/layout/section-header";
import { MetaLabel } from "@/components/ui/meta-label";
import { expertiseSection } from "@/content/home";
import { platformGroups, platforms, type PlatformGroup } from "@/content/platforms";
import { confirmed } from "@/content/types";
import { cn } from "@/lib/cn";

const groupLayout: Record<PlatformGroup, string> = {
  customer: "sm:grid-cols-2 md:grid-cols-3 nav:grid-cols-5",
  "data-ai": "sm:grid-cols-2",
};

/** Salesforce platforms: where Aakrin's services apply. Separate from the services list. */
export function ExpertiseSection() {
  const list = confirmed(platforms);
  const groups = (Object.keys(platformGroups) as PlatformGroup[])
    .map((group) => ({ group, items: list.filter((platform) => platform.group === group) }))
    .filter(({ items }) => items.length > 0);

  return (
    <Section id="salesforce" tone="surface" aria-labelledby="salesforce-title">
      <SectionHeader
        id="salesforce-title"
        eyebrow={expertiseSection.eyebrow}
        title={expertiseSection.title}
        description={<p>{expertiseSection.description}</p>}
      />
      <div className="grid gap-8">
        {groups.map(({ group, items }) => (
          <div key={group} className="grid gap-3">
            <MetaLabel as="p">{platformGroups[group]}</MetaLabel>
            <ul className={cn("grid gap-3", groupLayout[group])}>
              {items.map((platform) => (
                <li
                  key={platform.id}
                  className={cn(
                    "grid content-start gap-2 rounded-card border p-5",
                    group === "data-ai"
                      ? "border-accent/35 bg-accent-tint/60"
                      : "border-line bg-canvas",
                  )}
                >
                  <h3 className="text-lg">{platform.name}</h3>
                  <p className="text-sm">{platform.summary}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
