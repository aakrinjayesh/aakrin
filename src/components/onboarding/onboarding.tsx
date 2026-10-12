"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { OPEN_QUIZ_EVENT, type OpenQuizDetail } from "@/components/cta/enquire-button";
import { EnquiryForm } from "@/components/enquiry/enquiry-form";
import { ChoiceGroup } from "@/components/quiz/choice-group";
import { buttonClasses } from "@/components/ui/button-styles";
import { MetaLabel } from "@/components/ui/meta-label";
import {
  findSituation,
  onboardingCopy,
  quizCopy,
  quizSteps,
  requirementsFor,
  situations,
} from "@/content/quiz";
import { site } from "@/content/site";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import type { WebToLeadConfig } from "@/lib/leads/config";
import { emptyEnquiry, type EnquiryField, type EnquiryValues } from "@/lib/leads/types";
import { NovaAvatar, PlaneBack, PlaneFront } from "./nova-avatar";
import { NovaEngine, type StagePhase } from "./nova-engine";
import { NovaVoice } from "./nova-voice";
import { ONBOARDING_PENDING_CLASS, ONBOARDING_SEEN_KEY, ONBOARDING_SOUND_KEY } from "./storage";

type Phase = StagePhase;
const STEP_OF: Partial<Record<Phase, 1 | 2 | 3>> = { q1: 1, q2: 2, q3: 3 };
const QUESTION: Record<"q1" | "q2" | "q3", string> = {
  q1: quizCopy.situation.title,
  q2: quizCopy.requirement.title,
  q3: quizCopy.details.title,
};
const FORM_FIELDS: EnquiryField[] = [
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

/** Conversation pacing, in one place so it is easy to tune. */
const PACE = {
  /** Typing speed per character */
  typeMs: 40,
  /** Extra pause after , . ? ! while typing */
  punctuationMs: 260,
  /** Reading time per word that a self-advancing line stays on screen after typing */
  readMsPerWord: 150,
  /** Minimum reading time for a self-advancing line */
  minReadMs: 1200,
  /** Beat after Nova finishes speaking before the next line */
  afterSpeechMs: 400,
  /** How long a picked answer stays on screen (its tick pops) before the card moves on */
  pickMs: 380,
};
const readingTime = (text: string) =>
  Math.max(PACE.minReadMs, text.trim().split(/\s+/).length * PACE.readMsPerWord);

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage blocked: the onboarding may show again on the next visit
  }
}

/**
 * Full-screen onboarding with Nova (the qualification quiz): situation → requirement →
 * enquiry form. Shown automatically on every visit to "/" (decided before first paint by
 * the inline script in the root layout), at /start, and from "Tell us what you need".
 * "Skip & explore" is always available.
 *
 * This component owns the conversation; Nova's movement on the stage lives in NovaEngine.
 */
