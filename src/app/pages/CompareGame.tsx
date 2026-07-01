import { useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
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
const ANIMALS: { e: string; n: string; r: number }[] = [
  { e: '🐜', n: '개미', r: 1 },
  { e: '🐭', n: '생쥐', r: 2 },
  { e: '🐹', n: '햄스터', r: 2 },
  { e: '🐰', n: '토끼', r: 3 },
  { e: '🐱', n: '고양이', r: 4 },
  { e: '🐶', n: '강아지', r: 5 },
  { e: '🐷', n: '돼지', r: 6 },
  { e: '🐯', n: '호랑이', r: 7 },
  { e: '🦓', n: '얼룩말', r: 8 },
  { e: '🐴', n: '말', r: 8 },
  { e: '🦏', n: '코뿔소', r: 9 },
  { e: '🐘', n: '코끼리', r: 10 },
  { e: '🦒', n: '기린', r: 10 },
  { e: '🐳', n: '고래', r: 12 },
];

// `scale` visually shrinks/grows the drawing — the whole point of the harder
// levels is that the drawn size can help, be neutral, or mislead.
function animalCard(a: { e: string; n: string }, scale: number): ReactNode {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-7xl md:text-8xl" style={{ transform: `scale(${scale})`, display: 'inline-block' }}>
        {a.e}
      </span>
      <span className="text-2xl md:text-3xl font-title text-gray-600">{a.n}</span>
    </div>
  );
}

const FOODS = ['🍎', '🍌', '🍓', '🍇', '🍪', '⭐', '🐟', '🌸'];

function group(emoji: string, n: number, scale: number): ReactNode {
  return (
    <div
      style={{ transform: `scale(${scale})` }}
      className="flex flex-wrap justify-center items-center gap-1 max-w-[200px]"
    >
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} className="text-3xl md:text-4xl">
          {emoji}
        </span>
      ))}
    </div>
  );
}

type Mode = 'size' | 'count';
/** How the drawn size relates to the answer: helpful, neutral, or misleading. */
type SizeCue = 'answer' | 'equal' | 'random';

interface Level {
  label: string;
  questions: number;
  modes: Mode[];
  allowReverse: boolean; // also ask "smaller / fewer"
  maxCount: number;
  sizeCue: SizeCue;
  stars: { three: number; two: number };
}

const LEVELS: Level[] = [
  { label: '쉬움', questions: 5, modes: ['size', 'count'], allowReverse: false, maxCount: 5, sizeCue: 'answer', stars: { three: 0, two: 2 } },
  { label: '보통', questions: 5, modes: ['size', 'count'], allowReverse: false, maxCount: 6, sizeCue: 'equal', stars: { three: 0, two: 2 } },
  { label: '어려움', questions: 6, modes: ['size', 'count'], allowReverse: true, maxCount: 9, sizeCue: 'random', stars: { three: 0, two: 3 } },
];

// Player-facing difficulty options, matched 1:1 with LEVELS above.
const DIFFICULTIES = [
  { name: '쉬움', emoji: '🐤', color: 'bg-green-400 hover:bg-green-500', desc: '정답 그림이 더 크게 보여요' },
  { name: '보통', emoji: '🐰', color: 'bg-yellow-400 hover:bg-yellow-500', desc: '그림 크기가 똑같아요' },
  { name: '어려움', emoji: '🦁', color: 'bg-rose-400 hover:bg-rose-500', desc: '그림 크기가 뒤죽박죽! 진짜 크기로 골라요' },
];

interface Question {
  prompt: string;
  left: ReactNode;
  right: ReactNode;
  answer: 'left' | 'right';
}

// Scale for each side based on the level's size cue.
function scalesFor(level: Level, answer: 'left' | 'right'): { left: number; right: number } {
  if (level.sizeCue === 'answer') {
    return { left: answer === 'left' ? 1.3 : 0.72, right: answer === 'right' ? 1.3 : 0.72 };
  }
  if (level.sizeCue === 'random') {
    const rnd = () => 0.7 + Math.random() * 0.6; // 0.7 .. 1.3, independent per side
    return { left: rnd(), right: rnd() };
  }
  return { left: 1, right: 1 };
}

