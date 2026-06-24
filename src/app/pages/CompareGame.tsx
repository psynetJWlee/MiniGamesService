import { useMemo, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { GameShell } from '../components/GameShell';
import { ResultModal } from '../components/ResultModal';
import { playCorrect } from '../lib/sound';
import { burstSmall } from '../lib/celebrate';
import { starsForLower } from '../lib/scoring';
import { useWrongFeedback } from '../lib/useWrongFeedback';
import { useGameProgress } from '../lib/useGameProgress';

const ri = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Animals roughly ordered by real size (rank).
const ANIMALS: { e: string; r: number }[] = [
  { e: '🐜', r: 1 },
  { e: '🐭', r: 2 },
  { e: '🐹', r: 2 },
  { e: '🐰', r: 3 },
  { e: '🐱', r: 4 },
  { e: '🐶', r: 5 },
  { e: '🐷', r: 6 },
  { e: '🐯', r: 7 },
  { e: '🦓', r: 8 },
  { e: '🐴', r: 8 },
  { e: '🦏', r: 9 },
  { e: '🐘', r: 10 },
  { e: '🦒', r: 10 },
  { e: '🐳', r: 12 },
];
const FOODS = ['🍎', '🍌', '🍓', '🍇', '🍪', '⭐', '🐟', '🌸'];

type Mode = 'size' | 'count';

interface Level {
  label: string;
  questions: number;
  modes: Mode[];
  allowReverse: boolean; // also ask "smaller / fewer"
  maxCount: number;
  stars: { three: number; two: number };
}

const LEVELS: Level[] = [
  { label: '쉬워요', questions: 5, modes: ['size'], allowReverse: false, maxCount: 5, stars: { three: 0, two: 2 } },
  { label: '보통이에요', questions: 5, modes: ['size', 'count'], allowReverse: false, maxCount: 6, stars: { three: 1, two: 3 } },
  { label: '어려워요', questions: 6, modes: ['size', 'count'], allowReverse: true, maxCount: 9, stars: { three: 1, two: 4 } },
];

interface Question {
  prompt: string;
  left: ReactNode;
  right: ReactNode;
  answer: 'left' | 'right';
}

function group(emoji: string, n: number): ReactNode {
  return (
    <div className="flex flex-wrap justify-center items-center gap-1 max-w-[200px]">
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} className="text-3xl md:text-4xl">
          {emoji}
        </span>
      ))}
    </div>
  );
}

function makeQuestion(level: Level): Question {
  const mode = level.modes[ri(0, level.modes.length - 1)];
  const reverse = level.allowReverse && Math.random() < 0.4;

  if (mode === 'size') {
    let a = ANIMALS[ri(0, ANIMALS.length - 1)];
    let b = ANIMALS[ri(0, ANIMALS.length - 1)];
    while (b.r === a.r) b = ANIMALS[ri(0, ANIMALS.length - 1)];
    const leftIsBigger = a.r > b.r;
    const answer: 'left' | 'right' = reverse ? (leftIsBigger ? 'right' : 'left') : leftIsBigger ? 'left' : 'right';
    return {
      prompt: reverse ? '누가 더 작을까?' : '누가 더 클까?',
      left: <span className="text-7xl md:text-8xl">{a.e}</span>,
      right: <span className="text-7xl md:text-8xl">{b.e}</span>,
      answer,
    };
  }

  const food = FOODS[ri(0, FOODS.length - 1)];
  let na = ri(1, level.maxCount);
  let nb = ri(1, level.maxCount);
  while (nb === na) nb = ri(1, level.maxCount);
  const leftIsMore = na > nb;
  const answer: 'left' | 'right' = reverse ? (leftIsMore ? 'right' : 'left') : leftIsMore ? 'left' : 'right';
  return {
    prompt: reverse ? '어느 쪽이 더 적을까?' : '어느 쪽이 더 많을까?',
    left: group(food, na),
    right: group(food, nb),
    answer,
  };
}

function buildRound(level: Level): Question[] {
  return Array.from({ length: level.questions }, () => makeQuestion(level));
}

export default function CompareGame() {
  const navigate = useNavigate();
  const wrong = useWrongFeedback();
  const { level, setLevel, submitResult } = useGameProgress('compare');
  const levelIndex = Math.min(level, LEVELS.length - 1);
  const config = LEVELS[levelIndex];

  const [round, setRound] = useState<Question[]>(() => buildRound(config));
  const [current, setCurrent] = useState(0);
  const [picked, setPicked] = useState<'left' | 'right' | null>(null);
  const [locked, setLocked] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  const quiz = round[current];

  const startRound = useMemo(
    () => (cfg: Level) => {
      setRound(buildRound(cfg));
      setCurrent(0);
      setPicked(null);
      setLocked(false);
      setMistakes(0);
      setCleared(false);
    },
    [],
  );

  const choose = (side: 'left' | 'right') => {
    if (locked) return;
    setPicked(side);
    if (side !== quiz.answer) {
      setMistakes((m) => m + 1);
      wrong.trigger();
      setTimeout(() => setPicked(null), 600);
      return;
    }
    setLocked(true);
    playCorrect();
    burstSmall();
    setTimeout(() => {
      if (current < round.length - 1) {
        setCurrent((c) => c + 1);
        setPicked(null);
        setLocked(false);
      } else {
        const stars = starsForLower(mistakes, config.stars);
        setEarnedStars(stars);
        submitResult({ stars, level: levelIndex });
        setCleared(true);
      }
    }, 900);
  };

  const goNextLevel = () => {
    const next = Math.min(levelIndex + 1, LEVELS.length - 1);
    setLevel(next);
    startRound(LEVELS[next]);
  };

  const cardClass = (side: 'left' | 'right') => {
    const isPicked = picked === side;
    const isAnswer = side === quiz.answer;
    if (isPicked && isAnswer) return 'bg-green-400 border-green-500 scale-105';
    if (isPicked && !isAnswer) return 'bg-red-400 border-red-500 scale-95';
    return 'bg-white border-yellow-200 hover:scale-105';
  };

  const status = (
    <div className="bg-white/90 px-4 py-2 rounded-2xl shadow-md text-orange-500 font-title text-xl">
      {current + 1}/{round.length}
    </div>
  );

  return (
    <GameShell
      title="누가 더 클까?"
      levelIndex={levelIndex}
      levelCount={LEVELS.length}
      status={status}
      onReset={() => startRound(config)}
      contentClassName="relative z-10 px-4 pt-28 pb-10 max-w-3xl mx-auto"
    >
      {wrong.overlay}

      <p className="text-center text-4xl font-title text-orange-600 mb-8">{quiz.prompt}</p>

      <motion.div key={current} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-5">
        {(['left', 'right'] as const).map((side) => (
          <button
            key={side}
            onClick={() => choose(side)}
            className={`min-h-[220px] rounded-[40px] border-8 shadow-xl flex items-center justify-center p-6 transition-all ${cardClass(side)}`}
          >
            {side === 'left' ? quiz.left : quiz.right}
          </button>
        ))}
      </motion.div>

      <ResultModal
        open={cleared}
        stars={earnedStars}
        title="척척 비교왕!"
        subtitle={`크고 작은 걸 잘 골랐어요! (틀린 횟수 ${mistakes})`}
        hasNextLevel={levelIndex < LEVELS.length - 1}
        onNext={goNextLevel}
        onRetry={() => startRound(config)}
        onHome={() => navigate('/')}
      />
    </GameShell>
  );
}
