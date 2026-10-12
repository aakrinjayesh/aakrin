import { memo, type Ref } from "react";

/**
 * Nova, the onboarding guide. Artwork kept as supplied (including the Salesforce badge,
 * per the product decision), split into parts the motion engine (nova-engine.ts) moves:
 * every `data-rig` group is posed with an SVG transform, so none of them may set
 * `transform` here. Decorative: the guide's words are announced separately.
 *
 * Memoised and prop-free (apart from refs) on purpose: after mount the engine swaps the
 * furry parts for pre-rendered pictures and shows/hides props, and React must not
 * reconcile over that.
 */
export const NovaAvatar = memo(function NovaAvatar({ svgRef }: { svgRef?: Ref<SVGSVGElement> }) {
  return (
    <svg
      ref={svgRef}
      viewBox="0 0 200 270"
      aria-hidden="true"
      focusable="false"
      className="nova-svg"
    >
      <defs>
        <filter id="nova-fur" filterUnits="userSpaceOnUse" x="-40" y="-30" width="280" height="330">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves={3}
            seed={7}
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale={6}
            xChannelSelector="R"
            yChannelSelector="G"
            result="d"
          />
          <feTurbulence
            type="turbulence"
            baseFrequency="1.3"
            numOctaves={2}
            seed={4}
            result="curl"
          />
          <feColorMatrix
            in="curl"
            type="matrix"
            values="0 0 0 0 0.18  0 0 0 0 0.08  0 0 0 0 0.02  -2.2 0 0 0 1.1"
            result="dark"
          />
          <feComposite in="dark" in2="d" operator="in" result="darkIn" />
          <feColorMatrix
            in="curl"
            type="matrix"
            values="0 0 0 0 0.85  0 0 0 0 0.6  0 0 0 0 0.4  2.4 0 0 0 -1.7"
            result="lite"
          />
          <feComposite in="lite" in2="d" operator="in" result="liteIn" />
          <feMerge>
            <feMergeNode in="d" />
            <feMergeNode in="darkIn" />
            <feMergeNode in="liteIn" />
          </feMerge>
        </filter>
        <filter
          id="nova-tail-fur"
          filterUnits="userSpaceOnUse"
          x="-40"
          y="-30"
          width="280"
          height="330"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05 0.9"
            numOctaves={2}
            seed={9}
            result="n"
          />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={7} result="d" />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.3 2.2"
            numOctaves={2}
            seed={5}
            result="s"
          />
          <feColorMatrix
            in="s"
            type="matrix"
            values="0 0 0 0 0.15  0 0 0 0 0.07  0 0 0 0 0.02  2 0 0 0 -0.8"
            result="sd"
          />
          <feComposite in="sd" in2="d" operator="in" result="sdi" />
          <feMerge>
            <feMergeNode in="d" />
            <feMergeNode in="sdi" />
          </feMerge>
        </filter>
        <filter
          id="nova-felt"
          filterUnits="userSpaceOnUse"
          x="-40"
          y="-30"
          width="280"
          height="330"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.2"
            numOctaves={2}
            seed={1}
            result="n"
          />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={2.5} />
        </filter>
        <filter id="nova-soft">
          <feGaussianBlur stdDeviation={2.5} />
        </filter>
        <radialGradient id="nova-suit" cx="42%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#a86a3c" />
          <stop offset="55%" stopColor="#875230" />
          <stop offset="100%" stopColor="#5e3519" />
        </radialGradient>
        <radialGradient id="nova-ring" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#b87a48" />
          <stop offset="100%" stopColor="#8a522b" />
        </radialGradient>
        <linearGradient id="nova-tail" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6e3c1d" />
          <stop offset="100%" stopColor="#3f1f0c" />
        </linearGradient>
        <radialGradient id="nova-face" cx="50%" cy="45%" r="62%">
          <stop offset="0%" stopColor="#f6c49a" />
          <stop offset="75%" stopColor="#e9a877" />
          <stop offset="100%" stopColor="#cf8a5c" />
        </radialGradient>
        <linearGradient id="nova-hair" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#4a3226" />
          <stop offset="100%" stopColor="#2a1a12" />
        </linearGradient>
        <radialGradient id="nova-mitten" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#c4c5c6" />
          <stop offset="100%" stopColor="#8e9092" />
        </radialGradient>
        <radialGradient id="nova-eye" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#3a3a3a" />
          <stop offset="100%" stopColor="#050505" />
        </radialGradient>
        <linearGradient id="nova-lens" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.55} />
          <stop offset="55%" stopColor="#fcede6" stopOpacity={0.15} />
          <stop offset="100%" stopColor="#e55014" stopOpacity={0.18} />
        </linearGradient>
        <clipPath id="nova-lens-clip">
          <rect x="67" y="111" width="30" height="22" rx="9" />
          <rect x="106" y="109" width="30" height="22" rx="9" />
        </clipPath>
        <clipPath id="nova-face-clip">
          <ellipse cx="100" cy="112" rx="48" ry="46" />
        </clipPath>
      </defs>

      <g data-rig="root">
        <g data-rig="tail">
          <g filter="url(#nova-tail-fur)">
            <path
              d="M76 216 Q18 234 2 190 Q-8 150 24 126 Q26 166 48 178 Q62 186 78 184 Z"
              fill="url(#nova-tail)"
            />
            <path
              d="M20 140 Q22 176 60 196"
              stroke="#2f1708"
              strokeWidth={3}
              fill="none"
              opacity={0.5}
            />
          </g>
        </g>
        <g data-rig="legL">
          <g filter="url(#nova-fur)">
            <rect x="70" y="214" width="26" height="42" rx="12" fill="#7a4626" />
            <ellipse cx="81" cy="258" rx="17" ry="10" fill="#6c3c1f" />
          </g>
        </g>
        <g data-rig="legR">
          <g filter="url(#nova-fur)">
            <rect x="104" y="214" width="26" height="42" rx="12" fill="#7a4626" />
            <ellipse cx="119" cy="258" rx="17" ry="10" fill="#6c3c1f" />
          </g>
        </g>
        {/* Sitting legs (only while Nova sits on the card): shins hang over the edge */}
        <g data-rig="sitLegs" style={{ display: "none" }}>
          <g data-rig="shinL">
            <g filter="url(#nova-fur)">
              <rect x="68" y="242" width="24" height="32" rx="11" fill="#7a4626" />
              <ellipse cx="80" cy="277" rx="16" ry="10" fill="#6c3c1f" />
            </g>
          </g>
          <g data-rig="shinR">
            <g filter="url(#nova-fur)">
              <rect x="108" y="242" width="24" height="32" rx="11" fill="#7a4626" />
              <ellipse cx="120" cy="277" rx="16" ry="10" fill="#6c3c1f" />
            </g>
          </g>
        </g>

        <g data-rig="upper">
          {/* Parachute, opened above his head while he floats down after question 2 */}
          <g data-rig="chute" style={{ display: "none" }}>
            <path
              d="M-10 -36 L62 156 M38 -36 L66 154 M100 -38 L100 136 M162 -36 L134 154 M210 -36 L138 156"
              stroke="#5c3a1e"
              strokeWidth={1.6}
              strokeOpacity={0.75}
              fill="none"
            />
            <path
              d="M-14 -36 C-14 -150 214 -150 214 -36 Q196 -50 178 -36 Q160 -50 142 -36 Q124 -50 100 -36 Q76 -50 58 -36 Q40 -50 22 -36 Q4 -50 -14 -36 Z"
              fill="#e55014"
            />
            <path
              d="M58 -36 Q66 -110 100 -121 Q76 -50 58 -36 Z M142 -36 Q134 -110 100 -121 Q124 -50 142 -36 Z"
              fill="#ffffff"
            />
            <path
              d="M-14 -36 Q-8 -92 34 -112 Q20 -50 22 -36 Q4 -50 -14 -36 Z M214 -36 Q208 -92 166 -112 Q180 -50 178 -36 Q196 -50 214 -36 Z"
              fill="#16131d"
            />
            <path d="M100 -121 L100 -36" stroke="#a9380b" strokeWidth={1.5} opacity={0.5} />
            <path
              d="M6 -78 Q40 -116 92 -120"
              fill="none"
              stroke="#ffffff"
              strokeOpacity={0.45}
              strokeWidth={4}
              strokeLinecap="round"
            />
          </g>
          <g filter="url(#nova-fur)">
            <path
              d="M56 156 Q58 136 100 134 Q142 136 144 156 Q154 200 148 234 Q100 244 52 234 Q46 200 56 156 Z"
              fill="url(#nova-suit)"
            />
          </g>
          <g data-front="">
            <ellipse cx="103" cy="194" rx="28" ry="32" fill="#6a3417" filter="url(#nova-felt)" />
            <ellipse cx="98" cy="184" rx="14" ry="16" fill="#7d4220" opacity={0.5} />
          </g>
          {/* Seen from behind (climbing the ladder): his back, shaded down the spine */}
          <g data-rig="backBody" style={{ display: "none" }}>
            <path
              d="M100 150 Q97 196 100 238"
              stroke="#4e2a12"
              strokeWidth={3}
              fill="none"
              opacity={0.35}
              strokeLinecap="round"
            />
            <ellipse cx="78" cy="196" rx="16" ry="30" fill="#b07a4e" opacity={0.18} />
            <ellipse cx="124" cy="196" rx="14" ry="28" fill="#3f1f0c" opacity={0.18} />
          </g>
          {/* Knees (sitting only), resting on the card edge */}
          <g data-rig="knees" style={{ display: "none" }} filter="url(#nova-fur)">
            <ellipse cx="80" cy="243" rx="18" ry="13" fill="#8c5530" />
            <ellipse cx="120" cy="243" rx="18" ry="13" fill="#8c5530" />
            <ellipse cx="76" cy="238" rx="8" ry="4" fill="#b07a4e" opacity={0.55} />
            <ellipse cx="116" cy="238" rx="8" ry="4" fill="#b07a4e" opacity={0.55} />
          </g>

          <g data-rig="head">
            <g filter="url(#nova-fur)">
              <path d="M38 74 Q20 32 32 6 Q62 16 82 46 Z" fill="url(#nova-suit)" />
              <path d="M162 74 Q180 32 168 6 Q138 16 118 46 Z" fill="url(#nova-suit)" />
            </g>
            <g data-front="">
              <path d="M45 58 Q35 34 40 20 Q56 28 66 46 Z" fill="#5a2f16" />
              <path d="M155 58 Q165 34 160 20 Q144 28 134 46 Z" fill="#5a2f16" />
            </g>
            <g filter="url(#nova-fur)">
              <ellipse cx="100" cy="98" rx="76" ry="70" fill="url(#nova-suit)" />
            </g>
            <ellipse
              cx="100"
              cy="112"
              rx="64"
              ry="61"
              fill="none"
              stroke="#2e1608"
              strokeWidth={5}
              opacity={0.55}
              filter="url(#nova-soft)"
            />
            <g filter="url(#nova-fur)">
              <ellipse cx="100" cy="111" rx="62" ry="59" fill="url(#nova-ring)" />
            </g>
            <path
              d="M52 92 Q100 40 148 92"
              stroke="#c08552"
              strokeWidth={5}
              fill="none"
              opacity={0.35}
              strokeLinecap="round"
            />
            {/* Back of the head (climbing): a fur crown with a little whorl, no face */}
            <g data-rig="backHead" style={{ display: "none" }}>
              <g filter="url(#nova-fur)">
                <ellipse cx="100" cy="106" rx="56" ry="52" fill="url(#nova-suit)" />
              </g>
              <path
                d="M100 82 Q110 86 106 96 Q98 102 92 94 Q90 86 100 88"
                stroke="#4e2a12"
                strokeWidth={2.4}
                fill="none"
                opacity={0.5}
                strokeLinecap="round"
              />
              <path
                d="M62 140 Q100 162 138 140"
                stroke="#2e1608"
                strokeWidth={5}
                fill="none"
                opacity={0.3}
                strokeLinecap="round"
              />
            </g>
            <g data-front="">
              <ellipse cx="100" cy="112" rx="51" ry="49" fill="#4a2814" opacity={0.55} />
              <ellipse cx="100" cy="112" rx="48" ry="46" fill="url(#nova-face)" />
              <g clipPath="url(#nova-face-clip)">
                <g transform="translate(100 114) scale(1.3) translate(-100 -104)">
                  <path
                    d="M50 92 Q60 56 100 56 Q140 56 152 92 Q130 76 100 78 Q70 80 50 92 Z"
                    fill="url(#nova-hair)"
                  />
                  <path
                    d="M112 62 Q80 68 72 114 Q86 92 104 86 Q120 80 132 70 Z"
                    fill="url(#nova-hair)"
                  />
                  <path d="M118 68 Q148 72 143 108 Q136 88 118 80 Z" fill="url(#nova-hair)" />
                  <path d="M72 74 Q56 86 58 108 Q62 92 78 84 Z" fill="url(#nova-hair)" />
                  <path
                    d="M106 68 Q86 78 78 104 M116 70 Q98 80 90 92 M124 74 Q138 82 140 100 M100 62 Q120 60 136 70"
                    stroke="#6e4c3b"
                    strokeWidth={1.6}
                    fill="none"
                    strokeLinecap="round"
                    opacity={0.75}
                  />
                </g>
              </g>
              <g data-rig="eyeMotion" className="nova-eye-motion">
                <g className="nova-eyes">
                  <ellipse cx="82" cy="123" rx="8.5" ry="11" fill="url(#nova-eye)" />
                  <ellipse cx="121" cy="121" rx="8.5" ry="11" fill="url(#nova-eye)" />
                  <ellipse cx="84.5" cy="117" rx="3" ry="3.6" fill="#cfcfcf" opacity={0.85} />
                  <ellipse cx="123.5" cy="115" rx="3" ry="3.6" fill="#cfcfcf" opacity={0.85} />
                </g>
              </g>
              {/* Reading glasses for the second question: browline frames (Aakrin orange tops,
                fine dark lower rims), tinted lenses and a glint that sweeps across now and then */}
              <g data-rig="glasses" style={{ display: "none" }}>
                <path
                  d="M53 115 L67 118 M135 116 L149 110"
                  stroke="#16131d"
                  strokeWidth={2.6}
                  strokeLinecap="round"
                />
                <rect x="67" y="111" width="30" height="22" rx="9" fill="url(#nova-lens)" />
                <rect x="106" y="109" width="30" height="22" rx="9" fill="url(#nova-lens)" />
                <g clipPath="url(#nova-lens-clip)">
                  <polygon
                    className="nova-glint"
                    points="58,100 65,100 55,142 48,142"
                    fill="#fff"
                    opacity={0.6}
                  />
                </g>
                <rect
                  x="67"
                  y="111"
                  width="30"
                  height="22"
                  rx="9"
                  fill="none"
                  stroke="#16131d"
                  strokeWidth={1.4}
                />
                <rect
                  x="106"
                  y="109"
                  width="30"
                  height="22"
                  rx="9"
                  fill="none"
                  stroke="#16131d"
                  strokeWidth={1.4}
                />
                <path
                  d="M66.5 122 Q66.5 110.5 77 110.5 L87 110.5 Q97.5 110.5 97.5 119 M105.5 117 Q105.5 108.5 116 108.5 L126 108.5 Q136.5 108.5 136.5 120"
                  fill="none"
                  stroke="#c8450f"
                  strokeWidth={4.6}
                  strokeLinecap="round"
                />
                <path
                  d="M97 116.5 Q101.5 111.5 106 114.5"
                  fill="none"
                  stroke="#16131d"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                />
                <circle cx="69.5" cy="113" r="1.5" fill="#ffd66b" />
                <circle cx="133.5" cy="111" r="1.5" fill="#ffd66b" />
              </g>
              <g className="nova-mouth">
                <ellipse cx="100" cy="138" rx="4.5" ry="2.4" fill="#7a2b16" />
              </g>
            </g>
          </g>

          <g data-front="" transform="translate(0 6)">
            <g fill="#00a1e0">
              <circle cx="88" cy="182" r="11" />
              <circle cx="102" cy="175" r="13" />
              <circle cx="116" cy="181" r="10" />
              <circle cx="79" cy="193" r="9" />
              <circle cx="124" cy="191" r="8" />
              <rect x="78" y="182" width="48" height="18" rx="9" />
            </g>
            <text
              x="101"
              y="191"
              textAnchor="middle"
              fill="#fff"
              fontFamily="Arial, Helvetica, sans-serif"
              fontSize={8.6}
              fontWeight={700}
              letterSpacing={-0.2}
            >
              Salesforce
            </text>
          </g>

          <g data-rig="armL">
            <g filter="url(#nova-fur)">
              <path
                d="M60 162 Q32 184 34 208"
                stroke="#5c3218"
                strokeWidth={31}
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M60 162 Q32 184 34 208"
                stroke="#94593a"
                strokeWidth={26}
                strokeLinecap="round"
                fill="none"
              />
            </g>
            <g filter="url(#nova-felt)">
              <ellipse cx="34" cy="218" rx="14" ry="15" fill="url(#nova-mitten)" />
              <path
                d="M24 211 Q34 207 44 211 M23 217 Q34 213 45 217 M24 223 Q34 219 44 223"
                stroke="#a6a8aa"
                strokeWidth={1.2}
                fill="none"
              />
            </g>
          </g>

          <g data-rig="armR">
            <g filter="url(#nova-fur)">
              <path
                d="M140 160 Q170 146 178 120"
                stroke="#5c3218"
                strokeWidth={31}
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M140 160 Q170 146 178 120"
                stroke="#94593a"
                strokeWidth={26}
                strokeLinecap="round"
                fill="none"
              />
            </g>
            {/* Sign held in the right hand: "Welcome to Aakrin!" when he arrives, "Goodbye!" when he leaves */}
            <g data-rig="sign" style={{ display: "none" }}>
              <rect x="178" y="34" width="6" height="76" rx="3" fill="#a0703c" />
              <rect
                x="118"
                y="-24"
                width="126"
                height="62"
                rx="12"
                fill="#ffffff"
                stroke="#e55014"
                strokeWidth={3}
              />
              <rect x="118" y="-24" width="126" height="14" rx="7" fill="#e55014" opacity={0.12} />
              <text
                data-rig="signTop"
                x="181"
                y="1"
                textAnchor="middle"
                fontFamily="system-ui, sans-serif"
                fontSize={15}
                fontWeight={700}
                fill="#16131d"
              >
                Welcome to
              </text>
              <text
                data-rig="signMain"
                x="181"
                y="26"
                textAnchor="middle"
                fontFamily="system-ui, sans-serif"
                fontSize={21}
                fontWeight={800}
                fill="#c8450f"
              >
                Aakrin!
              </text>
            </g>
            {/* Lit incense stick, held while he waits to light the cracker */}
            <g data-rig="stick" style={{ display: "none" }}>
              <line
                x1="172"
                y1="104"
                x2="262"
                y2="126"
                stroke="#b07a45"
                strokeWidth={3}
                strokeLinecap="round"
              />
              <line
                x1="206"
                y1="112"
                x2="260"
                y2="125.5"
                stroke="#4a2a18"
                strokeWidth={5}
                strokeLinecap="round"
              />
              <circle data-rig="stickGlow" cx="262" cy="126" r="9" fill="#ffb347" opacity={0.45} />
              <circle cx="262" cy="126" r="4" fill="#ff5a1a" />
            </g>
            <g filter="url(#nova-felt)">
              <ellipse
                cx="181"
                cy="106"
                rx="14"
                ry="16"
                fill="url(#nova-mitten)"
                transform="rotate(18 181 106)"
              />
              <path
                d="M171 99 Q181 96 191 101 M170 105 Q181 102 192 107 M170 111 Q181 108 190 113"
                stroke="#a6a8aa"
                strokeWidth={1.2}
                fill="none"
              />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
});

/** The paper plane Nova arrives on, in Aakrin orange. Drawn nose-left: it flies in from the right. */
export function PlaneBack({ planeRef }: { planeRef?: Ref<SVGSVGElement> }) {
  return (
    <svg
      ref={planeRef}
      viewBox="0 0 420 210"
      aria-hidden="true"
      className="nova-plane nova-plane-back"
    >
      <polygon points="6,96 414,10 292,118" fill="#F08A5D" />
      <polygon points="6,96 414,10 340,40" fill="#F6A985" />
    </svg>
  );
}

export function PlaneFront({ planeRef }: { planeRef?: Ref<SVGSVGElement> }) {
  return (
    <svg
      ref={planeRef}
      viewBox="0 0 420 210"
      aria-hidden="true"
      className="nova-plane nova-plane-front"
    >
      <polygon points="6,96 292,118 236,200" fill="#C8450F" />
      <polygon points="120,104 414,10 292,118" fill="#E55014" />
      <polygon points="292,118 414,10 320,170" fill="#A9380B" />
      <line x1="6" y1="96" x2="414" y2="10" stroke="#FCEDE6" strokeWidth={2} opacity={0.7} />
    </svg>
  );
}
