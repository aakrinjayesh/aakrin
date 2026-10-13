import { AudiencePaths } from "@/components/home/audience-paths";
import { ClientLogos } from "@/components/home/client-logos";
import { EnquirySection } from "@/components/home/enquiry-section";
import { ExpertiseSection } from "@/components/home/expertise-section";
import { FinalCta } from "@/components/home/final-cta";
import { Hero } from "@/components/home/hero";
import { HowWeWork } from "@/components/home/how-we-work";
import { IndustriesSection } from "@/components/home/industries-section";
import { QualificationCta } from "@/components/home/qualification-cta";
import { ResultsSection } from "@/components/home/results-section";
import { ServicesSection } from "@/components/home/services-section";
import { WhyAakrin } from "@/components/home/why-aakrin";
import { defaultDescription, defaultTitle, pageMetadata } from "@/lib/seo/metadata";

export const metadata = pageMetadata({
  absoluteTitle: defaultTitle,
  description: defaultDescription,
  path: "/",
});

// Section order follows docs/05-INFORMATION-ARCHITECTURE.md. Header and footer come from the
// root layout. Sections backed by unconfirmed content (Results) or disabled features (the
// qualification quiz) render nothing until they're ready.
export default function HomePage() {
  return (
    <>
      <Hero />
      <AudiencePaths />
      <ClientLogos />
      <ServicesSection />
      <ExpertiseSection />
      <WhyAakrin />
      <IndustriesSection />
      <ResultsSection />
      <HowWeWork />
      <EnquirySection />
      <QualificationCta />
      <FinalCta />
    </>
  );
}
