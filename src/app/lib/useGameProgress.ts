import { useCallback, useState } from 'react';
import { getGameRecord, recordResult, type GameId, type GameRecord } from './storage';

export interface GameResult {
  score?: number;
  stars?: number;
  level?: number;
}

/**
 * Per-game progress: reads the saved record on mount (so the player resumes at
 * their highest level) and persists new results.
 *
 * `level` here is the level the player is *currently playing*, initialized from
 * the saved highest level. `submitResult` merges best score/stars/level into
 * storage and returns the updated record.
 */
export function useGameProgress(id: GameId) {
  const [record, setRecord] = useState<GameRecord>(() => getGameRecord(id));
  const [level, setLevel] = useState<number>(() => getGameRecord(id).level);

  const submitResult = useCallback(
    (result: GameResult): GameRecord => {
      const next = recordResult(id, { ...result, level });
      setRecord(next);
      return next;
    },
    [id, level],
  );

  return { record, level, setLevel, submitResult };
}
