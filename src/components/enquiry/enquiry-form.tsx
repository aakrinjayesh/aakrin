"use client";

import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { buttonClasses } from "@/components/ui/button-styles";
import { enquiryCopy } from "@/content/enquiry";
import { industryOptions, optionLabel, timingOptions } from "@/content/quiz";
import { cn } from "@/lib/cn";
import { getAttribution } from "@/lib/leads/attribution";
import type { WebToLeadConfig } from "@/lib/leads/config";
import { COUNTRY_CODES, STATES } from "@/lib/leads/geo";
import type { EnquiryField, EnquiryValues, LeadContext } from "@/lib/leads/types";
import { MESSAGE_MAX_LENGTH, validateEnquiry, type EnquiryErrors } from "@/lib/leads/validation";
import {
  buildWebToLeadFields,
  ensureLeadFrame,
  sameOriginReturnUrl,
  submitWebToLead,
} from "@/lib/leads/web-to-lead";

type EnquiryFormProps = {
  config: WebToLeadConfig;
  /** Qualification context; attribution is added at submit time */
  context: Omit<LeadContext, "attribution">;
  /** Values are owned by the parent so they survive Back and close/reopen */
  values: EnquiryValues;
  onValuesChange: (values: EnquiryValues) => void;
  onStarted?: () => void;
  onValidationError?: (field: EnquiryField) => void;
  onSubmitAttempt?: () => void;
  /**
   * Called as soon as a valid enquiry is posted. `sending` resolves true when Salesforce
   * accepted the post (not Lead creation), false when that couldn't be confirmed.
   */
  onSending: (sending: Promise<boolean>) => void;
};

const FIELD_ORDER: EnquiryField[] = [
  "name",
  "email",
  "phone",
  "company",
  "industry",
  "timing",
  "country",
  "state",
  "message",
];

/** Optional select answers that are sent as labelled context (timing). */
function selectContext(options: Parameters<typeof optionLabel>[0], id: string) {
  const label = id ? optionLabel(options, id) : undefined;
  return label ? { id, label } : undefined;
}

