import { createContext, useContext, useState, type ReactNode } from 'react';

/**
 * Which kid is playing. Both names end in "이", so Korean particles
 * (이/가, 랑, 는, 야) are consistent — no particle branching needed.
 */
export const PLAYERS = ['가온이', '시온이'] as const;
export type Player = (typeof PLAYERS)[number];

const KEY = 'minigames:player';

function loadPlayer(): Player | null {
  try {
    const v = window.localStorage.getItem(KEY);
    return v && (PLAYERS as readonly string[]).includes(v) ? (v as Player) : null;
  } catch {
    return null;
  }
}

interface PlayerContextValue {
  player: Player | null;
  setPlayer: (p: Player) => void;
}

const PlayerContext = createContext<PlayerContextValue>({ player: null, setPlayer: () => {} });

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [player, setPlayerState] = useState<Player | null>(() => loadPlayer());

  const setPlayer = (p: Player) => {
    setPlayerState(p);
    try {
      window.localStorage.setItem(KEY, p);
    } catch {
      // ignore — selection still lives in memory for this session
    }
  };

  return <PlayerContext.Provider value={{ player, setPlayer }}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  return useContext(PlayerContext);
}
