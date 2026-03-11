"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useShouldReduceMotion } from "@/lib/motionPrefs";

const EASE = [0.25, 0, 0, 1] as [number, number, number, number];

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useShouldReduceMotion();
  const initial = shouldReduceMotion
    ? { opacity: 1, y: 0, scale: 1 }
    : { opacity: 0, y: 12, scale: 0.996 };
  const animate = { opacity: 1, y: 0, scale: 1 };
  const exit = shouldReduceMotion
    ? { opacity: 1, y: 0, scale: 1 }
    : { opacity: 0, y: -6, scale: 1.002 };
  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.44, ease: EASE };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={initial}
        animate={animate}
        exit={exit}
        transition={transition}
        style={{ transformOrigin: "50% 0%" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
