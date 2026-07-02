import { useState, type MouseEvent } from 'react';
import { motion } from 'motion/react';
import { Search, Check } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { GameShell } from '../components/GameShell';
import { ResultModal } from '../components/ResultModal';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { playCorrect, playWrong } from '../lib/sound';
import { burstSmall } from '../lib/celebrate';
import { starsForLower } from '../lib/scoring';
import { useGameProgress } from '../lib/useGameProgress';
import { PUZZLES, type HiddenTarget } from '../lib/hiddenScenes';

const HINTS = 3;
const STAR_THRESHOLDS = { three: 0, two: 2 };

export default function HiddenGame() {
  const navigate = useNavigate();
  const { puzzleId } = useParams();
  // Dev helper: open …/game/hidden/<id>?edit to drop a green dot + read coords
  // for authoring hotspots. Read per-render so it works after client nav too.
  const editMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('edit');
  const { submitResult } = useGameProgress('hidden');
  const puzzleIndex = Math.max(0, PUZZLES.findIndex((p) => p.id === puzzleId));
  const puzzle = PUZZLES[puzzleIndex];

  const [found, setFound] = useState<string[]>([]);
  const [hintsLeft, setHintsLeft] = useState(HINTS);
  const [hintActive, setHintActive] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);
  const [miss, setMiss] = useState<{ x: number; y: number; key: number } | null>(null);
  const [lastClick, setLastClick] = useState<{ x: number; y: number } | null>(null);

  const startRound = () => {
    setFound([]);
    setHintsLeft(HINTS);
    setHintActive(false);
    setCleared(false);
    setMiss(null);
  };

  const registerFind = (nextFound: string[]) => {
    if (nextFound.length === puzzle.targets.length) {
      const used = HINTS - hintsLeft;
      const stars = starsForLower(used, STAR_THRESHOLDS);
      setEarnedStars(stars);
      submitResult({ stars, level: puzzleIndex });
      setTimeout(() => setCleared(true), 600);
    }
  };

  const tapScene = (e: MouseEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - box.left) / box.width;
    const ny = (e.clientY - box.top) / box.height;

    if (editMode) {
      // Coordinate picker: drop a green circle exactly where you tap, read x/y.
      setLastClick({ x: nx, y: ny });
      // eslint-disable-next-line no-console
      console.log(`hotspot → x: ${nx.toFixed(3)}, y: ${ny.toFixed(3)}`);
      return;
    }

    // Hit-test against unfound targets (distance in pixels vs r*width).
    const hit = puzzle.targets.find(
      (t) =>
        !found.includes(t.id) &&
        Math.hypot((nx - t.x) * box.width, (ny - t.y) * box.height) <= t.r * box.width,
    );

    if (hit) {
      const next = [...found, hit.id];
      setFound(next);
      setMiss(null);
      playCorrect();
      burstSmall({ x: hit.x, y: hit.y });
      registerFind(next);
    } else {
      playWrong();
      setMiss({ x: nx, y: ny, key: Date.now() });
    }
  };

  const useHint = () => {
    if (hintsLeft <= 0 || hintActive) return;
    setHintsLeft((h) => h - 1);
    setHintActive(true);
    setTimeout(() => setHintActive(false), 1600);
  };

  const backToSelect = () => navigate('/game/hidden');

  const status = (
    <div className="bg-white/90 px-4 py-2 rounded-2xl shadow-md text-orange-500 font-title text-xl">
      {found.length}/{puzzle.targets.length}
    </div>
  );

  return (
    <GameShell
      title={`숨은 그림 - ${puzzle.title}`}
      status={status}
      onBack={backToSelect}
      onReset={startRound}
      contentClassName="relative z-10 px-4 pt-24 pb-4 max-w-4xl mx-auto flex flex-col items-center gap-3"
    >
      {/* The illustration — tap where an object is hidden. The inner box hugs the
          image (any aspect ratio) so hotspot %s line up exactly; height is capped
          so the picture + find list always fit the viewport (no scroll). */}
      <div className="rounded-3xl overflow-hidden shadow-2xl border-8 border-white bg-white max-w-full">
      <div onClick={tapScene} className="relative block cursor-pointer select-none">
        <ImageWithFallback
          src={puzzle.image}
          alt={puzzle.title}
          className="block max-w-full w-auto"
          style={{ maxHeight: 'calc(100dvh - 16rem)' }}
        />

        {/* Found markers */}
        {puzzle.targets.map((t) =>
          found.includes(t.id) ? <Marker key={t.id} t={t} /> : null,
        )}

        {/* Hint pulses on unfound targets */}
        {hintActive &&
          puzzle.targets
            .filter((t) => !found.includes(t.id))
            .map((t) => <HintPulse key={t.id} t={t} />)}

        {/* Wrong-tap ripple */}
        {miss && (
          <motion.span
            key={miss.key}
            className="absolute w-10 h-10 rounded-full border-4 border-red-400 pointer-events-none"
            style={{ left: `${miss.x * 100}%`, top: `${miss.y * 100}%`, transform: 'translate(-50%,-50%)' }}
            initial={{ scale: 0.4, opacity: 0.9 }}
            animate={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}

        {editMode && lastClick && (
          <>
            <span
              className="absolute rounded-full border-4 border-green-500 bg-green-400/25 pointer-events-none"
              style={{
                left: `${lastClick.x * 100}%`,
                top: `${lastClick.y * 100}%`,
                width: '10%',
                aspectRatio: '1 / 1',
                transform: 'translate(-50%,-50%)',
              }}
            />
            {/* coordinate label right on the circle */}
            <div
              className="absolute bg-black/75 text-white text-[11px] md:text-xs font-mono px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap"
              style={{
                left: `${lastClick.x * 100}%`,
                top: `${lastClick.y * 100}%`,
                transform: 'translate(-50%, calc(-50% - 2.3rem))',
              }}
            >
              x {lastClick.x.toFixed(3)} · y {lastClick.y.toFixed(3)}
            </div>
          </>
        )}
      </div>
      </div>

      {/* Find list — the objects to spot, with the hint (돋보기) button. */}
      <div className="flex items-center justify-center flex-wrap gap-2">
        {puzzle.targets.map((t) => {
          const isFound = found.includes(t.id);
          return (
            <div
              key={t.id}
              className={`flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-2xl border-4 font-title text-base md:text-lg transition-all ${
                isFound
                  ? 'bg-green-100 border-green-400 text-green-600 opacity-70'
                  : 'bg-white border-yellow-300 text-gray-700'
              }`}
            >
              <span className="text-2xl md:text-3xl leading-none">
                {t.iconSrc ? <img src={t.iconSrc} alt="" className="w-7 h-7 object-contain" /> : t.icon}
              </span>
              <span className={isFound ? 'line-through' : ''}>{t.name}</span>
              {isFound && <Check size={16} />}
            </div>
          );
        })}
        <button
          onClick={useHint}
          disabled={hintsLeft <= 0}
          className="flex items-center gap-1.5 bg-purple-400 disabled:opacity-40 text-white px-4 py-2 rounded-2xl shadow-md font-title text-base md:text-lg hover:scale-105 transition-transform"
        >
          <Search size={18} />
          돋보기 {hintsLeft}
        </button>
      </div>

      <ResultModal
        open={cleared}
        stars={earnedStars}
        title="모두 다 찾았어요!"
        subtitle={`${puzzle.title}에서 숨은 그림을 다 찾았어요!`}
        hasNextLevel
        nextLabel="다른 그림 고르기"
        onNext={backToSelect}
        onRetry={startRound}
        onHome={() => navigate('/')}
      />
    </GameShell>
  );
}

function Marker({ t }: { t: HiddenTarget }) {
  return (
    <motion.span
      className="absolute rounded-full border-4 border-green-500 bg-green-400/15 pointer-events-none"
      style={{
        left: `${t.x * 100}%`,
        top: `${t.y * 100}%`,
        width: `${t.r * 2 * 100}%`,
        aspectRatio: '1 / 1',
        transform: 'translate(-50%,-50%)',
      }}
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
    />
  );
}

function HintPulse({ t }: { t: HiddenTarget }) {
  return (
    <motion.span
      className="absolute rounded-full border-4 border-purple-500 pointer-events-none"
      style={{
        left: `${t.x * 100}%`,
        top: `${t.y * 100}%`,
        width: `${t.r * 2 * 100}%`,
        aspectRatio: '1 / 1',
        transform: 'translate(-50%,-50%)',
      }}
      initial={{ scale: 1, opacity: 0 }}
      animate={{ scale: [1, 1.6, 1], opacity: [0.2, 0.9, 0] }}
      transition={{ duration: 1.4, repeat: 1 }}
    />
  );
}
