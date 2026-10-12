import Image from "next/image";
import Link from "next/link";
import { primaryNav } from "@/content/navigation";
import { site } from "@/content/site";
import { Container } from "./container";

const footerLink =
  "text-on-dark-muted no-underline hover:text-on-dark hover:underline hover:underline-offset-[3px]";
const footerHeading =
  "mb-3.5 font-sans text-xs font-semibold tracking-[0.12em] text-on-dark uppercase";

export function SiteFooter() {
  const { address } = site;

  return (
    <footer className="bg-ink pt-14 pb-8 text-sm text-on-dark-muted">
      <Container>
        <div className="grid gap-10 border-b border-on-dark-line pb-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Image
              src={site.logoOnDark.src}
              width={site.logoOnDark.width}
              height={site.logoOnDark.height}
              alt={site.name}
              className="mb-3.5 h-8 w-auto"
            />
            <p className="max-w-[32ch]">
              Salesforce engineering for consulting partners and businesses.
            </p>
          </div>

          <div>
            <h2 className={footerHeading}>Explore</h2>
            <ul className="grid gap-2">
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={footerLink}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className={footerHeading}>Contact</h2>
            <ul className="grid gap-2">
              <li>
                <a href={`mailto:${site.email}`} className={footerLink}>
                  {site.email}
                </a>
              </li>
              <li>
                <a href={site.linkedinUrl} target="_blank" rel="noopener" className={footerLink}>
                  LinkedIn<span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
              <li>
                <a href={site.whatsapp.url} target="_blank" rel="noopener" className={footerLink}>
                  WhatsApp<span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className={footerHeading}>Office</h2>
            <address className="not-italic">
              {address.streetAddress}, {address.locality} {address.postalCode},{" "}
              {address.countryName}
            </address>
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-3 pt-6 text-xs">
          <p>
            © {new Date().getFullYear()} {site.companyName}. All rights reserved.
          </p>
          <a href="#main" className={footerLink}>
            Back to top ↑
          </a>
        </div>
      </Container>
    </footer>
  );
}
