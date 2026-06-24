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
const won = (n: number) => `${n.toLocaleString()}원`;

const ITEMS = [
  { e: '🍎', name: '사과', price: 1000 },
  { e: '🍌', name: '바나나', price: 2000 },
  { e: '🍪', name: '쿠키', price: 500 },
  { e: '🥛', name: '우유', price: 1000 },
  { e: '🍞', name: '빵', price: 3000 },
  { e: '🍇', name: '포도', price: 2000 },
  { e: '🧃', name: '주스', price: 1500 },
];

interface Level {
  label: string;
  questions: number;
  types: number; // distinct item types in the cart
  maxQty: number;
  stars: { three: number; two: number };
}

const LEVELS: Level[] = [
  { label: '쉬워요', questions: 5, types: 1, maxQty: 3, stars: { three: 0, two: 2 } },
  { label: '보통이에요', questions: 5, types: 2, maxQty: 2, stars: { three: 1, two: 3 } },
  { label: '어려워요', questions: 6, types: 3, maxQty: 2, stars: { three: 1, two: 4 } },
];

interface CartItem {
  e: string;
  name: string;
  price: number;
  qty: number;
}
interface Question {
  cart: CartItem[];
  total: number;
  options: string[];
}

function priceOptions(total: number, count: number): string[] {
  const opts = new Set<number>([total]);
  let guard = 0;
  while (opts.size < count && guard++ < 50) {
    const v = total + ri(1, 4) * 500 * (Math.random() < 0.5 ? -1 : 1);
    if (v > 0) opts.add(v);
  }
  return shuffle([...opts]).map(won);
}

function makeQuestion(level: Level): Question {
  const chosen = shuffle(ITEMS).slice(0, level.types);
  const cart: CartItem[] = chosen.map((it) => ({ ...it, qty: ri(1, level.maxQty) }));
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  return { cart, total, options: priceOptions(total, 4) };
}

function buildRound(level: Level): Question[] {
  return Array.from({ length: level.questions }, () => makeQuestion(level));
}

export default function ShoppingGame() {
  const navigate = useNavigate();
  const wrong = useWrongFeedback();
  const { level, setLevel, submitResult } = useGameProgress('shopping');
  const levelIndex = Math.min(level, LEVELS.length - 1);
  const config = LEVELS[levelIndex];

  const [round, setRound] = useState<Question[]>(() => buildRound(config));
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  const quiz = round[current];
  const answer = won(quiz.total);

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

  const handleSelect = (option: string) => {
    if (isCorrect) return;
    setSelected(option);
    const correct = option === answer;
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
    }, 1200);
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
      title="마트 장보기"
      levelIndex={levelIndex}
      levelCount={LEVELS.length}
      status={status}
      onReset={() => startRound(config)}
      contentClassName="relative z-10 px-4 pt-28 pb-10 max-w-3xl mx-auto"
    >
      {wrong.overlay}

      <motion.div key={current} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {/* Price tags + cart */}
        <div className="bg-white rounded-[40px] p-6 md:p-8 shadow-2xl mb-6 border-8 border-yellow-100">
          <div className="flex flex-col gap-3">
            {quiz.cart.map((c) => (
              <div key={c.name} className="flex items-center justify-between bg-orange-50 rounded-2xl px-5 py-3">
                <span className="flex items-center gap-3 text-2xl md:text-3xl font-title text-gray-700">
                  <span className="text-4xl">{c.e}</span>
                  {c.name} <span className="text-orange-400">×{c.qty}</span>
                </span>
                <span className="text-2xl font-title text-blue-500">{won(c.price)}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-3xl font-title text-orange-600 mt-6">모두 얼마일까요?</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        {quiz.options.map((option) => {
          const isPicked = selected === option;
          const isAnswer = option === answer;
          return (
            <button
              key={option}
              disabled={isCorrect === true}
              onClick={() => handleSelect(option)}
              className={`py-6 rounded-[26px] text-3xl md:text-4xl font-title shadow-lg transition-all ${
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
        title="알뜰 쇼핑왕!"
        subtitle={`계산을 척척 해냈어요! (틀린 횟수 ${mistakes})`}
        hasNextLevel={levelIndex < LEVELS.length - 1}
        onNext={goNextLevel}
        onRetry={() => startRound(config)}
        onHome={() => navigate('/')}
      />
    </GameShell>
  );
}
