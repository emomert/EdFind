import { type SVGProps } from "react";

/**
 * Hand-drawn European skyline strip — Galata Tower, Eiffel Tower, Dutch
 * canal houses, Big Ben, a domed basilica, the Berlin TV tower, basilica
 * spires, and a ferris wheel, left to right (the journey starts in Istanbul).
 *
 * Same visual rules as components/decor/marker.tsx: round 2px strokes,
 * slightly wobbly geometry, `currentColor` so it tints via Tailwind text-*.
 * Decorative only — always `aria-hidden`. Designed to sit along the bottom
 * of a hero at low opacity with a horizontal fade mask.
 */
export function EuropeSkyline({
  className,
  ...rest
}: Omit<SVGProps<SVGSVGElement>, "viewBox" | "fill" | "stroke">) {
  return (
    <svg
      viewBox="0 0 1200 160"
      preserveAspectRatio="none"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable={false}
      className={className}
      {...rest}
    >
      {/* ground line */}
      <path d="M0 152 L1200 152" strokeDasharray="1 7" strokeWidth={1.5} />

      {/* Galata Tower (Istanbul — where the journey starts) */}
      <g>
        <path d="M62 152 L66 78 L94 78 L98 152" />
        <path d="M60 78 L100 78" />
        <path d="M64 64 L96 64 L94 78 L66 78 Z" />
        <path d="M64 64 L80 34 L96 64" />
        <path d="M80 34 L80 24" />
        <path d="M72 96 L72 104 M80 96 L80 104 M88 96 L88 104" strokeWidth={1.6} />
      </g>

      {/* little trees */}
      <path d="M136 152 C132 140, 140 134, 142 130 C144 134, 152 140, 148 152" />
      <path d="M168 152 C165 144, 171 140, 172 137 C173 140, 179 144, 176 152" strokeWidth={1.6} />

      {/* Eiffel Tower */}
      <g>
        <path d="M212 152 C230 112, 240 84, 246 38" />
        <path d="M280 152 C262 112, 252 84, 246 38" />
        <path d="M246 38 L246 22" />
        <path d="M222 116 L270 116" />
        <path d="M230 84 L262 84" strokeWidth={1.6} />
        <path d="M222 116 C234 128, 258 128, 270 116" strokeWidth={1.6} />
      </g>

      {/* Dutch canal houses (stepped + bell gables) */}
      <g>
        <path d="M348 152 L348 86 L356 86 L356 76 L376 76 L376 86 L384 86 L384 152" />
        <path d="M384 152 L384 70 C394 58, 410 58, 420 70 L420 152" />
        <path d="M420 152 L420 90 L428 90 L428 80 L436 80 L436 70 L452 70 L452 80 L460 80 L460 90 L468 90 L468 152" />
        <path d="M360 96 L372 96 M360 116 L372 116" strokeWidth={1.6} />
        <path d="M396 92 L410 92 M396 112 L410 112" strokeWidth={1.6} />
        <path d="M438 100 L452 100 M438 120 L452 120" strokeWidth={1.6} />
      </g>

      {/* Big Ben */}
      <g>
        <path d="M528 152 L530 64 L566 64 L568 152" />
        <path d="M524 64 L572 64" />
        <path d="M530 48 L566 48 L564 64 L532 64 Z" />
        <path d="M530 48 L548 18 L566 48" />
        <path d="M548 18 L548 8" />
        <circle cx="548" cy="78" r="9" strokeWidth={1.8} />
        <path d="M548 78 L548 72 M548 78 L553 80" strokeWidth={1.6} />
        <path d="M538 104 L538 116 M548 104 L548 116 M558 104 L558 116" strokeWidth={1.6} />
      </g>

      {/* domed basilica */}
      <g>
        <path d="M652 152 L652 108 M756 152 L756 108" />
        <path d="M644 108 L764 108" />
        <path d="M660 108 C660 64, 748 64, 748 108" />
        <path d="M704 56 L704 44 M698 50 L710 50" strokeWidth={1.8} />
        <path d="M672 122 L672 136 M704 122 L704 136 M736 122 L736 136" strokeWidth={1.6} />
      </g>

      {/* Berlin TV tower */}
      <g>
        <path d="M846 152 L850 92 M862 152 L858 92" />
        <circle cx="854" cy="74" r="15" />
        <path d="M854 59 L854 30" />
        <path d="M843 70 C850 64, 858 64, 865 70" strokeWidth={1.4} strokeDasharray="2 3" />
      </g>

      {/* basilica spires (Sagrada-like cluster) */}
      <g>
        <path d="M938 152 L944 76 C946 64, 950 64, 952 76 L958 152" />
        <path d="M966 152 L972 52 C974 40, 978 40, 980 52 L986 152" />
        <path d="M994 152 L1000 70 C1002 58, 1006 58, 1008 70 L1014 152" />
        <path d="M948 70 L948 62 M976 46 L976 38 M1004 64 L1004 56" strokeWidth={1.6} />
        <path d="M944 108 L956 108 M972 96 L984 96 M1000 104 L1012 104" strokeWidth={1.4} strokeDasharray="1 4" />
      </g>

      {/* ferris wheel */}
      <g>
        <circle cx="1112" cy="98" r="38" />
        <circle cx="1112" cy="98" r="4" strokeWidth={1.8} />
        <path d="M1112 60 L1112 136 M1074 98 L1150 98 M1085 71 L1139 125 M1139 71 L1085 125" strokeWidth={1.2} />
        <path d="M1092 152 L1112 102 L1132 152" />
      </g>
    </svg>
  );
}
