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

const CX = 110;
const CY = 110;
const pt = (angle: number, len: number): [number, number] => [
  CX + len * Math.sin((angle * Math.PI) / 180),
  CY - len * Math.cos((angle * Math.PI) / 180),
];

function Clock({ h, m }: { h: number; m: number }) {
  const minA = m * 6;
  const hourA = (h % 12) * 30 + m * 0.5;
  const [mx, my] = pt(minA, 72);
  const [hx, hy] = pt(hourA, 50);
  return (
    <svg viewBox="0 0 220 220" className="w-64 h-64 md:w-72 md:h-72">
      <circle cx={CX} cy={CY} r={100} fill="#ffffff" stroke="#FFB84C" strokeWidth={8} />
      {Array.from({ length: 12 }).map((_, i) => {
        const [x1, y1] = pt(i * 30, 100);
        const [x2, y2] = pt(i * 30, 90);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F0A93A" strokeWidth={3} strokeLinecap="round" />;
      })}
      {Array.from({ length: 12 }).map((_, i) => {
        const num = i === 0 ? 12 : i;
        const [x, y] = pt(i * 30, 76);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={700} fill="#5F5E5A">
            {num}
          </text>
        );
      })}
      <line x1={CX} y1={CY} x2={hx} y2={hy} stroke="#444441" strokeWidth={8} strokeLinecap="round" />
      <line x1={CX} y1={CY} x2={mx} y2={my} stroke="#E07B00" strokeWidth={5} strokeLinecap="round" />
      <circle cx={CX} cy={CY} r={7} fill="#444441" />
    </svg>
  );
}

interface Level {
  label: string;
  questions: number;
  minutes: number[]; // allowed minute values
  stars: { three: number; two: number };
}

const LEVELS: Level[] = [
  { label: '정각', questions: 5, minutes: [0], stars: { three: 0, two: 2 } },
  { label: '30분', questions: 5, minutes: [0, 30], stars: { three: 1, two: 3 } },
  { label: '5분 단위', questions: 6, minutes: [0, 15, 30, 45], stars: { three: 1, two: 4 } },
];

function timeStr(h: number, m: number) {
  return m === 0 ? `${h}시` : `${h}시 ${m}분`;
}

interface Question {
  h: number;
  m: number;
  options: string[];
  answer: string;
}

function makeQuestion(level: Level): Question {
  const h = ri(1, 12);
  const m = level.minutes[ri(0, level.minutes.length - 1)];
  const answer = timeStr(h, m);
  const opts = new Set<string>([answer]);
  let guard = 0;
  while (opts.size < 4 && guard++ < 50) {
    const dh = ((h - 1 + ri(-3, 3) + 12) % 12) + 1;
    const dm = level.minutes[ri(0, level.minutes.length - 1)];
    opts.add(timeStr(dh, dm));
  }
  return { h, m, answer, options: shuffle([...opts]) };
}

function buildRound(level: Level): Question[] {
  return Array.from({ length: level.questions }, () => makeQuestion(level));
}

export default function ClockGame() {
  const navigate = useNavigate();
  const wrong = useWrongFeedback();
  const { level, setLevel, submitResult } = useGameProgress('clock');
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
    const correct = option === quiz.answer;
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
      title="시계 보기"
      levelIndex={levelIndex}
      levelCount={LEVELS.length}
      status={status}
      onReset={() => startRound(config)}
      contentClassName="relative z-10 px-4 pt-24 pb-4 max-w-3xl mx-auto"
    >
      {wrong.overlay}

      <div className="bg-white rounded-[50px] p-8 shadow-2xl text-center mb-8 border-8 border-yellow-100">
        <p className="text-3xl font-title text-gray-600 mb-4">몇 시일까요?</p>
        <motion.div key={current} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex justify-center">
          <Clock h={quiz.h} m={quiz.m} />
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {quiz.options.map((option) => {
          const isPicked = selected === option;
          const isAnswer = option === quiz.answer;
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
        title="시계 박사님!"
        subtitle={`시간을 척척 읽었어요! (틀린 횟수 ${mistakes})`}
        hasNextLevel={levelIndex < LEVELS.length - 1}
        onNext={goNextLevel}
        onRetry={() => startRound(config)}
        onHome={() => navigate('/')}
      />
    </GameShell>
  );
}
