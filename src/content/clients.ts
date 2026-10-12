import type { Fact, ImageAsset } from "./types";

// Client logos (docs/07-HOMEPAGE.md), shown in this order. List, logo files and display
// permission confirmed by the product owner on 2026-10-12; it replaces the earlier list.
// Logo width/height are the files' own dimensions (the viewBox for SVGs).

export interface Client extends Fact {
  id: string;
  name: string;
  logo?: ImageAsset;
}

const CONFIRMED = "Client list, logo and display permission confirmed 2026-10-12.";

export const clients: readonly Client[] = [
  {
    id: "k2-partnering",
    name: "K2 Partnering Solutions",
    status: "confirmed",
    note: CONFIRMED,
    logo: { src: "/clients/k2-partnering.svg", width: 1000, height: 1000 },
  },
  {
    id: "square-one-resources",
    name: "Square One Resources",
    status: "confirmed",
    note: CONFIRMED,
    logo: { src: "/clients/square-one-resources.svg", width: 217, height: 88 },
  },
  {
    id: "absyz",
    name: "Absyz",
    status: "confirmed",
    note: CONFIRMED,
    logo: { src: "/clients/absyz.png", width: 252, height: 121 },
  },
  {
    id: "freedom-consulting",
    name: "Freedom Consulting Inc",
    status: "confirmed",
    note: CONFIRMED,
    logo: { src: "/clients/freedom-consulting.webp", width: 600, height: 161 },
  },
  {
    id: "cloud-analogy",
    name: "Cloud Analogy",
    status: "confirmed",
    note: `${CONFIRMED} The file is a small icon without the name (72x45); a full logo would read better.`,
    logo: { src: "/clients/cloud-analogy.png", width: 72, height: 45 },
  },
  {
    id: "cloud-intellect",
    name: "Cloud Intellect",
    status: "confirmed",
    note: CONFIRMED,
    logo: { src: "/clients/cloud-intellect.png", width: 357, height: 141 },
  },
  {
    id: "hic-global",
    name: "HIC Global Solutions",
    status: "confirmed",
    note: CONFIRMED,
    logo: { src: "/clients/hic-global.svg", width: 1080, height: 574 },
  },
  {
    id: "kloudrac",
    name: "Kloudrac",
    status: "confirmed",
    note: CONFIRMED,
    logo: { src: "/clients/kloudrac.png", width: 290, height: 89 },
  },
  {
    id: "zordial",
    name: "Zordial",
    status: "confirmed",
    note: CONFIRMED,
    logo: { src: "/clients/zordial.png", width: 972, height: 751 },
  },
];
