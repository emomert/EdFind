"use client";

import { motion } from "framer-motion";

/**
 * Per-route template that wraps every page in a subtle fade-up transition.
 * App Router re-renders this on navigation (unlike layout), so each route
 * change re-runs the animation.
 */
export default function RouteTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.21, 0.6, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
