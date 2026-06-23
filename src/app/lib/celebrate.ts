/**
 * Shared confetti presets, so games stop hand-rolling slightly different
 * canvas-confetti calls everywhere.
 */
import confetti from 'canvas-confetti';

const KIDS_COLORS = ['#FF9B9B', '#7BC9FF', '#A1EEBD', '#F9D949', '#D09CFA', '#FFB84C'];

/** Small pop at a point — for a single correct catch/pop. `origin` is 0–1. */
export function burstSmall(origin?: { x: number; y: number }) {
  confetti({ particleCount: 40, spread: 55, origin: origin ?? { y: 0.6 }, colors: KIDS_COLORS });
}

/** Big celebration — for clearing a level. */
export function burstBig() {
  confetti({ particleCount: 150, spread: 75, origin: { y: 0.6 }, colors: KIDS_COLORS });
}

/** Star rain from the top — for a 3-star / final clear. */
export function starRain() {
  confetti({ particleCount: 120, spread: 100, startVelocity: 45, origin: { y: 0 }, colors: KIDS_COLORS });
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: KIDS_COLORS });
}
