/**
 * Star-rating helpers (1–3 stars) shared by all games.
 *
 * Games clear with 3 stars and lose stars based on a metric — either a metric
 * where higher is better (e.g. score) or lower is better (e.g. mistakes, time).
 * Thresholds are owned by each game (usually in its `LEVELS` config).
 */

/**
 * Lower-is-better metric (mistakes, seconds, moves).
 * Returns 3 if value <= three, 2 if value <= two, else 1.
 * Clearing always earns at least 1 star.
 *
 * @example starsForLower(mistakes, { three: 0, two: 2 }) // 0 mistakes → 3
 */
export function starsForLower(value: number, t: { three: number; two: number }): number {
  if (value <= t.three) return 3;
  if (value <= t.two) return 2;
  return 1;
}

/**
 * Higher-is-better metric (score, distance).
 * Returns 3 if value >= three, 2 if value >= two, else 1.
 */
export function starsForHigher(value: number, t: { three: number; two: number }): number {
  if (value >= t.three) return 3;
  if (value >= t.two) return 2;
  return 1;
}
