import { createContext, useContext, useState, type ReactNode } from 'react';
import gaonPhoto from '../../assets/players/gaon-1.jpg';
import sionPhoto from '../../assets/players/sion-1.jpg';

/**
 * Who is playing. The two built-in kids (가온이 / 시온이) always exist, and
 * families can add their own players with a name + photo. A player is keyed by
 * name everywhere (game records, stickers), so names must stay unique.
 */
export interface PlayerInfo {
  name: string;
  /** Built-in asset URL, a stored data URL for custom players, or null. */
  photo: string | null;
  builtin: boolean;
}

const BUILTINS: PlayerInfo[] = [
  { name: '가온이', photo: gaonPhoto, builtin: true },
  { name: '시온이', photo: sionPhoto, builtin: true },
];

/** Built-in names — kept for anything that just needs the default labels. */
export const PLAYERS = BUILTINS.map((p) => p.name) as readonly string[];

const SELECTED_KEY = 'minigames:player';
const CUSTOM_KEY = 'minigames:customPlayers';

interface StoredCustom {
  name: string;
  photo: string | null;
}

function loadCustom(): PlayerInfo[] {
  try {
    const raw = window.localStorage.getItem(CUSTOM_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as StoredCustom[];
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((p) => p && typeof p.name === 'string' && !PLAYERS.includes(p.name))
      .map((p) => ({ name: p.name, photo: typeof p.photo === 'string' ? p.photo : null, builtin: false }));
  } catch {
    return [];
  }
}

function loadSelected(): string | null {
  try {
    return window.localStorage.getItem(SELECTED_KEY);
  } catch {
    return null;
  }
}

interface PlayerContextValue {
  /** Currently selected player name, or null if none chosen yet. */
  player: string | null;
  /** Built-in players followed by any custom ones. */
  players: PlayerInfo[];
  setPlayer: (name: string) => void;
  /** Add (and select) a custom player. No-op on blank/duplicate names. */
  addPlayer: (name: string, photo: string | null) => void;
  /** Remove a custom player (built-ins can't be removed). */
  removePlayer: (name: string) => void;
}

const PlayerContext = createContext<PlayerContextValue>({
  player: null,
  players: BUILTINS,
  setPlayer: () => {},
  addPlayer: () => {},
  removePlayer: () => {},
});

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [custom, setCustom] = useState<PlayerInfo[]>(() => loadCustom());
  const [player, setPlayerState] = useState<string | null>(() => loadSelected());

  const players = [...BUILTINS, ...custom];

  const persistCustom = (list: PlayerInfo[]) => {
    try {
      window.localStorage.setItem(
        CUSTOM_KEY,
        JSON.stringify(list.map((p) => ({ name: p.name, photo: p.photo }))),
      );
    } catch {
      // ignore — quota exceeded or storage unavailable; list still lives in memory
    }
  };

  const setPlayer = (name: string) => {
    setPlayerState(name);
    try {
      window.localStorage.setItem(SELECTED_KEY, name);
    } catch {
      // ignore — selection still lives in memory for this session
    }
  };

  const addPlayer = (name: string, photo: string | null) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (players.some((p) => p.name === trimmed)) {
      setPlayer(trimmed); // name already taken — just select it
      return;
    }
    const next = [...custom, { name: trimmed, photo, builtin: false }];
    setCustom(next);
    persistCustom(next);
    setPlayer(trimmed);
  };

  const removePlayer = (name: string) => {
    const next = custom.filter((p) => p.name !== name);
    setCustom(next);
    persistCustom(next);
    if (player === name) {
      setPlayerState(null);
      try {
        window.localStorage.removeItem(SELECTED_KEY);
      } catch {
        // ignore
      }
    }
  };

  return (
    <PlayerContext.Provider value={{ player, players, setPlayer, addPlayer, removePlayer }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
