/**
 * Returns a new array with the items shuffled using the Fisher–Yates
 * algorithm, which produces a uniformly random permutation.
 *
 * The common `array.sort(() => Math.random() - 0.5)` idiom that Figma's
 * generator used is biased and not a true shuffle — prefer this instead.
 */
export function shuffle<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