export function Onboarding({ config }: { config: WebToLeadConfig }) {
  const router = useRouter();
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const flyerRef = useRef<HTMLDivElement>(null);
  const agentRef = useRef<HTMLDivElement>(null);
  const planeBackRef = useRef<SVGSVGElement>(null);
  const planeFrontRef = useRef<SVGSVGElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const soundButtonRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const engineRef = useRef<NovaEngine | null>(null);
  const voiceRef = useRef<NovaVoice | null>(null);
  const runRef = useRef(0);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const busyRef = useRef(false);
  const openRef = useRef(false);
  /** The tap that unlocked speech landed on the sound button: it shouldn't also mute */
  const ignoreSoundClickRef = useRef(false);
  const headingId = useId();
  const hintId = useId();

  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [phase, setPhaseState] = useState<Phase>("intro");
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [typed, setTyped] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [ready, setReady] = useState(false);
  const [talking, setTalking] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [needsTap, setNeedsTap] = useState(false);
  const [placement, setPlacement] = useState("");
  const [situationId, setSituationId] = useState<string>();
  const [requirementId, setRequirementId] = useState<string>();
  const [values, setValues] = useState<EnquiryValues>(emptyEnquiry);
  /** Whether Salesforce accepted the post: null while unknown */
  const [confirmed, setConfirmed] = useState<boolean | null>(null);

  const situation = findSituation(situationId);
  const requirementOptions = requirementsFor(situationId);
  const requirement = requirementOptions.find((option) => option.id === requirementId);
  const step = STEP_OF[phase];
  /** Progress segments filled: the current step, or all three once done */
  const progress = phase === "done" ? quizSteps.length : (step ?? 0);

  /** Moves the conversation to a step; Nova's engine follows it (glasses, idle timer). */
  const enterPhase = useCallback((next: Phase) => {
    setPhaseState(next);
    const engine = engineRef.current;
    if (engine) {
      engine.phase = next;
      engine.touch();
    }
  }, []);

  /** Cancels whatever sequence is running (Back, Replay, Start over, close) */
  const newRun = useCallback(() => {
    engineRef.current?.newRun();
    return ++runRef.current;
  }, []);

  /** A wait that holds while the tab is hidden, like Nova's own animations */
  const wait = useCallback(
    (ms: number) =>
      engineRef.current?.wait(ms) ?? new Promise<void>((resolve) => window.setTimeout(resolve, ms)),
    [],
  );

  // ---------- Engine + voice ----------
  useEffect(() => {
    const els = {
      stage: stageRef.current,
      flyer: flyerRef.current,
      agent: agentRef.current,
      planeBack: planeBackRef.current,
      planeFront: planeFrontRef.current,
      trail: trailRef.current,
      shadow: shadowRef.current,
      canvas: canvasRef.current,
      card: cardRef.current,
    };
    if (Object.values(els).some((el) => !el)) return;
    const engine = new NovaEngine({
      ...(els as { [K in keyof typeof els]: NonNullable<(typeof els)[K]> }),
      sky: skyRef.current ?? undefined,
      avoid: () =>
        [...(navRef.current?.querySelectorAll("button") ?? [])].map((b) =>
          b.getBoundingClientRect(),
        ),
    });
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const voice = new NovaVoice(
      readStorage(ONBOARDING_SOUND_KEY) !== "off",
      setTalking,
      setNeedsTap,
    );
    voiceRef.current = voice;
    // The visitor's first click/tap or key press allows speech. Capture phase, so it runs before
    // the button's own handler. Answers, Back, Replay etc. move Nova on to a new line themselves,
    // so the held-back line is only replayed for other taps (or the sound button).
    const unlock = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key === "Escape") return;
      const target = event.target instanceof Element ? event.target : null;
      const onSound = !!target && !!soundButtonRef.current?.contains(target);
      if (onSound && voice.waiting) ignoreSoundClickRef.current = true;
      const movesOn =
        !onSound &&
        !!target?.closest("dialog button, dialog a, dialog input, dialog select, dialog textarea");
      voice.unlock(openRef.current && !movesOn);
    };
    document.addEventListener("pointerdown", unlock, true);
    document.addEventListener("keydown", unlock, true);
    return () => {
      document.removeEventListener("pointerdown", unlock, true);
      document.removeEventListener("keydown", unlock, true);
      voice.dispose();
    };
  }, []);

  function toggleSound() {
    if (ignoreSoundClickRef.current) {
      // This tap only switched speech on
      ignoreSoundClickRef.current = false;
      return;
    }
    const next = !soundOn;
    setSoundOn(next);
    writeStorage(ONBOARDING_SOUND_KEY, next ? "on" : "off");
    const voice = voiceRef.current;
    if (!voice) return;
    voice.enabled = next;
    if (next) voice.repeat();
    else voice.stop();
  }

  // ---------- Modal + scroll lock ----------
  useEffect(() => {
    openRef.current = open;
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Start focus on the dialog itself (not the first button) until a question is ready
      dialog.focus();
    }
    if (!open && dialog.open) dialog.close();
    document.documentElement.style.overflow = open ? "hidden" : "";
    // The pre-paint cover can go once the dialog itself is showing
    if (open) document.documentElement.classList.remove(ONBOARDING_PENDING_CLASS);
  }, [open]);

  // Focus the message heading whenever a step (or the confirmation) is ready
  useEffect(() => {
    if (open && ready && (step || phase === "done"))
      headingRef.current?.focus({ preventScroll: true });
  }, [open, ready, step, phase]);

  /** Resolves once the dialog is showing and the stage has real dimensions to measure. */
  const waitForStage = useCallback(async () => {
    for (let i = 0; i < 20; i++) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      if (dialogRef.current?.open && (stageRef.current?.offsetWidth ?? 0) > 0) return;
    }
  }, []);

  // ---------- Talking: typing + voice ----------
  /**
   * Types a line into the bubble and speaks it. Resolves false if the run was superseded.
   * Lines that Nova follows up on her own (greeting, replies) pass `untilSpoken`, so the next
   * line never cuts the speech off mid-sentence. Questions return once typed, so the answers
   * appear straight away; answering interrupts the speech, which is the visitor's choice.
   */
  const say = useCallback(
    async (text: string, run: number, { announce = false, untilSpoken = false } = {}) => {
      setMessage(text);
      setTyped("");
      if (announce) setAnnouncement(text);
      if (cardRef.current) cardRef.current.scrollTop = 0;
      const speech = voiceRef.current?.speak(text) ?? Promise.resolve();
      if (engineRef.current?.reduced ?? true) {
        setTyped(text);
      } else {
        const chars = Array.from(text);
        for (let i = 0; i < chars.length; i++) {
          if (run !== runRef.current) return false;
          setTyped(chars.slice(0, i + 1).join(""));
          await wait(/[,.?!]/.test(chars[i]) ? PACE.punctuationMs : PACE.typeMs);
        }
      }
      // Self-advancing lines stay up until they are both read and fully spoken. `speech`
      // resolves when speech ends, is stopped (skip/close/mute), fails, or times out.
      if (untilSpoken) {
        await Promise.all([speech.then(() => wait(PACE.afterSpeechMs)), wait(readingTime(text))]);
      }
      return run === runRef.current;
    },
    [wait],
  );

  /** Shows a step's question instantly, with Nova already in place (Back, resuming). */
  const showInstant = useCallback(
    (next: "q1" | "q2" | "q3") => {
      voiceRef.current?.stop();
      enterPhase(next);
      setMessage(QUESTION[next]);
      setTyped(QUESTION[next]);
      setReady(true);
      const engine = engineRef.current;
      if (!engine) return;
      if (next === "q1") engine.placeRoaming();
      else if (next === "q2") engine.placeSeated();
      else engine.placeCracker();
    },
    [enterPhase],
  );

  const askSituation = useCallback(
    async (run: number) => {
      enterPhase("q1");
      setReady(false);
      // Question 1: Nova roams freely while the visitor reads
      engineRef.current?.startRoam();
      if (await say(quizCopy.situation.title, run)) setReady(true);
    },
    [enterPhase, say],
  );

  const runFlow = useCallback(
    async (run: number, intro: boolean) => {
      setBubbleVisible(false);
      setReady(false);
      setMessage("");
      setTyped("");
      enterPhase("intro");
      engineRef.current?.hideFlyer();
      await waitForStage();
      const engine = engineRef.current;
      if (run !== runRef.current || !engine) return;
      engine.start();
      if (intro && !engine.reduced) {
        if (!(await engine.playIntro())) return;
      } else {
        engine.placeLanded();
      }
      if (run !== runRef.current) return;
      // Greeting: Nova holds up a "Welcome to Aakrin!" sign and waves while saying hello
      engine.setMood("sign");
      enterPhase("greeting");
      setBubbleVisible(true);
      await wait(intro ? 350 : 150);
      if (run !== runRef.current) return;
      if (!(await say(onboardingCopy.greeting, run, { announce: true, untilSpoken: true }))) return;
      await wait(250);
      if (run !== runRef.current) return;
      await askSituation(run);
    },
    [askSituation, enterPhase, say, wait, waitForStage],
  );

  /** Reopened part-way through: picks up where the visitor left off, Nova already in place */
  const resume = useCallback(
    async (run: number, at: "q1" | "q2" | "q3") => {
      await waitForStage();
      const engine = engineRef.current;
      if (run !== runRef.current || !engine) return;
      engine.start();
      engine.placeLanded();
      setBubbleVisible(true);
      showInstant(at);
    },
    [showInstant, waitForStage],
  );

  // ---------- Open / close ----------
  const openOnboarding = useCallback(
    (from: string, { replay = false, pageLoad = false } = {}) => {
      if (!replay) returnFocusRef.current = (document.activeElement as HTMLElement | null) ?? null;
      const soundEnabled = readStorage(ONBOARDING_SOUND_KEY) !== "off";
      setSoundOn(soundEnabled);
      if (voiceRef.current) voiceRef.current.enabled = soundEnabled;
      voiceRef.current?.stop();
      const run = newRun();
      busyRef.current = false;
      const seen = readStorage(ONBOARDING_SEEN_KEY) !== null;
      setPlacement(from);
      setLeaving(false);
      setOpen(true);
      if (!replay) track("quiz_open", { placement: from });

      if (!replay && (phase === "q1" || phase === "q2" || phase === "q3")) {
        void resume(run, phase);
        return;
      }
      setSituationId(undefined);
      setRequirementId(undefined);
      setValues(emptyEnquiry);
      setConfirmed(null);
      // The full fly-in on every page load and replay; reopening from a button later in the
      // visit, Nova is already standing
      void runFlow(run, replay || pageLoad || !seen);
    },
    [newRun, phase, resume, runFlow],
  );

  // Open on every visit to "/" and at /start (flagged before first paint), and from CTAs
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;
    if (root.classList.contains(ONBOARDING_PENDING_CLASS)) {
      const from = /[?&]onboarding=1/.test(window.location.search)
        ? "url"
        : window.location.pathname === "/start"
          ? "start_page"
          : "page_load";
      frame = requestAnimationFrame(() => openOnboarding(from, { pageLoad: true }));
    }
    return () => cancelAnimationFrame(frame);
    // Once, on first load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onOpen = (event: Event) =>
      openOnboarding((event as CustomEvent<OpenQuizDetail>).detail.placement);
    window.addEventListener(OPEN_QUIZ_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_QUIZ_EVENT, onOpen);
  }, [openOnboarding]);

  function close() {
    if (phase === "intro" || phase === "greeting" || phase === "q1")
      track("quiz_abandoned_question_1", { placement });
    if (phase === "q2") track("quiz_abandoned_question_2", { placement, situation: situationId });
    newRun();
    busyRef.current = false;
    voiceRef.current?.stop();
    engineRef.current?.stop();
    writeStorage(ONBOARDING_SEEN_KEY, "1");
    // Interrupted before the first question, or finished: start fresh next time
    if (phase === "intro" || phase === "greeting" || phase === "done") enterPhase("intro");
    setOpen(false);
    setLeaving(false);
    if (pathname === "/start") router.push("/");
    else returnFocusRef.current?.focus?.();
  }

  function replay() {
    voiceRef.current?.stop();
    openOnboarding(placement, { replay: true });
  }

  // ---------- Answers ----------
  async function chooseSituation(id: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    const engine = engineRef.current;
    if (engine) engine.busy = true;
    const run = runRef.current;
    const picked = findSituation(id);
    // Each problem has its own step 2 list, so a different problem clears the step 2 answer
    if (id !== situationId) setRequirementId(undefined);
    setSituationId(id);
    track("quiz_question_1", { placement, situation: id });
    // Nova heads off for the ladder straight away and climbs while replying and while the next
    // question is typed; the answers appear once he is sitting on the card
    const seating = engine?.climbToSeat() ?? Promise.resolve();
    // The picked answer shows its tick for a moment before the card moves on
    await wait(PACE.pickMs);
    if (run !== runRef.current) {
      if (engine) engine.busy = false;
      return;
    }
    setReady(false);
    voiceRef.current?.stop();
    if (picked && (await say(picked.ack, run, { announce: true, untilSpoken: true }))) {
      await wait(300);
      if (run === runRef.current) {
        enterPhase("q2");
        const typedOut = await say(quizCopy.requirement.title, run);
        await seating;
        if (typedOut && run === runRef.current) setReady(true);
      }
    }
    if (run === runRef.current) busyRef.current = false;
    if (engine) engine.busy = false;
  }

  async function chooseRequirement(id: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    const engine = engineRef.current;
    if (engine) engine.busy = true;
    const run = runRef.current;
    setRequirementId(id);
    track("quiz_question_2", { placement, situation: situationId, requirement: id });
    // Fist pump on the card, then a parachute float down; he sets up the cracker on the ground
    const landing = engine?.floatDownAndPrepare() ?? Promise.resolve();
    await wait(PACE.pickMs);
    if (run !== runRef.current) {
      if (engine) engine.busy = false;
      return;
    }
    setReady(false);
    voiceRef.current?.stop();
    if (await say(onboardingCopy.requirementAck, run, { announce: true, untilSpoken: true })) {
      await Promise.all([wait(250), landing]);
      if (run === runRef.current) {
        enterPhase("q3");
        track("quiz_contact_step", { placement, situation: situationId, requirement: id });
        if (await say(quizCopy.details.title, run)) setReady(true);
      }
    }
    if (run === runRef.current) busyRef.current = false;
    if (engine) engine.busy = false;
  }

  function goBack() {
    newRun();
    busyRef.current = false;
    if (phase === "q2") showInstant("q1");
    if (phase === "q3") showInstant("q2");
  }

  function onValuesChange(next: EnquiryValues) {
    setValues(next);
    engineRef.current?.fieldsChanged(FORM_FIELDS.filter((field) => next[field].trim()).length);
  }

  /** A valid enquiry was posted: Nova lights the cracker straight away, whatever Salesforce replies. */
  async function onSending(sending: Promise<boolean>) {
    const run = runRef.current;
    const engine = engineRef.current;
    writeStorage(ONBOARDING_SEEN_KEY, "1");
    setConfirmed(null);
    void sending.then((ok) => {
      if (run === runRef.current) setConfirmed(ok);
    });
    setReady(false);
    if (engine && !engine.reduced) {
      setBubbleVisible(false);
      if (!(await engine.lightCracker()) || run !== runRef.current) return;
    }
    enterPhase("done");
    engine?.setMood("celebrate");
    setBubbleVisible(true);
    // Website completion only: the confirmation is shown. Not Salesforce Lead creation.
    if (openRef.current)
      track("quiz_completed", { placement, situation: situationId, requirement: requirementId });
    if (await say(quizCopy.done.title, run)) setReady(true);
  }

  /** "Explore the website": Nova says goodbye and flies off, then the overlay closes. */
  async function exploreSite() {
    const run = runRef.current;
    const engine = engineRef.current;
    voiceRef.current?.stop();
    if (engine && !engine.reduced) {
      setReady(false);
      setBubbleVisible(false);
      await engine.flyAway({
        onGoodbye: () => {
          setAnnouncement(onboardingCopy.goodbye);
          void voiceRef.current?.speak(onboardingCopy.goodbye);
        },
        onLeaving: () => setLeaving(true),
      });
      if (run !== runRef.current) return;
    }
    close();
  }

  function startOver() {
    const run = newRun();
    voiceRef.current?.stop();
    engineRef.current?.clearCelebration();
    setSituationId(undefined);
    setRequirementId(undefined);
    setValues(emptyEnquiry);
    setConfirmed(null);
    void askSituation(run);
  }

  // ---------- Render ----------
  let body: ReactNode = null;
  if (ready && phase === "q1") {
    body = (
      <>
        <p id={hintId} className="text-sm text-muted">
          {quizCopy.situation.hint}
        </p>
        <ChoiceGroup
          layout="list"
          labelledBy={headingId}
          describedBy={hintId}
          options={situations}
          value={situationId}
          onSelect={chooseSituation}
        />
      </>
    );
  } else if (ready && phase === "q2") {
    body = (
      <>
        <p id={hintId} className="text-sm text-muted">
          {quizCopy.requirement.hint}
        </p>
        <ChoiceGroup
          layout="list"
          labelledBy={headingId}
          describedBy={hintId}
          options={requirementOptions}
          value={requirementId}
          onSelect={chooseRequirement}
        />
      </>
    );
  } else if (ready && phase === "q3") {
    body = (
      <>
        {situation && requirement && (
          <div className="grid gap-2.5 rounded-lg bg-canvas p-4">
            <MetaLabel as="p">{quizCopy.details.answersLabel}</MetaLabel>
            <ul className="flex flex-wrap gap-1.5 text-xs font-medium text-ink">
              <li className="rounded-md border border-line bg-surface px-2.5 py-1">
                {situation.label}
              </li>
              <li className="rounded-md border border-line bg-surface px-2.5 py-1">
                {requirement.label}
              </li>
            </ul>
            <p className="text-sm text-ink">
              {requirement.summary
                ? quizCopy.details.recommendation(requirement.summary)
                : quizCopy.details.somethingElse}
            </p>
          </div>
        )}
        <p className="text-sm text-muted">{quizCopy.details.hint}</p>
        <EnquiryForm
          config={config}
          context={{
            source: "quiz",
            placement,
            situation: situation && { id: situation.id, label: situation.label },
            requirement: requirement && { id: requirement.id, label: requirement.label },
          }}
          values={values}
          onValuesChange={onValuesChange}
          onStarted={() =>
            track("quiz_form_started", {
              placement,
              situation: situationId,
              requirement: requirementId,
            })
          }
          onValidationError={(field) => {
            track("form_validation_error", { placement, field });
            engineRef.current?.reactToError();
          }}
          onSubmitAttempt={() =>
            track("quiz_form_submitted", {
              placement,
              situation: situationId,
              requirement: requirementId,
            })
          }
          onSending={onSending}
        />
      </>
    );
  } else if (ready && phase === "done") {
    body = (
      <>
        <div className="flex items-start gap-3.5">
          <svg
            aria-hidden="true"
            viewBox="0 0 52 52"
            className="onb-check size-11 shrink-0 text-accent-strong"
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
          <p>{quizCopy.done.body}</p>
        </div>
        {situation && requirement && (
          <div className="grid gap-2">
            <MetaLabel as="p">{quizCopy.details.answersLabel}</MetaLabel>
            <ul className="flex flex-wrap gap-1.5 text-xs font-medium text-ink">
              <li className="rounded-md border border-line bg-canvas px-2.5 py-1">
                {situation.label}
              </li>
              <li className="rounded-md border border-line bg-canvas px-2.5 py-1">
                {requirement.label}
              </li>
            </ul>
          </div>
        )}
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
        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="button"
            onClick={exploreSite}
            className={buttonClasses({ className: "max-sm:w-full" })}
          >
            {onboardingCopy.exploreSite}
          </button>
          <button
            type="button"
            onClick={startOver}
            className={buttonClasses({ variant: "secondary", className: "max-sm:w-full" })}
          >
            {onboardingCopy.startOver}
          </button>
        </div>
      </>
    );
  }

  const showExploreLink = phase === "greeting" || phase === "q1" || phase === "q2";
  const iconButton =
    "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-ink hover:border-ink";

  return (
    <>
      {/* Pre-paint cover: hides the homepage on load until the dialog is showing */}
      <div aria-hidden="true" className="onb-cover fixed inset-0 z-[90] hidden" />

      <dialog
        ref={dialogRef}
        tabIndex={-1}
        aria-labelledby={headingId}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        className={cn(
          "onb-dialog m-0 h-dvh max-h-none w-full max-w-none overflow-hidden p-0 text-body backdrop:bg-transparent focus:outline-none",
          leaving && "onb-leaving",
        )}
      >
        <div ref={stageRef} className="onb-sky relative h-full overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div ref={skyRef} className="absolute -inset-8">
              <span className="nova-cloud nova-c1" />
              <span className="nova-cloud nova-c2" />
              <span className="nova-cloud nova-c3" />
              <span className="nova-cloud nova-c4" />
            </div>
          </div>

          <header className="relative z-40 mx-auto flex w-full max-w-site items-center justify-between gap-3 px-(--gutter) py-3">
            <Image
              src={site.logo.src}
              width={site.logo.width}
              height={site.logo.height}
              alt={site.name}
              className="h-7 w-auto sm:h-8"
            />
            <div ref={navRef} className="flex items-center gap-2">
              <button
                ref={soundButtonRef}
                type="button"
                onClick={toggleSound}
                aria-pressed={soundOn}
                className={cn(
                  iconButton,
                  needsTap &&
                    soundOn &&
                    "onb-tap border-accent-strong bg-accent-strong text-white hover:border-accent-strong",
                )}
              >
                <span aria-hidden="true">{soundOn ? "🔊" : "🔇"}</span>
                {needsTap && soundOn ? (
                  <span className="max-sm:sr-only">{onboardingCopy.tapToHear}</span>
                ) : (
                  <span className="sr-only">{onboardingCopy.sound}</span>
                )}
              </button>
              <button type="button" onClick={replay} className={iconButton}>
                <span aria-hidden="true">↻</span>
                <span className="max-sm:sr-only">{onboardingCopy.replay}</span>
              </button>
              <button
                type="button"
                onClick={close}
                aria-label={onboardingCopy.skip}
                className={buttonClasses({
                  variant: "secondary",
                  size: "sm",
                  className: "bg-surface whitespace-nowrap",
                })}
              >
                <span className="sm:hidden">Skip</span>
                <span className="max-sm:hidden">{onboardingCopy.skip}</span>
              </button>
            </div>
          </header>

          <canvas ref={canvasRef} aria-hidden="true" className="nova-fireworks" />

          {/* Stage: Nova and the paper plane (positioned by the engine) */}
          <div ref={flyerRef} aria-hidden="true" className="nova-flyer">
            <div ref={shadowRef} className="nova-shadow" />
            <PlaneBack planeRef={planeBackRef} />
            <div ref={agentRef} className={cn("nova-agent", talking && "nova-talking")}>
              <NovaAvatar />
            </div>
            <PlaneFront planeRef={planeFrontRef} />
            <div ref={trailRef} className="nova-trail" />
          </div>

          {/* Speech bubble: Nova's line, then the answers / enquiry form for the current step */}
          <div
            ref={cardRef}
            data-visible={bubbleVisible}
            className={cn(
              "onb-bubble rounded-card border border-line bg-surface p-5 shadow-[0_24px_60px_-28px_rgba(22,19,29,0.45)] sm:p-6",
              bubbleVisible ? "onb-bubble-in" : "invisible opacity-0",
            )}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <MetaLabel tone="accent" className="flex items-center gap-2">
                <span aria-hidden="true" className="size-2 rounded-[2px] bg-accent" />
                {onboardingCopy.guideName}
                <span aria-hidden="true" className={cn("onb-voice-bars", talking && "on")}>
                  <span />
                  <span />
                  <span />
                </span>
              </MetaLabel>
              {step && (
                <MetaLabel className="whitespace-nowrap">
                  Step {step} of {quizSteps.length} · {quizSteps[step - 1]}
                </MetaLabel>
              )}
            </div>

            {progress > 0 && (
              <div aria-hidden="true" className="onb-progress mb-4 grid grid-cols-3 gap-1.5">
                {quizSteps.map((label, index) => (
                  <span
                    key={label}
                    data-on={progress > index}
                    className="h-1 rounded-full bg-line"
                  />
                ))}
              </div>
            )}

            <h2
              ref={headingRef}
              id={headingId}
              tabIndex={-1}
              className="text-xl leading-snug [text-wrap:wrap] focus:outline-none sm:text-2xl"
            >
              <span className="sr-only">
                {step ? `Step ${step} of ${quizSteps.length}: ${quizSteps[step - 1]}. ` : ""}
                {message}
              </span>
              <span aria-hidden="true">
                {typed}
                {typed !== message && <span className="onb-caret" />}
              </span>
            </h2>
            <p aria-live="polite" className="sr-only">
              {announcement}
            </p>

            {body && <div className="mt-4 grid animate-quiz-step gap-4">{body}</div>}

            {((ready && (phase === "q2" || phase === "q3")) || showExploreLink) && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                {ready && (phase === "q2" || phase === "q3") ? (
                  <button
                    type="button"
                    onClick={goBack}
                    className={buttonClasses({ variant: "secondary", size: "sm" })}
                  >
                    <span aria-hidden="true">←</span> {onboardingCopy.back}
                  </button>
                ) : (
                  <span />
                )}
                {showExploreLink && (
                  <button
                    type="button"
                    onClick={close}
                    className="cursor-pointer text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
                  >
                    {onboardingCopy.exploreSelf}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
