import { Cta } from "@/components/cta/cta";
import { Section } from "@/components/layout/section";
import { MetaLabel, indexLabel } from "@/components/ui/meta-label";
import { audiences } from "@/content/audiences";
import { hero } from "@/content/home";
import { platforms } from "@/content/platforms";
import { lifecycleStages } from "@/content/services";
import { confirmed } from "@/content/types";
import { cn } from "@/lib/cn";

const HIGHLIGHT = "Salesforce engineering";

export function Hero() {
  const [highlight, rest] = hero.title.startsWith(HIGHLIGHT)
    ? [HIGHLIGHT, hero.title.slice(HIGHLIGHT.length)]
    : ["", hero.title];

  return (
    <Section
      tone="surface"
      aria-labelledby="hero-title"
      className="border-t-0 py-[clamp(48px,7vw,104px)]"
      containerClassName="grid items-center gap-[clamp(40px,5vw,72px)] lg:grid-cols-[1.1fr_1fr]"
    >
      <div className="grid min-w-0 gap-6">
        <MetaLabel as="p" tone="accent">
          {hero.eyebrow}
        </MetaLabel>
        <h1 id="hero-title" className="text-hero">
          {highlight && <span className="text-accent-strong">{highlight}</span>}
          {rest}
        </h1>
        <p className="max-w-[36em] text-lg leading-[1.55]">{hero.lede}</p>
        <div className="flex flex-wrap gap-3">
          <Cta kind="book" placement="hero" event="cta_book_hero" className="max-sm:w-full" />
          <Cta kind="enquire" placement="hero" event="cta_enquire_hero" className="max-sm:w-full" />
        </div>
      </div>
      <CapabilityMap />
    </Section>
  );
}

/** A compact, factual summary of what Aakrin covers: platforms, lifecycle and audiences. */
function CapabilityMap() {
  const rows = [
    {
      label: hero.map.platforms,
      content: (
        <ul className="flex flex-wrap gap-1.5">
          {confirmed(platforms).map((platform) => (
            <li
              key={platform.id}
              className={cn(
                "rounded-md border px-2 py-1 text-xs font-medium",
                platform.group === "data-ai"
                  ? "border-accent/40 bg-accent-tint text-accent-hover"
                  : "border-line bg-surface text-ink",
              )}
            >
              {platform.name}
            </li>
          ))}
        </ul>
      ),
    },
    {
      label: hero.map.lifecycle,
      content: (
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-[0.8125rem] text-ink">
          {lifecycleStages.map((stage, i) => (
            <li key={stage.id} className="flex items-center gap-1.5">
              {stage.label}
              {i < lifecycleStages.length - 1 && (
                <span aria-hidden="true" className="text-accent">
                  →
                </span>
              )}
            </li>
          ))}
        </ol>
      ),
    },
    {
      label: hero.map.audiences,
      content: (
        <ul className="grid gap-1.5 text-sm text-ink">
          {audiences.map((audience, i) => (
            <li key={audience.id} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={cn("size-2 rounded-[2px]", i === 0 ? "bg-accent" : "bg-muted/50")}
              />
              {audience.label}
            </li>
          ))}
        </ul>
      ),
    },
  ];

  return (
    <aside
      aria-label={hero.map.label}
      className="min-w-0 rounded-card border border-line bg-canvas p-5 sm:p-7"
    >
      <div className="mb-5 flex items-center justify-between gap-4 border-b border-line pb-4">
        <MetaLabel tone="muted">{hero.map.label}</MetaLabel>
        <span aria-hidden="true" className="flex gap-1">
          <span className="size-1.5 rounded-full bg-line" />
          <span className="size-1.5 rounded-full bg-line" />
          <span className="size-1.5 rounded-full bg-accent" />
        </span>
      </div>
      <ol className="relative grid gap-6 before:absolute before:top-2 before:bottom-2 before:left-[5px] before:w-px before:bg-line">
        {rows.map((row, i) => (
          <li key={row.label} className="relative grid gap-2.5 pl-7">
            <span
              aria-hidden="true"
              className="absolute top-[3px] left-0 size-[11px] rounded-full border-2 border-accent bg-canvas"
            />
            <MetaLabel>
              {indexLabel(i)} / {row.label}
            </MetaLabel>
            {row.content}
          </li>
        ))}
      </ol>
    </aside>
  );
}