export function EnquiryForm({
  config,
  context,
  values,
  onValuesChange,
  onStarted,
  onValidationError,
  onSubmitAttempt,
  onSending,
}: EnquiryFormProps) {
  const id = useId();
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const startedRef = useRef(false);
  // Spam honeypot: invisible to people, often filled in by bots. Never part of the lead.
  const honeypotRef = useRef<HTMLInputElement>(null);

  // Create the hidden frame ahead of time so its initial load can't be mistaken for a response
  useEffect(() => {
    ensureLeadFrame();
  }, []);

  const countries = useMemo(() => {
    let names: Intl.DisplayNames | null = null;
    try {
      names = new Intl.DisplayNames(["en"], { type: "region" });
    } catch {
      names = null;
    }
    return COUNTRY_CODES.map((code) => ({ code, name: names?.of(code) ?? code })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, []);
  const states = STATES[values.country];

  function update(field: EnquiryField, value: string) {
    if (!startedRef.current) {
      startedRef.current = true;
      onStarted?.();
    }
    const next = { ...values, [field]: value };
    if (field === "country") next.state = "";
    onValuesChange(next);
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return; // duplicate-submit guard
    // Honeypot filled: silently drop the submission (no request, no analytics, no message)
    if (honeypotRef.current?.value) return;

    const found = validateEnquiry(values);
    setErrors(found);
    const firstInvalid = FIELD_ORDER.find((field) => found[field]);
    if (firstInvalid) {
      onValidationError?.(firstInvalid);
      document.getElementById(`${id}-${firstInvalid}`)?.focus();
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    onSubmitAttempt?.();
    const post = { ...config, returnUrl: sameOriginReturnUrl(config) };
    const fields = buildWebToLeadFields(post, values, {
      ...context,
      timing: selectContext(timingOptions, values.timing),
      attribution: getAttribution(),
    });
    onSending(submitWebToLead(post, fields));
  }

  const hasErrors = Object.values(errors).some(Boolean);
  const fieldProps = (field: EnquiryField) => ({
    id: `${id}-${field}`,
    name: field,
    value: values[field],
    disabled: submitting,
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `${id}-${field}-error` : undefined,
    className: cn(
      "min-h-12 w-full rounded-lg border-[1.5px] bg-surface px-3.5 py-3 text-base text-ink transition-[border-color,box-shadow] focus:border-ink focus:shadow-[0_0_0_3px_var(--color-accent-tint)] focus:outline-none disabled:opacity-60",
      errors[field] ? "border-[#B42318]" : "border-line",
    ),
  });

  return (
    <form noValidate onSubmit={onSubmit} aria-busy={submitting} className="grid gap-4">
      {hasErrors && (
        <p role="alert" className="rounded-lg bg-[#FDECEA] px-4 py-3 text-sm text-[#8A1C12]">
          {enquiryCopy.errorSummary}
        </p>
      )}

      <div aria-hidden="true" className="sr-only">
        <label htmlFor={`${id}-website`}>Leave this field empty</label>
        <input
          ref={honeypotRef}
          id={`${id}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${id}-name`} label={enquiryCopy.fields.name} error={errors.name} required>
          <input
            {...fieldProps("name")}
            type="text"
            autoComplete="name"
            maxLength={120}
            required
            aria-required
            onChange={(e) => update("name", e.target.value)}
          />
        </Field>
        <Field id={`${id}-email`} label={enquiryCopy.fields.email} error={errors.email} required>
          <input
            {...fieldProps("email")}
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={80}
            required
            aria-required
            onChange={(e) => update("email", e.target.value)}
          />
        </Field>
        <Field id={`${id}-phone`} label={enquiryCopy.fields.phone} error={errors.phone} required>
          <input
            {...fieldProps("phone")}
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            maxLength={40}
            required
            aria-required
            onChange={(e) => update("phone", e.target.value)}
          />
        </Field>
        <Field id={`${id}-company`} label={enquiryCopy.fields.company} error={errors.company}>
          <input
            {...fieldProps("company")}
            type="text"
            autoComplete="organization"
            maxLength={40}
            onChange={(e) => update("company", e.target.value)}
          />
        </Field>
        <Field id={`${id}-industry`} label={enquiryCopy.fields.industry} error={errors.industry}>
          <select {...fieldProps("industry")} onChange={(e) => update("industry", e.target.value)}>
            <option value="">{enquiryCopy.industryPlaceholder}</option>
            {industryOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id={`${id}-timing`} label={enquiryCopy.fields.timing} error={errors.timing}>
          <select {...fieldProps("timing")} onChange={(e) => update("timing", e.target.value)}>
            <option value="">{enquiryCopy.timingPlaceholder}</option>
            {timingOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id={`${id}-country`} label={enquiryCopy.fields.country} error={errors.country}>
          <select
            {...fieldProps("country")}
            autoComplete="country"
            onChange={(e) => update("country", e.target.value)}
          >
            <option value="">{enquiryCopy.countryPlaceholder}</option>
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </Field>
        {states && (
          <Field id={`${id}-state`} label={enquiryCopy.fields.state} error={errors.state}>
            <select
              {...fieldProps("state")}
              autoComplete="address-level1"
              onChange={(e) => update("state", e.target.value)}
            >
              <option value="">{enquiryCopy.statePlaceholder}</option>
              {states.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.name}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      <Field id={`${id}-message`} label={enquiryCopy.fields.message} error={errors.message}>
        <textarea
          {...fieldProps("message")}
          rows={4}
          maxLength={MESSAGE_MAX_LENGTH}
          className={cn(fieldProps("message").className, "min-h-28 resize-y")}
          onChange={(e) => update("message", e.target.value)}
        />
      </Field>

      <button
        type="submit"
        disabled={submitting}
        className={buttonClasses({
          className: "w-full disabled:cursor-progress disabled:opacity-80",
        })}
      >
        {submitting ? enquiryCopy.submitting : enquiryCopy.submit}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="grid content-start gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
        {!required && <span className="font-normal text-muted"> {enquiryCopy.optional}</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-[#B42318]">
          {error}
        </p>
      )}
    </div>
  );
}
