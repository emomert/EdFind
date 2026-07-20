"use client";

/**
 * EuropeGlobe — interactive globe for the quiz's destinations question.
 *
 * Renders the world (Europe + Turkey + a wide context band of neighbouring
 * regions) onto an azimuthal-equal-area projection clipped to a circle so
 * the map curves like a real globe. The user can drag to rotate it; a
 * reset button snaps the view back to Europe.
 *
 * Visual treatment is "stylised satellite": deep-blue ocean radial
 * gradient, olive land, a soft cyan atmospheric glow on the rim, and a
 * faint specular highlight that sells the spherical illusion. The ten
 * EdFind-supported countries override the land colour with teal so they
 * read as "pick me" without needing an extra label.
 *
 * Data: /maps/europe.topo.json (world-atlas 110m, filtered down at build
 * time by scripts/download-europe-map.mjs). Fetched at runtime so the
 * payload stays off the initial JS bundle for /quiz.
 *
 * Accessibility: each selectable country is a `<path>` with role="button",
 * aria-pressed, and keyboard support (Enter/Space toggle). A native SVG
 * `<title>` provides the hover tooltip and screen-reader name. Drag is
 * pointer-only — keyboard users can still tab/select normally.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { geoAzimuthalEqualArea, geoGraticule10, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { motion, useReducedMotion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

import type { Destination } from "@/lib/quiz/schema";
import { useSound } from "@/lib/sound/sound-context";

// ISO 3166-1 numeric → EdFind destination code + display name.
// Must mirror `DESTINATIONS` in lib/quiz/schema.ts (minus the synthetic "ANY"
// option, which is a chip below the globe). Today: 18 countries — matches
// the set of distinct `universities.country` values in the catalog.
const SELECTABLE: Record<string, { code: Destination; name: string }> = {
  "040": { code: "AT", name: "Austria" },
  "056": { code: "BE", name: "Belgium" },
  "203": { code: "CZ", name: "Czechia" },
  "208": { code: "DK", name: "Denmark" },
  "233": { code: "EE", name: "Estonia" },
  "246": { code: "FI", name: "Finland" },
  "250": { code: "FR", name: "France" },
  "276": { code: "DE", name: "Germany" },
  "372": { code: "IE", name: "Ireland" },
  "380": { code: "IT", name: "Italy" },
  "528": { code: "NL", name: "Netherlands" },
  "578": { code: "NO", name: "Norway" },
  "616": { code: "PL", name: "Poland" },
  "620": { code: "PT", name: "Portugal" },
  "724": { code: "ES", name: "Spain" },
  "752": { code: "SE", name: "Sweden" },
  "756": { code: "CH", name: "Switzerland" },
  "826": { code: "GB", name: "United Kingdom" },
};

// Canvas geometry.
const WIDTH = 480;
const HEIGHT = 480;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;
const RADIUS = (WIDTH - 36) / 2;
const SCALE = 620;
const HOME_ROTATION: [number, number, number] = [-15, -53, 0];

// Pixel distance below which a pointer interaction is treated as a click
// rather than a drag. Anything above this suppresses the country toggle so
// the user doesn't accidentally select while panning the globe around.
const CLICK_VS_DRAG_THRESHOLD_PX = 5;

// How many degrees the globe rotates per pixel of drag. Tuned slow so the
// globe feels weighty rather than twitchy — combined with inertia on
// release this lands close to "real globe in a museum kiosk" feel.
const DRAG_SENSITIVITY = 0.18;

// Inertia after release: velocity decays exponentially each frame. 0.92 ≈
// the spin coasts for about 1 s before settling. INERTIA_STOP_DEG_PER_FRAME
// kills the loop once we're below visually-perceptible movement.
const INERTIA_DECAY = 0.92;
const INERTIA_STOP_DEG_PER_FRAME = 0.04;
// Cap initial throw speed so a fast flick doesn't whip across the globe.
const INERTIA_MAX_DEG_PER_FRAME = 6;

// Smooth-return animation duration when the user clicks the reset button.
const RESET_DURATION_MS = 700;

type GeoFeature = Feature<Geometry, { name?: string }> & {
  id?: string | number;
};

export function EuropeGlobe({
  selected,
  onToggle,
}: {
  selected: Destination[];
  onToggle: (code: Destination) => void;
}) {
  const t = useTranslations("quiz");
  // Country names overlay the schema's `questions.destinations.options.<CODE>`
  // labels (same English text as the option list) — see docs/features/i18n.md.
  const countryName = useCallback(
    (code: Destination, fallback: string): string => {
      const key = `questions.destinations.options.${code}`;
      return t.has(key) ? t(key) : fallback;
    },
    [t],
  );
  const [topo, setTopo] = useState<Topology | null>(null);
  const [rotation, setRotation] =
    useState<[number, number, number]>(HOME_ROTATION);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const reduce = useReducedMotion();

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startRotation: [number, number, number];
    moved: boolean;
    // Last two pointer samples so we can compute release velocity.
    lastX: number;
    lastY: number;
    lastT: number;
    prevX: number;
    prevY: number;
    prevT: number;
  } | null>(null);
  const suppressNextClickRef = useRef(false);
  const resetRafRef = useRef<number | null>(null);
  const inertiaRafRef = useRef<number | null>(null);
  const rotationRef = useRef<[number, number, number]>(HOME_ROTATION);
  const sound = useSound();

  useEffect(() => {
    let cancelled = false;
    fetch("/maps/europe.topo.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Topology>;
      })
      .then((data) => {
        if (!cancelled) setTopo(data);
      })
      .catch((err) => {
        console.error("[EuropeGlobe] failed to load map", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Pre-parse the geometry once. The projection/path pipeline below depends
  // only on `rotation`, so we recompute paths but never re-decode TopoJSON.
  const features = useMemo(() => {
    if (!topo) {
      return {
        all: [] as GeoFeature[],
        selectable: [] as GeoFeature[],
        context: [] as GeoFeature[],
      };
    }
    const fc = feature(
      topo,
      topo.objects.countries as never,
    ) as unknown as FeatureCollection<Geometry, { name?: string }>;
    const all = fc.features as GeoFeature[];
    const selectable = all.filter((f) =>
      f.id !== undefined ? SELECTABLE[String(f.id)] !== undefined : false,
    );
    const context = all.filter((f) =>
      f.id !== undefined ? SELECTABLE[String(f.id)] === undefined : true,
    );
    return { all, selectable, context };
  }, [topo]);

  const { projectionPath, graticulePath } = useMemo(() => {
    if (!topo) {
      return {
        projectionPath: null as ReturnType<typeof geoPath> | null,
        graticulePath: "",
      };
    }
    const projection = geoAzimuthalEqualArea()
      .rotate(rotation)
      .scale(SCALE)
      .translate([CENTER_X, CENTER_Y])
      .clipAngle(75);
    const path = geoPath(projection);
    return {
      projectionPath: path,
      graticulePath: path(geoGraticule10()) ?? "",
    };
  }, [topo, rotation]);

  // Keep rotationRef in lock-step with rotation state so inertia rAF can
  // read the latest value without re-subscribing.
  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  const cancelResetAnimation = useCallback(() => {
    if (resetRafRef.current !== null) {
      cancelAnimationFrame(resetRafRef.current);
      resetRafRef.current = null;
    }
  }, []);

  const cancelInertia = useCallback(() => {
    if (inertiaRafRef.current !== null) {
      cancelAnimationFrame(inertiaRafRef.current);
      inertiaRafRef.current = null;
    }
  }, []);

  const startInertia = useCallback(
    (vx: number, vy: number) => {
      cancelInertia();
      let velX = clamp(vx, -INERTIA_MAX_DEG_PER_FRAME, INERTIA_MAX_DEG_PER_FRAME);
      let velY = clamp(vy, -INERTIA_MAX_DEG_PER_FRAME, INERTIA_MAX_DEG_PER_FRAME);
      const tick = () => {
        const [lambda, phi, gamma] = rotationRef.current;
        const nextLambda = lambda + velX;
        const nextPhi = clamp(phi + velY, -89, 89);
        setRotation([nextLambda, nextPhi, gamma]);
        velX *= INERTIA_DECAY;
        velY *= INERTIA_DECAY;
        if (
          Math.abs(velX) < INERTIA_STOP_DEG_PER_FRAME &&
          Math.abs(velY) < INERTIA_STOP_DEG_PER_FRAME
        ) {
          inertiaRafRef.current = null;
          return;
        }
        inertiaRafRef.current = requestAnimationFrame(tick);
      };
      inertiaRafRef.current = requestAnimationFrame(tick);
    },
    [cancelInertia],
  );

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      // Ignore non-primary buttons; let middle/right-click pass through.
      if (e.button !== 0 && e.pointerType === "mouse") return;
      cancelResetAnimation();
      cancelInertia();
      setHasInteracted(true);
      const now = performance.now();
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startRotation: rotation,
        moved: false,
        lastX: e.clientX,
        lastY: e.clientY,
        lastT: now,
        prevX: e.clientX,
        prevY: e.clientY,
        prevT: now,
      };
      // NOTE: don't call setPointerCapture here. Capturing on the SVG would
      // retarget the synthesized `click` event to the SVG, so taps on inner
      // country <path>s would never fire their onClick. Capture is deferred
      // to handlePointerMove once we know it's a drag, not a tap.
    },
    [rotation, cancelResetAnimation, cancelInertia],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) > CLICK_VS_DRAG_THRESHOLD_PX) {
        drag.moved = true;
        setIsDragging(true);
        // Now we know this is a drag, not a tap — capture the pointer so
        // motion outside the SVG bounds keeps rotating the globe.
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Capture can fail (e.g., pointer no longer active); harmless.
        }
      }
      if (!drag.moved) return;
      // Record sliding two-sample buffer for release-velocity estimation.
      drag.prevX = drag.lastX;
      drag.prevY = drag.lastY;
      drag.prevT = drag.lastT;
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
      drag.lastT = performance.now();
      // Lambda (yaw) rotates with horizontal drag; phi (pitch) with vertical.
      // Phi clamps to ±89° so the user can't fully flip the globe.
      const nextLambda = drag.startRotation[0] + dx * DRAG_SENSITIVITY;
      const nextPhi = clamp(
        drag.startRotation[1] - dy * DRAG_SENSITIVITY,
        -89,
        89,
      );
      setRotation([nextLambda, nextPhi, drag.startRotation[2]]);
    },
    [],
  );

  const finishDrag = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      if (drag.moved) {
        // The pointer-up here would otherwise fire a synthetic click on the
        // country path under the pointer. Eat the next click event.
        suppressNextClickRef.current = true;
        // Compute release velocity from the most recent two samples.
        const dt = drag.lastT - drag.prevT;
        if (dt > 0 && dt < 120) {
          // Pixels per millisecond → pixels per ~16.6 ms frame → degrees per
          // frame via our drag sensitivity. Vertical sign is flipped to match
          // the drag handler.
          const pxPerFrameX = ((drag.lastX - drag.prevX) / dt) * 16.6;
          const pxPerFrameY = ((drag.lastY - drag.prevY) / dt) * 16.6;
          const velLambda = pxPerFrameX * DRAG_SENSITIVITY;
          const velPhi = -pxPerFrameY * DRAG_SENSITIVITY;
          if (
            Math.abs(velLambda) > INERTIA_STOP_DEG_PER_FRAME ||
            Math.abs(velPhi) > INERTIA_STOP_DEG_PER_FRAME
          ) {
            startInertia(velLambda, velPhi);
          }
        }
      }
      dragRef.current = null;
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // setPointerCapture may have failed silently — releasing is best-effort.
      }
    },
    [startInertia],
  );

  const resetToHome = useCallback(() => {
    cancelResetAnimation();
    cancelInertia();
    const start = rotation;
    const startTime = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / RESET_DURATION_MS);
      // ease-out-cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setRotation([
        lerp(start[0], HOME_ROTATION[0], eased),
        lerp(start[1], HOME_ROTATION[1], eased),
        lerp(start[2], HOME_ROTATION[2], eased),
      ]);
      if (t < 1) {
        resetRafRef.current = requestAnimationFrame(tick);
      } else {
        resetRafRef.current = null;
      }
    };
    resetRafRef.current = requestAnimationFrame(tick);
  }, [rotation, cancelResetAnimation, cancelInertia]);

  useEffect(
    () => () => {
      cancelResetAnimation();
      cancelInertia();
    },
    [cancelResetAnimation, cancelInertia],
  );

  const isAtHome =
    Math.abs(rotation[0] - HOME_ROTATION[0]) < 0.5 &&
    Math.abs(rotation[1] - HOME_ROTATION[1]) < 0.5;

  if (!topo || !projectionPath) {
    return (
      <GlobeSkeleton
        label={
          t.has("questions.destinations.loadingGlobe")
            ? t("questions.destinations.loadingGlobe")
            : "Loading globe…"
        }
      />
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-[480px]">
      <motion.svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full touch-none select-none [filter:drop-shadow(0_18px_40px_rgba(15,23,42,0.18))]"
        role="group"
        aria-label={
          t.has("questions.destinations.globeAriaLabel")
            ? t("questions.destinations.globeAriaLabel")
            : "Globe — drag to rotate, click a highlighted country to select"
        }
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          transformOrigin: `${CENTER_X}px ${CENTER_Y}px`,
        }}
        animate={
          reduce || hasInteracted ? undefined : { rotate: [-1.4, 1.4, -1.4] }
        }
        transition={
          reduce || hasInteracted
            ? undefined
            : { duration: 9, ease: "easeInOut", repeat: Infinity }
        }
      >
        <defs>
          <clipPath id="globe-clip">
            <circle cx={CENTER_X} cy={CENTER_Y} r={RADIUS} />
          </clipPath>
          <radialGradient id="globe-ocean" cx="32%" cy="28%" r="85%">
            <stop offset="0%" stopColor="#3b6f9c" />
            <stop offset="55%" stopColor="#1d3a5f" />
            <stop offset="100%" stopColor="#0c1f33" />
          </radialGradient>
          <radialGradient id="globe-atmosphere" cx="50%" cy="50%" r="55%">
            <stop offset="78%" stopColor="rgba(125,211,252,0)" />
            <stop offset="92%" stopColor="rgba(125,211,252,0.55)" />
            <stop offset="100%" stopColor="rgba(56,189,248,0)" />
          </radialGradient>
          <radialGradient id="globe-shine" cx="28%" cy="22%" r="60%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.40)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <radialGradient id="globe-shadow" cx="68%" cy="74%" r="65%">
            <stop offset="60%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
          </radialGradient>
        </defs>

        {/* Atmospheric glow rim — slightly larger than the globe. */}
        <circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={RADIUS + 10}
          fill="url(#globe-atmosphere)"
          pointerEvents="none"
        />

        {/* Ocean. */}
        <circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={RADIUS}
          fill="url(#globe-ocean)"
        />

        {/* Map content. */}
        <g clipPath="url(#globe-clip)">
          {graticulePath ? (
            <path
              d={graticulePath}
              fill="none"
              stroke="rgba(186,230,253,0.18)"
              strokeWidth={0.4}
            />
          ) : null}

          {features.context.map((f) => {
            const d = projectionPath(f);
            if (!d) return null;
            return (
              <path
                key={`ctx-${f.id}`}
                d={d}
                fill="#6f7f4d"
                stroke="rgba(15,25,10,0.55)"
                strokeWidth={0.5}
                strokeLinejoin="round"
              />
            );
          })}

          {features.selectable.map((f) => {
            const meta = SELECTABLE[String(f.id)];
            const isSelected = selected.includes(meta.code);
            const d = projectionPath(f);
            if (!d) return null;
            const name = countryName(meta.code, meta.name);
            const ariaLabel = isSelected
              ? t.has("questions.destinations.countryAriaSelected")
                ? t("questions.destinations.countryAriaSelected", { country: name })
                : `${name} — selected`
              : t.has("questions.destinations.countryAriaUnselected")
                ? t("questions.destinations.countryAriaUnselected", { country: name })
                : `${name} — click to select`;
            return (
              <SelectablePath
                key={`sel-${f.id}`}
                d={d}
                name={name}
                ariaLabel={ariaLabel}
                code={meta.code}
                isSelected={isSelected}
                onToggle={() => {
                  if (suppressNextClickRef.current) {
                    suppressNextClickRef.current = false;
                    return;
                  }
                  sound.play(isSelected ? "deselect" : "select");
                  onToggle(meta.code);
                }}
              />
            );
          })}
        </g>

        {/* Specular highlight + soft interior shadow that sell the curvature. */}
        <circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={RADIUS}
          fill="url(#globe-shine)"
          pointerEvents="none"
        />
        <circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={RADIUS}
          fill="url(#globe-shadow)"
          pointerEvents="none"
        />

        {/* Outer rim. */}
        <circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={RADIUS}
          fill="none"
          stroke="rgba(8,47,73,0.65)"
          strokeWidth={1.25}
        />
      </motion.svg>

      {!isAtHome ? (
        <button
          type="button"
          onClick={resetToHome}
          className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur transition-colors hover:bg-accent"
          aria-label={
            t.has("questions.destinations.centerAriaLabel")
              ? t("questions.destinations.centerAriaLabel")
              : "Center the globe on Europe"
          }
        >
          <RotateCcw className="size-3.5" />
          {t.has("questions.destinations.centerButton")
            ? t("questions.destinations.centerButton")
            : "Center on Europe"}
        </button>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {selected.length === 0
          ? t.has("questions.destinations.noneSelectedAria")
            ? t("questions.destinations.noneSelectedAria")
            : "No countries selected."
          : t.has("questions.destinations.countSelectedAria")
            ? t("questions.destinations.countSelectedAria", { count: selected.length })
            : `${selected.length} ${selected.length === 1 ? "country" : "countries"} selected.`}
      </p>
    </div>
  );
}

function SelectablePath({
  d,
  name,
  ariaLabel,
  code,
  isSelected,
  onToggle,
}: {
  d: string;
  name: string;
  ariaLabel: string;
  code: Destination;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.path
      d={d}
      role="button"
      aria-pressed={isSelected}
      aria-label={ariaLabel}
      tabIndex={0}
      data-code={code}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      className="cursor-pointer outline-none transition-colors"
      animate={{
        fill: isSelected ? "#14b8a6" : "#a7d49c",
      }}
      whileHover={{
        fill: isSelected ? "#0d9488" : "#7fc66f",
      }}
      transition={{ duration: 0.18 }}
      stroke={isSelected ? "#0f766e" : "#2c4720"}
      strokeWidth={isSelected ? 1.25 : 0.7}
      strokeLinejoin="round"
    >
      <title>{name}</title>
    </motion.path>
  );
}

function GlobeSkeleton({ label }: { label: string }) {
  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[480px] items-center justify-center">
      <div className="size-[88%] animate-pulse rounded-full bg-gradient-to-br from-slate-200 to-slate-300" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
