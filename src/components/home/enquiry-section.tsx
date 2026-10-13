import { EnquiryPanel } from "@/components/enquiry/enquiry-panel";
import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/layout/section-header";
import { enquirySection } from "@/content/home";
import { site } from "@/content/site";
import { webToLeadConfig } from "@/lib/leads/config";

/** The enquiry form, inline on the page, for visitors who'd rather not go through the quiz. */
export function EnquirySection() {
  return (
    <Section id="enquiry" aria-labelledby="enquiry-title">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.35fr] lg:gap-16">
        <SectionHeader
          id="enquiry-title"
          eyebrow={enquirySection.eyebrow}
          title={enquirySection.title}
          description={
            <>
              <p>{enquirySection.description}</p>
              <p className="text-sm text-muted">
                {enquirySection.emailPrompt}{" "}
                <a
                  href={`mailto:${site.email}`}
                  className="font-semibold text-accent-strong underline underline-offset-4"
                >
                  {site.email}
                </a>
              </p>
            </>
          }
          className="mb-0 content-start lg:sticky lg:top-28 lg:self-start"
        />
        <div className="rounded-card border border-line bg-surface p-[clamp(20px,3vw,32px)] shadow-[0_24px_60px_-40px_rgba(22,19,29,0.35)]">
          <EnquiryPanel config={webToLeadConfig()} />
        </div>
      </div>
    </Section>
  );
}
