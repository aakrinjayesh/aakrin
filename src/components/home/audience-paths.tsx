import { Cta } from "@/components/cta/cta";
import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/layout/section-header";
import { MetaLabel, indexLabel } from "@/components/ui/meta-label";
import { audiences, type Audience } from "@/content/audiences";
import { audienceSection } from "@/content/home";
import { cn } from "@/lib/cn";
import { features } from "@/lib/features";

export function AudiencePaths() {
  return (
    <Section aria-labelledby="audiences-title">
      <SectionHeader
        id="audiences-title"
        eyebrow={audienceSection.eyebrow}
        title={audienceSection.title}
      />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        {audiences.map((audience, i) => (
          <AudienceCard key={audience.id} audience={audience} index={i} />
        ))}
      </div>
    </Section>
  );
}

function AudienceCard({ audience, index }: { audience: Audience; index: number }) {
  // Consulting partners are the primary audience, so their path gets the stronger treatment.
  const primary = audience.id === "partner";

  return (
    <article
      className={cn(
        "grid min-w-0 grid-rows-[auto_auto_1fr_auto] gap-5 rounded-card p-[clamp(24px,3.5vw,40px)]",
        primary ? "bg-ink text-on-dark-muted" : "border border-line bg-surface",
      )}
    >
      <h3 className={cn("grid gap-3 text-xl", primary && "text-on-dark")}>
        <MetaLabel tone={primary ? "accent-on-dark" : "accent"}>
          {indexLabel(index)} · For {audience.label}
        </MetaLabel>
        {audience.title}
      </h3>
      <p className={cn("max-w-[48ch]", primary ? "text-on-dark-muted" : "text-body")}>
        {audience.summary}
      </p>
      <ul
        className={cn(
          "grid content-start gap-2.5 border-t pt-5 text-sm sm:grid-cols-2",
          primary ? "border-on-dark-line text-on-dark" : "border-line text-ink",
        )}
      >
        {audience.themes.map((theme) => (
          <li key={theme} className="flex gap-2.5">
            <span
              aria-hidden="true"
              className="mt-[0.55em] size-1.5 shrink-0 rounded-[1px] bg-accent"
            />
            {theme}
          </li>
        ))}
      </ul>
      <div className="pt-2">
        {primary ? (
          <Cta
            kind="book"
            placement="audience_partner"
            event="cta_audience_partner"
            className="max-sm:w-full"
          />
        ) : features.quiz ? (
          <Cta
            kind="enquire"
            placement="audience_business"
            event="cta_audience_business"
            className="max-sm:w-full"
          />
        ) : (
          // Quiz off: an informational link, not a stand-in for "Tell us what you need"
          <Cta
            kind="exploreExpertise"
            placement="audience_business"
            event="cta_audience_business"
          />
        )}
      </div>
    </article>
  );
}
