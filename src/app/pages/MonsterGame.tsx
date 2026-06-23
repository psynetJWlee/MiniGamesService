import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { GameShell } from '../components/GameShell';
import { ResultModal } from '../components/ResultModal';
import { shuffle } from '../lib/shuffle';
import { playPop } from '../lib/sound';
import { burstSmall } from '../lib/celebrate';
import { starsForLower } from '../lib/scoring';
import { useWrongFeedback } from '../lib/useWrongFeedback';
import { useGameProgress } from '../lib/useGameProgress';

interface ColorDef {
  name: string;
  color: string;
}

const PALETTE: ColorDef[] = [
  { name: '빨강', color: '#ef4444' },
  { name: '파랑', color: '#3b82f6' },
  { name: '노랑', color: '#eab308' },
  { name: '초록', color: '#22c55e' },
  { name: '보라', color: '#a855f7' },
  { name: '주황', color: '#f97316' },
];

interface Monster {
  id: number;
  name: string;
  color: string;
  x: number;
  y: number;
  delay: number;
}

interface Level {
  label: string;
  count: number;
  colors: number; // how many palette colors are in play
  duration: number; // float speed
  goal: number;
  stars: { three: number; two: number };
}

const LEVELS: Level[] = [
  { label: '쉬워요', count: 6, colors: 4, duration: 3, goal: 5, stars: { three: 0, two: 3 } },
  { label: '보통이에요', count: 8, colors: 5, duration: 2.4, goal: 7, stars: { three: 1, two: 4 } },
  { label: '어려워요', count: 10, colors: 6, duration: 2, goal: 9, stars: { three: 1, two: 5 } },
];

let monsterSeq = 0;

function buildWave(target: ColorDef, level: Level): Monster[] {
  const pool = PALETTE.slice(0, level.colors);
  return shuffle(
    Array.from({ length: level.count }).map((_, i) => {
      const c = i < 2 ? target : pool[Math.floor(Math.random() * pool.length)];
      return {
        id: ++monsterSeq,
        name: c.name,
        color: c.color,
        x: Math.random() * 78 + 8,
        y: Math.random() * 60 + 16,
        delay: Math.random() * 1.5,
      };
    }),
  );
}

function randomColor(level: Level): ColorDef {
  const pool = PALETTE.slice(0, level.colors);
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function MonsterGame() {
  const navigate = useNavigate();
  const wrong = useWrongFeedback();
  const { level, setLevel, submitResult } = useGameProgress('monsters');
  const levelIndex = Math.min(level, LEVELS.length - 1);
  const config = LEVELS[levelIndex];

  const [target, setTarget] = useState<ColorDef>(() => randomColor(config));
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [score, setScore] = useState(0);
  const [wrongTaps, setWrongTaps] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  const startWaveFor = (nextTarget: ColorDef, cfg: Level) => {
    setTarget(nextTarget);
    setMonsters(buildWave(nextTarget, cfg));
  };

  // First wave on mount.
  useEffect(() => {
    startWaveFor(randomColor(config), config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRound = (cfg: Level) => {
    setScore(0);
    setWrongTaps(0);
    setCleared(false);
    startWaveFor(randomColor(cfg), cfg);
  };

  const handleCatch = (monster: Monster) => {
    if (monster.name !== target.name) {
      setWrongTaps((w) => w + 1);
      wrong.trigger();
      return;
    }

    playPop();
    burstSmall({ x: monster.x / 100, y: monster.y / 100 });
    const newScore = score + 1;
    setScore(newScore);

    if (newScore >= config.goal) {
      const stars = starsForLower(wrongTaps, config.stars);
      setEarnedStars(stars);
      submitResult({ stars, score: newScore, level: levelIndex });
      setMonsters((prev) => prev.filter((m) => m.id !== monster.id));
      setCleared(true);
      return;
    }

    const remaining = monsters.filter((m) => m.id !== monster.id);
    const targetsLeft = remaining.filter((m) => m.name === target.name).length;
    if (targetsLeft === 0) {
      startWaveFor(randomColor(config), config);
    } else {
      setMonsters(remaining);
    }
  };

  const goNextLevel = () => {
    const next = Math.min(levelIndex + 1, LEVELS.length - 1);
    setLevel(next);
    startRound(LEVELS[next]);
  };

  const status = (
    <div className="text-white font-title text-2xl">
      {score}/{config.goal}
    </div>
  );

  return (
    <GameShell
      title="색깔 몬스터 잡기"
      levelIndex={levelIndex}
      levelCount={LEVELS.length}
      status={status}
      onReset={() => startRound(config)}
      bgClassName="bg-slate-900"
      showBlobs={false}
      contentClassName="relative z-10 h-screen"
    >
      {wrong.overlay}

      {/* Target color banner */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div
          className="bg-white px-8 py-3 rounded-[30px] shadow-2xl border-4 flex items-center gap-3"
          style={{ borderColor: target.color }}
        >
          <span className="w-8 h-8 rounded-full" style={{ backgroundColor: target.color }} />
          <span className="text-2xl font-title text-gray-800">
            <span style={{ color: target.color }}>{target.name}</span> 몬스터를 잡아요!
          </span>
        </div>
      </div>

      {monsters.map((monster) => (
        <motion.button
          key={monster.id}
          initial={{ scale: 0, x: `${monster.x}vw`, y: `${monster.y}vh` }}
          animate={{
            scale: 1,
            x: [`${monster.x}vw`, `${(monster.x + 8) % 88}vw`, `${monster.x}vw`],
            y: [`${monster.y}vh`, `${(monster.y + 8) % 75}vh`, `${monster.y}vh`],
          }}
          transition={{ duration: config.duration, repeat: Infinity, delay: monster.delay, ease: 'easeInOut' }}
          onClick={() => handleCatch(monster)}
          className="absolute left-0 top-0"
        >
          {/* Cute colored blob monster — the color IS the gameplay cue. */}
          <div
            className="w-24 h-24 md:w-28 md:h-28 rounded-[44%] relative flex items-center justify-center shadow-[0_0_25px_rgba(255,255,255,0.35)]"
            style={{ backgroundColor: monster.color }}
          >
            <div className="flex gap-3 mb-2">
              {[0, 1].map((e) => (
                <span key={e} className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <span className="w-2 h-2 bg-gray-900 rounded-full" />
                </span>
              ))}
            </div>
            <span className="absolute bottom-4 w-5 h-2.5 border-b-4 border-white/80 rounded-b-full" />
          </div>
        </motion.button>
      ))}

      <ResultModal
        open={cleared}
        stars={earnedStars}
        title="몬스터를 다 잡았어요!"
        subtitle={`멋진 사냥꾼! (틀린 횟수 ${wrongTaps})`}
        hasNextLevel={levelIndex < LEVELS.length - 1}
        onNext={goNextLevel}
        onRetry={() => startRound(config)}
        onHome={() => navigate('/')}
      />
    </GameShell>
  );
}
