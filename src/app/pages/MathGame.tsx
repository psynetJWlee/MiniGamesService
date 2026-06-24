import { useMemo, useState } from 'react';
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

const ri = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

interface Problem {
  a: number;
  b: number;
  op: '+' | '-';
  answer: number;
}

interface Level {
  label: string;
  options: number;
  questions: number;
  gen: () => Problem;
  stars: { three: number; two: number };
}

const LEVELS: Level[] = [
  {
    label: '쉬워요',
    options: 3,
    questions: 5,
    stars: { three: 0, two: 2 },
    // single-digit addition, no carry (sum ≤ 9)
    gen: () => {
      const a = ri(1, 8);
      const b = ri(1, 9 - a);
      return { a, b, op: '+', answer: a + b };
    },
  },
  {
    label: '보통이에요',
    options: 4,
    questions: 5,
    stars: { three: 1, two: 3 },
    // two-digit ± one-digit
    gen: () => {
      if (Math.random() < 0.5) {
        const a = ri(10, 40);
        const b = ri(1, 9);
        return { a, b, op: '+', answer: a + b };
      }
      const a = ri(11, 49);
      const b = ri(1, Math.min(9, a - 1));
      return { a, b, op: '-', answer: a - b };
    },
  },
  {
    label: '어려워요',
    options: 4,
    questions: 6,
    stars: { three: 1, two: 4 },
    // two-digit ± two-digit (answer kept 0–99)
    gen: () => {
      if (Math.random() < 0.5) {
        const a = ri(10, 49);
        const b = ri(10, Math.min(49, 99 - a));
        return { a, b, op: '+', answer: a + b };
      }
      const a = ri(30, 90);
      const b = ri(10, a - 1);
      return { a, b, op: '-', answer: a - b };
    },
  },
];

function buildOptions(answer: number, count: number): number[] {
  const opts = new Set<number>([answer]);
  while (opts.size < count) {
    const delta = ri(1, count + 2) * (Math.random() < 0.5 ? -1 : 1);
    const v = answer + delta;
    if (v >= 0) opts.add(v);
  }
  return shuffle([...opts]);
}

interface Question extends Problem {
  options: number[];
}

function buildRound(level: Level): Question[] {
  return Array.from({ length: level.questions }, () => {
    const p = level.gen();
    return { ...p, options: buildOptions(p.answer, level.options) };
  });
}

export default function MathGame() {
  const navigate = useNavigate();
  const wrong = useWrongFeedback();
  const { level, setLevel, submitResult } = useGameProgress('math');
  const levelIndex = Math.min(level, LEVELS.length - 1);
  const config = LEVELS[levelIndex];

  const [round, setRound] = useState<Question[]>(() => buildRound(config));
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  const quiz = round[current];

  const startRound = useMemo(
    () => (cfg: Level) => {
      setRound(buildRound(cfg));
      setCurrent(0);
      setSelected(null);
      setIsCorrect(null);
      setMistakes(0);
      setCleared(false);
    },
    [],
  );

  const handleSelect = (value: number) => {
    if (isCorrect) return;
    setSelected(value);
    const correct = value === quiz.answer;
    setIsCorrect(correct);

    if (!correct) {
      setMistakes((m) => m + 1);
      wrong.trigger();
      return;
    }

    playCorrect();
    burstSmall();
    setTimeout(() => {
      if (current < round.length - 1) {
        setCurrent((c) => c + 1);
        setSelected(null);
        setIsCorrect(null);
      } else {
        const stars = starsForLower(mistakes, config.stars);
        setEarnedStars(stars);
        submitResult({ stars, level: levelIndex });
        setCleared(true);
      }
    }, 1100);
  };

  const goNextLevel = () => {
    const next = Math.min(levelIndex + 1, LEVELS.length - 1);
    setLevel(next);
    startRound(LEVELS[next]);
  };

  const status = (
    <div className="bg-white/90 px-4 py-2 rounded-2xl shadow-md text-orange-500 font-title text-xl">
      {current + 1}/{round.length}
    </div>
  );

  return (
    <GameShell
      title="산수 놀이"
      levelIndex={levelIndex}
      levelCount={LEVELS.length}
      status={status}
      onReset={() => startRound(config)}
      contentClassName="relative z-10 px-4 pt-28 pb-10 max-w-3xl mx-auto"
    >
      {wrong.overlay}

      {/* Problem */}
      <div className="bg-white rounded-[50px] p-10 md:p-14 shadow-2xl text-center mb-10 border-8 border-yellow-100">
        <motion.div
          key={current}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-6xl md:text-7xl font-title text-gray-700"
        >
          {quiz.a} {quiz.op} {quiz.b} = <span className="text-orange-500">?</span>
        </motion.div>
      </div>

      {/* Answer options */}
      <div className={`grid gap-5 ${config.options >= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {quiz.options.map((option) => {
          const isPicked = selected === option;
          const isAnswer = option === quiz.answer;
          return (
            <button
              key={option}
              disabled={isCorrect === true}
              onClick={() => handleSelect(option)}
              className={`py-8 rounded-[30px] text-4xl md:text-5xl font-title shadow-lg transition-all ${
                isPicked
                  ? isAnswer
                    ? 'bg-green-500 text-white scale-105'
                    : 'bg-red-500 text-white scale-95'
                  : 'bg-white text-gray-700 hover:bg-gray-50 active:scale-95'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>

      <ResultModal
        open={cleared}
        stars={earnedStars}
        title="계산 척척박사!"
        subtitle={`${round.length}문제 완료! (틀린 횟수 ${mistakes})`}
        hasNextLevel={levelIndex < LEVELS.length - 1}
        onNext={goNextLevel}
        onRetry={() => startRound(config)}
        onHome={() => navigate('/')}
      />
    </GameShell>
  );
}
