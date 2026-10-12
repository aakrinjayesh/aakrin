import Image from "next/image";
import Link from "next/link";
import { Cta } from "@/components/cta/cta";
import { primaryNav } from "@/content/navigation";
import { site } from "@/content/site";
import { Container } from "./container";
import { PrimaryNav } from "./primary-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/92 backdrop-blur-md backdrop-saturate-[1.4]">
      <Container className="relative flex min-h-(--header-h) items-center justify-between gap-6">
        <Link href="/" className="inline-flex py-1.5">
          <Image
            src={site.logo.src}
            width={site.logo.width}
            height={site.logo.height}
            alt={`${site.name} home`}
            priority
            className="h-[34px] w-auto"
          />
        </Link>
        <PrimaryNav
          items={primaryNav}
          // Wide screens: both CTAs inline
          desktopActions={
            <>
              <Cta kind="enquire" placement="header" size="sm" className="whitespace-nowrap" />
              <Cta
                kind="book"
                placement="header"
                event="cta_book_header"
                size="sm"
                className="whitespace-nowrap"
              />
            </>
          }
          // Tablet: the primary CTA stays in the bar; the secondary moves into the menu
          barActions={
            <Cta
              kind="book"
              placement="header"
              event="cta_book_header"
              size="sm"
              className="whitespace-nowrap"
            />
          }
          // Phone: both CTAs live in the menu
          menuActions={
            <>
              <Cta
                kind="book"
                placement="header_menu"
                event="cta_book_header"
                className="sm:hidden"
              />
              <Cta kind="enquire" placement="header_menu" />
            </>
          }
        />
      </Container>
    </header>
  );
}
