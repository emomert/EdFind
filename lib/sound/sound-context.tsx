"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { playSound } from "./feedback";

const STORAGE_KEY = "edfind:sound-enabled";

type SoundName = Parameters<typeof playSound>[0];

type SoundContextValue = {
  enabled: boolean;
  toggle: () => void;
  play: (name: SoundName) => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

/**
 * SoundProvider — wraps any subtree that wants `useSound()`. Keeps the
 * mute preference in localStorage so it survives reload, and exposes a
 * single `play(name)` function that's a no-op when the user has muted.
 *
 * Default is DISABLED — a quiz that plays sound the user can't immediately
 * silence is more annoying than delightful, and the in-quiz toggle was
 * removed (2026-06-10) for being unclear. The provider stays so `play()`
 * is a safe no-op and sound can be re-enabled later behind a clear control.
 */
export function SoundProvider({ children }: { children: ReactNode }) {
  // SSR-safe: render with `false` server-side and rehydrate on mount.
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        // localStorage isn't readable during SSR, so the initial render uses
        // the default and we promote the saved value here. Same pattern the
        // quiz draft load uses.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEnabled(raw === "true");
      }
    } catch {
      // ignore
    }
  }, []);

  const persistAndSet = useCallback((next: boolean) => {
    setEnabled(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // ignore
    }
  }, []);

  const toggle = useCallback(() => {
    persistAndSet(!enabled);
  }, [enabled, persistAndSet]);

  const play = useCallback(
    (name: SoundName) => {
      playSound(name, enabled);
    },
    [enabled],
  );

  const value = useMemo<SoundContextValue>(
    () => ({ enabled, toggle, play }),
    [enabled, toggle, play],
  );

  return (
    <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
  );
}

/**
 * Reads the current sound preference + play function. If used outside a
 * SoundProvider, returns a silent no-op stub so a stray consumer never
 * crashes the tree.
 */
export function useSound(): SoundContextValue {
  const ctx = useContext(SoundContext);
  if (ctx) return ctx;
  return {
    enabled: false,
    toggle: () => {},
    play: () => {},
  };
}
