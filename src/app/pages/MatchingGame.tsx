import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { GameShell } from '../components/GameShell';
import { ResultModal } from '../components/ResultModal';
import { shuffle } from '../lib/shuffle';
import { playCorrect } from '../lib/sound';
import { burstSmall } from '../lib/celebrate';
import { starsForLower } from '../lib/scoring';
import { useWrongFeedback } from '../lib/useWrongFeedback';
import { useGameProgress } from '../lib/useGameProgress';

const THEMES: Record<string, string[]> = {
  animals: ['🦁', '🐵', '🦒', '🐘', '🐷', '🐸', '🐶', '🐱', '🐰', '🐼', '🐯', '🦊'],
  fruits: ['🍎', '🍌', '🍇', '🍓', '🍉', '🍑', '🍍', '🥝', '🍒', '🥥', '🍊', '🍐'],
  vehicles: ['🚗', '🚌', '🚓', '🚑', '🚒', '🚜', '🚲', '✈️', '🚀', '🚁', '🚢', '🚂'],
};
const THEME_KEYS = Object.keys(THEMES);

interface Level {
  label: string;
  pairs: number;
  cols: string;
  /** Max moves for 3 / 2 stars (clearing always gives ≥1). */
  stars: { three: number; two: number };
}

const LEVELS: Level[] = [
  { label: '쉬워요', pairs: 6, cols: 'grid-cols-3 md:grid-cols-4', stars: { three: 8, two: 12 } },
  { label: '보통이에요', pairs: 8, cols: 'grid-cols-4', stars: { three: 11, two: 16 } },
  { label: '어려워요', pairs: 10, cols: 'grid-cols-4 md:grid-cols-5', stars: { three: 14, two: 20 } },
];

interface Card {
  id: number;
  emoji: string;
}

function buildDeck(level: Level): Card[] {
  const theme = THEMES[THEME_KEYS[Math.floor(Math.random() * THEME_KEYS.length)]];
  const picks = shuffle(theme).slice(0, level.pairs);
  const doubled = picks.flatMap((emoji) => [emoji, emoji]);
  return shuffle(doubled).map((emoji, i) => ({ id: i, emoji }));
}

export default function MatchingGame() {
  const navigate = useNavigate();
  const wrong = useWrongFeedback();
  const { level, setLevel, submitResult } = useGameProgress('matching');
  const levelIndex = Math.min(level, LEVELS.length - 1);
  const config = LEVELS[levelIndex];

  const [cards, setCards] = useState<Card[]>(() => buildDeck(config));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [solved, setSolved] = useState<number[]>([]);
  const [disabled, setDisabled] = useState(false);
  const [moves, setMoves] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  const startGame = (cfg: Level) => {
    setCards(buildDeck(cfg));
    setFlipped([]);
    setSolved([]);
    setDisabled(false);
    setMoves(0);
    setCleared(false);
  };

  const handleCardClick = (id: number) => {
    if (disabled || flipped.includes(id) || solved.includes(id)) return;

    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);
    if (newFlipped.length < 2) return;

    setDisabled(true);
    const moveCount = moves + 1;
    setMoves(moveCount);
    const [a, b] = newFlipped;
    const cardA = cards.find((c) => c.id === a);
    const cardB = cards.find((c) => c.id === b);

    if (cardA && cardB && cardA.emoji === cardB.emoji) {
      const newSolved = [...solved, a, b];
      setSolved(newSolved);
      setFlipped([]);
      setDisabled(false);
      playCorrect();
      burstSmall();
      if (newSolved.length === cards.length) {
        const stars = starsForLower(moveCount, config.stars);
        setEarnedStars(stars);
        submitResult({ stars, score: moveCount, level: levelIndex });
        setTimeout(() => setCleared(true), 600);
      }
    } else {
      wrong.trigger();
      setTimeout(() => {
        setFlipped([]);
        setDisabled(false);
      }, 900);
    }
  };

  const goNextLevel = () => {
    const next = Math.min(levelIndex + 1, LEVELS.length - 1);
    setLevel(next);
    startGame(LEVELS[next]);
  };

  const status = (
    <div className="bg-white/90 px-4 py-2 rounded-2xl shadow-md text-orange-500 font-title text-xl">
      {moves}번
    </div>
  );

  return (
    <GameShell
      title="같은 그림 찾기"
      levelIndex={levelIndex}
      levelCount={LEVELS.length}
      status={status}
      onReset={() => startGame(config)}
      contentClassName="relative z-10 px-4 pt-28 pb-10 max-w-4xl mx-auto"
    >
      {wrong.overlay}

      <div className={`grid ${config.cols} gap-3 md:gap-5`}>
        {cards.map((card) => {
          const isUp = flipped.includes(card.id) || solved.includes(card.id);
          const isSolved = solved.includes(card.id);
          return (
            <motion.button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              whileHover={!isUp ? { scale: 1.05 } : {}}
              whileTap={!isUp ? { scale: 0.95 } : {}}
              aria-label={isUp ? card.emoji : '뒤집힌 카드'}
              className={`aspect-square rounded-3xl shadow-xl flex items-center justify-center text-5xl md:text-7xl transition-colors duration-300 ${
                isUp ? 'bg-white' : 'bg-orange-400'
              } ${isSolved ? 'ring-4 ring-green-400' : ''}`}
            >
              {/* Content is rendered directly from state (no 3D backface, which
                  silently fails in some browsers) — a small flip-in plays when
                  the face changes. Solved cards keep showing their picture. */}
              <motion.span
                key={isUp ? 'up' : 'down'}
                initial={{ rotateY: 90, scale: 0.5 }}
                animate={{ rotateY: 0, scale: 1 }}
                transition={{ duration: 0.25 }}
                className={isUp ? '' : 'font-title text-white/90'}
              >
                {isUp ? card.emoji : '?'}
              </motion.span>
            </motion.button>
          );
        })}
      </div>

      <ResultModal
        open={cleared}
        stars={earnedStars}
        title="전부 다 찾았어요!"
        subtitle={`${moves}번 만에 성공! 짝짝짝!`}
        hasNextLevel={levelIndex < LEVELS.length - 1}
        onNext={goNextLevel}
        onRetry={() => startGame(config)}
        onHome={() => navigate('/')}
      />
    </GameShell>
  );
}
