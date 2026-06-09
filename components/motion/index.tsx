"use client";

/**
 * Motion utilities — one consistent vocabulary for the whole app so motion
 * stays a polish layer instead of a soup of bespoke animations.
 *
 * Every component here respects `prefers-reduced-motion`: when the user
 * has it enabled, the wrapper renders its children inert (no animation,
 * no transforms). The shape of the DOM never changes — only the motion
 * does — so layout and accessibility are stable either way.
 */

import {
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from "framer-motion";
import { type ReactNode } from "react";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/**
 * Reveal — fades a block in with a small upward slide once it enters the
 * viewport. Good for hero subheads and section headers. Triggers once.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * PageTransition — a gentle fade applied to every route via app/template.tsx,
 * which re-mounts on navigation so the animation replays. Deliberately
 * opacity-only (no transform): a persistent transform on this wrapper would
 * become the containing block for descendant `position: fixed` elements
 * (welcome tour, community dev toggle, toasts) and break them.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger + StaggerItem — for lists where each card should arrive a
 * fraction after the one before it.
 *
 * <Stagger>
 *   {items.map(i => <StaggerItem key={i.id}>...</StaggerItem>)}
 * </Stagger>
 */
const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

export function Stagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={staggerItem}>
      {children}
    </motion.div>
  );
}

/**
 * Drift — slow continuous floating motion for decorative background
 * blobs / shapes. Two phases (offset, scale) so neighbours feel alive
 * rather than synchronised.
 */
export function Drift({
  children,
  className,
  amplitude = 14,
  duration = 14,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  amplitude?: number;
  duration?: number;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  const transition: Transition = {
    duration,
    repeat: Infinity,
    repeatType: "mirror",
    ease: "easeInOut",
    delay,
  };
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -amplitude, 0, amplitude * 0.6, 0],
        scale: [1, 1.03, 1, 0.99, 1],
      }}
      transition={transition}
      aria-hidden="true"
    >
      {children}
    </motion.div>
  );
}

/**
 * Lift — hover-only soft vertical lift. Use as a wrapper for cards that
 * already define their own colour/shadow transition; keeps motion logic
 * out of the card body so it stays consistent everywhere.
 */
export function Lift({
  children,
  className,
  amount = 3,
}: {
  children: ReactNode;
  className?: string;
  amount?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      whileHover={{ y: -amount }}
      transition={{ type: "spring", stiffness: 240, damping: 18 }}
    >
      {children}
    </motion.div>
  );
}
