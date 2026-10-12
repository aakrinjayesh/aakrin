import { Cta } from "@/components/cta/cta";
import { Section } from "@/components/layout/section";
import { finalCtaSection } from "@/content/home";

/** Closing conversion section: the primary and secondary CTA only. */
export function FinalCta() {
  return (
    <Section tone="ink" aria-labelledby="final-cta-title" className="border-b border-on-dark-line">
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div className="grid max-w-[40rem] gap-4">
          <span aria-hidden="true" className="block h-1 w-12 bg-accent" />
          <h2 id="final-cta-title" className="text-2xl text-on-dark">
            {finalCtaSection.title}
          </h2>
          <p>{finalCtaSection.description}</p>
        </div>
        <div className="flex flex-wrap gap-3 lg:justify-end">
          <Cta kind="book" placement="final" event="cta_final_book" className="max-sm:w-full" />
          <Cta
            kind="enquire"
            placement="final"
            event="cta_final_enquire"
            variant="secondary-on-dark"
            className="max-sm:w-full"
          />
        </div>
      </div>
    </Section>
  );
}
