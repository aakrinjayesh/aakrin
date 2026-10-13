"use client";

import { useRef, useState } from "react";
import { EnquiryForm } from "@/components/enquiry/enquiry-form";
import { buttonClasses } from "@/components/ui/button-styles";
import { enquirySection } from "@/content/home";
import { onboardingCopy, quizCopy } from "@/content/quiz";
import { site } from "@/content/site";
import { track } from "@/lib/analytics";
import type { WebToLeadConfig } from "@/lib/leads/config";
import { emptyEnquiry, type EnquiryValues } from "@/lib/leads/types";

const SOURCE = "home_form";
const PLACEMENT = "home_enquiry";

/** The enquiry form outside the quiz: the form, then a thank-you in its place once sent. */
export function EnquiryPanel({ config }: { config: WebToLeadConfig }) {
  const [values, setValues] = useState<EnquiryValues>(emptyEnquiry);
  const [sent, setSent] = useState(false);
  /** Whether Salesforce accepted the post: null while unknown */
  const [confirmed, setConfirmed] = useState<boolean | null>(null);
  const runRef = useRef(0);
  const doneRef = useRef<HTMLHeadingElement>(null);

  function onSending(sending: Promise<boolean>) {
    const run = ++runRef.current;
    setConfirmed(null);
    setSent(true);
    // The form is replaced by the thank-you: keep focus with the content that replaced it
    requestAnimationFrame(() => doneRef.current?.focus());
    void sending.then((ok) => {
      if (run === runRef.current) setConfirmed(ok);
    });
  }

  function sendAnother() {
    runRef.current++;
    setValues(emptyEnquiry);
    setConfirmed(null);
    setSent(false);
  }

  if (sent) {
    return (
      <div className="grid gap-4" aria-live="polite">
        <div className="flex items-start gap-3.5">
          <svg
            aria-hidden="true"
            viewBox="0 0 52 52"
            className="size-11 shrink-0 text-accent-strong"
          >
            <circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth={3} />
            <path
              d="M15 27l7 7 15-16"
              fill="none"
              stroke="currentColor"
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="grid gap-1.5">
            <h3 ref={doneRef} tabIndex={-1} className="text-xl focus:outline-none">
              {quizCopy.done.title}
            </h3>
            <p>{quizCopy.done.body}</p>
          </div>
        </div>
        {confirmed === false && (
          <p className="text-sm text-muted">
            {onboardingCopy.unconfirmed}{" "}
            <a
              href={`mailto:${site.email}`}
              className="font-semibold text-accent-strong underline underline-offset-4"
            >
              {site.email}
            </a>
            .
          </p>
        )}
        <div>
          <button
            type="button"
            onClick={sendAnother}
            className={buttonClasses({ variant: "secondary", size: "sm" })}
          >
            {enquirySection.sendAnother}
          </button>
        </div>
      </div>
    );
  }

  return (
    <EnquiryForm
      config={config}
      context={{ source: SOURCE, placement: PLACEMENT }}
      values={values}
      onValuesChange={setValues}
      onStarted={() => track("form_started", { placement: PLACEMENT, source: SOURCE })}
      onValidationError={(field) => track("form_validation_error", { placement: PLACEMENT, field })}
      onSubmitAttempt={() => track("form_submitted", { placement: PLACEMENT, source: SOURCE })}
      onSending={onSending}
    />
  );
}
