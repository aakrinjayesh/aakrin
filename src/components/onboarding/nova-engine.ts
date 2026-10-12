// Nova's motion engine: everything that moves on the onboarding stage.
//
// React owns the conversation (bubble, answers, form); this class owns the stage: the
// fly-in, walking and roaming, the ladder/rope climb onto the card (question 2), the
// parachute float and the cracker with its fuse (question 3), the fireworks, and the
// fly-away. It works directly on the DOM in one requestAnimationFrame loop, because the
// character is posed many times a second and none of that belongs in React state.
//
// Coordinates: the stage container covers the viewport, so screen px = stage px.
// Nova's position is an offset (walkX, walkY) from his landing spot, applied to the flyer.

export type StagePhase = "intro" | "greeting" | "q1" | "q2" | "q3" | "done";

export type NovaElements = {
  /** Full-screen container; props (ladder, cracker, shells) are added here */
  stage: HTMLElement;
  flyer: HTMLElement;
  agent: HTMLElement;
  planeBack: SVGSVGElement;
  planeFront: SVGSVGElement;
  trail: HTMLElement;
  shadow: HTMLElement;
  canvas: HTMLCanvasElement;
  /** The speech bubble (question card) */
  card: HTMLElement;
  /** Controls Nova must not cover when he sits on the card (the top buttons) */
  avoid: () => DOMRect[];
  /** Cloud layer, drifted slightly against the pointer for depth */
  sky?: HTMLElement;
};

type Pose = Partial<
  Record<
    | PoseKey
    | "headY"
    | "squash"
    | "spin"
    | "swayX"
    | "armRTo"
    | "liftL"
    | "liftR"
    | "reachL"
    | "reachR",
    number
  >
>;
type PoseKey = "armL" | "armR" | "head" | "lean" | "legL" | "legR" | "rootY" | "shinL" | "shinR";
type MoveStyle = "walk" | "climb" | "slide" | "hop" | "float";
type Walk = {
  fromX: number;
  toX: number;
  fromY: number;
  toY: number;
  start: number;
  dur: number;
  pace?: number;
  style: MoveStyle;
  /** Hop height in px, or the number of rung-to-rung steps for a climb */
  height: number;
  sizeFrom: number;
  sizeTo: number;
  resolve: () => void;
};
type Gesture = { name: GestureName; start: number; dur: number; fadeFrom?: number };
type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  colour: string;
  size: number;
  flash?: boolean;
  /** A soft cloud puff (contrail, dust): grows, fades, floats instead of falling */
  puff?: boolean;
};
type Emitter = {
  kind: "fuse" | "fountain" | "trail" | "contrail";
  pos: () => { x: number; y: number };
  alive: () => boolean;
};
type Point = { x: number; y: number };
type Measure = { r: Rect; k: number; cx: number; feetY: number; groundY: number; card: DOMRect };
type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
};
type CrackerLayout = {
  sc: number;
  ground: number;
  nova: Point;
  placeAt: Point;
  cracker: { x: number; w: number; h: number };
  tip: Point;
  base: Point;
  dip: number;
};
type Kit = {
  el: HTMLElement;
  cracker: HTMLElement;
  thread: SVGPathElement;
  ash: SVGPathElement;
  len: number;
  layout: CrackerLayout;
  ready: boolean;
};

const SVG_NS = "http://www.w3.org/2000/svg";
const VB_W = 200;
const VB_H = 270;
const EYE = { x: 100, y: 122 };
/** Agent top inside the flyer: sitting on the plane, and standing on the ground */
export const AGENT_TOP = 18;
export const AGENT_LANDED_TOP = 120;
/** Knees (rest on the card edge), soles of the standing feet, tips of the ears (drawing units) */
const SEAT = 243;
const FEET = 266;
const EARS = 6;
/**
 * Arm limits in degrees from the drawn pose (positive = clockwise). Inward swings are capped
 * so a mitten never covers the face.
 */
const ARM_L_RANGE: [number, number] = [-35, 120];
const ARM_R_RANGE: [number, number] = [-20, 120];
/** With his back turned there is no face to cover, so the arms can reach straight up */
const ARM_L_BACK: [number, number] = [-35, 162];
const ARM_R_BACK: [number, number] = [-62, 120];
/**
 * Each arm as drawn: shoulder, and the unit direction from shoulder to hand (drawing units).
 * A reaching arm is stretched along this line and its mitten slides out with it.
 */
const ARM_L_AXIS = { x: 60, y: 162, dx: -0.49, dy: 0.87 };
const ARM_R_AXIS = { x: 140, y: 160, dx: 0.69, dy: -0.72 };
const ARM_LEN = 54;
/** How long turning round (to face the ladder, or back) takes */
const TURN_MS = 320;
/**
 * The right arm is drawn raised (for the sign). At rest it hangs at his side, mirroring the
 * left arm; moods that need it up (sign, stick, pointing, cheering) set it explicitly.
 */
const ARM_R_REST = 105;
const IDLE_MS = 15000;
const PHONE_MAX = 720;
/** Brand-led palette, vivid enough to read on the light sky */
const FIREWORK_COLOURS = ["#e55014", "#7c3aed", "#f5b400", "#14b874", "#0b8cff", "#ff3b5c"];
const SPARK_GOLD = ["#ffd166", "#fff3b0", "#ff8a3d"];
const MAX_SPARKS = 1100;
const FADE_STEPS = 6;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];
export const isPhone = () => window.innerWidth <= PHONE_MAX;
/** Phones: top of the question sheet at its tallest (62vh, 12px from the bottom; see globals.css) */
const sheetTop = (H: number) => H - 12 - H * 0.62;

// Looping behaviour per step (t = seconds since the mood started)
const MOODS = {
  idle: (): Pose => ({}),
  /** Holds the welcome sign up in the right hand and waves with the left */
  sign: (t: number): Pose => ({
    armR: -12,
    armL: 100 + Math.sin(t * 8) * 22,
    head: 5 + Math.sin(t * 2) * 3,
  }),
  /** Movement comes from the roaming loop */
  roam: (): Pose => ({}),
  /** Pointing at the form */
  point: (): Pose => ({ armR: isPhone() ? 95 : 48, head: isPhone() ? 0 : 6, lean: 3 }),
  celebrate: (t: number): Pose => ({
    armL: 105 + Math.sin(t * 10) * 10,
    armR: -15 + Math.sin(t * 10 + 1) * 5,
    head: Math.sin(t * 3) * 6,
  }),
  /** Back to the viewer, both hands up on the rungs; the hand-over-hand steps come from the climb */
  climb: (): Pose => ({ armL: 108, armR: -3, head: 0 }),
  rope: (): Pose => ({ armL: 150, armR: -20, legL: 8, legR: -8, head: 6 }),
  perch: (t: number): Pose => ({
    shinL: Math.sin(t * 3.2),
    shinR: Math.sin(t * 3.2 + 2.4),
    armL: -14,
    armR: 100,
    head: 6 + Math.sin(t * 0.8) * 5,
  }),
  /**
   * Hiding behind the card: leans out past its edge so his eyes peek round it (desktop), or
   * peeks over the top of the sheet looking about (phones)
   */
  hide: (t: number): Pose =>
    isPhone()
      ? { head: Math.sin(t * 1.2) * 8, armL: 8 }
      : { lean: -9 + Math.sin(t * 1.5) * 1.5, head: -10 + Math.sin(t * 1.1) * 3, armL: 18 },
  /** Ladder held over his head */
  carry: (): Pose => ({ armL: 150, armR: -20, head: 4 }),
  /** Hanging from the parachute, holding a cord */
  float: (t: number): Pose => ({
    armR: -20,
    armL: 108 + Math.sin(t * 2.5) * 6,
    legL: Math.sin(t * 3) * 10,
    legR: -Math.sin(t * 3) * 10,
    head: Math.sin(t * 2.5) * 6,
  }),
  /** Incense stick ready, watching the form */
  guard: (t: number): Pose => ({ armL: 6, armR: 10, head: 7 + Math.sin(t * 1.1) * 5 }),
  /** Hands over his ears, leaning away from the cracker */
  ears: (t: number): Pose => ({ armL: 116, armR: -16, lean: -5, head: -6 + Math.sin(t * 14) * 2 }),
  /** Tipping the ladder up */
  push: (): Pose => ({ armL: 120, armR: 15, lean: 6 }),
  /** Idle reaction: sits down, nodding off; every few seconds waves for attention */
  nap: (t: number): Pose => {
    const c = t % 6;
    const waving = c > 2.5 && c < 4;
    return {
      rootY: 22,
      legL: 38,
      legR: -38,
      head: waving ? 6 : Math.sin(t * 0.9) * 7 - 4,
      armL: waving ? 100 + Math.sin(t * 10) * 22 : 12,
    };
  },
} satisfies Record<string, (t: number) => Pose>;
export type Mood = keyof typeof MOODS;

// One-off moves (p = progress 0..1, t = seconds since the move started); values add to the mood
const GESTURES = {
  hop: (p: number): Pose => ({
    rootY: -Math.sin(p * Math.PI) * 28,
    squash:
      p < 0.15
        ? -0.12 * Math.sin((p / 0.15) * Math.PI)
        : p > 0.85
          ? -0.1 * Math.sin(((p - 0.85) / 0.15) * Math.PI)
          : 0.04,
  }),
  nod: (p: number): Pose => ({ headY: Math.abs(Math.sin(p * Math.PI * 2)) * 5 }),
  fistpump: (p: number, t: number): Pose => ({
    armRTo: -12 + Math.sin(t * 16) * 26 * (1 - p),
    rootY: -Math.sin(p * Math.PI) * 12,
  }),
  jump: (p: number): Pose => ({
    rootY: -Math.sin(p * Math.PI) * 40,
    squash: p < 0.12 ? -0.14 : p > 0.9 ? -0.12 : 0.05,
  }),
  spin: (p: number): Pose => ({
    spin: Math.cos(p * Math.PI * 2),
    rootY: -Math.sin(p * Math.PI) * 16,
  }),
  /** Reaches down to the fuse */
  crouch: (p: number): Pose => {
    const e = Math.sin((Math.min(1, p / 0.3) * Math.PI) / 2) * (p > 0.8 ? (1 - p) / 0.2 : 1);
    return { squash: -0.06 * e, armR: 60 * e, lean: 6 * e };
  },
  look: (p: number): Pose => ({ head: Math.sin(p * Math.PI * 2) * 14 }),
  /** Leans towards the question card */
  peek: (p: number): Pose => {
    const e = Math.sin(p * Math.PI);
    return { lean: (isPhone() ? 0 : 7) * e, head: 10 * e, headY: (isPhone() ? 3 : 0) * e };
  },
  stretch: (p: number): Pose => {
    const e = Math.sin(p * Math.PI);
    return { armL: 105 * e, squash: 0.06 * e, head: -6 * e };
  },
  tapfoot: (p: number): Pose => ({ legR: -Math.abs(Math.sin(p * Math.PI * 4)) * 10, head: 4 }),
  wave: (p: number): Pose => {
    const e = Math.sin(p * Math.PI);
    return { armL: 100 * e + Math.sin(p * Math.PI * 8) * 22 * e, head: 6 * e };
  },
  /** Peeks down at the answers while sitting on the card */
  readdown: (p: number): Pose => {
    const e = Math.sin(p * Math.PI);
    return { headY: 6 * e, head: -12 * e };
  },
  kick: (p: number): Pose => ({
    shinL: -1.6 * Math.sin(p * Math.PI * 2),
    shinR: 1.6 * Math.sin(p * Math.PI * 2),
  }),
  land: (p: number): Pose => ({ squash: -0.12 * Math.sin(p * Math.PI) }),
  shake: (p: number): Pose => ({ head: Math.sin(p * Math.PI * 6) * 14 * (1 - p) }),

  bow: (p: number): Pose => {
    const e = Math.sin(p * Math.PI);
    return { headY: 10 * e, squash: -0.08 * e, armL: -20 * e, armR: 30 * e };
  },
} satisfies Record<string, (p: number, t: number) => Pose>;
type GestureName = keyof typeof GESTURES;

const POSE_KEYS: PoseKey[] = [
  "armL",
  "armR",
  "head",
  "lean",
  "legL",
  "legR",
  "rootY",
  "shinL",
  "shinR",
];

