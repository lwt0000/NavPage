import type { Transition } from "framer-motion";

/**
 * Apple-tuned motion vocabulary (damping-ratio + response mapped onto
 * framer-motion's bounce + duration spring API).
 *
 * Critically damped springs everywhere by default; reserve bounce for
 * interactions that inherited real momentum from a gesture (a flick,
 * a drag release) — overshoot on something that merely appeared feels wrong.
 */

/** Default UI spring — damping 1.0, response 0.4. Panels, dialogs, reflows. */
export const spring: Transition = { type: "spring", duration: 0.4, bounce: 0 };

/** Snappier variant — response 0.3. Menus, popovers, toggles, small moves. */
export const springSnappy: Transition = { type: "spring", duration: 0.3, bounce: 0 };

/** Momentum spring — slight bounce, only after a gesture carried velocity. */
export const springGesture: Transition = { type: "spring", duration: 0.4, bounce: 0.2 };

/**
 * Projects where a flick would land if left to decelerate like a scroll view
 * (Apple's exponential-decay projection from Designing Fluid Interfaces).
 * Decide commit-vs-cancel from the projected endpoint, not the release point.
 */
export function project(initialVelocity: number, decelerationRate = 0.998): number {
  return ((initialVelocity / 1000) * decelerationRate) / (1 - decelerationRate);
}
