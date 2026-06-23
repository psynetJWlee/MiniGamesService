import { useState } from 'react';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { GameShell } from '../components/GameShell';
import { ResultModal } from '../components/ResultModal';
import { shuffle } from '../lib/shuffle';
import { playCorrect } from '../lib/sound';
import { burstSmall } from '../lib/celebrate';
import { starsForLower } from '../lib/scoring';
import { useGameProgress } from '../lib/useGameProgress';

const BG_IMAGE =
  'https://images.unsplash.com/photo-1724421815419-21f4c87c259b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg';

const ITEM_POOL = [
  { emoji: '⭐', name: '별' },
  { emoji: '🍎', name: '사과' },
  { emoji: '🚗', name: '자동차' },
  { emoji: '🔑', name: '열쇠' },
  { emoji: '⚽', name: '공' },
  { emoji: '🎈', name: '풍선' },
  { emoji: '🦋', name: '나비' },
  { emoji: '🍄', name: '버섯' },
  { emoji: '🌸', name: '꽃' },
];

interface HiddenItem {
  id: number;
  emoji: string;
  x: number;
  y: number;
}

interface Level {
  label: string;
  count: number;
  /** Hit-area size in px (shrinks with difficulty). */
  hit: number;
  hints: number;
  stars: { three: number; two: number };
}

const LEVELS: Level[] = [
  { label: '쉬워요', count: 3, hit: 84, hints: 3, stars: { three: 0, two: 1 } },
  { label: '보통이에요', count: 5, hit: 64, hints: 2, stars: { three: 0, two: 2 } },
  { label: '어려워요', count: 7, hit: 50, hints: 2, stars: { three: 1, two: 3 } },
];

let itemSeq = 0;

function buildRound(level: Level): HiddenItem[] {
  return shuffle(ITEM_POOL)
    .slice(0, level.count)
    .map((it) => ({
      id: ++itemSeq,
      emoji: it.emoji,
      x: Math.random() * 75 + 12,
      y: Math.random() * 65 + 15,
    }));
}

export default function HiddenGame() {
  const navigate = useNavigate();
  const { level, setLevel, submitResult } = useGameProgress('hidden');
  const levelIndex = Math.min(level, LEVELS.length - 1);
  const config = LEVELS[levelIndex];

  const [items, setItems] = useState<HiddenItem[]>(() => buildRound(config));
  const [found, setFound] = useState<number[]>([]);
  const [hintsLeft, setHintsLeft] = useState(config.hints);
  const [hintActive, setHintActive] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  const startRound = (cfg: Level) => {
    setItems(buildRound(cfg));
    setFound([]);
    setHintsLeft(cfg.hints);
    setHintActive(false);
    setCleared(false);
  };

  const handleFind = (id: number) => {
    if (found.includes(id)) return;
    const next = [...found, id];
    setFound(next);
    playCorrect();
    burstSmall();
    if (next.length === items.length) {
      const used = config.hints - hintsLeft;
      const stars = starsForLower(used, config.stars);
      setEarnedStars(stars);
      submitResult({ stars, level: levelIndex });
      setTimeout(() => setCleared(true), 500);
    }
  };

  const useHint = () => {
    if (hintsLeft <= 0 || hintActive) return;
    setHintsLeft((h) => h - 1);
    setHintActive(true);
    setTimeout(() => setHintActive(false), 1500);
  };

  const goNextLevel = () => {
    const next = Math.min(levelIndex + 1, LEVELS.length - 1);
    setLevel(next);
    startRound(LEVELS[next]);
  };

  const status = (
    <div className="bg-white/90 px-4 py-2 rounded-2xl shadow-md text-orange-500 font-title text-xl">
      {found.length}/{items.length}
    </div>
  );

  return (
    <GameShell
      title="숨은 그림 찾기"
      levelIndex={levelIndex}
      levelCount={LEVELS.length}
      status={status}
      onReset={() => startRound(config)}
    >
      {/* Items to find + hint */}
      <div className="flex items-center justify-center flex-wrap gap-3 mb-6">
        {items.map((item) => (
          <div
            key={item.id}
            className={`p-3 rounded-2xl border-4 transition-all ${
              found.includes(item.id) ? 'bg-green-100 border-green-500 scale-90 opacity-50' : 'bg-white border-yellow-400'
            }`}
          >
            <span className="text-2xl">{item.emoji}</span>
          </div>
        ))}
        <button
          onClick={useHint}
          disabled={hintsLeft <= 0}
          className="flex items-center gap-2 bg-purple-400 disabled:opacity-40 text-white px-4 py-2.5 rounded-2xl shadow-md font-title hover:scale-105 transition-transform"
        >
          <Search size={22} />
          돋보기 {hintsLeft}
        </button>
      </div>

      <div className="relative aspect-video rounded-[40px] overflow-hidden shadow-2xl border-8 border-white">
        <ImageWithFallback src={BG_IMAGE} alt="숨은 그림 배경" className="w-full h-full object-cover" />

        {items.map((item) => {
          const isFound = found.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => handleFind(item.id)}
              className="absolute flex items-center justify-center"
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                width: config.hit,
                height: config.hit,
              }}
            >
              {/* Unfound items are faintly visible (a real "hidden picture"),
                  not invisible — with a soft white halo so they're spottable
                  against the busy photo. */}
              <span
                className={`text-4xl ${isFound ? 'animate-bounce' : ''}`}
                style={{
                  opacity: isFound ? 1 : 0.5,
                  filter: isFound ? 'none' : 'drop-shadow(0 0 3px rgba(255,255,255,0.9))',
                }}
              >
                {item.emoji}
              </span>
              {isFound && <div className="absolute inset-0 border-4 border-green-500 rounded-full" />}
              {/* Hint pulse for unfound items */}
              {!isFound && hintActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.4, 0.5] }}
                  transition={{ duration: 1.2, repeat: 1 }}
                  className="absolute inset-0 border-4 border-purple-400 rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>

      <ResultModal
        open={cleared}
        stars={earnedStars}
        title="모두 다 찾았어요!"
        subtitle="대단해요! 보물을 다 찾았어요!"
        hasNextLevel={levelIndex < LEVELS.length - 1}
        onNext={goNextLevel}
        onRetry={() => startRound(config)}
        onHome={() => navigate('/')}
      />
    </GameShell>
  );
}
