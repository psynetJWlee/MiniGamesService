import { useState } from 'react';
import { Search, Check } from 'lucide-react';
import { useNavigate } from 'react-router';
import { GameShell } from '../components/GameShell';
import { ResultModal } from '../components/ResultModal';
import { playCorrect } from '../lib/sound';
import { burstSmall } from '../lib/celebrate';
import { starsForLower } from '../lib/scoring';
import { useGameProgress } from '../lib/useGameProgress';
import { SCENES } from '../lib/hiddenScenes';

const HINTS = 3;
const STAR_THRESHOLDS = { three: 0, two: 2 };

export default function HiddenGame() {
  const navigate = useNavigate();
  const { level, setLevel, submitResult } = useGameProgress('hidden');
  const sceneIndex = Math.min(level, SCENES.length - 1);
  const scene = SCENES[sceneIndex];

  const [found, setFound] = useState<string[]>([]);
  const [hintsLeft, setHintsLeft] = useState(HINTS);
  const [hintActive, setHintActive] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  const startRound = () => {
    setFound([]);
    setHintsLeft(HINTS);
    setHintActive(false);
    setCleared(false);
  };

  const handleFind = (id: string) => {
    if (found.includes(id)) return;
    const next = [...found, id];
    setFound(next);
    playCorrect();
    burstSmall();
    if (next.length === scene.objects.length) {
      const used = HINTS - hintsLeft;
      const stars = starsForLower(used, STAR_THRESHOLDS);
      setEarnedStars(stars);
      submitResult({ stars, level: sceneIndex });
      setTimeout(() => setCleared(true), 600);
    }
  };

  const useHint = () => {
    if (hintsLeft <= 0 || hintActive) return;
    setHintsLeft((h) => h - 1);
    setHintActive(true);
    setTimeout(() => setHintActive(false), 1500);
  };

  const goNextLevel = () => {
    const next = Math.min(sceneIndex + 1, SCENES.length - 1);
    setLevel(next);
    startRound();
  };

  const status = (
    <div className="bg-white/90 px-4 py-2 rounded-2xl shadow-md text-orange-500 font-title text-xl">
      {found.length}/{scene.objects.length}
    </div>
  );

  return (
    <GameShell
      title={`숨은 그림 - ${scene.title}`}
      levelIndex={sceneIndex}
      levelCount={SCENES.length}
      status={status}
      onReset={startRound}
    >
      {/* Objects to find + hint */}
      <div className="flex items-center justify-center flex-wrap gap-2.5 mb-5">
        {scene.objects.map((obj) => {
          const isFound = found.includes(obj.id);
          return (
            <div
              key={obj.id}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full border-4 font-title text-lg transition-all ${
                isFound
                  ? 'bg-green-100 border-green-400 text-green-600 line-through opacity-70'
                  : 'bg-white border-yellow-300 text-gray-700'
              }`}
            >
              {isFound && <Check size={18} />}
              {obj.name}
            </div>
          );
        })}
        <button
          onClick={useHint}
          disabled={hintsLeft <= 0}
          className="flex items-center gap-1.5 bg-purple-400 disabled:opacity-40 text-white px-4 py-2 rounded-full shadow-md font-title text-lg hover:scale-105 transition-transform"
        >
          <Search size={20} />
          돋보기 {hintsLeft}
        </button>
      </div>

      {/* Scene */}
      <div className="rounded-[36px] overflow-hidden shadow-2xl border-8 border-white bg-white">
        <svg viewBox="0 0 800 520" className="w-full h-auto block select-none">
          {scene.render({ found, hint: hintActive, onFind: handleFind })}
        </svg>
      </div>

      <ResultModal
        open={cleared}
        stars={earnedStars}
        title="모두 다 찾았어요!"
        subtitle={`${scene.title}에서 숨은 그림을 다 찾았어요!`}
        hasNextLevel={sceneIndex < SCENES.length - 1}
        onNext={goNextLevel}
        onRetry={startRound}
        onHome={() => navigate('/')}
      />
    </GameShell>
  );
}
