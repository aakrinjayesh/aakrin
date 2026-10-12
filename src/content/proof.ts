import type { Fact } from "./types";

// Proof points: metrics, certifications and case studies. Nothing here is
// validated yet, so nothing here renders until its status is set to "confirmed".

export interface Metric extends Fact {
  id: string;
  value: string;
  label: string;
}

export const metrics: readonly Metric[] = [
  {
    id: "projects",
    value: "200+",
    label: "projects",
    status: "unconfirmed",
    note: "docs/07: must be validated before publication.",
  },
  {
    id: "clients",
    value: "80+",
    label: "active clients",
    status: "unconfirmed",
    note: "docs/07: must be validated before publication.",
  },
  {
    id: "certifications",
    value: "14+",
    label: "Salesforce certifications",
    status: "unconfirmed",
    note: "docs/07: must be validated before publication.",
  },
  {
    id: "satisfaction",
    value: "98%",
    label: "client satisfaction",
    status: "unconfirmed",
    note: "docs/07: must be validated before publication. Needs a measurement source.",
  },
];

export interface Certification extends Fact {
  id: string;
  name: string;
}

const LEGACY_CERT = "Listed on the legacy site; not confirmed in the spec.";

export const certifications: readonly Certification[] = [
  {
    id: "application-architect",
    name: "Application Architect",
    status: "unconfirmed",
    note: LEGACY_CERT,
  },
  { id: "data-architect", name: "Data Architect", status: "unconfirmed", note: LEGACY_CERT },
  {
    id: "platform-developer-1",
    name: "Platform Developer I",
    status: "unconfirmed",
    note: LEGACY_CERT,
  },
  {
    id: "platform-developer-2",
    name: "Platform Developer II",
    status: "unconfirmed",
    note: LEGACY_CERT,
  },
  {
    id: "platform-app-builder",
    name: "Platform App Builder",
    status: "unconfirmed",
    note: LEGACY_CERT,
  },
  { id: "administrator", name: "Administrator", status: "unconfirmed", note: LEGACY_CERT },
  {
    id: "field-service-consultant",
    name: "Field Service Consultant",
    status: "unconfirmed",
    note: LEGACY_CERT,
  },
  {
    id: "tableau-crm-consultant",
    name: "Tableau CRM Consultant",
    status: "unconfirmed",
    note: LEGACY_CERT,
  },
];

export interface CaseStudy extends Fact {
  id: string;
  title: string;
  platformIds: readonly string[];
  problem?: string;
  solution?: string;
  outcome?: string;
}

export const caseStudies: readonly CaseStudy[] = [
  {
    id: "service-cloud-support",
    title: "Rebuilding customer support on Service Cloud",
    platformIds: ["service-cloud"],
    status: "unconfirmed",
    note: "docs/07: outcome is only 'a significant rise in customer satisfaction'. Needs measurable outcome and client/permission details.",
  },
];