/** A festive sky-shot cracker: shaded orange body, gold foil bands, a star medallion, a gold cone */
const CRACKER_SVG =
  '<svg viewBox="0 0 40 78" width="100%" height="100%" aria-hidden="true"><defs>' +
  '<linearGradient id="nc-body" x1="0" x2="1">' +
  '<stop offset="0" stop-color="#7a2606"/><stop offset=".22" stop-color="#c8450f"/>' +
  '<stop offset=".42" stop-color="#f6a985"/><stop offset=".58" stop-color="#e55014"/>' +
  '<stop offset="1" stop-color="#6e2205"/></linearGradient>' +
  '<linearGradient id="nc-gold" x1="0" x2="1">' +
  '<stop offset="0" stop-color="#9a6200"/><stop offset=".35" stop-color="#ffd66b"/>' +
  '<stop offset=".5" stop-color="#fff3c4"/><stop offset=".7" stop-color="#f5b400"/>' +
  '<stop offset="1" stop-color="#8a5800"/></linearGradient></defs>' +
  '<path d="M20 4 Q16.5 -0.5 20.5 -3 Q24.5 -5.5 21.5 -9" fill="none" stroke="#6b4423" stroke-width="1.6" stroke-linecap="round"/>' +
  '<path d="M7 17 L20 3.5 L33 17 Z" fill="url(#nc-gold)"/><path d="M20 3.5 L33 17 L24 17 Z" fill="#000" opacity=".14"/>' +
  '<rect x="6" y="16" width="28" height="56" rx="3" fill="url(#nc-body)"/>' +
  '<ellipse cx="20" cy="16.6" rx="14" ry="2.4" fill="#6e2205"/>' +
  '<rect x="6" y="21" width="28" height="4" fill="url(#nc-gold)"/><rect x="6" y="63" width="28" height="4" fill="url(#nc-gold)"/>' +
  '<rect x="6" y="27" width="28" height=".9" fill="#ffd66b" opacity=".75"/><rect x="6" y="60.5" width="28" height=".9" fill="#ffd66b" opacity=".75"/>' +
  '<g fill="#ffd66b" opacity=".9"><circle cx="10.5" cy="33" r=".9"/><circle cx="29.5" cy="33" r=".9"/><circle cx="10.5" cy="55" r=".9"/>' +
  '<circle cx="29.5" cy="55" r=".9"/><circle cx="20" cy="31.5" r=".8"/><circle cx="20" cy="56.5" r=".8"/></g>' +
  '<circle cx="20" cy="44" r="9" fill="#fff7ef"/><circle cx="20" cy="44" r="9" fill="none" stroke="url(#nc-gold)" stroke-width="1.8"/>' +
  '<path d="M20 37.2 L21.7 42.3 L26.8 44 L21.7 45.7 L20 50.8 L18.3 45.7 L13.2 44 L18.3 42.3 Z" fill="#7c3aed"/>' +
  '<path d="M20 40.5 L20.9 43.1 L23.5 44 L20.9 44.9 L20 47.5 L19.1 44.9 L16.5 44 L19.1 43.1 Z" fill="#ffd66b"/>' +
  '<rect x="9.5" y="17.5" width="2.4" height="53" rx="1.2" fill="#fff" opacity=".3"/>' +
  '<ellipse cx="20" cy="72" rx="14" ry="2.8" fill="#4a1703"/>' +
  "</svg>";

/**
 * Smooth flight path through points (s = scale): a Catmull-Rom curve resampled evenly along
 * its length, so the speed never jumps between points. Each sample's tilt follows the
 * direction of travel for a plane whose nose points left or right; the tilt is softened,
 * capped and (unless level is false) eased to level at the end.
 */
