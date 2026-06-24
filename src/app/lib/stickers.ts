/**
 * Sticker collection — emoji stickers grouped into themed albums.
 *
 * Awarded on a game clear: one sticker per star earned (new ones preferred),
 * plus a bonus "반짝이" sticker on a 3-star clear. Collections are kept
 * per-player (가온이 / 시온이) in localStorage.
 */

export interface Sticker {
  id: string;
  emoji: string;
}

export interface Album {
  id: string;
  title: string;
  icon: string;
  special?: boolean; // shiny album — only from 3-star bonuses
  stickers: Sticker[];
}

const RAW: { id: string; title: string; icon: string; special?: boolean; emojis: string[] }[] = [
  { id: 'animals', title: '동물 친구들', icon: '🐾', emojis: ['🐶', '🐱', '🐰', '🦁', '🐼', '🦊'] },
  { id: 'snacks', title: '맛있는 간식', icon: '🍓', emojis: ['🍎', '🍌', '🍓', '🍪', '🍰', '🍦'] },
  { id: 'sea', title: '바다 친구들', icon: '🌊', emojis: ['🐠', '🐙', '🦀', '🐳', '🐢', '🦈'] },
  { id: 'space', title: '우주 탐험', icon: '🚀', emojis: ['🚀', '🪐', '🌟', '🌙', '☄️', '🧑‍🚀'] },
  { id: 'dino', title: '공룡 나라', icon: '🦕', emojis: ['🦖', '🦕', '🥚', '🌋', '🦴', '🌴'] },
  { id: 'nature', title: '자연과 날씨', icon: '🌈', emojis: ['🌈', '☀️', '🌸', '🍀', '🦋', '🌻'] },
  { id: 'shiny', title: '반짝이', icon: '✨', special: true, emojis: ['👑', '💎', '🦄', '🏆', '🎖️', '⭐'] },
];

export const ALBUMS: Album[] = RAW.map((a) => ({
  id: a.id,
  title: a.title,
  icon: a.icon,
  special: a.special,
  stickers: a.emojis.map((emoji, i) => ({ id: `${a.id}-${i}`, emoji })),
}));

const ALL_NORMAL: Sticker[] = ALBUMS.filter((a) => !a.special).flatMap((a) => a.stickers);
const ALL_SPECIAL: Sticker[] = ALBUMS.filter((a) => a.special).flatMap((a) => a.stickers);
const TOTAL = ALL_NORMAL.length + ALL_SPECIAL.length;

/** sticker id -> how many copies the player owns */
type Counts = Record<string, number>;

const KEY = 'minigames:stickers';

let cache: Record<string, Counts> | null = null;

function loadAll(): Record<string, Counts> {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Record<string, Counts>) : {};
  } catch {
    cache = {};
  }
  return cache;
}

function saveAll(data: Record<string, Counts>) {
  cache = data;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // ignore — cache still holds this session's state
  }
}

export function getCollection(player: string): Counts {
  return loadAll()[player] ?? {};
}

export interface AwardedSticker extends Sticker {
  isNew: boolean;
}

/**
 * Award stickers for a cleared game: `stars` normal stickers (new preferred),
 * plus one shiny sticker when stars === 3. Returns what was awarded so the
 * result screen can show it off.
 */
export function awardStickers(player: string, stars: number): AwardedSticker[] {
  const data = loadAll();
  const owned: Counts = { ...(data[player] ?? {}) };
  const awarded: AwardedSticker[] = [];

  const give = (pool: Sticker[]) => {
    const fresh = pool.filter((s) => !owned[s.id]);
    const from = fresh.length ? fresh : pool;
    const s = from[Math.floor(Math.random() * from.length)];
    awarded.push({ ...s, isNew: !owned[s.id] });
    owned[s.id] = (owned[s.id] ?? 0) + 1;
  };

  for (let i = 0; i < stars; i++) give(ALL_NORMAL);
  if (stars >= 3) give(ALL_SPECIAL);

  data[player] = owned;
  saveAll(data);
  return awarded;
}

export function getProgress(player: string): { collected: number; total: number } {
  const owned = getCollection(player);
  const collected = [...ALL_NORMAL, ...ALL_SPECIAL].filter((s) => owned[s.id]).length;
  return { collected, total: TOTAL };
}

/** Wipe every player's sticker collection. */
export function resetStickers() {
  cache = {};
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore — in-memory cache is already cleared
  }
}
