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
  const [cleared, setCleared] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  const n = maze.grid.length;

  // Refs mirror the live position/moves/win so drag steps read the latest
  // values synchronously (many pointer events can fire before a re-render).
  const posRef = useRef(pos);
  const movesRef = useRef(0);
  const wonRef = useRef(false);

  const startRound = (cfg: Level) => {
    setMaze(buildMaze(cfg));
    posRef.current = { x: 0, y: 0 };
    movesRef.current = 0;
    wonRef.current = false;
    setPos({ x: 0, y: 0 });
    setVisited(new Set(['0,0']));
    setMoves(0);
    setCleared(false);
  };

  const move = (dx: number, dy: number) => {
    if (wonRef.current) return;
    const cur = posRef.current;
    const nx = cur.x + dx;
    const ny = cur.y + dy;
    if (nx < 0 || nx >= n || ny < 0 || ny >= n || maze.grid[ny][nx] === 1) return;
    posRef.current = { x: nx, y: ny };
    setPos({ x: nx, y: ny });
    setVisited((v) => new Set(v).add(`${nx},${ny}`));
    const newMoves = movesRef.current + 1;
    movesRef.current = newMoves;
    setMoves(newMoves);
    if (maze.grid[ny][nx] === 2) {
      wonRef.current = true;
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

  // Drag-to-move: the runner follows the pointer (mouse or finger) through the
  // corridors, one step at a time. Direction buttons still work too.
  const boardRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const cellFromPointer = (clientX: number, clientY: number) => {
    const el = boardRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const gx = Math.floor(((clientX - r.left) / r.width) * n);
    const gy = Math.floor(((clientY - r.top) / r.height) * n);
    if (gx < 0 || gx >= n || gy < 0 || gy >= n) return null;
    return { x: gx, y: gy };
  };

  // One step toward the target cell — greedy on the bigger axis, falling back
  // to the other axis if a wall blocks it (so dragging can turn corners).
  const stepToward = (target: { x: number; y: number }) => {
    const cur = posRef.current;
    const dx = target.x - cur.x;
    const dy = target.y - cur.y;
    if (dx === 0 && dy === 0) return;
    const before = posRef.current;
    if (Math.abs(dx) >= Math.abs(dy)) {
      if (dx !== 0) move(Math.sign(dx), 0);
      if (posRef.current === before && dy !== 0) move(0, Math.sign(dy));
    } else {
      if (dy !== 0) move(0, Math.sign(dy));
      if (posRef.current === before && dx !== 0) move(Math.sign(dx), 0);
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    boardRef.current?.setPointerCapture?.(e.pointerId);
    const c = cellFromPointer(e.clientX, e.clientY);
    if (c) stepToward(c);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const c = cellFromPointer(e.clientX, e.clientY);
    if (c) stepToward(c);
  };
  const endDrag = () => {
    dragging.current = false;
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
      contentClassName="relative z-10 px-4 pt-24 pb-4 max-w-2xl landscape:max-w-5xl mx-auto"
    >
      {/* Portrait: board above the D-pad. Landscape: board and D-pad side by side so the whole
          game fits the viewport with no scroll. The board is capped by available height too. */}
      <div className="flex flex-col items-center gap-6 landscape:flex-row landscape:items-center landscape:justify-center landscape:gap-10">
      <div
        ref={boardRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="bg-white p-3 rounded-[40px] shadow-2xl aspect-square w-[min(100%,calc(100dvh-16rem))] landscape:w-[min(58vw,calc(100dvh-8rem))] shrink-0 grid gap-1.5 border-8 border-yellow-100 touch-none cursor-pointer select-none"
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
