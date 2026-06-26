import { useEffect, useMemo, useState } from 'react';
import { useDrag, useDrop, useDragLayer, DndProvider } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';
import { useNavigate } from 'react-router';
import { GameShell } from '../components/GameShell';
import { ResultModal } from '../components/ResultModal';
import { shuffle } from '../lib/shuffle';
import { playCorrect } from '../lib/sound';
import { burstSmall } from '../lib/celebrate';
import { starsForLower } from '../lib/scoring';
import { useWrongFeedback } from '../lib/useWrongFeedback';
import { useGameProgress } from '../lib/useGameProgress';
import gaonImg from '../../assets/players/gaon-1.jpg';
import sionImg from '../../assets/players/sion-1.jpg';

// Auto-discover puzzle images dropped into src/assets/puzzle. If none, fall
// back to the kids' photos so the game always works out of the box.
const discovered = import.meta.glob('../../assets/puzzle/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', {
  eager: true,
  query: '?url',
  import: 'default',
});
const POOL = Object.values(discovered) as string[];
const IMAGES: string[] = POOL.length ? POOL : [gaonImg, sionImg];

interface Level {
  label: string;
  n: number;
  stars: { three: number; two: number };
}

const LEVELS: Level[] = [
  { label: '5×5', n: 5, stars: { three: 0, two: 6 } },
  { label: '6×6', n: 6, stars: { three: 0, two: 8 } },
  { label: '7×7', n: 7, stars: { three: 1, two: 10 } },
];

const ItemTypes = { PIECE: 'piece' };
const keyOf = (r: number, c: number) => `${r},${c}`;

interface PieceItem {
  r: number;
  c: number;
  image: string;
  n: number;
  size: number;
}

// One image tile — uses percentage background sizing so it scales with any
// board size (no pre-cut assets needed).
function tileStyle(image: string, n: number, r: number, c: number): React.CSSProperties {
  return {
    backgroundImage: `url(${image})`,
    backgroundSize: `${n * 100}% ${n * 100}%`,
    backgroundPosition: `${(c / (n - 1)) * 100}% ${(r / (n - 1)) * 100}%`,
  };
}

function TrayPiece({ image, n, r, c, size }: { image: string; n: number; r: number; c: number; size: number }) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.PIECE,
    item: { r, c, image, n, size } as PieceItem,
    collect: (m) => ({ isDragging: !!m.isDragging() }),
  });
  return (
    <div
      ref={drag as never}
      style={{ width: size, height: size, ...tileStyle(image, n, r, c), opacity: isDragging ? 0.4 : 1 }}
      className="rounded-lg shadow-md cursor-grab active:cursor-grabbing touch-none select-none border-2 border-white"
    />
  );
}

function Slot({
  r,
  c,
  n,
  image,
  isPlaced,
  onPlace,
}: {
  r: number;
  c: number;
  n: number;
  image: string;
  isPlaced: boolean;
  onPlace: (item: PieceItem, r: number, c: number) => void;
}) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.PIECE,
    canDrop: () => !isPlaced,
    drop: (item: PieceItem) => onPlace(item, r, c),
    collect: (m) => ({ isOver: !!m.isOver(), canDrop: !!m.canDrop() }),
  });
  return (
    <div ref={drop as never} className="relative">
      {isPlaced ? (
        <div className="absolute inset-0" style={tileStyle(image, n, r, c)} />
      ) : (
        <div className={`absolute inset-0 border border-white/60 ${isOver && canDrop ? 'bg-white/50' : ''}`} />
      )}
    </div>
  );
}

// Floating preview that follows the finger (TouchBackend has no default preview).
function PuzzleDragLayer() {
  const { item, isDragging, offset } = useDragLayer((m) => ({
    item: m.getItem() as PieceItem | null,
    isDragging: m.isDragging(),
    offset: m.getSourceClientOffset(),
  }));
  if (!isDragging || !offset || !item) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[70]">
      <div
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          width: item.size,
          height: item.size,
          ...tileStyle(item.image, item.n, item.r, item.c),
        }}
        className="rounded-lg shadow-2xl border-2 border-white"
      />
    </div>
  );
}

