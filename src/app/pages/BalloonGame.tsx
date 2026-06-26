import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { GameShell } from '../components/GameShell';
import { ResultModal } from '../components/ResultModal';
import { playPop } from '../lib/sound';
import { burstSmall } from '../lib/celebrate';
import { starsForLower } from '../lib/scoring';
import { useWrongFeedback } from '../lib/useWrongFeedback';
import { useGameProgress } from '../lib/useGameProgress';

const COLORS = ['#FF9B9B', '#7BC9FF', '#A1EEBD', '#F9D949', '#D09CFA', '#FFB84C'];

let balloonSeq = 0;

interface Balloon {
  id: number;
  createdAt: number;
  label: string; // shown on the balloon ("3" or "2+1")
  value: number; // the number it counts as
  color: string;
  x: number;
  duration: number;
}

interface Level {
  label: string;
  mode: 'number' | 'add';
  max: number;
  spawnMs: number;
  goal: number;
  stars: { three: number; two: number };
}

const LEVELS: Level[] = [
  { label: '쉬워요', mode: 'number', max: 5, spawnMs: 1300, goal: 8, stars: { three: 0, two: 3 } },
  { label: '보통이에요', mode: 'number', max: 9, spawnMs: 1000, goal: 10, stars: { three: 1, two: 4 } },
  { label: '어려워요', mode: 'add', max: 9, spawnMs: 1150, goal: 8, stars: { three: 1, two: 4 } },
];

function makeBalloon(level: Level): Balloon {
  let label: string;
  let value: number;
  if (level.mode === 'add') {
    const a = Math.floor(Math.random() * 4) + 1;
    const b = Math.floor(Math.random() * 4) + 1;
    value = a + b;
    label = `${a}+${b}`;
  } else {
    value = Math.floor(Math.random() * level.max) + 1;
    label = String(value);
  }
  return {
    id: ++balloonSeq,
    createdAt: Date.now(),
    label,
    value,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    x: Math.random() * 78 + 8,
    duration: Math.random() * 2 + 4,
  };
}

function pickTarget(level: Level): number {
  if (level.mode === 'add') return Math.floor(Math.random() * 7) + 2; // 2..8
  return Math.floor(Math.random() * level.max) + 1;
}

