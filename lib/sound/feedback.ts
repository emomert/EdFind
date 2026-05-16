"use client";

/**
 * Quiz sound feedback — procedurally synthesised via Web Audio API so we
 * don't ship any audio assets.
 *
 * The AudioContext is created lazily on the first play (browser autoplay
 * policy: the context can only start in response to a user gesture, so we
 * defer creation until the first click/keypress comes through).
 *
 * Each effect is a short envelope-shaped sine — quiet by design. Volume
 * caps around 0.18 so even multiple stacked sounds don't blow eardrums.
 */

type SoundName = "select" | "deselect" | "advance" | "back" | "complete";

let sharedCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (sharedCtx) return sharedCtx;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  try {
    sharedCtx = new Ctor();
    return sharedCtx;
  } catch {
    return null;
  }
}

type ToneSpec = {
  freq: number;
  duration: number; // seconds
  volume?: number;
  type?: OscillatorType;
  startTime?: number; // seconds offset from now
};

function playTone(ctx: AudioContext, spec: ToneSpec) {
  const t0 = ctx.currentTime + (spec.startTime ?? 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = spec.type ?? "sine";
  osc.frequency.setValueAtTime(spec.freq, t0);
  const peak = spec.volume ?? 0.16;
  // Brief attack (3 ms), exponential decay over the rest.
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + spec.duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + spec.duration + 0.02);
}

function playPitchSlide(
  ctx: AudioContext,
  spec: { from: number; to: number; duration: number; volume?: number },
) {
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(spec.from, t0);
  osc.frequency.exponentialRampToValueAtTime(spec.to, t0 + spec.duration);
  const peak = spec.volume ?? 0.16;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + spec.duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + spec.duration + 0.02);
}

const PRESETS: Record<SoundName, (ctx: AudioContext) => void> = {
  // Upward pop — "yes, that's added"
  select: (ctx) =>
    playPitchSlide(ctx, {
      from: 540,
      to: 760,
      duration: 0.09,
      volume: 0.16,
    }),
  // Downward pop — symmetric counterpart to select
  deselect: (ctx) =>
    playPitchSlide(ctx, {
      from: 540,
      to: 360,
      duration: 0.09,
      volume: 0.14,
    }),
  // Soft two-note advance: C5 then a perfect fifth (G5).
  advance: (ctx) => {
    playTone(ctx, { freq: 523.25, duration: 0.1, volume: 0.14 });
    playTone(ctx, {
      freq: 783.99,
      duration: 0.14,
      volume: 0.13,
      startTime: 0.06,
    });
  },
  // Lighter, lower step back.
  back: (ctx) =>
    playPitchSlide(ctx, {
      from: 460,
      to: 340,
      duration: 0.12,
      volume: 0.12,
    }),
  // Three-note arpeggio for "all done": C5 → E5 → G5.
  complete: (ctx) => {
    playTone(ctx, { freq: 523.25, duration: 0.18, volume: 0.16 });
    playTone(ctx, {
      freq: 659.25,
      duration: 0.18,
      volume: 0.16,
      startTime: 0.11,
    });
    playTone(ctx, {
      freq: 783.99,
      duration: 0.28,
      volume: 0.17,
      startTime: 0.22,
    });
  },
};

/**
 * Play a named sound. Silent fallback when no AudioContext is available or
 * `enabled` is false — never throws, never blocks the UI thread.
 */
export function playSound(name: SoundName, enabled: boolean): void {
  if (!enabled) return;
  const ctx = getContext();
  if (!ctx) return;
  // Some browsers (notably Safari) suspend the context until a user gesture
  // resumes it. resume() is idempotent and safe to call repeatedly.
  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => {});
  }
  try {
    PRESETS[name](ctx);
  } catch {
    // Swallow synthesis errors — sound is a polish layer, never load-bearing.
  }
}
