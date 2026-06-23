import { useState } from 'react';
import { motion } from 'motion/react';
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

interface Animal {
  id: string;
  name: string;
  emoji: string;
  food: string; // food id this animal wants
  color: string;
}

interface Food {
  id: string;
  emoji: string;
}

const ANIMALS: Animal[] = [
  { id: 'rabbit', name: '토끼', emoji: '🐰', food: 'carrot', color: '#FF9B9B' },
  { id: 'cat', name: '고양이', emoji: '🐱', food: 'fish', color: '#7BC9FF' },
  { id: 'dog', name: '강아지', emoji: '🐶', food: 'bone', color: '#A1EEBD' },
  { id: 'monkey', name: '원숭이', emoji: '🐵', food: 'banana', color: '#F9D949' },
  { id: 'panda', name: '판다', emoji: '🐼', food: 'bamboo', color: '#CDFCF6' },
  { id: 'bear', name: '곰', emoji: '🐻', food: 'honey', color: '#FFB84C' },
  { id: 'mouse', name: '생쥐', emoji: '🐭', food: 'cheese', color: '#D09CFA' },
];

const FOODS: Record<string, Food> = {
  carrot: { id: 'carrot', emoji: '🥕' },
  fish: { id: 'fish', emoji: '🐟' },
  bone: { id: 'bone', emoji: '🦴' },
  banana: { id: 'banana', emoji: '🍌' },
  bamboo: { id: 'bamboo', emoji: '🎋' },
  honey: { id: 'honey', emoji: '🍯' },
  cheese: { id: 'cheese', emoji: '🧀' },
};
// Foods that no animal wants — used as decoys on the hardest level.
const DECOY_FOODS: Food[] = [
  { id: 'icecream', emoji: '🍦' },
  { id: 'pizza', emoji: '🍕' },
  { id: 'candy', emoji: '🍬' },
];

interface Level {
  label: string;
  animals: number;
  decoys: number;
  stars: { three: number; two: number };
}

const LEVELS: Level[] = [
  { label: '쉬워요', animals: 3, decoys: 0, stars: { three: 0, two: 1 } },
  { label: '보통이에요', animals: 5, decoys: 0, stars: { three: 0, two: 2 } },
  { label: '어려워요', animals: 6, decoys: 2, stars: { three: 1, two: 3 } },
];

const ItemTypes = { FOOD: 'food' };

interface FoodDragItem {
  id: string;
  emoji: string;
}

interface Round {
  animals: Animal[];
  foods: Food[];
}

function buildRound(level: Level): Round {
  const animals = shuffle(ANIMALS).slice(0, level.animals);
  const wanted = animals.map((a) => FOODS[a.food]);
  const decoys = shuffle(DECOY_FOODS).slice(0, level.decoys);
  return { animals, foods: shuffle([...wanted, ...decoys]) };
}

function AnimalZone({ animal, onFeed, isFed }: { animal: Animal; onFeed: (foodId: string) => void; isFed: boolean }) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.FOOD,
    drop: (item: FoodDragItem) => onFeed(item.id),
    collect: (monitor) => ({ isOver: !!monitor.isOver(), canDrop: !!monitor.canDrop() }),
  });

  return (
    <div
      ref={drop as never}
      className={`relative flex flex-col items-center gap-3 p-4 rounded-[40px] transition-all duration-300 ${
        isOver && canDrop ? 'scale-110 bg-white/40' : 'scale-100'
      }`}
    >
      <motion.div
        animate={isFed ? { scale: [1, 1.25, 1], rotate: [0, 6, -6, 0] } : isOver ? { scale: 1.1 } : {}}
        transition={{ duration: 0.5 }}
        className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-8 shadow-xl relative flex items-center justify-center bg-white"
        style={{ borderColor: animal.color }}
      >
        <span className="text-7xl md:text-8xl">{animal.emoji}</span>
        {isFed && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 bg-black/10 flex items-center justify-center"
          >
            <span className="text-5xl">❤️</span>
          </motion.div>
        )}
      </motion.div>
      <div className="bg-white/80 backdrop-blur-sm px-5 py-1.5 rounded-2xl shadow-sm">
        <span className="text-2xl font-title text-gray-800">{animal.name}</span>
      </div>
    </div>
  );
}