function flightPath(
  pts: { x: number; y: number; s: number }[],
  nose: "left" | "right",
  n = 48,
  level = true,
) {
  const P = [pts[0], ...pts, pts[pts.length - 1]];
  const dense: { x: number; y: number; s: number }[] = [];
  for (let i = 1; i < P.length - 2; i++) {
    const [a, b, c, d] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    for (let j = 0; j < 40; j++) {
      const t = j / 40;
      const t2 = t * t;
      const t3 = t2 * t;
      const cr = (k: "x" | "y") =>
        0.5 *
        (2 * b[k] +
          (-a[k] + c[k]) * t +
          (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 +
          (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * t3);
      dense.push({ x: cr("x"), y: cr("y"), s: b.s + (c.s - b.s) * (t * t * (3 - 2 * t)) });
    }
  }
  dense.push({ ...pts[pts.length - 1] });
  const len = [0];
  for (let i = 1; i < dense.length; i++)
    len.push(len[i - 1] + Math.hypot(dense[i].x - dense[i - 1].x, dense[i].y - dense[i - 1].y));
  const total = len[len.length - 1] || 1;
  const out: { x: number; y: number; s: number; offset: number; deg: number }[] = [];
  let j = 0;
  for (let i = 0; i <= n; i++) {
    const want = (total * i) / n;
    while (j < dense.length - 2 && len[j + 1] < want) j++;
    const f = clamp((want - len[j]) / (len[j + 1] - len[j] || 1), 0, 1);
    const A = dense[j];
    const B = dense[Math.min(j + 1, dense.length - 1)];
    const A2 = dense[Math.max(0, j - 3)];
    const B2 = dense[Math.min(dense.length - 1, j + 4)];
    const dx = B2.x - A2.x;
    const dy = B2.y - A2.y;
    let deg =
      nose === "left"
        ? (Math.atan2(-dy, -dx) * 180) / Math.PI
        : (Math.atan2(dy, dx) * 180) / Math.PI;
    if (deg > 90) deg -= 180;
    else if (deg < -90) deg += 180;
    const u = i / n;
    const settle = level && u > 0.85 ? 1 - ((u - 0.85) / 0.15) ** 2 : 1;
    out.push({
      x: A.x + (B.x - A.x) * f,
      y: A.y + (B.y - A.y) * f,
      s: A.s + (B.s - A.s) * f,
      offset: u,
      deg: clamp(deg * 0.6, -22, 22) * settle,
    });
  }
  return out;
}

export class NovaEngine {
  readonly reduced: boolean;
  /** Current conversation step, set by the onboarding component */
  phase: StagePhase = "intro";
  /** A conversation transition is in progress (no napping meanwhile) */
  busy = false;

  private els: NovaElements;
  private rig: Record<string, SVGGraphicsElement>;
  /** Face, inner ears, belly and badge: hidden while he has his back to the viewer */
  private frontParts: SVGGElement[];
  private eyeMotion: SVGGElement;
  private ctx: CanvasRenderingContext2D | null;
  private run = 0;
  private loopOn = false;
  private frame = 0;
  private disposers: (() => void)[] = [];
  /** Resolves once the furry parts have been turned into pictures (or that failed) */
  private fur: Promise<void> | null = null;

  // Pausable clock: holds while the tab is hidden, so nothing jumps ahead on return
  private hiddenTotal = 0;
  private hiddenAt = 0;
  private parkedWaits: (() => void)[] = [];
  private pausedAnims: Animation[] = [];

  // Motion state
  private landed = false;
  private walkX = 0;
  private walkY = 0;
  private walk: Walk | null = null;
  private mood: Mood = "idle";
  private moodStart = 0;
  private gesture: Gesture | null = null;
  private gestureOut: Gesture | null = null;
  private signScale = 0;
  private glassesScale = 0;
  private chuteScale = 0;
  private chuteOpen = false;
  private stickOn = false;
  private pose: Record<PoseKey, number> = {
    armL: 0,
    armR: ARM_R_REST,
    head: 0,
    lean: 0,
    legL: 0,
    legR: 0,
    rootY: 0,
    shinL: 0,
    shinR: 0,
  };
  private lastMove = 0;
  private lastFrame = 0;
  private seatBlend = 0;
  private walkLook = 0;
  private seatCardTop = 0;
  private size = 1;
  private seated = false;
  /** Facing the ladder (back to the viewer); he turns round through backBlend 0 → 1 */
  private facingBack = false;
  private backBlend = 0;
  private backShown = false;
  /** Body tilt along the ladder while climbing (degrees, eased) */
  private climbTilt = 0;
  private tilt = 0;
  /** Up the ladder, off the ground (no floor shadow) */
  private aloft = false;
  private prop: HTMLElement | null = null;
  private carrying: { foot: Point } | null = null;
  private seatShadow: HTMLDivElement;
  /** Speech-bubble tail on the card's edge, pointing at Nova */
  private tail: HTMLDivElement;
  private tailShown = false;
  /** Head turn towards the pointer/focus (degrees, eased) */
  private headTrack = 0;
  /** Raw pointer position on screen (parallax) and the eased sky offset */
  private screenPointer = { x: 0, y: 0 };
  private skyShift = { x: 0, y: 0 };
  private lastRootY = 0;
  private cardRect: DOMRect | null = null;
  private written = new WeakMap<Element, Map<string, string>>();
  private cardRectAt = 0;
  private zTimer = 0;
  private contrailOn = false;
  private pointer = { x: EYE.x, y: EYE.y };
  private eye = { x: 0, y: 0 };
  private flyerApplied = { x: 0, y: 0 };
  private agentBox: { left: number; top: number; width: number; height: number } | null = null;
  private agentBoxKey = "";

  // Behaviour loops and their cancellation tokens
  private roamToken = 0;
  private perchToken = 0;
  private seatRun = 0;
  private prepRun = 0;
  private lastActivity = 0;
  private napping: Mood | null = null;
  private stageBusy = false;
  private lastWidth = 0;
  private relayoutTimer = 0;

  // Celebration
  private sparks: Spark[] = [];
  private emitters: Emitter[] = [];
  private fwDirty = false;
  private kit: Kit | null = null;
  private lastFilled = 0;

  constructor(els: NovaElements) {
    this.els = els;
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const q = <T extends Element>(name: string) =>
      els.agent.querySelector<T>(`[data-rig="${name}"]`)!;
    this.rig = Object.fromEntries(
      [
        "root",
        "upper",
        "head",
        "tail",
        "legL",
        "legR",
        "armL",
        "armR",
        "sign",
        "sitLegs",
        "shinL",
        "shinR",
        "knees",
        "chute",
        "stick",
        "stickGlow",
        "glasses",
        "signTop",
        "signMain",
        "backHead",
        "backBody",
      ].map((name) => [name, q<SVGGraphicsElement>(name)]),
    );
    this.frontParts = [...els.agent.querySelectorAll<SVGGElement>("[data-front]")];
    this.eyeMotion = q<SVGGElement>("eyeMotion");
    this.ctx = els.canvas.getContext("2d");
    this.seatShadow = document.createElement("div");
    this.seatShadow.className = "nova-seat-shadow";
    els.stage.appendChild(this.seatShadow);
    this.tail = document.createElement("div");
    this.tail.className = "nova-tail";
    this.tail.setAttribute("aria-hidden", "true");
    els.stage.appendChild(this.tail);
    this.screenPointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.lastWidth = window.innerWidth;
    this.lastActivity = performance.now();

    this.listen(window, "pointermove", (e) => {
      const { clientX, clientY } = e as PointerEvent;
      this.screenPointer = { x: clientX, y: clientY };
      this.trackPointer(clientX, clientY);
    });
    // Keyboard users: Nova looks at whatever has focus in the bubble
    this.listen(els.card, "focusin", (e) => {
      const r = (e.target as Element).getBoundingClientRect();
      this.trackPointer(r.left + r.width / 2, r.top + r.height / 2);
    });
    for (const type of ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"]) {
      this.listen(els.stage, type, () => {
        this.lastActivity = performance.now();
        if (this.napping) this.wakeUp();
      });
    }
    this.listen(document, "visibilitychange", () => this.onVisibility());
    this.listen(window, "resize", () => {
      // Width changes only: a phone's on-screen keyboard changes the height while typing
      if (window.innerWidth === this.lastWidth) return;
      this.lastWidth = window.innerWidth;
      window.clearTimeout(this.relayoutTimer);
      this.relayoutTimer = window.setTimeout(() => this.relayout(), 200);
    });
  }

  /** Turns the fur into pictures, once the stage is showing (hidden parts can't be measured) */
  private prepare() {
    if (this.fur || this.reduced || !this.els.agent.getBoundingClientRect().width) return;
    this.fur = this.bakeFur().catch(() => undefined);
  }

  private listen(target: EventTarget, type: string, fn: (e: Event) => void) {
    target.addEventListener(type, fn, { passive: true });
    this.disposers.push(() => target.removeEventListener(type, fn));
  }

  dispose() {
    this.stop();
    window.clearTimeout(this.relayoutTimer);
    this.disposers.forEach((d) => d());
    this.seatShadow.remove();
    this.tail.remove();
  }

  // ---------- Clock ----------
  private now = () =>
    performance.now() - this.hiddenTotal - (this.hiddenAt ? performance.now() - this.hiddenAt : 0);

  /** A wait that holds while the tab is hidden */
  wait = (ms: number) =>
    new Promise<void>((resolve) => {
      const due = this.now() + ms;
      const check = () => {
        if (document.hidden) {
          this.parkedWaits.push(check);
          return;
        }
        const left = due - this.now();
        if (left <= 0) resolve();
        else window.setTimeout(check, left);
      };
      check();
    });

  private anim(el: Element, frames: Keyframe[], options: KeyframeAnimationOptions) {
    return el.animate(frames, { fill: "forwards", ...options }).finished.then(
      () => undefined,
      () => undefined,
    );
  }

  private onVisibility() {
    const now = performance.now();
    if (document.hidden) {
      if (this.hiddenAt) return;
      this.hiddenAt = now;
      this.pausedAnims = document
        .getAnimations()
        .filter(
          (a) =>
            a.playState === "running" &&
            a.effect instanceof KeyframeEffect &&
            a.effect.target &&
            this.els.stage.contains(a.effect.target),
        );
      this.pausedAnims.forEach((a) => a.pause());
      return;
    }
    if (!this.hiddenAt) return;
    const gap = now - this.hiddenAt;
    this.hiddenTotal += gap;
    this.hiddenAt = 0;
    if (this.walk) this.walk.start += gap;
    if (this.gesture) this.gesture.start += gap;
    if (this.gestureOut) {
      this.gestureOut.start += gap;
      if (this.gestureOut.fadeFrom) this.gestureOut.fadeFrom += gap;
    }
    this.moodStart += gap;
    this.lastActivity += gap;
    this.lastFrame = this.lastMove = 0;
    this.pausedAnims.forEach((a) => {
      try {
        a.play();
      } catch {
        // animation was cancelled meanwhile
      }
    });
    this.pausedAnims = [];
    this.parkedWaits.splice(0).forEach((c) => c());
  }

  // ---------- Loop ----------
  start() {
    if (this.loopOn) return;
    this.loopOn = true;
    this.prepare();
    this.lastFrame = this.lastMove = 0;
    this.frame = requestAnimationFrame(this.tick);
  }

  /** Stops everything (the onboarding was closed) */
  stop() {
    this.newRun();
    this.loopOn = false;
    cancelAnimationFrame(this.frame);
    this.napping = null;
    this.gesture = this.gestureOut = null;
    this.clearCelebration();
  }

  /** Cancels any sequence in progress (Back, Replay, Start over, close) */
  newRun() {
    this.run++;
    this.seatRun++;
    this.prepRun++;
    this.stopRoam();
    this.stopPerch();
    this.resolveWalk();
    this.faceFront();
  }

  private tick = (time: number) => {
    if (!this.loopOn) return;
    this.frame = requestAnimationFrame(this.tick);
    if (this.hiddenAt) return;
    const dt = this.lastFrame ? Math.min(0.05, (time - this.lastFrame) / 1000) : 0.016;
    this.lastFrame = time;
    // The card only moves on step changes and resizes, so it is measured a few times a second,
    // and before this frame writes anything (measuring after a style change would force the
    // browser to recalculate the whole layout mid-frame)
    if (time - this.cardRectAt > 200) {
      this.cardRectAt = time;
      this.cardRect =
        this.landed && this.cardShown() ? this.els.card.getBoundingClientRect() : null;
    }
    const cardRect = this.landed && this.cardShown() ? this.cardRect : null;

    // Eyes follow the pointer (or focus), or look where he is walking
    const edx = this.pointer.x - EYE.x;
    const edy = this.pointer.y - EYE.y;
    const ed = Math.hypot(edx, edy) || 1;
    const strength = Math.min(1, ed / 70);
    const k = this.easeK(10.5, dt);
    const lk = Math.abs(this.walkLook);
    this.eye.x += ((edx / ed) * 4.5 * strength * (1 - lk) + this.walkLook * 4.5 - this.eye.x) * k;
    this.eye.y += ((edy / ed) * 3.5 * strength * (1 - lk) - this.eye.y) * k;
    this.put(
      this.eyeMotion,
      "transform",
      `translate(${this.eye.x.toFixed(2)} ${this.eye.y.toFixed(2)})`,
    );

    this.moveCharacter(time);
    this.checkIdle(time);
    this.updateTail(cardRect);
    this.driftSky(dt);
    this.drawFireworks(dt);
  };

  /** Clouds drift a little against the pointer, so the sky has depth */
  private driftSky(dt: number) {
    const sky = this.els.sky;
    if (!sky || this.reduced) return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const tx = ((W / 2 - this.screenPointer.x) / W) * 26;
    const ty = ((H / 2 - this.screenPointer.y) / H) * 14;
    const k = this.easeK(2.5, dt);
    const nx = this.skyShift.x + (tx - this.skyShift.x) * k;
    const ny = this.skyShift.y + (ty - this.skyShift.y) * k;
    // Settled: no write, so the browser has nothing to redo
    if (Math.abs(nx - this.skyShift.x) < 0.02 && Math.abs(ny - this.skyShift.y) < 0.02) return;
    this.skyShift.x = nx;
    this.skyShift.y = ny;
    sky.style.transform = `translate(${this.skyShift.x.toFixed(1)}px, ${this.skyShift.y.toFixed(1)}px)`;
  }

  /**
   * The card's speech tail points at Nova's head: on its left edge on wider screens, on its
   * top edge on phones (Nova above the sheet). Hidden while he sits on the card or is away.
   */
  private updateTail(cardRect: DOMRect | null) {
    let show = !!cardRect && !this.seated && !this.stageBusy && !this.walkIsBig();
    let x = 0;
    let y = 0;
    let up = false;
    if (show && cardRect) {
      const c = cardRect;
      const r = this.agentRect();
      const k = r.height / VB_H;
      const feetY = r.top + FEET * k;
      const headY = feetY - (FEET - 112) * k * this.size;
      const cx = r.left + r.width / 2;
      if (isPhone()) {
        up = true;
        x = clamp(cx, c.left + 28, c.right - 28);
        y = c.top;
        show = feetY < c.top + 20 && Math.abs(cx - x) < 120;
      } else {
        x = c.left;
        y = clamp(headY, c.top + 30, Math.min(c.bottom - 30, c.top + 220));
        show = cx < c.left - 20 && Math.abs(headY - y) < 260;
      }
    }
    if (show !== this.tailShown) {
      this.tailShown = show;
      this.tail.classList.toggle("show", show);
    }
    if (!show) return;
    this.tail.classList.toggle("up", up);
    this.tail.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(45deg)`;
  }

  /** Mid-way through a long walk or climb (the tail would chase him round the screen) */
  private walkIsBig() {
    const w = this.walk;
    return !!w && w.style !== "walk";
  }

  private trackPointer(clientX: number, clientY: number) {
    const rect = this.landed ? this.agentRect() : this.els.agent.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    this.pointer = {
      x: (clientX - rect.left) * (VB_W / rect.width),
      y: (clientY - rect.top) * (VB_H / rect.height),
    };
  }

  // ---------- Fur: each textured part is drawn once into a picture ----------
  // The SVG noise filters would otherwise be recalculated every frame he moves. Every
  // filtered part is a still drawing inside a moving group, so a picture of it looks the
  // same and costs almost nothing to move. If anything fails, the live filter stays.
  private async bakeFur() {
    const svg = this.els.agent.querySelector("svg");
    if (!svg) return;
    const ser = new XMLSerializer();
    const defsEl = svg.querySelector("defs");
    if (!defsEl) return;
    const defs = ser.serializeToString(defsEl);
    const S = 2; // pixels per drawing unit: he is never shown above ~1.7x
    const hidden = [this.rig.sitLegs, this.rig.knees, this.rig.backHead];
    const saved = hidden.map((el) => el.style.display);
    hidden.forEach((el) => (el.style.display = ""));
    const jobs = [...svg.querySelectorAll<SVGGraphicsElement>("[filter]")].map((el) => {
      const b = el.getBBox();
      return {
        el,
        x: Math.floor(b.x - 9),
        y: Math.floor(b.y - 9),
        w: Math.ceil(b.width + 18),
        h: Math.ceil(b.height + 18),
      };
    });
    hidden.forEach((el, i) => (el.style.display = saved[i]));
    for (const j of jobs) {
      if (!j.w || !j.h) continue;
      try {
        const clone = j.el.cloneNode(true) as Element;
        clone.removeAttribute("style");
        clone.removeAttribute("data-rig");
        // Limit the filters to this part so only its own noise is worked out (the noise is
        // laid out in drawing units, so the texture is identical)
        const box = `x="${j.x}" y="${j.y}" width="${j.w}" height="${j.h}"`;
        const partDefs = defs.replace(/x="-40" y="-30" width="280" height="330"/g, box);
        const src = `<svg xmlns="${SVG_NS}" width="${j.w * S}" height="${j.h * S}" viewBox="${j.x} ${j.y} ${j.w} ${j.h}">${partDefs}${ser.serializeToString(clone)}</svg>`;
        const img = new Image();
        img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(src);
        await img.decode();
        const c = document.createElement("canvas");
        c.width = j.w * S;
        c.height = j.h * S;
        c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
        const blob = await new Promise<Blob>((res, rej) => {
          try {
            c.toBlob((b) => (b ? res(b) : rej(new Error("toBlob"))), "image/png");
          } catch (e) {
            rej(e);
          }
        });
        const pic = document.createElementNS(SVG_NS, "image");
        pic.setAttribute("href", URL.createObjectURL(blob));
        pic.setAttribute("x", String(j.x));
        pic.setAttribute("y", String(j.y));
        pic.setAttribute("width", String(j.w));
        pic.setAttribute("height", String(j.h));
        pic.setAttribute("preserveAspectRatio", "none");
        if (j.el.tagName.toLowerCase() === "g") {
          j.el.removeAttribute("filter");
          j.el.replaceChildren(pic);
        } else {
          // A single filtered shape: keep the element (React owns it), draw the picture instead
          j.el.removeAttribute("filter");
          j.el.setAttribute("opacity", "0");
          j.el.after(pic);
        }
      } catch {
        // keep the live filter for this part
      }
      await new Promise((r) => window.setTimeout(r));
    }
  }

  // ---------- Behaviour ----------
  setMood(name: Mood) {
    if (this.mood !== name) {
      this.mood = name;
      this.moodStart = performance.now();
    }
  }

  /** Turns to face the ladder (back to the viewer) or round again; resolves once he has turned */
  private turnRound(toBack: boolean) {
    this.facingBack = toBack;
    return this.reduced ? Promise.resolve() : this.wait(TURN_MS);
  }

  /** Swaps the drawing between his front and his back (at the narrowest point of the turn) */
  private showBack(on: boolean) {
    this.backShown = on;
    for (const part of this.frontParts) part.style.display = on ? "none" : "";
    this.rig.backHead.style.display = this.rig.backBody.style.display = on ? "" : "none";
    // From behind the tail sits in front of his body
    if (on) this.rig.root.appendChild(this.rig.tail);
    else this.rig.root.insertBefore(this.rig.tail, this.rig.root.firstChild);
  }

  /** Facing the viewer again straight away (a sequence was cut short) */
  private faceFront() {
    this.facingBack = false;
    this.backBlend = 0;
    this.climbTilt = this.tilt = 0;
    this.aloft = false;
    if (this.backShown) this.showBack(false);
  }

  private playGesture(name: GestureName, dur: number) {
    if (this.reduced) return Promise.resolve();
    const now = performance.now();
    if (this.gesture && now - this.gesture.start < this.gesture.dur)
      this.gestureOut = { ...this.gesture, fadeFrom: now };
    this.gesture = { name, start: now, dur };
    return this.wait(dur);
  }

  private resolveWalk() {
    if (this.walk) {
      const r = this.walk.resolve;
      this.walk = null;
      r();
    }
  }

  /** Walks to an offset from the landing spot. pace = ms per px (higher = slower). */
  private walkTo(x: number, y = this.walkY, pace = 6, maxMs = Infinity) {
    return new Promise<void>((resolve) => {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return resolve();
      this.resolveWalk();
      const dist = Math.hypot(x - this.walkX, y - this.walkY);
      if (this.reduced || !this.landed || dist < 4) {
        this.walkX = x;
        this.walkY = y;
        return resolve();
      }
      this.walk = {
        fromX: this.walkX,
        toX: x,
        fromY: this.walkY,
        toY: y,
        start: performance.now(),
        dur: Math.min(maxMs, Math.max(450, dist * pace)),
        pace,
        style: "walk",
        height: 0,
        sizeFrom: this.size,
        sizeTo: this.size,
        resolve,
      };
    });
  }

  /** Moves without walking steps ('climb'/'slide' straight, 'hop' in an arc); toSize resizes on the way. */
  private moveTo(
    x: number,
    y: number,
    dur: number,
    style: MoveStyle,
    height = 40,
    toSize = this.size,
  ) {
    return new Promise<void>((resolve) => {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return resolve();
      this.resolveWalk();
      if (this.reduced || !this.landed) {
        this.walkX = x;
        this.walkY = y;
        this.size = toSize;
        return resolve();
      }
      this.walk = {
        fromX: this.walkX,
        toX: x,
        fromY: this.walkY,
        toY: y,
        start: performance.now(),
        dur,
        style,
        height,
        sizeFrom: this.size,
        sizeTo: toSize,
        resolve,
      };
    });
  }

  // Where Nova may go: the open area beside the card (desktop) or above the sheet (phones)
  private cardShown() {
    return this.els.card.dataset.visible === "true";
  }

  private roamBox() {
    const r = this.agentRect();
    const half = r.width / 2;
    const homeCx = r.left + half - this.walkX;
    const homeTop = r.top - this.walkY;
    const homeBottom = r.bottom - this.walkY;
    const W = window.innerWidth;
    const H = window.innerHeight;
    if (isPhone()) {
      // Between the top buttons and the sheet at its tallest (62% of the screen)
      const navBottom = Math.max(0, ...this.els.avoid().map((b) => b.bottom));
      const y0 = navBottom + 4 - homeTop;
      return {
        x0: 12 + half - homeCx,
        x1: W - 12 - half - homeCx,
        y0,
        y1: Math.max(y0, Math.min(90, sheetTop(H) - 10 - homeBottom)),
      };
    }
    const cardLeft = this.cardShown() ? this.els.card.getBoundingClientRect().left : W;
    const x0 = 16 + half - homeCx;
    return {
      x0,
      x1: Math.max(x0, cardLeft - 28 - half - homeCx),
      y0: Math.max(-140, 96 - homeTop),
      y1: Math.max(0, Math.min(110, H - 16 - homeBottom)),
    };
  }

  /** Question 1: roams freely, pausing to look around, peek at the card, stretch or tap a foot */
  startRoam() {
    this.setMood("roam");
    void this.roam();
  }

  private stopRoam() {
    this.roamToken++;
  }

  /**
   * Question 1: Nova stays close to the card. He strolls beside it, then slips behind it and
   * peeks out round its edge (over its top on phones), ducks out of sight, pops back out, and
   * steps out again with a wave.
   */
  private async roam() {
    const token = ++this.roamToken;
    const alive = () => token === this.roamToken && (this.mood === "roam" || this.mood === "hide");
    // Phones: up out of the way of the question sheet first
    const first = this.roamBox();
    if (isPhone() && this.walkY > first.y1) await this.walkTo(this.walkX, first.y1, 3);
    else await this.wait(400);
    while (alive()) {
      // A short stroll near the card, and a pause
      const b = this.roamBox();
      const near = isPhone()
        ? {
            x0: Math.max(b.x0, -90),
            x1: Math.min(b.x1, 90),
            y0: Math.max(b.y0, b.y1 - 30),
            y1: b.y1,
          }
        : {
            x0: Math.max(b.x0, b.x1 - 180),
            x1: b.x1,
            y0: Math.max(b.y0, -30),
            y1: Math.min(b.y1, 30),
          };
      await this.walkTo(rand(near.x0, near.x1), rand(near.y0, near.y1), 8);
      if (!alive()) return;
      const pauses: [GestureName, number][] = [
        ["peek", 1400],
        ["wave", 1300],
        ["look", 1600],
        ["tapfoot", 1200],
      ];
      const [name, dur] = pick(pauses);
      await this.playGesture(name, dur);
      if (!alive()) return;
      await this.wait(rand(500, 1000));
      if (!alive()) return;
      // Hide and peek
      if (!(await this.peekaboo(alive))) await this.wait(rand(800, 1400));
    }
  }

  /** Slips behind the card and peeks out. Resolves false if the card can't hide him now. */
  private async peekaboo(alive: () => boolean) {
    let m = this.measure();
    const c = m.card;
    let peekAt: Point;
    let duckAt: Point;
    if (isPhone()) {
      // Behind the sheet: only his head shows above its top edge
      const x = clamp(m.cx + rand(-60, 60), c.left + 70, c.right - 70);
      if (c.bottom < c.top + 120) return false;
      peekAt = this.offsetFor(m, x, c.top + (FEET - 148) * m.k);
      duckAt = this.offsetFor(m, x, c.top + (FEET - 2) * m.k);
    } else {
      // Behind the card's left edge: the card must cover his whole height
      if (c.top > m.feetY - (FEET - EARS) * m.k || c.bottom < m.feetY + 6) return false;
      peekAt = this.offsetFor(m, c.left + 10, m.feetY);
      duckAt = this.offsetFor(m, c.left + 74, m.feetY);
    }
    // Into hiding
    this.setMood("roam");
    if (isPhone()) await this.moveTo(peekAt.x, peekAt.y, 520, "slide");
    else await this.walkTo(peekAt.x, peekAt.y, 6);
    if (!alive()) return true;
    this.setMood("hide");
    await this.wait(rand(2200, 3400));
    if (!alive()) return true;
    // Ducks right out of sight... and pops back out
    await this.moveTo(duckAt.x, duckAt.y, 260, "slide");
    if (!alive()) return true;
    await this.wait(rand(600, 1000));
    if (!alive()) return true;
    await this.moveTo(peekAt.x, peekAt.y, 320, "hop", 10);
    if (!alive()) return true;
    await this.wait(rand(1800, 2800));
    if (!alive()) return true;
    // Steps back out with a wave
    this.setMood("roam");
    m = this.measure();
    const b = this.roamBox();
    if (isPhone()) await this.moveTo(this.walkX, b.y1, 420, "hop", 24);
    else await this.walkTo(b.x1 - rand(0, 60), clamp(0, b.y0, b.y1), 6);
    if (!alive()) return true;
    await this.playGesture("wave", 1300);
    return true;
  }

  // Idle reaction: after 15s with no activity Nova sits down, yawns and waves for attention
  private checkIdle(now: number) {
    if (this.napping || this.reduced || this.busy || this.walk || !this.landed || this.seated)
      return;
    if (!(this.phase === "q1" || this.phase === "q2" || this.phase === "q3")) return;
    if (this.mood === "hide") return;
    if (now - this.lastActivity < IDLE_MS) return;
    this.napping = this.mood;
    this.stopRoam();
    this.setMood("nap");
    this.snore();
    this.els.agent.classList.add("nova-yawning");
    void this.wait(1500).then(() => this.els.agent.classList.remove("nova-yawning"));
  }

  /** Little "z"s float up from his head while he naps */
  private snore() {
    window.clearTimeout(this.zTimer);
    if (this.mood !== "nap" || !this.loopOn) return;
    const r = this.agentRect();
    const k = r.height / VB_H;
    const z = document.createElement("span");
    z.className = "nova-z";
    z.textContent = "z";
    z.setAttribute("aria-hidden", "true");
    const size = 14 + Math.random() * 10;
    Object.assign(z.style, {
      left: `${(r.left + r.width / 2 + 40 * k).toFixed(1)}px`,
      top: `${(r.top + 40 * k).toFixed(1)}px`,
      fontSize: `${size.toFixed(0)}px`,
    });
    this.els.stage.appendChild(z);
    void this.anim(
      z,
      [
        { transform: "translate(0,0) rotate(-8deg)", opacity: 0 },
        { opacity: 1, offset: 0.2 },
        { transform: `translate(${rand(18, 40).toFixed(0)}px, -70px) rotate(12deg)`, opacity: 0 },
      ],
      { duration: 2200, easing: "ease-out" },
    ).then(() => z.remove());
    this.zTimer = window.setTimeout(() => this.snore(), 900);
  }

  private wakeUp() {
    window.clearTimeout(this.zTimer);
    const back = this.napping ?? "idle";
    this.napping = null;
    this.els.agent.classList.remove("nova-yawning");
    this.setMood(back);
    void this.playGesture("hop", 600);
    if (back === "roam" || back === "hide") {
      this.setMood("roam");
      void this.roam();
    }
  }

  /** The visitor is active again (e.g. a new step started): restart the idle timer */
  touch() {
    this.lastActivity = performance.now();
  }

  // ---------- Question 2: ladder (desktop) or rope (phones) onto the card, then sits ----------
  private measure(): Measure {
    const r = this.agentRect();
    const k = r.height / VB_H;
    return {
      r,
      k,
      cx: r.left + r.width / 2,
      feetY: r.top + FEET * k,
      groundY: r.top - this.walkY + FEET * k,
      card: this.els.card.getBoundingClientRect(),
    };
  }

  /** Phones: the lowest his feet may go, clear of the question sheet at its tallest */
  private phoneFloor(m: Measure) {
    return Math.min(m.groundY, sheetTop(window.innerHeight) - 30);
  }

  /** Walk offset that puts Nova's centre at x and the soles of his feet at feetY */
  private offsetFor(m: Measure, x: number, feetY: number): Point {
    return { x: this.walkX + x - m.cx, y: this.walkY + feetY - m.feetY };
  }

  /** Size that lets him sit on the card with his ears below the top buttons */
  private seatSize(m: Measure) {
    const avoid = this.els.avoid();
    const ceiling = isPhone() ? Math.max(0, ...avoid.map((b) => b.bottom)) + 8 : 8;
    return clamp((m.card.top - ceiling) / ((SEAT - EARS) * m.k), 0.35, 1);
  }

  /** Where along the card's top edge he sits, keeping clear of the top buttons */
  private seatX(m: Measure, f: number) {
    const c = m.card;
    const half = 80 * m.k * f + 6;
    if (isPhone()) return clamp(m.cx, c.left + 60, c.right - 60);
    const lo = c.left + 18 + half;
    const hi = c.right - 18 - half;
    const ears = c.top - (SEAT - EARS) * m.k * f;
    const btns = this.els.avoid().filter((b) => b.bottom > ears - 4);
    if (!btns.length) return (lo + hi) / 2;
    const nl = Math.min(...btns.map((b) => b.left)) - 18;
    const nr = Math.max(...btns.map((b) => b.right)) + 18;
    const spans = (
      [
        [lo, Math.min(hi, nl - half)],
        [Math.max(lo, nr + half), hi],
      ] as [number, number][]
    ).filter((s) => s[1] >= s[0]);
    if (!spans.length) return Math.max(c.left + 4, Math.min(lo, nl - half));
    spans.sort((a, b) => b[1] - b[0] - (a[1] - a[0]));
    return (spans[0][0] + spans[0][1]) / 2;
  }

  /** Seat: knees on the card's top edge, shins hanging over the front */
  private seatSpot(m: Measure) {
    const f = this.seatSize(m);
    const x = this.seatX(m, f);
    return { ...this.offsetFor(m, x, m.card.top + (FEET - SEAT) * m.k * f), size: f, screenX: x };
  }

  private removeProp() {
    this.prop?.remove();
    this.prop = null;
    this.carrying = null;
  }

  private makeLadder(foot: Point, top: Point) {
    this.removeProp();
    const len = Math.hypot(top.x - foot.x, foot.y - top.y);
    const ang = (Math.atan2(top.x - foot.x, foot.y - top.y) * 180) / Math.PI;
    const prop = document.createElement("div");
    prop.className = "nova-ladder";
    Object.assign(prop.style, {
      left: `${foot.x - 23}px`,
      top: `${foot.y - len}px`,
      height: `${len}px`,
      transform: `rotate(${ang}deg)`,
    });
    this.els.stage.appendChild(prop);
    this.prop = prop;
    return ang;
  }

  /** While carried, the ladder is held up above his head, sticking out ahead */
  private carriedTransform() {
    const r = this.agentRect();
    const k = r.height / VB_H;
    const fx = r.left + r.width / 2 - 46 * k;
    const fy = r.top + 34 * k;
    const foot = this.carrying!.foot;
    return `translate(${(fx - foot.x).toFixed(1)}px, ${(fy - foot.y).toFixed(1)}px) rotate(90deg)`;
  }

  private showRope(x: number, bottom: number) {
    this.removeProp();
    const prop = document.createElement("div");
    prop.className = "nova-rope";
    Object.assign(prop.style, { left: `${x}px`, height: `${bottom}px` });
    this.els.stage.appendChild(prop);
    this.prop = prop;
    if (!this.reduced)
      prop.animate([{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], {
        duration: 350,
        easing: "ease-out",
      });
  }

  private stopPerch() {
    this.perchToken++;
  }

  /** While sitting: shins swing, and now and then he peeks at the answers, looks around or kicks */
  private async perch() {
    const token = ++this.perchToken;
    const alive = () => token === this.perchToken && this.mood === "perch";
    while (alive()) {
      await this.wait(rand(2000, 3800));
      if (!alive()) return;
      const acts: [GestureName, number][] = [
        ["readdown", 1500],
        ["look", 1600],
        ["kick", 900],
        ["readdown", 1500],
      ];
      const [name, dur] = pick(acts);
      await this.playGesture(name, dur);
    }
  }

  private sitDown() {
    this.seated = true;
    this.aloft = false;
    this.seatCardTop = this.els.card.getBoundingClientRect().top;
    this.setMood("perch");
    void this.perch();
  }

  private setStageFlag(name: "q2" | "front", on: boolean) {
    if (on) this.els.stage.dataset[name] = "";
    else delete this.els.stage.dataset[name];
  }

  /** The card moves while its layout changes for question 2; measure it without the transition */
  private settleCard() {
    const card = this.els.card;
    const previous = card.style.transition;
    card.style.transition = "none";
    void card.offsetWidth;
    requestAnimationFrame(() => (card.style.transition = previous));
  }

  /** Fetches a ladder and climbs onto the card (desktop), or slides down a rope (phones), then sits. */
  async climbToSeat() {
    const token = ++this.seatRun;
    const run = this.run;
    const alive = () => run === this.run && token === this.seatRun;
    this.stopRoam();
    this.napping = null;
    this.setMood("idle");
    this.facingBack = false;
    this.climbTilt = 0;
    this.setStageFlag("q2", true);
    if (this.reduced) {
      this.placeSeated();
      return;
    }
    if (isPhone()) {
      const b = this.roamBox();
      if (this.walkY > b.y1) await this.moveTo(this.walkX, b.y1, 350, "hop", 20);
      await this.wait(300); // the sheet settles into its question-2 size
      if (!alive()) return;
      this.setStageFlag("front", true);
      const seat = this.seatSpot(this.measure());
      await this.walkTo(seat.x, this.walkY, 3); // line up above the seat
      if (!alive()) return;
      const m = this.measure();
      const s2 = this.seatSpot(m);
      this.showRope(s2.screenX, m.card.top + 8);
      this.setMood("rope");
      await this.wait(250);
      if (!alive()) return;
      this.seated = true; // legs swap to sitting as he lands
      await this.moveTo(s2.x, s2.y, 700, "slide", 0, s2.size);
      if (!alive()) return;
      this.removeProp();
      this.sitDown();
      return;
    }

    // 1. Runs off the bottom of the screen (the nearest edge) to fetch a ladder
    let m = this.measure();
    const offscreen = this.offsetFor(m, m.cx, window.innerHeight + 24 + FEET * m.k);
    await this.walkTo(offscreen.x, offscreen.y, 1.6, 650);
    if (!alive()) return;
    m = this.measure();
    const foot = { x: m.card.left - 64, y: m.groundY };
    const top = { x: m.card.left + 8, y: m.card.top + 10 };
    const ang = this.makeLadder(foot, top);
    this.carrying = { foot };
    this.prop!.style.transform = this.carriedTransform();
    this.setMood("carry");
    await this.wait(150);
    if (!alive()) return;
    // 2. Comes back carrying it over his head
    await this.walkTo(this.walkX + (foot.x + 46 * m.k) - m.cx, 0, 2, 750);
    if (!alive() || !this.prop) return;
    // 3. Tips it up against the card
    const from = this.carriedTransform();
    this.carrying = null;
    this.setMood("push");
    this.prop.style.transform = `rotate(${ang}deg)`;
    await this.anim(this.prop, [{ transform: from }, { transform: `rotate(${ang}deg)` }], {
      duration: 450,
      easing: "cubic-bezier(.4,1.4,.6,1)",
      fill: "none",
    });
    if (!alive()) return;
    // 4. Steps up to the foot of the ladder, turns to face it and grabs the rails
    this.setStageFlag("front", true);
    m = this.measure();
    const f = this.seatSize(m);
    const base = this.offsetFor(m, foot.x, foot.y);
    await this.walkTo(base.x, base.y, 3, 400);
    if (!alive()) return;
    this.setMood("climb");
    await this.turnRound(true);
    if (!alive()) return;
    this.climbTilt = ang * 0.8;
    await this.wait(120);
    if (!alive()) return;
    // 5. Climbs hand over hand, rung by rung, getting smaller as he goes up so he fits above the card
    m = this.measure();
    const peak = this.offsetFor(m, top.x - 4, top.y + 4);
    const rise = Math.hypot(peak.x - this.walkX, peak.y - this.walkY);
    const steps = clamp(Math.round(rise / 46), 4, 9);
    this.aloft = true;
    await this.moveTo(peak.x, peak.y, steps * 290, "climb", steps, f);
    if (!alive()) return;
    // 6. Climbs over the top onto the card, turning round to face the visitor as he goes
    this.climbTilt = 0;
    void this.turnRound(false);
    this.setMood("idle");
    m = this.measure();
    const onCard = this.offsetFor(m, m.card.left + 26 + 80 * m.k * f, m.card.top);
    await this.moveTo(onCard.x, onCard.y, 380, "hop", 22);
    if (!alive()) return;
    if (this.prop) {
      const ladder = this.prop;
      this.prop = null;
      void this.anim(ladder, [{ opacity: 1 }, { opacity: 0 }], { duration: 400 }).then(() =>
        ladder.remove(),
      );
    }
    m = this.measure();
    const seat = this.seatSpot(m);
    const above = this.offsetFor(m, seat.screenX, m.card.top);
    await this.walkTo(above.x, above.y, 1.7, 550);
    if (!alive()) return;
    // 7. Sits down: legs swing out over the edge
    this.seated = true;
    await this.moveTo(seat.x, seat.y, 250, "slide", 0, seat.size);
    if (!alive()) return;
    this.sitDown();
  }

  /** Sitting on the card straight away (Back, resuming, reduced motion, resize). */
  placeSeated() {
    this.seatRun++;
    this.stopRoam();
    this.stopPerch();
    this.napping = null;
    this.setStageFlag("q2", true);
    this.setStageFlag("front", true);
    this.settleCard();
    this.resolveWalk();
    this.removeProp();
    this.faceFront();
    const seat = this.seatSpot(this.measure());
    this.walkX = seat.x;
    this.walkY = seat.y;
    this.size = seat.size;
    this.clearCracker();
    this.stickOn = false;
    this.sitDown();
  }

  /** Off the card and back to the ground beside it. */
  private leaveSeat() {
    this.seatRun++;
    this.stopPerch();
    const wasUp = this.seated || "q2" in this.els.stage.dataset;
    this.seated = false;
    this.chuteOpen = false;
    if (!wasUp) return;
    this.resolveWalk();
    this.removeProp();
    this.setStageFlag("q2", false);
    this.setStageFlag("front", false);
    this.settleCard();
    // Back on the ground beside the card (phones: above the sheet)
    this.size = 1;
    const b = this.roamBox();
    this.walkX = clamp(this.walkX, b.x0, b.x1);
    this.walkY = clamp(0, b.y0, b.y1);
  }

  /** Question 1 straight away (Back from question 2) */
  placeRoaming() {
    this.newRun();
    this.leaveSeat();
    this.clearCracker();
    this.stickOn = false;
    this.startRoam();
  }

  // ---------- Question 3: parachute float, cracker with a long fuse, lit on submit ----------
  /** Question 2 answered: fist pump, jumps off the card, floats down under the parachute, sets up the cracker. */
  async floatDownAndPrepare() {
    const run = this.run;
    this.stopPerch();
    this.setMood("idle");
    void this.playGesture("fistpump", 900);
    await this.wait(900);
    if (run !== this.run) return;
    await this.floatDown();
    if (run !== this.run) return;
    void this.prepareCracker();
  }

  private async floatDown() {
    const token = ++this.seatRun;
    const run = this.run;
    const alive = () => run === this.run && token === this.seatRun;
    this.stopPerch();
    this.removeProp();
    const m = this.measure();
    const land = isPhone()
      ? this.offsetFor(m, m.cx, this.phoneFloor(m))
      : this.offsetFor(m, m.card.left - 28 - 80 * m.k, m.groundY);
    if (this.reduced) {
      this.seated = false;
      this.walkX = land.x;
      this.walkY = land.y;
      this.size = 1;
      this.setStageFlag("q2", false);
      this.setStageFlag("front", false);
      return;
    }
    this.setMood("idle");
    this.seated = false;
    // Jumps up and away from the card (phones: a little above his usual spot, so the canopy
    // stays below the top buttons; desktop: out to the left and a little down)
    await this.moveTo(
      this.walkX + (isPhone() ? 0 : -80),
      isPhone() ? -24 : this.walkY + 24,
      380,
      "hop",
      18,
    );
    if (!alive()) return;
    this.chuteOpen = true;
    this.setMood("float");
    await this.moveTo(land.x, land.y, isPhone() ? 1500 : 2000, "float", 0, 1);
    this.chuteOpen = false;
    if (!alive()) return;
    this.setMood("idle");
    void this.playGesture("land", 450);
    this.dust(6);
    this.setStageFlag("q2", false);
    this.setStageFlag("front", false);
    this.settleCard();
  }

  private clearCracker() {
    this.prepRun++;
    this.kit?.el.remove();
    this.kit = null;
  }

  /**
   * Where everything goes (Nova on the ground, walkY = 0): Nova at the left of the open area,
   * the cracker further right (left of the card on desktop, at the right edge on phones), and
   * the thread on the ground between them.
   */
  private crackerLayout(): CrackerLayout {
    if (this.landed) this.applyFlyer();
    const m = this.measure();
    const k = m.k;
    const sc = k / 0.8;
    // Phones: the ground line sits above the form sheet at its tallest
    const feet = isPhone() ? this.phoneFloor(m) : m.groundY;
    const ground = feet - 2 * sc;
    const W = window.innerWidth;
    const right = isPhone() ? W - 12 : Math.min(W - 12, m.card.left - 16);
    const novaCx = Math.max(12 + 104 * k, isPhone() ? 0 : m.card.left - 560 * sc);
    const tip = { x: novaCx + 115 * k, y: ground };
    const w = 48 * sc;
    const h = 94 * sc;
    const cx = Math.max(tip.x + 50 * sc, Math.min(right - w / 2 - 4, tip.x + 330 * sc));
    const base = { x: cx - 10 * sc, y: ground - 3 * sc };
    // How far the thread may loop towards the viewer: on screen and above the phone sheet
    const floor = (isPhone() ? sheetTop(window.innerHeight) : window.innerHeight) - 8;
    const gap = base.x - tip.x;
    const want = gap < 160 * sc ? (240 * sc - gap) * 0.45 : clamp(gap * 0.3, 12 * sc, 40 * sc);
    const dip = Math.max(4, Math.min(floor - ground, want));
    return {
      sc,
      ground,
      nova: this.offsetFor(m, novaCx, feet),
      placeAt: this.offsetFor(m, cx - 118 * k, feet),
      cracker: { x: cx, w, h },
      tip,
      base,
      dip,
    };
  }

  /** A long, loose thread: from the cracker's base it loops forward and wanders back to Nova */
  private threadPath(L: CrackerLayout) {
    const a = L.base;
    const b = L.tip;
    const dx = b.x - a.x;
    const d = L.dip;
    const p = (f: number, dy: number) =>
      `${(a.x + dx * f).toFixed(1)} ${(L.ground + dy).toFixed(1)}`;
    if (-dx < 160 * L.sc)
      return `M${a.x.toFixed(1)} ${a.y.toFixed(1)} C${p(-0.35, d * 1.3)} ${p(1.35, d * 1.3)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    return (
      `M${a.x.toFixed(1)} ${a.y.toFixed(1)} C${p(0.05, d * 0.9)} ${p(0.3, d)} ${p(0.42, d * 0.55)} ` +
      `S${p(0.62, -d * 0.05)} ${p(0.72, d * 0.35)} S${p(0.95, d * 0.25)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`
    );
  }

  private buildCracker(L: CrackerLayout, ready: boolean): Kit {
    this.kit?.el.remove();
    const el = document.createElement("div");
    el.className = "nova-kit";
    const d = this.threadPath(L);
    const sw = (2.6 * L.sc).toFixed(1);
    el.innerHTML =
      `<svg class="nova-thread" width="1" height="1" aria-hidden="true">` +
      `<path class="nova-ash" d="${d}" fill="none" stroke="#8d8d8d" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="2 5" opacity=".55" style="display:none"/>` +
      `<path class="nova-thread-line" d="${d}" fill="none" stroke="#8a5a30" stroke-width="${sw}" stroke-linecap="round"/>` +
      `</svg>` +
      `<div class="nova-cracker" style="left:${(L.cracker.x - L.cracker.w / 2).toFixed(1)}px;top:${(L.ground - L.cracker.h).toFixed(1)}px;` +
      `width:${L.cracker.w.toFixed(1)}px;height:${L.cracker.h.toFixed(1)}px">${CRACKER_SVG}</div>`;
    this.els.stage.appendChild(el);
    const thread = el.querySelector<SVGPathElement>(".nova-thread-line")!;
    const len = thread.getTotalLength();
    thread.style.strokeDasharray = `${len} ${len}`;
    thread.style.strokeDashoffset = ready ? "0" : String(len);
    const kit: Kit = {
      el,
      cracker: el.querySelector<HTMLElement>(".nova-cracker")!,
      thread,
      ash: el.querySelector<SVGPathElement>(".nova-ash")!,
      len,
      layout: L,
      ready,
    };
    if (!ready) kit.cracker.style.opacity = "0";
    this.kit = kit;
    return kit;
  }

  /** Everything set up straight away (Back, resuming, reduced motion, resize). */
  placeCracker() {
    this.prepRun++;
    this.newRunSoft();
    this.seated = false;
    this.chuteOpen = false;
    this.size = 1;
    this.setStageFlag("q2", false);
    this.setStageFlag("front", false);
    this.settleCard();
    const L = this.crackerLayout();
    this.walkX = L.nova.x;
    this.walkY = L.nova.y;
    this.buildCracker(L, true);
    this.stickOn = true;
    this.setMood("guard");
  }

  /** Stops movement in progress without cancelling the conversation run */
  private newRunSoft() {
    this.seatRun++;
    this.stopRoam();
    this.stopPerch();
    this.resolveWalk();
    this.removeProp();
  }

  /** While the visitor fills in the form: sets the cracker down, unrolls the thread, lights an incense stick. */
  private async prepareCracker() {
    if (this.kit?.ready) return;
    const token = ++this.prepRun;
    const run = this.run;
    const alive = () => run === this.run && token === this.prepRun;
    if (this.reduced) return this.placeCracker();
    const L = this.crackerLayout();
    const kit = this.buildCracker(L, false);
    // 1. Over to where the cracker goes; sets it down
    this.setMood("idle");
    await this.walkTo(L.placeAt.x, L.placeAt.y, 3.5);
    if (!alive()) return;
    void this.playGesture("crouch", 700);
    await this.wait(260);
    if (!alive()) return;
    kit.cracker.style.opacity = "";
    kit.cracker.animate(
      [
        { transform: "translateY(-26px) scale(.5)", opacity: 0 },
        { transform: "translateY(0) scale(1.08)", opacity: 1, offset: 0.7 },
        { transform: "none" },
      ],
      { duration: 420, easing: "ease-out" },
    );
    await this.wait(500);
    if (!alive()) return;
    // 2. Walks back to the left, the thread unrolling behind him
    const dur = Math.max(900, Math.abs(L.nova.x - this.walkX) * 6);
    kit.thread.animate([{ strokeDashoffset: kit.len }, { strokeDashoffset: 0 }], {
      duration: dur,
      easing: "ease-in-out",
      fill: "forwards",
    });
    await this.moveTo(L.nova.x, L.nova.y, dur, "walk");
    if (!alive()) return;
    kit.thread.getAnimations().forEach((a) => a.cancel());
    kit.thread.style.strokeDashoffset = "0";
    kit.ready = true;
    // 3. Lights an incense stick and holds it ready
    this.stickOn = true;
    void this.playGesture("fistpump", 700);
    this.setMood("guard");
  }

  /** Each newly filled-in form field gets a nod */
  fieldsChanged(filled: number) {
    if (filled > this.lastFilled && this.kit && !this.reduced && !this.gesture && !this.walk)
      void this.playGesture("nod", 500);
    this.lastFilled = filled;
  }

  /** Form error: shakes his head and points at the form */
  reactToError() {
    if (this.reduced || !this.landed) return;
    const back = this.mood;
    this.setMood("point");
    void this.playGesture("shake", 900).then(() => {
      if (this.mood === "point") this.setMood(back === "point" ? "guard" : back);
    });
  }

  /**
   * Submit: Nova crouches and lights the end of the thread, the flame runs to the cracker while
   * he covers his ears, the cracker fountains and fires shells that burst across the sky.
   * Resolves at the moment the thank-you should appear (bursts carry on behind it), or false
   * if cancelled.
   */
  async lightCracker(): Promise<boolean> {
    this.stageBusy = true;
    try {
      return await this.lightCrackerRun();
    } finally {
      this.stageBusy = false;
    }
  }

  private async lightCrackerRun() {
    const run = this.run;
    const alive = () => run === this.run;
    if (!this.kit?.ready) this.placeCracker();
    const k = this.kit!;
    const L = k.layout;
    this.stickOn = true;
    this.setMood("guard");
    const crouching = this.playGesture("crouch", 900);
    await this.wait(330);
    if (!alive()) return false;
    const flame = document.createElement("div");
    flame.className = "nova-flame";
    const at = (len: number) => {
      const pt = k.thread.getPointAtLength(len);
      return `translate(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px)`;
    };
    flame.style.transform = at(k.len);
    k.el.appendChild(flame);
    let burning: Animation | null = null;
    const progressOf = (a: Animation) => {
      const p = a.effect?.getComputedTiming().progress;
      return p == null ? 1 : p;
    };
    this.emitters.push({
      kind: "fuse",
      pos: () => k.thread.getPointAtLength(k.len * (1 - (burning ? progressOf(burning) : 0))),
      alive: () => flame.isConnected,
    });
    await crouching;
    if (!alive()) return false;
    // The flame runs along the thread, burning it away, while Nova covers his ears
    this.stickOn = false;
    this.setMood("ears");
    const burn = clamp(k.len / 0.28, 1000, 1800);
    const N = 40;
    k.ash.style.display = "";
    k.thread.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: k.len }], {
      duration: burn,
      easing: "linear",
      fill: "forwards",
    });
    burning = flame.animate(
      Array.from({ length: N + 1 }, (_, i) => ({ transform: at(k.len * (1 - i / N)) })),
      { duration: burn, easing: "linear", fill: "forwards" },
    );
    await burning.finished.catch(() => undefined);
    flame.remove();
    if (!alive()) return false;
    // A fountain of sparks from the top, the cracker shaking
    const spout = { x: L.cracker.x, y: L.ground - L.cracker.h };
    let fountainOn = true;
    this.emitters.push({ kind: "fountain", pos: () => spout, alive: () => fountainOn && alive() });
    k.cracker.classList.add("lit");
    k.cracker.animate(
      [
        { transform: "rotate(0)" },
        { transform: "rotate(-3deg)" },
        { transform: "rotate(3deg)" },
        { transform: "rotate(0)" },
      ],
      { duration: 160, iterations: 6 },
    );
    await this.wait(600);
    if (!alive()) return false;
    // Six shells fly up one after another; Nova starts cheering after the second
    for (let i = 0; i < 6; i++) {
      this.launchShell(spout.x, spout.y, run);
      if (i === 1) {
        this.setMood("celebrate");
        void this.playGesture("jump", 700)
          .then(() => (alive() ? this.playGesture("spin", 800) : undefined))
          .then(() => (alive() ? this.playGesture("jump", 700) : undefined));
      }
      await this.wait(300);
      if (!alive()) return false;
    }
    fountainOn = false;
    // Finale, then the spent cracker fades away
    for (const ms of [250, 550]) {
      void this.wait(ms).then(() => {
        if (!alive()) return;
        const W = window.innerWidth;
        const H = window.innerHeight;
        this.burst(W * rand(0.15, 0.45), H * rand(0.12, 0.3));
        this.burst(W * rand(0.55, 0.85), H * rand(0.12, 0.3));
      });
    }
    k.ash.animate([{ opacity: 0.55 }, { opacity: 0 }], {
      duration: 1000,
      delay: 600,
      fill: "forwards",
    });
    k.cracker.animate(
      [
        { filter: "none", opacity: 1 },
        { filter: "brightness(.45) grayscale(.6)", opacity: 1, offset: 0.3 },
        { filter: "brightness(.45) grayscale(.6)", opacity: 0 },
      ],
      { duration: 1600, fill: "forwards" },
    );
    await this.wait(700);
    return alive();
  }

  private launchShell(x0: number, y0: number, run: number) {
    const el = document.createElement("div");
    el.className = "nova-shell";
    Object.assign(el.style, { left: `${x0.toFixed(1)}px`, top: `${y0.toFixed(1)}px` });
    this.els.stage.appendChild(el);
    const W = window.innerWidth;
    const H = window.innerHeight;
    const ax = clamp(x0 + rand(-220, 220), 60, W - 60);
    const ay = Math.max(50, Math.min(y0 - 70, H * rand(0.1, 0.32))); // always climbs
    const climb = el.animate(
      [
        { transform: "translate(0,0)" },
        { transform: `translate(${(ax - x0).toFixed(1)}px, ${(ay - y0).toFixed(1)}px)` },
      ],
      { duration: 900, easing: "cubic-bezier(.2,.65,.4,1)", fill: "forwards" },
    );
    this.emitters.push({
      kind: "trail",
      alive: () => el.isConnected,
      pos: () => {
        const p = climb.effect?.getComputedTiming().progress ?? 1;
        return { x: x0 + (ax - x0) * p, y: y0 + (ay - y0) * p + 5 };
      },
    });
    void climb.finished
      .catch(() => undefined)
      .then(() => {
        el.remove();
        if (run === this.run) this.burst(ax, ay);
      });
  }

  /**
   * Ending: Nova bows, holds up a "Goodbye!" sign, his plane swoops back, he hops on and flies
   * off. onGoodbye fires as the sign goes up (to say the line); onLeaving as he flies off
   * (to fade the overlay out behind him).
   */
  async flyAway(cues: { onGoodbye: () => void; onLeaving: () => void }) {
    this.stageBusy = true;
    try {
      await this.flyAwayRun(cues);
    } finally {
      this.stageBusy = false;
    }
  }

  private async flyAwayRun({
    onGoodbye,
    onLeaving,
  }: {
    onGoodbye: () => void;
    onLeaving: () => void;
  }) {
    const run = this.run;
    const alive = () => run === this.run;
    const { flyer, agent, planeBack, planeFront, trail } = this.els;
    this.clearCracker();
    this.stickOn = false;
    this.stopRoam();
    this.stopPerch();
    if (this.reduced) return;
    this.setMood("idle");
    // Out into the open area first, so the plane has room to land around him
    const b = this.roamBox();
    await this.walkTo((b.x0 + b.x1) / 2, isPhone() ? 150 : 0, 4);
    if (!alive()) return;
    await this.playGesture("bow", 900);
    if (!alive()) return;
    this.rig.signTop.textContent = "See you soon!";
    this.rig.signMain.textContent = "Goodbye!";
    this.setMood("sign");
    onGoodbye();
    await this.wait(1100);
    if (!alive()) return;
    // The plane comes back from the left. Mirrored about its centre so the nose points right.
    const s = isPhone() ? 0.7 : 1;
    for (const el of [planeBack, planeFront, trail]) {
      el.getAnimations().forEach((a) => a.cancel());
      el.style.opacity = "";
    }
    trail.style.transformOrigin = "-90px 15px";
    const MIRROR = "translateX(40px) scaleX(-1)";
    const pr = planeFront.getBoundingClientRect();
    const inX = -(pr.right + 80) / s;
    const inY = (-window.innerHeight * 0.22) / s;
    const swoop: KeyframeAnimationOptions = { duration: 1300, easing: "cubic-bezier(.2,.8,.3,1)" };
    const frames = flightPath(
      [
        { x: inX, y: inY, s: 1 },
        { x: inX * 0.45, y: inY * 0.2 + 30, s: 1 },
        { x: 40, y: -6, s: 1 },
        { x: 0, y: 0, s: 1 },
      ],
      "right",
    ).map((p) => ({
      offset: p.offset,
      transform: `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) rotate(${p.deg.toFixed(2)}deg) ${MIRROR}`,
    }));
    this.startContrail(() => {
      const r = planeFront.getBoundingClientRect();
      return { x: r.left + r.width * 0.06, y: r.top + r.height * 0.12 };
    });
    await Promise.all([
      this.anim(planeBack, frames, swoop),
      this.anim(planeFront, frames, swoop),
      this.anim(trail, frames, swoop),
    ]);
    if (!alive()) return;
    this.contrailOn = false;
    // Hops on: rises easing out, drops easing in
    await this.anim(
      agent,
      [
        { transform: "translateY(0)", easing: "cubic-bezier(.3,.7,.5,1)" },
        { transform: "translateY(-140px)", offset: 0.55, easing: "cubic-bezier(.5,0,.7,.4)" },
        { transform: "translateY(-102px)" },
      ],
      { duration: 650 },
    );
    agent.style.top = `${AGENT_LANDED_TOP - 102}px`;
    agent.getAnimations().forEach((a) => a.cancel());
    if (!alive()) return;
    await this.wait(500);
    // Flies off to the bottom right, where he first came in, nose first
    this.landed = false;
    this.startContrail(() => {
      const r = planeFront.getBoundingClientRect();
      return { x: r.left + r.width * 0.06, y: r.top + r.height * 0.12 };
    });
    const from = flyer.style.transform;
    const fr = planeFront.getBoundingClientRect();
    const outX = (window.innerWidth - fr.left + 120) / s;
    const outY = (window.innerHeight - fr.top + 120) / s;
    const out = flightPath(
      [
        { x: 0, y: 0, s: 1 },
        { x: outX * 0.25, y: -40, s: 1 },
        { x: outX * 0.6, y: outY * 0.35, s: 1 },
        { x: outX, y: outY, s: 1 },
      ],
      "right",
      48,
      false,
    );
    out[0].deg = 0;
    const fly = this.anim(
      flyer,
      out.map((p, i) => ({
        offset: p.offset,
        transform: `${from} translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) rotate(${(p.deg * Math.min(1, i / 6)).toFixed(2)}deg)`,
      })),
      { duration: 1800, easing: "cubic-bezier(.45,0,.75,.6)" },
    );
    await this.wait(1100);
    onLeaving();
    await fly;
    this.contrailOn = false;
  }

  // ---------- Fireworks (canvas behind Nova and the card) ----------
  private burst(x: number, y: number) {
    const colour = pick(FIREWORK_COLOURS);
    const count = 80 + Math.floor(Math.random() * 20);
    this.sparks.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0,
      max: 0.22,
      colour: "#ffffff",
      size: 26,
      flash: true,
    });
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 90 + Math.random() * 230;
      this.sparks.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 0,
        max: 1.1 + Math.random() * 0.9,
        colour: i % 7 ? colour : "#ffd166",
        size: 2.2 + Math.random() * 1.8,
      });
    }
  }

  /** Soft puffs behind the plane while it flies (every other frame) */
  private startContrail(pos: () => { x: number; y: number }) {
    if (this.reduced) return;
    this.contrailOn = true;
    let frame = 0;
    this.emitters.push({
      kind: "contrail",
      pos,
      alive: () => this.contrailOn && this.loopOn && frame++ >= 0,
    });
  }

  /** Dust kicked up at his feet */
  private dust(n: number) {
    if (this.reduced || this.sparks.length > MAX_SPARKS) return;
    const r = this.agentRect();
    const k = r.height / VB_H;
    const x = r.left + r.width / 2;
    const y = r.top + (FEET - 4) * k;
    for (let i = 0; i < n; i++) {
      const dir = i % 2 ? 1 : -1;
      this.sparks.push({
        x: x + dir * rand(10, 30) * k * 1.2,
        y,
        vx: dir * rand(25, 70),
        vy: -rand(8, 26),
        life: 0,
        max: rand(0.5, 0.8),
        colour: "#d9cfc6",
        size: rand(5, 9) * k * 1.25,
        puff: true,
      });
    }
  }

  private emit() {
    if (this.sparks.length > MAX_SPARKS) return;
    for (let j = this.emitters.length - 1; j >= 0; j--) {
      const em = this.emitters[j];
      if (!em.alive()) {
        this.emitters.splice(j, 1);
        continue;
      }
      const { x, y } = em.pos();
      if (em.kind === "contrail") {
        if (Math.random() < 0.45) continue;
        this.sparks.push({
          x: x + rand(-3, 3),
          y: y + rand(-3, 3),
          vx: rand(-8, 8),
          vy: rand(-6, 2),
          life: 0,
          max: rand(0.9, 1.3),
          colour: "#ffffff",
          size: rand(5, 8),
          puff: true,
        });
        continue;
      }
      const n = em.kind === "fountain" ? 7 : 3;
      for (let i = 0; i < n; i++) {
        const colour = pick(SPARK_GOLD);
        if (em.kind === "fountain")
          this.sparks.push({
            x: x + rand(-3, 3),
            y,
            vx: rand(-75, 75),
            vy: -rand(230, 400),
            life: 0,
            max: rand(0.7, 1.1),
            colour,
            size: rand(1.6, 2.8),
          });
        else if (em.kind === "fuse")
          this.sparks.push({
            x,
            y,
            vx: rand(-90, 90),
            vy: -rand(40, 150),
            life: 0,
            max: rand(0.25, 0.5),
            colour,
            size: rand(1.2, 2.2),
          });
        else
          this.sparks.push({
            x: x + rand(-3, 3),
            y,
            vx: rand(-20, 20),
            vy: rand(40, 100),
            life: 0,
            max: rand(0.45, 0.75),
            colour,
            size: rand(1.5, 3),
          });
      }
    }
  }

  /** Sparks are drawn in batches (one path per colour, fade level and thickness) */
  private drawFireworks(dt: number) {
    const fw = this.ctx;
    const canvas = this.els.canvas;
    if (!fw) return;
    this.emit();
    if (!this.sparks.length) {
      if (this.fwDirty) {
        fw.clearRect(0, 0, canvas.width, canvas.height);
        this.fwDirty = false;
      }
      return;
    }
    const W = window.innerWidth;
    const H = window.innerHeight;
    const d = Math.min(1.5, window.devicePixelRatio || 1);
    const w = Math.round(W * d);
    const h = Math.round(H * d);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    fw.setTransform(d, 0, 0, d, 0, 0);
    fw.clearRect(0, 0, W, H);
    const drag = Math.pow(0.985, dt * 60);
    const batches = new Map<string, Spark[]>();
    let n = 0;
    for (let i = 0; i < this.sparks.length; i++) {
      const s = this.sparks[i];
      s.life += dt;
      if (s.life > s.max) continue;
      this.sparks[n++] = s;
      s.vx *= drag;
      s.vy = s.puff ? s.vy * drag : s.vy * drag + 170 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      const fade = Math.max(0, 1 - s.life / s.max);
      if (s.puff) {
        fw.globalAlpha = fade * 0.75;
        fw.fillStyle = s.colour;
        fw.beginPath();
        fw.arc(s.x, s.y, s.size * (1 + (s.life / s.max) * 1.6), 0, Math.PI * 2);
        fw.fill();
        continue;
      }
      if (s.flash) {
        fw.globalAlpha = fade;
        fw.fillStyle = s.colour;
        fw.beginPath();
        fw.arc(s.x, s.y, s.size * (1 + s.life * 4), 0, Math.PI * 2);
        fw.fill();
        continue;
      }
      const key = `${s.colour}|${Math.ceil(fade * FADE_STEPS)}|${s.size > 2.4 ? 1 : 0}`;
      let list = batches.get(key);
      if (!list) batches.set(key, (list = []));
      list.push(s);
    }
    this.sparks.length = n;
    fw.lineCap = "butt";
    batches.forEach((list, key) => {
      const [colour, level, thick] = key.split("|");
      fw.globalAlpha = Number(level) / FADE_STEPS;
      fw.strokeStyle = colour;
      fw.lineWidth = thick === "1" ? 3.2 : 2;
      fw.beginPath();
      for (const s of list) {
        fw.moveTo(s.x - s.vx * 0.035, s.y - s.vy * 0.035);
        fw.lineTo(s.x, s.y);
      }
      fw.stroke();
    });
    fw.globalAlpha = 1;
    this.fwDirty = true;
  }

  /** Removes the cracker, sparks and shells */
  clearCelebration() {
    this.sparks.length = 0;
    this.emitters.length = 0;
    this.els.stage.querySelectorAll(".nova-shell, .nova-z").forEach((el) => el.remove());
    window.clearTimeout(this.zTimer);
    this.contrailOn = false;
    this.clearCracker();
    this.stickOn = false;
    this.chuteOpen = false;
    const canvas = this.els.canvas;
    this.ctx?.clearRect(0, 0, canvas.width, canvas.height);
  }

  // ---------- Posing ----------
  private easeK = (rate: number, dt: number) => (this.reduced ? 1 : 1 - Math.exp(-rate * dt));

  private applyGesture(o: Required<Pose>, g: Gesture, now: number, w: number) {
    const p = (now - g.start) / g.dur;
    if (p >= 1 || w <= 0) return;
    const v = GESTURES[g.name](Math.max(0, p), (now - g.start) / 1000);
    for (const [key, value] of Object.entries(v) as [keyof Pose, number][]) {
      if (key === "spin") o.spin *= 1 + (value - 1) * w;
      // An absolute right-arm angle (raised from wherever it rests)
      else if (key === "armRTo") o.armR += (value - this.pose.armR) * w;
      else o[key] += value * w;
    }
  }

  private moveCharacter(now: number) {
    const t = now / 1000;
    const calm = this.reduced ? 0 : 1;
    const dt = this.lastMove ? clamp((now - this.lastMove) / 1000, 0, 0.1) : 1 / 60;
    this.lastMove = now;
    const rig = this.rig;
    // Every value of the current behaviour eases towards its target, so changes never snap
    const target = MOODS[this.mood](this.reduced ? 0 : (now - this.moodStart) / 1000);
    const k = this.easeK(13.4, dt);
    for (const key of POSE_KEYS) {
      const want = target[key] ?? (key === "armR" ? ARM_R_REST : 0);
      this.pose[key] += (want - this.pose[key]) * k;
    }
    const pose = this.pose;
    const o: Required<Pose> = {
      armRTo: 0,
      armL: 0,
      armR: 0,
      head: 0,
      headY: 0,
      lean: pose.lean,
      legL: pose.legL,
      legR: pose.legR,
      shinL: pose.shinL,
      shinR: pose.shinR,
      rootY: pose.rootY,
      squash: 0,
      spin: 1,
      swayX: 0,
      liftL: 0,
      liftR: 0,
      reachL: 0,
      reachR: 0,
    };

    // One-off moves fade in over 110ms; one cut short fades out over 160ms
    if (this.gestureOut) {
      const w = 1 - (now - (this.gestureOut.fadeFrom ?? now)) / 160;
      if (w <= 0 || now - this.gestureOut.start >= this.gestureOut.dur) this.gestureOut = null;
      else this.applyGesture(o, this.gestureOut, now, w);
    }
    if (this.gesture) {
      if (now - this.gesture.start >= this.gesture.dur) this.gesture = null;
      else this.applyGesture(o, this.gesture, now, clamp((now - this.gesture.start) / 110, 0, 1));
    }

    let look = 0;
    const walk = this.walk;
    if (walk) {
      const p = Math.min(1, (now - walk.start) / walk.dur);
      const style = walk.style;
      // Climbing goes rung by rung: reach up with one hand (and the other foot), then pull up
      const steps = Math.max(1, Math.round(walk.height));
      const u = p * steps;
      const rung = Math.min(steps - 1, Math.floor(u));
      const fr = u - rung;
      const pull = clamp((fr - 0.32) / 0.68, 0, 1);
      const pullE = pull * pull * (3 - 2 * pull);
      const e =
        style === "climb"
          ? (rung + pullE) / steps
          : style === "walk"
            ? p < 0.5
              ? 2 * p * p
              : 1 - Math.pow(-2 * p + 2, 2) / 2
            : style === "slide"
              ? p * p
              : style === "float"
                ? 1 - (1 - p) * (1 - p)
                : p;
      if (style === "float") {
        o.swayX += Math.sin(t * 2.5) * 9 * calm;
        o.lean += Math.sin(t * 2.5 + 0.6) * 6 * calm;
      }
      this.walkX = walk.fromX + (walk.toX - walk.fromX) * e;
      this.walkY = walk.fromY + (walk.toY - walk.fromY) * e;
      this.size = walk.sizeFrom + (walk.sizeTo - walk.sizeFrom) * e;
      if (style === "hop") o.rootY -= Math.sin(p * Math.PI) * walk.height;
      if (style === "climb") {
        // Hands and feet stay on their rungs while the body rises past them: the reaching hand
        // goes up while he hangs still, then the hand and the lifted knee sink back as he pulls
        const left = rung % 2 === 0;
        const reach = Math.sin(clamp(fr / 0.32, 0, 1) * (Math.PI / 2));
        const hold = reach * (1 - pullE);
        const env = Math.min(1, p * 8, (1 - p) * 8);
        // Arms stay out at his sides (clear of his big head): the reaching hand slides up beside
        // his head to the next rung, arm stretched, then comes down to his shoulder as he pulls
        const moving = -13 * (1 - reach) + 12 * hold;
        const resting = -13 * pullE;
        o.armL += (left ? moving : resting) * env;
        o.armR -= (left ? resting : moving) * env;
        o.reachL += (left ? 30 * hold : 0) * env;
        o.reachR += (left ? 0 : 30 * hold) * env;
        o.liftR += (left ? 16 * hold : 0) * env;
        o.liftL += (left ? 0 : 16 * hold) * env;
        o.lean += (left ? -2.5 : 2.5) * hold * env;
        o.squash -= 0.035 * Math.sin(pull * Math.PI) * env;
      }
      if (style === "walk") {
        // Steps: legs swing from the hips, the body bobs and leans in, arms swing. Running steps faster.
        const fast = (walk.pace ?? 6) < 5;
        const phase = ((now - walk.start) / 1000) * (fast ? 17 : 11);
        const env = Math.min(1, p * 6, (1 - p) * 6);
        const step = Math.sin(phase) * env;
        const dir = Math.sign(walk.toX - walk.fromX);
        o.legL += step * 24;
        o.legR -= step * 24;
        o.rootY -= Math.abs(Math.cos(phase)) * 4 * env;
        o.lean += dir * (fast ? 7 : 4) * env;
        o.armL += step * 12;
        o.armR -= step * 8;
        if (Math.abs(walk.toX - walk.fromX) > 30) look = dir * env;
      }
      if (p >= 1) {
        this.walkX = walk.toX;
        this.walkY = walk.toY;
        this.size = walk.sizeTo;
        this.walk = null;
        walk.resolve();
      }
    }
    // Turns towards where he is walking: head and eyes look that way, body narrows slightly
    this.walkLook += (look - this.walkLook) * this.easeK(8, dt);
    o.head += this.walkLook * 7;
    // Head turns a little towards the pointer or the focused answer (on top of the eyes)
    const attentive =
      this.landed &&
      this.mood !== "nap" &&
      this.mood !== "ears" &&
      !this.facingBack &&
      !this.reduced;
    const want = attentive
      ? clamp((this.pointer.x - EYE.x) / 28, -9, 9) * (1 - Math.abs(this.walkLook))
      : 0;
    this.headTrack += (want - this.headTrack) * this.easeK(5, dt);
    o.head += this.headTrack;
    const turn = 1 - Math.abs(this.walkLook) * 0.06;

    // Sign: pops up while greeting/leaving, wiggles, tucks away afterwards
    this.signScale += ((this.mood === "sign" ? 1 : 0) - this.signScale) * this.easeK(11.9, dt);
    // (hidden: no wiggle to write)
    if (this.signScale >= 0.02)
      this.put(
        rig.sign,
        "transform",
        `rotate(${(Math.sin(t * 4) * 5 * calm).toFixed(2)} 181 106) translate(181 106) scale(${this.signScale.toFixed(3)}) translate(-181 -106)`,
      );
    this.put(rig.sign, "style.display", this.signScale < 0.02 ? "none" : "");
    // Parachute: billows open upwards from his shoulders, packs away on landing
    this.chuteScale += ((this.chuteOpen ? 1 : 0) - this.chuteScale) * this.easeK(17.3, dt);
    const cs = isPhone() ? 0.8 : 1;
    this.put(
      rig.chute,
      "transform",
      `translate(100 150) scale(${((0.3 + 0.7 * this.chuteScale) * cs).toFixed(3)} ${(this.chuteScale * cs).toFixed(3)}) translate(-100 -150)`,
    );
    this.put(rig.chute, "style.display", this.chuteScale < 0.02 ? "none" : "");
    // Reading glasses for the second question
    this.glassesScale += ((this.phase === "q2" ? 1 : 0) - this.glassesScale) * this.easeK(13.4, dt);
    this.put(
      rig.glasses,
      "transform",
      `translate(101 120) scale(${this.glassesScale.toFixed(3)}) translate(-101 -120)`,
    );
    this.put(rig.glasses, "style.display", this.glassesScale < 0.02 ? "none" : "");
    // Incense stick: the glowing tip flickers
    this.put(rig.stick, "style.display", this.stickOn ? "" : "none");
    if (this.stickOn)
      this.put(
        rig.stickGlow,
        "opacity",
        (0.35 + 0.25 * Math.abs(Math.sin(t * 7)) * calm).toFixed(2),
      );

    // Turning round to face the ladder: he narrows, flips (mirrored, so the tail is on the
    // other side) and widens again showing his back
    const backTarget = this.facingBack ? 1 : 0;
    this.backBlend = this.reduced
      ? backTarget
      : this.backBlend +
        clamp(backTarget - this.backBlend, -dt / (TURN_MS / 1000), dt / (TURN_MS / 1000));
    const flip = Math.cos(this.backBlend * Math.PI);
    const back = this.backBlend > 0.5;
    if (back !== this.backShown) this.showBack(back);
    this.tilt += (this.climbTilt - this.tilt) * this.easeK(9, dt);

    const L = clamp(pose.armL + o.armL, ...(back ? ARM_L_BACK : ARM_L_RANGE));
    const R = clamp(pose.armR + o.armR, ...(back ? ARM_R_BACK : ARM_R_RANGE));
    const sy = 1 + o.squash;
    const sx =
      (1 - o.squash * 0.6) * o.spin * turn * Math.sign(flip || 1) * (0.25 + 0.75 * Math.abs(flip));
    this.put(
      rig.root,
      "transform",
      `translate(${o.swayX.toFixed(2)} ${o.rootY.toFixed(2)}) rotate(${this.tilt.toFixed(2)} 100 266) translate(100 266) scale(${(sx * this.size).toFixed(3)} ${(sy * this.size).toFixed(3)}) translate(-100 -266)`,
    );
    this.put(rig.upper, "transform", `rotate(${o.lean.toFixed(2)} 100 236)`);
    this.put(
      rig.head,
      "transform",
      `rotate(${(pose.head + o.head).toFixed(2)} 100 160) translate(0 ${o.headY.toFixed(2)})`,
    );
    this.put(rig.armL, "transform", `rotate(${L.toFixed(2)} 60 162)`);
    this.put(rig.armR, "transform", `rotate(${R.toFixed(2)} 140 160)`);
    this.stretchArm(rig.armL, ARM_L_AXIS, o.reachL);
    this.stretchArm(rig.armR, ARM_R_AXIS, o.reachR);
    // A lifted knee (climbing): the leg rises and, seen from behind, the shin foreshortens
    const leg = (deg: number, lift: number, hipX: number) =>
      `translate(0 ${(-lift).toFixed(2)}) rotate(${deg.toFixed(2)} ${hipX} 216)` +
      (lift > 0.1
        ? ` translate(0 216) scale(1 ${(1 - lift / 90).toFixed(3)}) translate(0 -216)`
        : "");
    this.put(rig.legL, "transform", leg(o.legL, o.liftL, 83));
    this.put(rig.legR, "transform", leg(o.legR, o.liftR, 117));
    this.put(rig.tail, "transform", `rotate(${(Math.sin(t * 2.4) * 5 * calm).toFixed(2)} 74 200)`);
    // Sitting: standing legs cross-fade into sitting legs; each shin swings towards the viewer
    const seatTarget = this.seated ? 1 : 0;
    this.seatBlend += (seatTarget - this.seatBlend) * this.easeK(20, dt);
    if (Math.abs(this.seatBlend - seatTarget) < 0.01) this.seatBlend = seatTarget;
    const standDisplay = this.seatBlend >= 1 ? "none" : "";
    this.put(rig.legL, "style.display", standDisplay);
    this.put(rig.legR, "style.display", standDisplay);
    const sitDisplay = this.seatBlend <= 0 ? "none" : "";
    this.put(rig.sitLegs, "style.display", sitDisplay);
    this.put(rig.knees, "style.display", sitDisplay);
    const standOpacity = (1 - this.seatBlend).toFixed(3);
    this.put(rig.legL, "style.opacity", standOpacity);
    this.put(rig.legR, "style.opacity", standOpacity);
    const sitOpacity = this.seatBlend.toFixed(3);
    this.put(rig.sitLegs, "style.opacity", sitOpacity);
    this.put(rig.knees, "style.opacity", sitOpacity);
    if (this.seatBlend > 0) {
      const shin = (v: number) =>
        `translate(0 243) scale(1 ${(0.8 + 0.2 * Math.cos(clamp(v, -1.6, 1.6) * calm)).toFixed(3)}) rotate(${(v * 4 * calm).toFixed(2)}) translate(0 -243)`;
      this.put(rig.shinL, "transform", shin(o.shinL));
      this.put(rig.shinR, "transform", shin(o.shinR));
    }
    if (this.carrying && this.prop) this.prop.style.transform = this.carriedTransform();
    // Floor shadow only while standing on the ground; a small one on the card while sitting.
    // It shrinks and fades as he leaves the ground.
    this.els.shadow.style.visibility =
      this.seated || this.aloft || this.size < 0.98 ? "hidden" : "";
    if (this.landed) {
      const lift = clamp(-o.rootY / 45, 0, 1);
      this.els.shadow.style.transform = `scale(${(1 - 0.45 * lift).toFixed(3)})`;
      this.els.shadow.style.opacity = (1 - 0.55 * lift).toFixed(3);
    }
    // Touchdown after a jump or hop: a little dust
    if (this.lastRootY < -14 && o.rootY >= -3 && !this.seated && this.landed) this.dust(5);
    this.lastRootY = o.rootY;
    const onCard = this.seated && !this.walk;
    this.seatShadow.classList.toggle("show", onCard);
    if (onCard) {
      const r = this.agentRect();
      const w = 120 * (r.height / VB_H) * this.size;
      Object.assign(this.seatShadow.style, {
        left: `${(r.left + r.width / 2 - w / 2).toFixed(1)}px`,
        top: `${this.seatCardTop.toFixed(1)}px`,
        width: `${w.toFixed(1)}px`,
      });
    }
    if (this.landed) this.applyFlyer();
  }

  /**
   * Lengthens an arm by `by` drawing units (reaching for a rung): the furry sleeve (the arm's
   * first part) stretches along the arm and the mitten (its last part) slides out to its end.
   */
  private stretchArm(arm: SVGGraphicsElement, axis: typeof ARM_L_AXIS, by: number) {
    const sleeve = arm.firstElementChild;
    const mitten = arm.lastElementChild;
    if (!sleeve || !mitten) return;
    if (by < 0.05) {
      if (sleeve.hasAttribute("transform")) {
        sleeve.removeAttribute("transform");
        mitten.removeAttribute("transform");
      }
      return;
    }
    const deg = (Math.atan2(axis.dy, axis.dx) * 180) / Math.PI;
    sleeve.setAttribute(
      "transform",
      `translate(${axis.x} ${axis.y}) rotate(${deg.toFixed(2)}) scale(${(1 + by / ARM_LEN).toFixed(3)} 1) rotate(${(-deg).toFixed(2)}) translate(${-axis.x} ${-axis.y})`,
    );
    mitten.setAttribute(
      "transform",
      `translate(${(axis.dx * by).toFixed(2)} ${(axis.dy * by).toFixed(2)})`,
    );
  }

  /**
   * Per-frame pose writes go through here and are skipped when the value hasn't changed:
   * even an identical write makes the browser re-check the element's styles. Only for parts
   * nothing else writes to, so the remembered values stay true.
   */
  private put(el: Element, key: string, value: string) {
    let last = this.written.get(el);
    if (!last) this.written.set(el, (last = new Map()));
    if (last.get(key) === value) return;
    last.set(key, value);
    if (key.startsWith("style.")) (el as HTMLElement).style.setProperty(key.slice(6), value);
    else el.setAttribute(key, value);
  }

  /** Nova's box on screen, from his walk offset (measured once per layout, not every frame) */
  private applyFlyer() {
    this.els.flyer.style.transform = `translate(${this.walkX.toFixed(1)}px, ${this.walkY.toFixed(1)}px) scale(${isPhone() ? 0.7 : 1})`;
    this.flyerApplied = { x: +this.walkX.toFixed(1), y: +this.walkY.toFixed(1) };
  }

  private agentRect(): Rect {
    const { agent } = this.els;
    const key = `${agent.style.top}|${window.innerWidth}|${window.innerHeight}|${this.landed}`;
    if (!this.agentBox || key !== this.agentBoxKey) {
      const r = agent.getBoundingClientRect();
      this.agentBox = {
        left: r.left - this.flyerApplied.x,
        top: r.top - this.flyerApplied.y,
        width: r.width,
        height: r.height,
      };
      this.agentBoxKey = key;
    }
    const left = this.agentBox.left + this.walkX;
    const top = this.agentBox.top + this.walkY;
    return {
      left,
      top,
      width: this.agentBox.width,
      height: this.agentBox.height,
      right: left + this.agentBox.width,
      bottom: top + this.agentBox.height,
    };
  }

  /** Screen resized or rotated: put Nova and his props back in the right place */
  private relayout() {
    if (!this.landed || this.stageBusy || !this.loopOn) return;
    this.agentBox = null;
    if (this.phase === "q2") return this.placeSeated();
    if (this.phase === "q3") return this.placeCracker();
    this.resolveWalk();
    const b = this.roamBox();
    this.walkX = clamp(this.walkX, b.x0, b.x1);
    this.walkY = clamp(this.walkY, b.y0, b.y1);
  }

  // ---------- Fly-in ----------
  /** Clears the stage back to "about to fly in" */
  reset() {
    const { flyer, agent, planeBack, planeFront, trail, shadow } = this.els;
    for (const el of [flyer, agent, planeBack, planeFront, trail, shadow])
      el.getAnimations().forEach((a) => a.cancel());
    this.newRun();
    this.landed = false;
    this.seated = false;
    this.seatBlend = 0;
    this.removeProp();
    this.setStageFlag("q2", false);
    this.setStageFlag("front", false);
    this.napping = null;
    this.walkX = this.walkY = 0;
    this.flyerApplied = { x: 0, y: 0 };
    this.agentBox = null;
    this.size = 1;
    this.lastFilled = 0;
    this.gesture = this.gestureOut = null;
    this.setMood("idle");
    this.clearCelebration();
    flyer.style.transform = "";
    flyer.style.visibility = "";
    for (const el of [planeBack, planeFront, trail, shadow]) el.style.opacity = "";
    shadow.style.transform = "";
    trail.style.transformOrigin = "";
    this.rig.signTop.textContent = "Welcome to";
    this.rig.signMain.textContent = "Aakrin!";
    agent.style.top = "";
    agent.classList.remove("nova-idle", "nova-yawning");
  }

  /** Nova already standing, no fly-in (repeat opens, reduced motion) */
  placeLanded() {
    this.reset();
    const { planeBack, planeFront, trail, shadow, agent } = this.els;
    for (const el of [planeBack, planeFront, trail]) el.style.opacity = "0";
    shadow.style.opacity = "1";
    agent.style.top = `${AGENT_LANDED_TOP}px`;
    agent.classList.add("nova-idle");
    this.landed = true;
    this.applyFlyer();
  }

  /**
   * In from just off the bottom-right corner, through the centre of the screen, to Nova's
   * spot; the plane levels off, Nova jumps down and the plane carries on off to the upper left.
   */
  async playIntro(): Promise<boolean> {
    this.reset();
    const run = this.run;
    const alive = () => run === this.run;
    const { flyer, agent, planeBack, planeFront, trail, shadow } = this.els;
    // The fur pictures are usually ready within a few hundred ms; the plane is off-screen meanwhile
    this.prepare();
    await Promise.race([this.fur ?? Promise.resolve(), this.wait(1500)]);
    if (!alive()) return false;
    const s = isPhone() ? 0.7 : 1;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const home = {
      x: flyer.offsetLeft + flyer.offsetWidth / 2,
      y: flyer.offsetTop + flyer.offsetHeight / 2,
    };
    const start = { x: W + 260 * s, y: H + 160 * s };
    const centre = { x: W / 2, y: H / 2 };
    const approach = { x: home.x + 70 * s, y: home.y - 14 * s };
    // Wide screens: Nova lands left of centre, so the plane passes the centre on the way
    const viaCentre = centre.x - home.x > 80 * s;
    const pts = [{ ...start, s: 0.45 * s }];
    if (viaCentre) pts.push({ ...centre, s: 0.8 * s });
    pts.push({ ...approach, s: 0.95 * s }, { ...home, s });
    const frames = flightPath(pts, "left").map((p) => ({
      offset: p.offset,
      transform: `translate(${(p.x - home.x).toFixed(1)}px, ${(p.y - home.y).toFixed(1)}px) scale(${p.s.toFixed(3)}) rotate(${p.deg.toFixed(2)}deg)`,
    }));
    this.startContrail(() => {
      const r = planeFront.getBoundingClientRect();
      return { x: r.right - r.width * 0.06, y: r.top + r.height * 0.12 };
    });
    await this.anim(flyer, frames, { duration: 3400, easing: "cubic-bezier(.35,.25,.4,1)" });
    this.contrailOn = false;
    if (!alive()) return false;
    await this.anim(
      flyer,
      [
        { transform: `translate(0,0) scale(${s})` },
        { transform: `translate(0,-8px) scale(${s})` },
        { transform: `translate(0,0) scale(${s})` },
      ],
      { duration: 600, easing: "ease-in-out" },
    );
    if (!alive()) return false;
    await this.anim(
      agent,
      [{ transform: "translateY(0) scale(1,1)" }, { transform: "translateY(6px) scale(1.08,.88)" }],
      { duration: 220, easing: "ease-out" },
    );
    if (!alive()) return false;

    // The plane carries on nose-first, climbing off to the upper left, while Nova jumps down
    const leave: KeyframeAnimationOptions = { duration: 1300, easing: "cubic-bezier(.5,0,.9,.4)" };
    const away = [
      { transform: "translate(0,0) rotate(0)", opacity: 1 },
      { transform: "translate(-90vw,-70vh) rotate(18deg)", opacity: 1 },
    ];
    void this.anim(planeBack, away, leave);
    void this.anim(trail, away, leave);
    // Once it is gone, hide it: it travels with the flyer, so it would drift back into view
    // as Nova walks about
    void this.anim(planeFront, away, leave).then(() => {
      if (!alive()) return;
      for (const el of [planeBack, planeFront, trail]) {
        el.getAnimations().forEach((a) => a.cancel());
        el.style.opacity = "0";
      }
    });
    void this.anim(
      shadow,
      [
        { opacity: 0, transform: "scale(.4)" },
        { opacity: 1, transform: "scale(1)" },
      ],
      { duration: 900, delay: 200 },
    );
    await this.anim(
      agent,
      [
        { transform: "translateY(6px) scale(1.08,.88) rotate(0)" },
        { transform: "translateY(-150px) scale(.95,1.08) rotate(8deg)", offset: 0.4 },
        { transform: "translateY(-150px) scale(1,1) rotate(-6deg)", offset: 0.55 },
        { transform: "translateY(104px) scale(1,1.04) rotate(0)", offset: 0.9 },
        { transform: "translateY(104px) scale(1.12,.86) rotate(0)", offset: 0.95 },
        { transform: "translateY(102px) scale(1,1) rotate(0)" },
      ],
      { duration: 1150, easing: "ease-in-out" },
    );
    if (!alive()) return false;
    agent.getAnimations().forEach((a) => a.cancel());
    agent.style.top = `${AGENT_LANDED_TOP}px`;
    agent.classList.add("nova-idle");
    // From here the engine positions Nova (the same spot the flight ended on), so he can walk
    flyer.getAnimations().forEach((a) => a.cancel());
    shadow.getAnimations().forEach((a) => a.cancel());
    shadow.style.opacity = "1";
    this.landed = true;
    this.applyFlyer();
    this.dust(8);
    return true;
  }

  /** Hides the flyer until the dialog has real dimensions to measure */
  hideFlyer() {
    this.els.flyer.style.visibility = "hidden";
  }
}
