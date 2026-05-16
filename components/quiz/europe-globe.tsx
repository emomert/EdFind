"use client";

/**
 * EuropeGlobe — interactive country picker for the quiz's `destinations`
 * question. Renders Europe (+ Turkey for orientation, since the audience is
 * Turkish) onto an azimuthal-equal-area projection clipped to a circle so
 * the map curves like a globe. The 10 EdFind-supported countries are
 * clickable; the rest of Europe sits as muted context.
 *
 * Data: /maps/europe.topo.json (world-atlas 110m, filtered down at build
 * time by scripts/download-europe-map.mjs). Fetched at runtime so the
 * payload stays off the initial JS bundle for /quiz.
 *
 * Accessibility: each selectable country is a `<path>` with role="button",
 * aria-pressed, and keyboard support (Enter/Space toggle). A native SVG
 * `<title>` provides the hover tooltip and screen-reader name. The
 * consumer should also render the parallel chip list below so users who
 * can't see the map can still confirm their selection.
 */

import { useEffect, useMemo, useState } from "react";
import { geoAzimuthalEqualArea, geoGraticule10, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { motion, useReducedMotion } from "framer-motion";

import type { Destination } from "@/lib/quiz/schema";

// ISO 3166-1 numeric → EdFind destination code + display name.
const SELECTABLE: Record<string, { code: Destination; name: string }> = {
  "208": { code: "DK", name: "Denmark" },
  "250": { code: "FR", name: "France" },
  "276": { code: "DE", name: "Germany" },
  "372": { code: "IE", name: "Ireland" },
  "380": { code: "IT", name: "Italy" },
  "528": { code: "NL", name: "Netherlands" },
  "724": { code: "ES", name: "Spain" },
  "752": { code: "SE", name: "Sweden" },
  "756": { code: "CH", name: "Switzerland" },
  "826": { code: "GB", name: "United Kingdom" },
};

// Geographic centre + scale chosen to fit Europe + Turkey within the clip
// circle at this canvas size. Tweak `SCALE` if you change `WIDTH`.
const WIDTH = 480;
const HEIGHT = 480;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;
const RADIUS = (WIDTH - 36) / 2;
const SCALE = 620;
const ROTATE: [number, number, number] = [-15, -53, 0];

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
  const [topo, setTopo] = useState<Topology | null>(null);
  const reduce = useReducedMotion();

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

  const { contextFeatures, selectableFeatures, graticulePath, projectionPath } =
    useMemo(() => {
      if (!topo) {
        return {
          contextFeatures: [] as GeoFeature[],
          selectableFeatures: [] as GeoFeature[],
          graticulePath: "",
          projectionPath: null as ReturnType<typeof geoPath> | null,
        };
      }
      const projection = geoAzimuthalEqualArea()
        .rotate(ROTATE)
        .scale(SCALE)
        .translate([CENTER_X, CENTER_Y])
        .clipAngle(40);
      const path = geoPath(projection);
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
      return {
        contextFeatures: context,
        selectableFeatures: selectable,
        graticulePath: path(geoGraticule10()) ?? "",
        projectionPath: path,
      };
    }, [topo]);

  if (!topo || !projectionPath) {
    return <GlobeSkeleton />;
  }

  return (
    <div className="relative mx-auto w-full max-w-[480px]">
      <motion.svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full select-none"
        role="group"
        aria-label="Europe map — pick which countries you'd like to study in"
        animate={
          reduce ? undefined : { rotate: [-1.4, 1.4, -1.4] }
        }
        transition={
          reduce
            ? undefined
            : {
                duration: 9,
                ease: "easeInOut",
                repeat: Infinity,
              }
        }
        style={{ transformOrigin: `${CENTER_X}px ${CENTER_Y}px` }}
        whileHover={{ rotate: 0 }}
      >
        <defs>
          <clipPath id="globe-clip">
            <circle cx={CENTER_X} cy={CENTER_Y} r={RADIUS} />
          </clipPath>
          <radialGradient id="globe-ocean" cx="35%" cy="32%" r="80%">
            <stop offset="0%" stopColor="#e0f5f3" />
            <stop offset="100%" stopColor="#bfe6e0" />
          </radialGradient>
          <radialGradient id="globe-shine" cx="30%" cy="28%" r="55%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        {/* Outer halo ring for depth. */}
        <circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={RADIUS + 4}
          fill="none"
          stroke="rgb(13 148 136 / 0.18)"
          strokeWidth={3}
        />

        {/* Ocean. */}
        <circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={RADIUS}
          fill="url(#globe-ocean)"
        />

        {/* Map content, clipped to the ocean circle. */}
        <g clipPath="url(#globe-clip)">
          {graticulePath ? (
            <path
              d={graticulePath}
              fill="none"
              stroke="rgb(15 118 110 / 0.15)"
              strokeWidth={0.4}
            />
          ) : null}

          {contextFeatures.map((f) => {
            const d = projectionPath(f);
            if (!d) return null;
            return (
              <path
                key={`ctx-${f.id}`}
                d={d}
                fill="rgb(203 213 225 / 0.6)"
                stroke="rgb(148 163 184 / 0.6)"
                strokeWidth={0.3}
              />
            );
          })}

          {selectableFeatures.map((f) => {
            const meta = SELECTABLE[String(f.id)];
            const isSelected = selected.includes(meta.code);
            const d = projectionPath(f);
            if (!d) return null;
            return (
              <SelectablePath
                key={`sel-${f.id}`}
                d={d}
                name={meta.name}
                code={meta.code}
                isSelected={isSelected}
                onToggle={() => onToggle(meta.code)}
              />
            );
          })}
        </g>

        {/* Glossy highlight + outer rim. */}
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
          fill="none"
          stroke="rgb(15 118 110 / 0.35)"
          strokeWidth={1.5}
        />
      </motion.svg>

      {/* Live region for screen readers — narrates picks without forcing
          them to interpret the map. */}
      <p className="sr-only" aria-live="polite">
        {selected.length === 0
          ? "No countries selected."
          : `${selected.length} ${selected.length === 1 ? "country" : "countries"} selected.`}
      </p>
    </div>
  );
}

function SelectablePath({
  d,
  name,
  code,
  isSelected,
  onToggle,
}: {
  d: string;
  name: string;
  code: Destination;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.path
      d={d}
      role="button"
      aria-pressed={isSelected}
      aria-label={`${name} — ${isSelected ? "selected" : "click to select"}`}
      tabIndex={0}
      data-code={code}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      className={[
        "cursor-pointer outline-none transition-colors",
        "focus-visible:[filter:drop-shadow(0_0_0_2px_rgb(13_148_136))]",
      ].join(" ")}
      animate={{
        fill: isSelected ? "rgb(13 148 136)" : "rgb(204 251 241)",
        scale: isSelected ? 1.015 : 1,
      }}
      whileHover={{
        fill: isSelected ? "rgb(15 118 110)" : "rgb(153 246 228)",
      }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      stroke={isSelected ? "rgb(15 118 110)" : "rgb(13 148 136)"}
      strokeWidth={isSelected ? 1 : 0.6}
      style={{ transformBox: "fill-box", transformOrigin: "center" }}
    >
      <title>{name}</title>
    </motion.path>
  );
}

function GlobeSkeleton() {
  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[480px] items-center justify-center">
      <div className="size-[88%] animate-pulse rounded-full bg-gradient-to-br from-teal-50 to-emerald-100" />
      <span className="sr-only">Loading map…</span>
    </div>
  );
}
