import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import { AnalyticsScripts } from "@/components/analytics/analytics-scripts";
import { AttributionCapture } from "@/components/analytics/attribution-capture";
import { ClickTracker } from "@/components/analytics/click-tracker";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Onboarding } from "@/components/onboarding/onboarding";
import { onboardingPrePaintScript } from "@/components/onboarding/storage";
import { JsonLd } from "@/components/seo/json-ld";
import { site } from "@/content/site";
import { env } from "@/lib/env";
import { features } from "@/lib/features";
import { webToLeadConfig } from "@/lib/leads/config";
import { defaultDescription, defaultTitle } from "@/lib/seo/metadata";
import { organizationJsonLd } from "@/lib/seo/structured-data";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-bricolage",
});

const body = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: { default: defaultTitle, template: `%s | ${site.name}` },
  description: defaultDescription,
  applicationName: site.name,
  icons: { icon: "/favicon.svg" },
  robots: env.allowIndexing ? { index: true, follow: true } : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#16131D",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the pre-paint script may add the onboarding class to <html>
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      {features.quiz && (
        <head>
          {/* Runs before first paint: decides whether the onboarding opens on load (every
              visit to "/", /start, ?onboarding=1) so the homepage never flashes behind it */}
          <script dangerouslySetInnerHTML={{ __html: onboardingPrePaintScript }} />
        </head>
      )}
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="absolute -top-24 left-4 z-[100] rounded-md bg-ink px-4 py-2.5 text-on-dark no-underline focus:top-3"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <JsonLd data={organizationJsonLd()} />
        <ClickTracker />
        <AnalyticsScripts />
        {features.quiz && (
          <>
            <AttributionCapture />
            <Onboarding config={webToLeadConfig()} />
          </>
        )}
      </body>
    </html>
  );
}