export default function PuzzleGame() {
  const navigate = useNavigate();
  const wrong = useWrongFeedback();
  const { level, setLevel, submitResult } = useGameProgress('puzzle');
  const levelIndex = Math.min(level, LEVELS.length - 1);
  const config = LEVELS[levelIndex];
  const n = config.n;

  const [image, setImage] = useState(() => IMAGES[Math.floor(Math.random() * IMAGES.length)]);
  const [placed, setPlaced] = useState<Set<string>>(new Set());
  const [order, setOrder] = useState<{ r: number; c: number }[]>(() => buildOrder(n));
  const [wrongDrops, setWrongDrops] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  function makeImageChoice() {
    return IMAGES[Math.floor(Math.random() * IMAGES.length)];
  }

  const startRound = (cfg: Level, newImage = true) => {
    if (newImage) setImage(makeImageChoice());
    setPlaced(new Set());
    setOrder(buildOrder(cfg.n));
    setWrongDrops(0);
    setCleared(false);
  };

  const handlePlace = (item: PieceItem, sr: number, sc: number) => {
    if (item.r === sr && item.c === sc) {
      playCorrect();
      burstSmall();
      const next = new Set(placed);
      next.add(keyOf(sr, sc));
      setPlaced(next);
      if (next.size === n * n) {
        const stars = starsForLower(wrongDrops, config.stars);
        setEarnedStars(stars);
        submitResult({ stars, level: levelIndex });
        setTimeout(() => setCleared(true), 600);
      }
    } else {
      setWrongDrops((w) => w + 1);
      wrong.trigger();
    }
  };

  const goNextLevel = () => {
    const next = Math.min(levelIndex + 1, LEVELS.length - 1);
    setLevel(next);
    startRound(LEVELS[next]);
  };

  // Tray pieces = not-yet-placed, in their shuffled order.
  const trayPieces = useMemo(() => order.filter((p) => !placed.has(keyOf(p.r, p.c))), [order, placed]);

  // Shrink tray pieces on narrow screens so the whole tray fits the viewport
  // without scrolling (phones in portrait can't fit full-size pieces + board).
  const [vw, setVw] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1024));
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const trayPieceSize = Math.round(Math.min(300, vw * 0.6) / n);

  const status = (
    <div className="bg-white/90 px-4 py-2 rounded-2xl shadow-md text-orange-500 font-title text-xl">
      {placed.size}/{n * n}
    </div>
  );

  return (
    <DndProvider backend={TouchBackend} options={{ enableMouseEvents: true }}>
      <GameShell
        title="직소 퍼즐"
        levelIndex={levelIndex}
        levelCount={LEVELS.length}
        status={status}
        onReset={() => startRound(config, false)}
        contentClassName="relative z-10 px-4 pt-24 pb-4 max-w-2xl landscape:max-w-6xl mx-auto"
      >
        <PuzzleDragLayer />
        {wrong.overlay}

        {/* Portrait: board stacked above the tray. Landscape: board and tray sit side by side so
            nothing ever overflows the viewport (no scroll in any orientation). The board is also
            capped by the available height so it stays fully visible. */}
        <div className="flex flex-col items-center gap-4 landscape:flex-row landscape:items-start landscape:justify-center landscape:gap-6">
          {/* Board with a faint guide image behind the slots */}
          <div className="relative shrink-0 w-[min(100%,460px,calc(100dvh-34rem))] landscape:w-[min(46vw,460px,calc(100dvh-8rem))] aspect-square rounded-2xl overflow-hidden shadow-2xl border-8 border-white bg-orange-50">
            <div className="absolute inset-0 opacity-15" style={{ backgroundImage: `url(${image})`, backgroundSize: '100% 100%' }} />
            <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, gridTemplateRows: `repeat(${n}, 1fr)` }}>
              {Array.from({ length: n * n }).map((_, i) => {
                const r = Math.floor(i / n);
                const c = i % n;
                return (
                  <Slot key={i} r={r} c={c} n={n} image={image} isPlaced={placed.has(keyOf(r, c))} onPlace={handlePlace} />
                );
              })}
            </div>
          </div>

          {/* Tray of shuffled pieces */}
          <div className="w-full landscape:flex-1 bg-white/50 backdrop-blur-md p-4 rounded-[30px] shadow-inner border-4 border-dashed border-white/80 min-h-[80px]">
            <div className="flex flex-wrap justify-center gap-2">
              {trayPieces.map((p) => (
                <TrayPiece key={keyOf(p.r, p.c)} image={image} n={n} r={p.r} c={p.c} size={trayPieceSize} />
              ))}
            </div>
          </div>
        </div>

        <ResultModal
          open={cleared}
          stars={earnedStars}
          title="퍼즐 완성!"
          subtitle={`멋진 그림을 완성했어요! (틀린 횟수 ${wrongDrops})`}
          hasNextLevel={levelIndex < LEVELS.length - 1}
          onNext={goNextLevel}
          onRetry={() => startRound(config, false)}
          onHome={() => navigate('/')}
        />
      </GameShell>
    </DndProvider>
  );
}

function buildOrder(n: number): { r: number; c: number }[] {
  const all: { r: number; c: number }[] = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) all.push({ r, c });
  return shuffle(all);
}
