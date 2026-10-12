// Nova's voice: the browser's built-in speech synthesis (no audio files, no third parties).
// Browsers only allow speech after the visitor has interacted with the page. Until then the
// line is kept, onNeedsTap(true) lets the sound button ask for a tap, and unlock() (called on
// the first pointer/key interaction) speaks the line that is on screen.

const VOICE_PREFERENCES: ((voice: SpeechSynthesisVoice) => boolean)[] = [
  (v) => /natural|neural/i.test(v.name),
  (v) => /google us english/i.test(v.name),
  (v) => /google uk english female/i.test(v.name),
  (v) => /google/i.test(v.name),
  (v) => /samantha/i.test(v.name),
  (v) => /microsoft.*(zira|aria|jenny|guy)/i.test(v.name),
  (v) => v.default,
];

/** Speech engines read emoji out by name, so they are removed from spoken text. */
export function spokenText(text: string): string {
  return text
    .replace(/[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{FE0F}\u{200D}\u{20E3}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export class NovaVoice {
  private synth: SpeechSynthesis | null;
  private voice: SpeechSynthesisVoice | null = null;
  private finishPending: (() => void) | null = null;
  private currentLine = "";
  private waitingForTap = false;
  enabled: boolean;
  private onTalking: (talking: boolean) => void;
  private onNeedsTap: (needsTap: boolean) => void;

  constructor(
    enabled: boolean,
    onTalking: (talking: boolean) => void,
    onNeedsTap: (needsTap: boolean) => void = () => undefined,
  ) {
    this.synth =
      typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
    this.enabled = enabled;
    this.onTalking = onTalking;
    this.onNeedsTap = onNeedsTap;
    if (this.synth) {
      this.pickVoice();
      this.synth.addEventListener("voiceschanged", this.pickVoice);
    }
  }

  get supported(): boolean {
    return this.synth !== null;
  }

  /** A line is being held back until the visitor's first tap */
  get waiting(): boolean {
    return this.waitingForTap;
  }

  private pickVoice = () => {
    if (!this.synth) return;
    const all = this.synth.getVoices();
    if (!all.length) return;
    const english = all.filter((v) => /^en([-_]|$)/i.test(v.lang));
    const pool = english.length ? english : all;
    for (const test of VOICE_PREFERENCES) {
      const found = pool.find(test);
      if (found) {
        this.voice = found;
        return;
      }
    }
    this.voice = pool[0] ?? null;
  };

  /** Whether the browser will let the page speak yet (it needs a click, tap or key press first) */
  private allowed() {
    const activation = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } })
      .userActivation;
    return !activation || activation.hasBeenActive;
  }

  private setWaiting(waiting: boolean) {
    if (this.waitingForTap === waiting) return;
    this.waitingForTap = waiting;
    this.onNeedsTap(waiting);
  }

  /**
   * First user gesture: speech may play from now on. Speaks the line on screen if it was held
   * back, unless the gesture itself moves the conversation on (replayLine = false).
   */
  unlock(replayLine = true) {
    if (!this.synth) return;
    try {
      this.synth.resume();
    } catch {
      // ignore
    }
    const wasWaiting = this.waitingForTap;
    this.setWaiting(false);
    if (wasWaiting && replayLine && this.enabled && this.currentLine)
      void this.speak(this.currentLine);
  }

  /** Speaks the line on screen again (sound switched back on) */
  repeat() {
    if (this.currentLine) void this.speak(this.currentLine);
  }

  /** Speaks a line. Resolves when it ends, is interrupted, or after a safety timeout. */
  speak(text: string): Promise<void> {
    this.stop();
    this.currentLine = text;
    const clean = spokenText(text);
    if (!this.synth || !this.enabled || !clean) return Promise.resolve();
    if (!this.allowed()) {
      // Not allowed yet: keep the line for the first tap
      this.setWaiting(true);
      return Promise.resolve();
    }
    const synth = this.synth;

    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        if (this.finishPending === finish) this.finishPending = null;
        this.onTalking(false);
        resolve();
      };
      this.finishPending = finish;

      const utterance = new SpeechSynthesisUtterance(clean);
      if (this.voice) {
        utterance.voice = this.voice;
        utterance.lang = this.voice.lang;
      } else {
        utterance.lang = "en-US";
      }
      utterance.pitch = 1.05;
      utterance.rate = 0.95;
      utterance.onstart = () => this.onTalking(true);
      utterance.onend = finish;
      utterance.onerror = (event) => {
        // Blocked by the browser's autoplay rule: wait for the visitor's first tap
        if (event.error === "not-allowed") this.setWaiting(true);
        finish();
      };

      // Safety net if the engine never reports the end (generous: the rate is below 1)
      window.setTimeout(finish, Math.max(4000, clean.length * 130));
      // Chrome can drop an utterance queued in the same tick as cancel()
      window.setTimeout(() => {
        if (done || !this.enabled) return finish();
        try {
          synth.speak(utterance);
        } catch {
          finish();
        }
      }, 60);
    });
  }

  stop() {
    const pending = this.finishPending;
    this.finishPending = null;
    pending?.();
    this.synth?.cancel();
    this.onTalking(false);
  }

  dispose() {
    this.stop();
    this.synth?.removeEventListener("voiceschanged", this.pickVoice);
  }
}
