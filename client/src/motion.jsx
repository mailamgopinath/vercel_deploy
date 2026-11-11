// Reusable animation pieces for StyleHub (built on Framer Motion).
//   <MotionProvider>         once at the top: turns animations off for visitors who ask for "reduced motion"
//   <Reveal>                 fades + slides content in the first time it scrolls into view
//   <Notice>                 a message that slides open/closed (errors, success, coupon text)
//   <AnimatedNumber>         a number/price that slides when its value changes
// All of them only animate opacity/transform, which keeps scrolling smooth.

import React from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";

export const EASE = [0.22, 1, 0.36, 1]; // gentle "ease-out" curve used everywhere

export function MotionProvider({ children }) {
  // reducedMotion="user": if the visitor's device asks for less motion, movement is skipped.
  return <MotionConfig reducedMotion="user" transition={{ duration: 0.45, ease: EASE }}>{children}</MotionConfig>;
}

// Fade in + slide up (or scale) once, when the element first enters the screen.
//   as="article"  -> which HTML tag to use     delay={0.1} -> wait before starting (seconds)
//   y / scale     -> how far it travels / how much it grows
export function Reveal({ as = "div", delay = 0, x = 0, y = 24, scale = 1, duration = 0.5, amount = 0.15, children, ...rest }) {
  const Tag = motion[as];
  return (
    <Tag
      initial={{ opacity: 0, x, y, scale }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, amount }} // once: never replays while scrolling up and down
      transition={{ duration, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// Delay for item number "index" in a grid, so cards appear one after another (max 4 steps).
export const stagger = (index, step = 0.07) => (index % 4) * step;

// A message that opens smoothly and closes smoothly. Pass the text (empty/false = hidden).
export function Notice({ show, children, ...rest }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          key="notice"
          initial={{ opacity: 0, height: 0, y: -6 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -6 }}
          transition={{ duration: 0.3, ease: EASE }}
          style={{ overflow: "hidden" }}
          {...rest}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Shows a value and slides the old one out / the new one in whenever it changes.
export function AnimatedNumber({ value, className }) {
  return (
    <span className={className} style={{ display: "inline-flex", overflow: "hidden", verticalAlign: "bottom" }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: "60%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-60%", opacity: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export { motion, AnimatePresence };
