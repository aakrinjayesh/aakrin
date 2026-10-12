import { industryOptions } from "@/content/quiz";
import { STATES } from "./geo";
import type { EnquiryField, EnquiryValues } from "./types";

export type EnquiryErrors = Partial<Record<EnquiryField, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[\d\s\-().]{7,20}$/;

export const MESSAGE_MAX_LENGTH = 2000;

/** Field order matters: the first error is focused. */
export function validateEnquiry(values: EnquiryValues): EnquiryErrors {
  const errors: EnquiryErrors = {};
  if (!values.name.trim()) errors.name = "Enter your name.";
  if (!EMAIL.test(values.email.trim())) errors.email = "Enter a valid work email address.";
  // Required: name, email, phone (onboarding decision). Company is optional.
  if (!values.phone.trim()) errors.phone = "Enter your phone number.";
  else if (!PHONE.test(values.phone.trim())) errors.phone = "Enter a valid phone number.";
  // Only exact Industry picklist values may reach Salesforce
  if (values.industry && !industryOptions.some((option) => option.id === values.industry))
    errors.industry = "Choose an industry from the list.";
  if (values.state && !STATES[values.country]?.some((state) => state.code === values.state))
    errors.state = "Choose a state from the list.";
  if (values.message.length > MESSAGE_MAX_LENGTH)
    errors.message = `Keep this under ${MESSAGE_MAX_LENGTH.toLocaleString("en")} characters.`;
  return errors;
}
