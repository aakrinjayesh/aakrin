import Image from "next/image";
import { Section } from "@/components/layout/section";
import { clients } from "@/content/clients";
import { trustSection } from "@/content/home";
import { confirmed } from "@/content/types";

/** Confirmed client logos only. Logos are not links, so they have no hover state. */
export function ClientLogos() {
  const logos = confirmed(clients).filter((client) => client.logo);
  if (logos.length === 0) return null;

  return (
    <Section tone="surface" spacing="compact" aria-labelledby="clients-title">
      <h2
        id="clients-title"
        className="mb-6 text-center font-sans text-sm font-medium tracking-normal text-muted"
      >
        {trustSection.title}
      </h2>
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
        {logos.map((client) => (
          <li
            key={client.id}
            // White tiles: several logo files have baked-in white backgrounds
            className="flex h-20 items-center justify-center rounded-lg border border-line bg-surface px-4 py-3"
          >
            <Image
              src={client.logo!.src}
              width={client.logo!.width}
              height={client.logo!.height}
              alt={client.name}
              sizes="140px"
              // Same bounding box for every logo so wide and square marks read at a similar weight
              className="h-auto max-h-14 w-auto max-w-[min(100%,140px)] object-contain opacity-85 grayscale"
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
