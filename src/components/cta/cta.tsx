import Link from "next/link";
import { ctas, type ContextualCtaKey } from "@/content/ctas";
import { site } from "@/content/site";
import { trackAttributes, type AnalyticsEvent } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { features } from "@/lib/features";
import {
  buttonClasses,
  linkArrowClasses,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/ui/button-styles";
import { EnquireButton } from "./enquire-button";

type CtaEvent = Extract<AnalyticsEvent, `cta_${string}`>;

/** Where a CTA sits. Also sent to Calendly as utm_medium and to analytics as `placement`. */
export type CtaPlacement =
  | "header"
  | "header_menu"
  | "hero"
  | "audience_partner"
  | "audience_business"
  | "qualification"
  | "final";

type CommonProps = {
  className?: string;
};

type BookProps = CommonProps & {
  kind: "book";
  placement: CtaPlacement;
  event: CtaEvent;
  size?: ButtonSize;
  variant?: Extract<ButtonVariant, "primary">;
};

type EnquireProps = CommonProps & {
  kind: "enquire";
  placement: CtaPlacement;
  /**
   * Spec CTA event for this placement, where docs/10 defines one (hero, final).
   * Placements without one (e.g. the header) rely on quiz_open, which records the placement.
   */
  event?: CtaEvent;
  size?: ButtonSize;
  variant?: Exclude<ButtonVariant, "primary">;
};

type ContextualProps = CommonProps & {
  kind: ContextualCtaKey;
  /** Optional spec CTA event, for contextual links that stand in for a path's action. */
  event?: CtaEvent;
  placement?: CtaPlacement;
};

export type CtaProps = BookProps | EnquireProps | ContextualProps;

export function calendlyUrl(placement: CtaPlacement): string {
  const url = new URL(site.calendlyUrl);
  url.searchParams.set("utm_source", "website");
  url.searchParams.set("utm_medium", placement);
  return url.toString();
}

/**
 * The only way to render a CTA. Labels and destinations come from content/ctas.ts,
 * so the hierarchy stays consistent across the site:
 * - "book": primary, "Book a Salesforce Consultation", opens Calendly in a new tab
 * - "enquire": secondary, "Tell us what you need", opens the quiz (hidden until it exists)
 * - contextual keys: arrow links such as "Explore services"
 */
export function Cta(props: CtaProps) {
  if (props.kind === "book") {
    const { placement, event, size, className } = props;
    return (
      <a
        href={calendlyUrl(placement)}
        target="_blank"
        rel="noopener"
        className={buttonClasses({ variant: "primary", size, className })}
        {...trackAttributes(event, { placement, booking: true })}
      >
        {ctas.book.label}
        <span className="sr-only"> (opens Calendly in a new tab)</span>
      </a>
    );
  }

  if (props.kind === "enquire") {
    if (!features.quiz) return null;
    const { placement, event, size, variant = "secondary", className } = props;
    return (
      <EnquireButton
        placement={placement}
        event={event}
        className={buttonClasses({ variant, size, className })}
      >
        {ctas.enquire.label}
      </EnquireButton>
    );
  }

  const cta = ctas[props.kind];
  return (
    <Link
      href={cta.href}
      className={cn(linkArrowClasses, props.className)}
      {...(props.event ? trackAttributes(props.event, { placement: props.placement }) : {})}
    >
      {cta.label}
      <span
        aria-hidden="true"
        className="transition-transform duration-200 ease-(--ease-out) group-hover:translate-x-1"
      >
        →
      </span>
    </Link>
  );
}
