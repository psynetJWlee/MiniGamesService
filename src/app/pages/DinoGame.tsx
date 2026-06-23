import { useEffect, useReducer, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { GameShell } from '../components/GameShell';
import { ResultModal } from '../components/ResultModal';
import { playWrong } from '../lib/sound';
import { starsForHigher } from '../lib/scoring';
import { useGameProgress } from '../lib/useGameProgress';

const BASE_SPEED = 1.1; // % of width per tick
const DINO_X = 12; // % from left
const OBSTACLE_EMOJIS = ['🌵', '🪨', '🌵', '🦔'];

interface Obstacle {
  id: number;
  x: number; // % position
  emoji: string;
}

export default function DinoGame() {
  const navigate = useNavigate();
  const { record, submitResult } = useGameProgress('dino');

  const [playing, setPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [dinoY, setDinoY] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [earnedStars, setEarnedStars] = useState(0);

  // Mutable game-loop state kept in refs; a frame counter forces re-render.
  const playingRef = useRef(false);
  const jumpingRef = useRef(false);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const scoreRef = useRef(0);
  const seedRef = useRef(0);
  const [, force] = useReducer((c) => c + 1, 0);

  const jump = () => {
    if (jumpingRef.current || !playingRef.current) return;
    jumpingRef.current = true;
    setDinoY(-150);
    setTimeout(() => {
      setDinoY(0);
      jumpingRef.current = false;
    }, 600);
  };

  const start = () => {
    playingRef.current = true;
    jumpingRef.current = false;
    obstaclesRef.current = [];
    scoreRef.current = 0;
    setDinoY(0);
    setGameOver(false);
    setPlaying(true);
  };

  const endGame = () => {
    playingRef.current = false;
    const final = scoreRef.current;
    const stars = starsForHigher(final, { three: 600, two: 300 });
    setFinalScore(final);
    setEarnedStars(stars);
    submitResult({ score: final, stars });
    playWrong();
    setPlaying(false);
    setGameOver(true);
  };

  // Game loop.
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      scoreRef.current += 1;
      const speed = BASE_SPEED + Math.floor(scoreRef.current / 250) * 0.18;

      // Move + cull obstacles.
      let obs = obstaclesRef.current.map((o) => ({ ...o, x: o.x - speed })).filter((o) => o.x > -12);

      // Spawn with a randomized gap so obstacles never cluster impossibly.
      const rightmost = obs.length ? Math.max(...obs.map((o) => o.x)) : -Infinity;
      const minGap = 42 + Math.random() * 34;
      if (rightmost < 100 - minGap && Math.random() < 0.12) {
        seedRef.current += 1;
        obs.push({ id: seedRef.current, x: 106, emoji: OBSTACLE_EMOJIS[Math.floor(Math.random() * OBSTACLE_EMOJIS.length)] });
      }
      obstaclesRef.current = obs;

      // Collision — only when the dino is on the ground (not mid-jump).
      if (!jumpingRef.current) {
        for (const o of obs) {
          if (o.x > DINO_X - 6 && o.x < DINO_X + 6) {
            endGame();
            return;
          }
        }
      }
      force();
    }, 30);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  // Keyboard jump.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const status = (
    <div className="text-2xl md:text-3xl font-title text-gray-700">
      {scoreRef.current}
      <span className="text-base text-gray-400 ml-2">최고 {record.bestScore}</span>
    </div>
  );

  return (
    <GameShell
      title="공룡 점프 놀이"
      status={status}
      onReset={start}
      bgClassName="bg-gradient-to-b from-blue-100 to-green-50"
      showBlobs={false}
      contentClassName="relative z-10 h-screen"
    >
      <div className="absolute inset-0 select-none" onClick={jump}>
        {/* Drifting clouds for a bit of parallax depth. */}
        {[15, 45, 75].map((top, i) => (
          <motion.div
            key={i}
            className="absolute text-5xl opacity-70"
            style={{ top: `${top}%` }}
            initial={{ x: '100vw' }}
            animate={{ x: '-20vw' }}
            transition={{ duration: 14 + i * 4, repeat: Infinity, ease: 'linear' }}
          >
            ☁️
          </motion.div>
        ))}

        {/* Play field */}
        <div className="absolute bottom-28 left-0 right-0 h-px">
          {/* Dino */}
          <motion.div
            animate={{ y: dinoY }}
            transition={{ duration: 0.25, type: 'spring', bounce: 0.35 }}
            className="absolute text-7xl md:text-8xl"
            style={{ left: `${DINO_X}%`, bottom: 0, transform: 'translateX(-50%)' }}
          >
            🦖
          </motion.div>

          {/* Obstacles */}
          {playing &&
            obstaclesRef.current.map((o) => (
              <div
                key={o.id}
                className="absolute text-6xl md:text-7xl"
                style={{ left: `${o.x}%`, bottom: 0 }}
              >
                {o.emoji}
              </div>
            ))}
        </div>

        {/* Ground */}
        <div className="absolute bottom-28 left-0 right-0 h-2 bg-yellow-700/30" />
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-green-200/40" />

        {/* Hint */}
        {playing && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-xl font-body text-gray-500">
            화면을 눌러 점프!
          </div>
        )}
      </div>

      {/* Start screen */}
      {!playing && !gameOver && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="bg-white p-12 rounded-[50px] text-center shadow-2xl border-8 border-green-300">
            <span className="text-9xl mb-6 block">🦖</span>
            <h2 className="text-4xl font-title text-orange-600 mb-2">공룡 점프 놀이!</h2>
            <p className="text-xl font-body text-gray-500 mb-6">화면을 눌러 장애물을 뛰어넘어요</p>
            <button
              onClick={start}
              className="bg-green-500 text-white px-12 py-5 rounded-3xl font-title text-3xl shadow-xl active:scale-95 transition-all"
            >
              시작하기
            </button>
          </div>
        </div>
      )}

      <ResultModal
        open={gameOver}
        stars={earnedStars}
        title="쿵! 잘 달렸어요!"
        subtitle={`${finalScore}만큼 달렸어요! (최고 ${record.bestScore})`}
        hasNextLevel={false}
        onNext={start}
        onRetry={start}
        onHome={() => navigate('/')}
      />
    </GameShell>
  );
}