// Glossy, 3D-looking balloon — radial highlight, soft inner shadow, a little
// knot, and a curved string. Replaces the old flat solid oval.
function Balloon({ color, label }: { color: string; label: string }) {
  return (
    <div className="relative flex flex-col items-center transition-transform group-active:scale-90">
      <div
        className="relative flex items-center justify-center w-24 h-28 md:w-28 md:h-32"
        style={{
          backgroundColor: color,
          borderRadius: '48% 48% 48% 48% / 42% 42% 58% 58%',
          backgroundImage: 'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.65), rgba(255,255,255,0) 45%)',
          boxShadow: 'inset -6px -9px 16px rgba(0,0,0,0.18), 0 8px 14px rgba(0,0,0,0.18)',
        }}
      >
        {/* specular shine */}
        <span className="absolute top-3 left-4 w-3.5 h-5 rotate-[18deg] rounded-full bg-white/60 blur-[1px]" />
        <span
          className={`relative font-title text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] ${
            label.length > 2 ? 'text-xl md:text-2xl' : 'text-3xl md:text-4xl'
          }`}
        >
          {label}
        </span>
        {/* knot */}
        <span
          className="absolute -bottom-2 left-1/2 -translate-x-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderTop: `11px solid ${color}`,
          }}
        />
      </div>
      {/* curved string */}
      <svg width="22" height="56" viewBox="0 0 22 56" fill="none" className="-mt-1">
        <path d="M11 0 Q3 15 11 28 Q19 41 11 56" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function BalloonGame() {
  const navigate = useNavigate();
  const wrong = useWrongFeedback();
  const { level, setLevel, submitResult } = useGameProgress('balloons');
  const levelIndex = Math.min(level, LEVELS.length - 1);
  const config = LEVELS[levelIndex];

  const [target, setTarget] = useState(() => pickTarget(config));
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [score, setScore] = useState(0);
  const [wrongTaps, setWrongTaps] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  // Spawn balloons.
  useEffect(() => {
    if (cleared) return;
    const interval = setInterval(() => {
      // Spawn 3 balloons per tick so there are ~3x as many on screen at once.
      setBalloons((prev) => [...prev, makeBalloon(config), makeBalloon(config), makeBalloon(config)]);
    }, config.spawnMs);
    return () => clearInterval(interval);
  }, [cleared, config]);

  // Remove balloons that have floated away.
  useEffect(() => {
    const interval = setInterval(() => {
      setBalloons((prev) => prev.filter((b) => Date.now() - b.createdAt < 7000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const startRound = (cfg: Level) => {
    setTarget(pickTarget(cfg));
    setBalloons([]);
    setScore(0);
    setWrongTaps(0);
    setCleared(false);
  };

  const handlePop = (balloon: Balloon) => {
    if (balloon.value !== target) {
      setWrongTaps((w) => w + 1);
      wrong.trigger();
      return;
    }
    playPop();
    burstSmall({ x: balloon.x / 100, y: 0.5 });
    setBalloons((prev) => prev.filter((b) => b.id !== balloon.id));
    setTarget(pickTarget(config));
    const newScore = score + 1;
    setScore(newScore);
    if (newScore >= config.goal) {
      const stars = starsForLower(wrongTaps, config.stars);
      setEarnedStars(stars);
      submitResult({ stars, score: newScore, level: levelIndex });
      setCleared(true);
    }
  };

  const goNextLevel = () => {
    const next = Math.min(levelIndex + 1, LEVELS.length - 1);
    setLevel(next);
    startRound(LEVELS[next]);
  };

  const status = (
    <div className="bg-white/90 px-4 py-2 rounded-2xl shadow-md text-blue-500 font-title text-xl">
      {score}/{config.goal}
    </div>
  );

  return (
    <GameShell
      title="풍선 터뜨리기"
      levelIndex={levelIndex}
      levelCount={LEVELS.length}
      status={status}
      onReset={() => startRound(config)}
      bgClassName="bg-blue-50"
      contentClassName="relative z-10 h-screen"
    >
      {wrong.overlay}

      {/* Target banner */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <motion.div
          key={target}
          initial={{ scale: 0.8 }}
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 0.5 }}
          className="bg-white/90 backdrop-blur-md px-12 py-4 rounded-[30px] shadow-xl border-4 border-blue-200 text-center"
        >
          <span className="text-[50px] leading-tight font-title text-blue-600 whitespace-nowrap">
            {config.mode === 'add' ? `더해서 ${target} 만들기` : `찾아야 하는 숫자 : ${target}`}
          </span>
        </motion.div>
      </div>

      {/* Balloons (no AnimatePresence — popped balloons are removed instantly). */}
      {balloons.map((balloon) => (
        <motion.button
          key={balloon.id}
          initial={{ y: '110vh', x: `${balloon.x}vw`, scale: 0.8 }}
          animate={{ y: '-20vh', x: `${balloon.x}vw`, scale: 1 }}
          transition={{ duration: balloon.duration, ease: 'linear' }}
          onClick={() => handlePop(balloon)}
          className="absolute left-0 top-0 cursor-pointer group"
        >
          <Balloon color={balloon.color} label={balloon.label} />
        </motion.button>
      ))}

      <ResultModal
        open={cleared}
        stars={earnedStars}
        title="최고예요!"
        subtitle={`숫자 왕 가온이 시온이! (틀린 횟수 ${wrongTaps})`}
        hasNextLevel={levelIndex < LEVELS.length - 1}
        onNext={goNextLevel}
        onRetry={() => startRound(config)}
        onHome={() => navigate('/')}
      />
    </GameShell>
  );
}