function makeQuestion(level: Level): Question {
  const mode = level.modes[ri(0, level.modes.length - 1)];
  const reverse = level.allowReverse && Math.random() < 0.4;

  if (mode === 'size') {
    const a = ANIMALS[ri(0, ANIMALS.length - 1)];
    let b = ANIMALS[ri(0, ANIMALS.length - 1)];
    while (b.r === a.r) b = ANIMALS[ri(0, ANIMALS.length - 1)];
    const leftIsBigger = a.r > b.r;
    const answer: 'left' | 'right' = reverse ? (leftIsBigger ? 'right' : 'left') : leftIsBigger ? 'left' : 'right';
    const s = scalesFor(level, answer);
    return {
      prompt: reverse ? '누가 더 작을까?' : '누가 더 클까?',
      left: animalCard(a, s.left),
      right: animalCard(b, s.right),
      answer,
    };
  }

  const food = FOODS[ri(0, FOODS.length - 1)];
  const na = ri(1, level.maxCount);
  let nb = ri(1, level.maxCount);
  while (nb === na) nb = ri(1, level.maxCount);
  const leftIsMore = na > nb;
  const answer: 'left' | 'right' = reverse ? (leftIsMore ? 'right' : 'left') : leftIsMore ? 'left' : 'right';
  const s = scalesFor(level, answer);
  return {
    prompt: reverse ? '어느 쪽이 더 적을까?' : '어느 쪽이 더 많을까?',
    left: group(food, na, s.left),
    right: group(food, nb, s.right),
    answer,
  };
}

function buildRound(level: Level): Question[] {
  return Array.from({ length: level.questions }, () => makeQuestion(level));
}

export default function CompareGame() {
  const navigate = useNavigate();
  const wrong = useWrongFeedback();
  const { submitResult } = useGameProgress('compare');

  // Difficulty is chosen by the player at the start of each game (no auto
  // progression). null shows the difficulty picker first.
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const lv = selectedLevel ?? 0;
  const config = LEVELS[lv];

  const [round, setRound] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [picked, setPicked] = useState<'left' | 'right' | null>(null);
  const [locked, setLocked] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  const quiz = round[current];

  const startLevel = (idx: number) => {
    setSelectedLevel(idx);
    setRound(buildRound(LEVELS[idx]));
    setCurrent(0);
    setPicked(null);
    setLocked(false);
    setMistakes(0);
    setCleared(false);
  };

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
        submitResult({ stars, level: lv });
        setCleared(true);
      }
    }, 900);
  };

  // Difficulty picker — shown when entering the game, before a round starts.
  if (selectedLevel == null) {
    return (
      <GameShell
        title="누가 더 클까?"
        contentClassName="relative z-10 h-[100dvh] px-4 pt-28 pb-6 max-w-md mx-auto flex flex-col justify-center"
      >
        <h3 className="text-3xl md:text-4xl font-title text-orange-600 mb-2 text-center">난이도를 골라봐!</h3>
        <p className="text-lg font-body text-gray-500 mb-6 text-center">그림 크기에 속지 말고 진짜 크기로!</p>
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
                  <span className="block text-sm md:text-base font-body opacity-90">{d.desc}</span>
                </span>
                <ArrowRight size={28} />
              </button>
            );
          })}
        </div>
      </GameShell>
    );
  }

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
      title={`누가 더 클까? · ${DIFFICULTIES[lv].name}`}
      status={status}
      onBack={() => setSelectedLevel(null)}
      onReset={() => startLevel(lv)}
      contentClassName="relative z-10 px-4 pt-24 pb-4 max-w-3xl mx-auto"
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
        hasNextLevel
        nextLabel="난이도 다시 고르기"
        onNext={() => setSelectedLevel(null)}
        onRetry={() => startLevel(lv)}
        onHome={() => navigate('/')}
      />
    </GameShell>
  );
}