function FoodItem({ food, isUsed }: { food: Food; isUsed: boolean }) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.FOOD,
    item: { id: food.id, emoji: food.emoji } as FoodDragItem,
    canDrag: !isUsed,
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  });

  return (
    <motion.div
      ref={drag as never}
      whileHover={!isUsed ? { scale: 1.1, rotate: 5 } : {}}
      whileTap={!isUsed ? { scale: 0.9 } : {}}
      className={`relative w-20 h-20 md:w-28 md:h-28 bg-white rounded-3xl shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none transition-opacity ${
        isDragging ? 'opacity-50' : isUsed ? 'opacity-30' : 'opacity-100'
      }`}
    >
      <span className="text-5xl md:text-6xl select-none">{food.emoji}</span>
      {isUsed && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-1 bg-red-400/50 rotate-45 absolute" />
          <div className="w-full h-1 bg-red-400/50 -rotate-45 absolute" />
        </div>
      )}
    </motion.div>
  );
}

// Drag preview that follows the finger (TouchBackend renders none by default).
function FoodDragLayer() {
  const { item, isDragging, offset } = useDragLayer((monitor) => ({
    item: monitor.getItem() as FoodDragItem | null,
    isDragging: monitor.isDragging(),
    offset: monitor.getSourceClientOffset(),
  }));
  if (!isDragging || !offset || !item?.emoji) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[70] select-none">
      <div
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
        className="w-20 h-20 md:w-28 md:h-28 bg-white rounded-3xl shadow-2xl flex items-center justify-center"
      >
        <span className="text-5xl md:text-6xl">{item.emoji}</span>
      </div>
    </div>
  );
}

export default function FeedingGame() {
  const navigate = useNavigate();
  const wrong = useWrongFeedback();
  const { level, setLevel, submitResult } = useGameProgress('feeding');
  const levelIndex = Math.min(level, LEVELS.length - 1);
  const config = LEVELS[levelIndex];

  const [round, setRound] = useState<Round>(() => buildRound(config));
  const [fed, setFed] = useState<string[]>([]);
  const [wrongDrops, setWrongDrops] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  const startRound = (cfg: Level) => {
    setRound(buildRound(cfg));
    setFed([]);
    setWrongDrops(0);
    setCleared(false);
  };

  const handleFeed = (foodId: string, animal: Animal) => {
    if (fed.includes(animal.id)) return;
    if (foodId !== animal.food) {
      setWrongDrops((w) => w + 1);
      wrong.trigger();
      return;
    }
    const next = [...fed, animal.id];
    setFed(next);
    playCorrect();
    burstSmall();
    if (next.length === round.animals.length) {
      const stars = starsForLower(wrongDrops, config.stars);
      setEarnedStars(stars);
      submitResult({ stars, level: levelIndex });
      setTimeout(() => setCleared(true), 900);
    }
  };

  const goNextLevel = () => {
    const next = Math.min(levelIndex + 1, LEVELS.length - 1);
    setLevel(next);
    startRound(LEVELS[next]);
  };

  const status = (
    <div className="bg-white/90 px-4 py-2 rounded-2xl shadow-md text-orange-500 font-title text-xl">
      {fed.length}/{round.animals.length}
    </div>
  );

  return (
    <DndProvider backend={TouchBackend} options={{ enableMouseEvents: true }}>
      <GameShell
        title="동물 먹이 주기"
        levelIndex={levelIndex}
        levelCount={LEVELS.length}
        status={status}
        onReset={() => startRound(config)}
        contentClassName="relative z-10 px-4 pt-28 pb-10 max-w-6xl mx-auto flex flex-col gap-8 select-none"
      >
        <FoodDragLayer />
        {wrong.overlay}

        {/* Animals */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 justify-items-center">
          {round.animals.map((animal) => (
            <AnimalZone
              key={animal.id}
              animal={animal}
              isFed={fed.includes(animal.id)}
              onFeed={(foodId) => handleFeed(foodId, animal)}
            />
          ))}
        </div>

        {/* Foods tray */}
        <div className="bg-white/50 backdrop-blur-md p-6 rounded-[50px] shadow-inner border-4 border-dashed border-white/80">
          <div className="flex flex-wrap justify-center gap-5 md:gap-10">
            {round.foods.map((food) => (
              <FoodItem
                key={food.id}
                food={food}
                isUsed={round.animals.some((a) => a.food === food.id && fed.includes(a.id))}
              />
            ))}
          </div>
        </div>

        <ResultModal
          open={cleared}
          stars={earnedStars}
          title="참 잘했어요!"
          subtitle={`동물 친구들이 배가 불러요! (틀린 횟수 ${wrongDrops})`}
          hasNextLevel={levelIndex < LEVELS.length - 1}
          onNext={goNextLevel}
          onRetry={() => startRound(config)}
          onHome={() => navigate('/')}
        />
      </GameShell>
    </DndProvider>
  );
}
