/**
 * Local progress storage for the mini games.
 *
 * Everything is kept in a single localStorage key as JSON. There is no server
 * — stars and best scores live only on the device. All access is wrapped in
 * try/catch so private-browsing or storage-blocked environments degrade to an
 * in-memory copy instead of throwing.
 */

export type GameId =
  | 'feeding'
  | 'balloons'
  | 'matching'
  | 'monsters'
  | 'sounds'
  | 'maze'
  | 'hidden'
  | 'dino'
  | 'hospital'
  | 'math'
  | 'flags'
  | 'hangul';

export interface GameRecord {
  /** Best score achieved (higher is better; meaning is per-game). */
  bestScore: number;
  /** Best star rating earned, 0–3. */
  stars: number;
  /** Highest level reached / unlocked, 0-based. */
  level: number;
}

interface SaveData {
  version: 1;
  games: Partial<Record<GameId, GameRecord>>;
}

const STORAGE_KEY = 'minigames:v1';
const EMPTY_RECORD: GameRecord = { bestScore: 0, stars: 0, level: 0 };

// In-memory fallback used when localStorage is unavailable.
let memoryCache: SaveData | null = null;

function emptySave(): SaveData {
  return { version: 1, games: {} };
}

export function loadSave(): SaveData {
  if (memoryCache) return memoryCache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      memoryCache = emptySave();
      return memoryCache;
    }
    const parsed = JSON.parse(raw) as SaveData;
    memoryCache = parsed && parsed.games ? parsed : emptySave();
  } catch {
    memoryCache = emptySave();
  }
  return memoryCache;
}

function persist(data: SaveData) {
  memoryCache = data;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore — the in-memory cache still holds the latest state this session.
  }
}

export function getGameRecord(id: GameId): GameRecord {
  return loadSave().games[id] ?? { ...EMPTY_RECORD };
}

/**
 * Merge a result into a game's record, keeping the best of each field.
 * `level` is the level the player has now reached (stored as a max so progress
 * never goes backwards).
 */
export function recordResult(
  id: GameId,
  result: { score?: number; stars?: number; level?: number },
): GameRecord {
  const data = loadSave();
  const prev = data.games[id] ?? { ...EMPTY_RECORD };
  const next: GameRecord = {
    bestScore: Math.max(prev.bestScore, result.score ?? 0),
    stars: Math.max(prev.stars, result.stars ?? 0),
    level: Math.max(prev.level, result.level ?? 0),
  };
  data.games[id] = next;
  persist(data);
  return next;
}

/** Sum of best stars across all games (each game contributes up to 3). */
export function getTotalStars(): number {
  const games = loadSave().games;
  return Object.values(games).reduce((sum, r) => sum + (r?.stars ?? 0), 0);
}

/** Wipe all game progress (stars, best scores, unlocked levels). */
export function resetProgress() {
  memoryCache = emptySave();
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore — in-memory cache is already cleared
  }
}
