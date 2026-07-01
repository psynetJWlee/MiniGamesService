import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
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
  op: '+' | '-' | '×' | '÷';
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
    // 쉬움 — two-digit addition / subtraction (no negatives, answer ≤ 99)
    label: '쉬움',
    options: 3,
    questions: 5,
    stars: { three: 0, two: 2 },
    gen: () => {
      if (Math.random() < 0.5) {
        const a = ri(10, 89);
        const b = ri(10, 99 - a);
        return { a, b, op: '+', answer: a + b };
      }
      const a = ri(20, 99);
      const b = ri(10, a - 1);
      return { a, b, op: '-', answer: a - b };
    },
  },
  {
    // 보통 — single-digit multiplication / division (integer results)
    label: '보통',
    options: 4,
    questions: 5,
    stars: { three: 0, two: 2 },
    gen: () => {
      if (Math.random() < 0.5) {
        const a = ri(2, 9);
        const b = ri(2, 9);
        return { a, b, op: '×', answer: a * b };
      }
      const b = ri(2, 9); // divisor
      const q = ri(2, 9); // quotient (the answer)
      return { a: b * q, b, op: '÷', answer: q };
    },
  },
  {
    // 어려움 — two-digit multiplication / division (integer results)
    label: '어려움',
    options: 4,
    questions: 6,
    stars: { three: 0, two: 3 },
    gen: () => {
      if (Math.random() < 0.5) {
        const a = ri(11, 99); // two-digit
        const b = ri(2, 9); // one-digit
        return { a, b, op: '×', answer: a * b };
      }
      const b = ri(2, 9); // divisor
      const q = ri(Math.ceil(10 / b), Math.floor(99 / b)); // quotient so the dividend is two-digit
      return { a: b * q, b, op: '÷', answer: q };
    },
  },
  {
    // 진짜 어려움 — two-digit × two-digit / two-digit ÷ two-digit (integer results)
    label: '진짜 어려움',
    options: 4,
    questions: 6,
    stars: { three: 0, two: 3 },
    gen: () => {
      if (Math.random() < 0.5) {
        const a = ri(10, 99); // two-digit
        const b = ri(10, 99); // two-digit
        return { a, b, op: '×', answer: a * b };
      }
      const b = ri(10, 49); // two-digit divisor
      const q = ri(2, Math.floor(99 / b)); // quotient so the dividend stays two-digit
      return { a: b * q, b, op: '÷', answer: q };
    },
  },
];

// Player-facing difficulty options, matched 1:1 with LEVELS above.
const DIFFICULTIES = [
  { name: '쉬움', emoji: '🐤', color: 'bg-green-400 hover:bg-green-500', desc: '두 자리 수 더하기·빼기' },
  { name: '보통', emoji: '🐰', color: 'bg-yellow-400 hover:bg-yellow-500', desc: '한 자리 수 곱하기·나누기' },
  { name: '어려움', emoji: '🦁', color: 'bg-rose-400 hover:bg-rose-500', desc: '두 자리 수 곱하기·나누기' },
  { name: '진짜 어려움', emoji: '🔥', color: 'bg-purple-500 hover:bg-purple-600', desc: '두 자리끼리 곱하기·나누기' },
];

function buildOptions(answer: number, count: number): number[] {
  // Distractors spread relative to the answer's size, so big answers don't get
  // near-identical options (and small answers stay tight).
  const spread = Math.max(count + 2, Math.round(Math.abs(answer) * 0.2));
  const opts = new Set<number>([answer]);
  let guard = 0;
  while (opts.size < count && guard++ < 200) {
    const delta = ri(1, spread) * (Math.random() < 0.5 ? -1 : 1);
    const v = answer + delta;
    if (v >= 0) opts.add(v);
  }
  while (opts.size < count) opts.add(answer + opts.size + 1); // safety fill
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
  const { submitResult } = useGameProgress('math');

  // Difficulty is chosen by the player at the start of each game (no auto
  // progression). null shows the difficulty picker first.
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const lv = selectedLevel ?? 0;
  const config = LEVELS[lv];

  const [round, setRound] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  const quiz = round[current];

  const startLevel = (idx: number) => {
    setSelectedLevel(idx);
    setRound(buildRound(LEVELS[idx]));
    setCurrent(0);
    setSelected(null);
    setIsCorrect(null);
    setMistakes(0);
    setCleared(false);
  };

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
        submitResult({ stars, level: lv });
        setCleared(true);
      }
    }, 1100);
  };

  // Difficulty picker — shown when entering the game, before a round starts.
  if (selectedLevel == null) {
    return (
      <GameShell
        title="산수 놀이"
        contentClassName="relative z-10 h-[100dvh] px-4 pt-28 pb-6 max-w-md mx-auto flex flex-col justify-center"
      >
        <h3 className="text-3xl md:text-4xl font-title text-orange-600 mb-2 text-center">난이도를 골라봐!</h3>
        <p className="text-lg font-body text-gray-500 mb-6 text-center">어떤 계산에 도전할까?</p>
        <div className="flex flex-col gap-3">
          {LEVELS.map((_, i) => {
            const d = DIFFICULTIES[i];
            return (
              <button
                key={i}
                onClick={() => startLevel(i)}
                className={`flex items-center gap-4 px-6 py-4 rounded-3xl shadow-lg text-white active:scale-95 transition-all ${d.color}`}
              >
                <span className="text-4xl">{d.emoji}</span>
                <span className="flex-1 text-left">
                  <span className="block text-2xl font-title">{d.name}</span>
                  <span className="block text-base font-body opacity-90">{d.desc}</span>
                </span>
                <ArrowRight size={28} />
              </button>
            );
          })}
        </div>
      </GameShell>
    );
  }

  const status = (
    <div className="bg-white/90 px-4 py-2 rounded-2xl shadow-md text-orange-500 font-title text-xl">
      {current + 1}/{round.length}
    </div>
  );

  return (
    <GameShell
      title={`산수 놀이 · ${DIFFICULTIES[lv].name}`}
      status={status}
      onBack={() => setSelectedLevel(null)}
      onReset={() => startLevel(lv)}
      contentClassName="relative z-10 px-4 pt-24 pb-4 max-w-3xl mx-auto"
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
        hasNextLevel
        nextLabel="난이도 다시 고르기"
        onNext={() => setSelectedLevel(null)}
        onRetry={() => startLevel(lv)}
        onHome={() => navigate('/')}
      />
    </GameShell>
  );
}
