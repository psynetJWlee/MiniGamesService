import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { GameShell } from '../components/GameShell';
import { ResultModal } from '../components/ResultModal';
import { shuffle } from '../lib/shuffle';
import { playCorrect } from '../lib/sound';
import { burstBig } from '../lib/celebrate';
import { starsForLower } from '../lib/scoring';
import { useGameProgress } from '../lib/useGameProgress';

interface Level {
  label: string;
  size: number; // odd
}

const LEVELS: Level[] = [
  { label: '쉬워요', size: 5 },
  { label: '보통이에요', size: 7 },
  { label: '어려워요', size: 9 },
];

type Grid = number[][]; // 0 path, 1 wall, 2 goal

// Recursive-backtracker maze — always fully connected, so always solvable.
function generateMaze(n: number): Grid {
  const g: Grid = Array.from({ length: n }, () => Array<number>(n).fill(1));
  const carve = (x: number, y: number) => {
    g[y][x] = 0;
    for (const [dx, dy] of shuffle([
      [0, -2],
      [0, 2],
      [-2, 0],
      [2, 0],
    ])) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < n && ny >= 0 && ny < n && g[ny][nx] === 1) {
        g[y + dy / 2][x + dx / 2] = 0;
        carve(nx, ny);
      }
    }
  };
  carve(0, 0);
  g[n - 1][n - 1] = 2;
  return g;
}

// Shortest path length from (0,0) to the goal (BFS).
function shortestPath(g: Grid): number {
  const n = g.length;
  const seen = new Set<string>(['0,0']);
  let frontier: [number, number][] = [[0, 0]];
  let dist = 0;
  while (frontier.length) {
    const next: [number, number][] = [];
    for (const [x, y] of frontier) {
      if (g[y][x] === 2) return dist;
      for (const [dx, dy] of [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0],
      ]) {
        const nx = x + dx;
        const ny = y + dy;
        const key = `${nx},${ny}`;
        if (nx >= 0 && nx < n && ny >= 0 && ny < n && g[ny][nx] !== 1 && !seen.has(key)) {
          seen.add(key);
          next.push([nx, ny]);
        }
      }
    }
    frontier = next;
    dist++;
  }
  return n * n;
}

interface MazeState {
  grid: Grid;
  optimal: number;
}

function buildMaze(level: Level): MazeState {
  const grid = generateMaze(level.size);
  return { grid, optimal: shortestPath(grid) };
}

export default function MazeGame() {
  const navigate = useNavigate();
  const { level, setLevel, submitResult } = useGameProgress('maze');
  const levelIndex = Math.min(level, LEVELS.length - 1);
  const config = LEVELS[levelIndex];

  const [maze, setMaze] = useState<MazeState>(() => buildMaze(config));
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visited, setVisited] = useState<Set<string>>(new Set(['0,0']));
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  const n = maze.grid.length;

  const startRound = (cfg: Level) => {
    setMaze(buildMaze(cfg));
    setPos({ x: 0, y: 0 });
    setVisited(new Set(['0,0']));
    setMoves(0);
    setWon(false);
    setCleared(false);
  };

  const move = (dx: number, dy: number) => {
    if (won) return;
    const nx = pos.x + dx;
    const ny = pos.y + dy;
    if (nx < 0 || nx >= n || ny < 0 || ny >= n || maze.grid[ny][nx] === 1) return;
    setPos({ x: nx, y: ny });
    setVisited((v) => new Set(v).add(`${nx},${ny}`));
    const newMoves = moves + 1;
    setMoves(newMoves);
    if (maze.grid[ny][nx] === 2) {
      setWon(true);
      playCorrect();
      burstBig();
      const stars = starsForLower(newMoves, { three: maze.optimal + 2, two: maze.optimal + 8 });
      setEarnedStars(stars);
      submitResult({ stars, level: levelIndex });
      setTimeout(() => setCleared(true), 700);
    }
  };

  // Keyboard arrows for desktop.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, [number, number]> = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
      };
      const d = map[e.key];
      if (d) {
        e.preventDefault();
        move(d[0], d[1]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Swipe gestures on the board.
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1, 0);
    else move(0, dy > 0 ? 1 : -1);
  };

  const goNextLevel = () => {
    const next = Math.min(levelIndex + 1, LEVELS.length - 1);
    setLevel(next);
    startRound(LEVELS[next]);
  };

  const status = (
    <div className="bg-white/90 px-4 py-2 rounded-2xl shadow-md text-orange-500 font-title text-xl">{moves}걸음</div>
  );

  return (
    <GameShell
      title="쿠키를 찾으러 가요!"
      levelIndex={levelIndex}
      levelCount={LEVELS.length}
      status={status}
      onReset={() => startRound(config)}
      contentClassName="relative z-10 px-4 pt-28 pb-10 max-w-2xl mx-auto"
    >
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="bg-white p-3 rounded-[40px] shadow-2xl aspect-square grid gap-1.5 mb-8 border-8 border-yellow-100 touch-none"
        style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
      >
        {maze.grid.map((row, y) =>
          row.map((cell, x) => {
            const isPlayer = pos.x === x && pos.y === y;
            const isTrail = visited.has(`${x},${y}`);
            return (
              <div
                key={`${x}-${y}`}
                className={`rounded-lg flex items-center justify-center text-xl md:text-3xl ${
                  cell === 1 ? 'bg-orange-200' : isTrail ? 'bg-yellow-100' : 'bg-orange-50'
                }`}
              >
                {isPlayer && (
                  <motion.span layoutId="player" className="filter drop-shadow-md">
                    🏃
                  </motion.span>
                )}
                {cell === 2 && !isPlayer && <span className="animate-bounce">🍪</span>}
                {!isPlayer && cell !== 2 && isTrail && <span className="text-[10px] opacity-30">👣</span>}
              </div>
            );
          }),
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
        <div />
        <ControlButton icon={<ChevronUp size={36} />} onClick={() => move(0, -1)} />
        <div />
        <ControlButton icon={<ChevronLeft size={36} />} onClick={() => move(-1, 0)} />
        <ControlButton icon={<ChevronDown size={36} />} onClick={() => move(0, 1)} />
        <ControlButton icon={<ChevronRight size={36} />} onClick={() => move(1, 0)} />
      </div>

      <ResultModal
        open={cleared}
        stars={earnedStars}
        title="맛있게 냠냠!"
        subtitle={`${moves}걸음 만에 도착! (가장 빠른 길 ${maze.optimal}걸음)`}
        hasNextLevel={levelIndex < LEVELS.length - 1}
        onNext={goNextLevel}
        onRetry={() => startRound(config)}
        onHome={() => navigate('/')}
      />
    </GameShell>
  );
}

function ControlButton({ icon, onClick }: { icon: React.ReactElement; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center text-orange-500 hover:bg-orange-50 active:scale-90 transition-all border-b-4 border-gray-200"
    >
      {icon}
    </button>
  );
}
