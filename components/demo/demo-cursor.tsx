"use client";

import { motion } from "framer-motion";

/**
 * A fake mouse pointer for the self-playing demo. The orchestrator moves it to
 * an element's center (viewport coordinates) and bumps `clickId` to fire a
 * click ripple — so scripted interactions ("click Quiz", "click Save") read
 * clearly on camera. Purely decorative; pointer-events-none.
 */
export function DemoCursor({
  x,
  y,
  visible,
  clickId,
}: {
  x: number;
  y: number;
  visible: boolean;
  clickId: number;
}) {
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0, x, y }}
      transition={{
        x: { type: "tween", duration: 0.62, ease: [0.22, 1, 0.36, 1] },
        y: { type: "tween", duration: 0.62, ease: [0.22, 1, 0.36, 1] },
        opacity: { duration: 0.25 },
      }}
      style={{ position: "fixed", left: 0, top: 0, zIndex: 60, pointerEvents: "none" }}
    >
      {clickId > 0 ? (
        <motion.span
          key={clickId}
          initial={{ scale: 0.2, opacity: 0.55 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            position: "absolute",
            left: -2,
            top: -2,
            width: 30,
            height: 30,
            borderRadius: 9999,
            background: "var(--primary)",
          }}
        />
      ) : null}
      {/* Arrow pointer — tip at (0,0) so it lands on the target center. */}
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.35))" }}
      >
        <path
          d="M3 2 L3 19 L8 14.5 L11 21.5 L14 20 L11 13 L18 13 Z"
          fill="white"
          stroke="#0f172a"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  );
}
