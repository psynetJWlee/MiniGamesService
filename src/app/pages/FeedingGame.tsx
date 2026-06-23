import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ArrowLeft, RotateCcw, PartyPopper } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import confetti from 'canvas-confetti';

// Game constants
const ANIMALS = [
  { id: 'rabbit', name: '토끼', food: 'carrot', image: 'https://images.unsplash.com/photo-1642861937504-62b536fcc1b9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwY2FydG9vbiUyMHJhYmJpdCUyMGhlYWQlMjBmYWNlfGVufDF8fHx8MTc4MjE5NjAxNnww&ixlib=rb-4.1.0&q=80&w=1080', color: '#FF9B9B' },
  { id: 'cat', name: '고양이', food: 'fish', image: 'https://images.unsplash.com/photo-1593541810982-4390fb4255ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwY2FydG9vbiUyMGNhdCUyMGhlYWQlMjBmYWNlfGVufDF8fHx8MTc4MjE5NjAxNnww&ixlib=rb-4.1.0&q=80&w=1080', color: '#7BC9FF' },
  { id: 'dog', name: '강아지', food: 'bone', image: 'https://images.unsplash.com/photo-1676873261959-173b91552b0d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwY2FydG9vbiUyMGRvZyUyMGhlYWQlMjBmYWNlfGVufDF8fHx8MTc4MjE5NjAxNnww&ixlib=rb-4.1.0&q=80&w=1080', color: '#A1EEBD' },
];

const FOODS = [
  { id: 'carrot', name: '당근', image: 'https://images.unsplash.com/photo-1596206363094-925b51e4ee17?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJ0b29uJTIwY2Fycm90JTIwaWxsdXN0cmF0aW9uJTIwaWNvbnxlbnwxfHx8fDE3ODIxOTYwMTd8MA&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 'fish', name: '물고기', image: 'https://images.unsplash.com/photo-1763748999122-50b96fee064a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJ0b29uJTIwZmlzaCUyMGlsbHVzdHJhdGlvbiUyMGljb258ZW58MXx8fHwxNzgyMTk2MDE3fDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 'bone', name: '뼈다귀', image: 'https://images.unsplash.com/photo-1758086193161-9cda6e8c5089?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJ0b29uJTIwYm9uZSUyMGlsbHVzdHJhdGlvbiUyMGljb258ZW58MXx8fHwxNzgyMTk2MDE3fDA&ixlib=rb-4.1.0&q=80&w=1080' },
];

const ItemTypes = {
  FOOD: 'food',
};

// Animal Drop Zone Component
function AnimalZone({ animal, onFeed, isFed }: { animal: typeof ANIMALS[0], onFeed: (foodId: string) => void, isFed: boolean }) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.FOOD,
    drop: (item: { id: string }) => onFeed(item.id),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={drop as any}
      className={`relative flex flex-col items-center gap-4 p-6 rounded-[40px] transition-all duration-300 ${
        isOver && canDrop ? 'scale-110 shadow-2xl bg-white/40' : 'scale-100'
      }`}
    >
      <motion.div
        animate={isFed ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } : isOver ? { scale: 1.1 } : {}}
        transition={{ duration: 0.5 }}
        className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-8 shadow-xl relative"
        style={{ borderColor: animal.color }}
      >
        <ImageWithFallback
          src={animal.image}
          alt={animal.name}
          className="w-full h-full object-cover"
        />
        {isFed && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 bg-black/20 flex items-center justify-center"
          >
            <span className="text-6xl">❤️</span>
          </motion.div>
        )}
      </motion.div>
      <div className="bg-white/80 backdrop-blur-sm px-6 py-2 rounded-2xl shadow-sm">
        <span className="text-2xl font-title text-gray-800">{animal.name}</span>
      </div>
    </div>
  );
}

// Draggable Food Component
function FoodItem({ food, isUsed }: { food: typeof FOODS[0], isUsed: boolean }) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.FOOD,
    item: { id: food.id },
    canDrag: !isUsed,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  return (
    <motion.div
      ref={drag as any}
      whileHover={!isUsed ? { scale: 1.1, rotate: 5 } : {}}
      whileTap={!isUsed ? { scale: 0.9 } : {}}
      className={`relative w-24 h-24 md:w-32 md:h-32 bg-white rounded-3xl shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing transition-opacity ${
        isDragging ? 'opacity-50' : isUsed ? 'opacity-30' : 'opacity-100'
      }`}
    >
      <ImageWithFallback
        src={food.image}
        alt={food.name}
        className="w-[80%] h-[80%] object-contain"
      />
      {isUsed && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-1 bg-red-400/50 rotate-45 absolute" />
          <div className="w-full h-1 bg-red-400/50 -rotate-45 absolute" />
        </div>
      )}
    </motion.div>
  );
}

export default function FeedingGame() {
  const navigate = useNavigate();
  const [fedAnimals, setFedAnimals] = useState<string[]>([]);
  const [showClear, setShowClear] = useState(false);
  const [shuffledFoods, setShuffledFoods] = useState([...FOODS]);

  useEffect(() => {
    // Shuffle foods on start
    setShuffledFoods([...FOODS].sort(() => Math.random() - 0.5));
  }, []);

  const handleFeed = (foodId: string, animalId: string, correctFoodId: string) => {
    if (foodId === correctFoodId) {
      if (!fedAnimals.includes(animalId)) {
        setFedAnimals((prev) => [...prev, animalId]);
        
        // Success effect
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
        audio.play().catch(() => {});
        
        if (fedAnimals.length + 1 === ANIMALS.length) {
          handleGameClear();
        }
      }
    } else {
      // Wrong food effect - simple shake or sound
      console.log('Wrong food!');
    }
  };

  const handleGameClear = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF9B9B', '#7BC9FF', '#A1EEBD', '#F9D949']
    });
    setTimeout(() => setShowClear(true), 1000);
  };

  const resetGame = () => {
    setFedAnimals([]);
    setShowClear(false);
    setShuffledFoods([...FOODS].sort(() => Math.random() - 0.5));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="max-w-6xl mx-auto px-4 py-8 min-h-[80vh] flex flex-col">
        {/* Header Controls */}
        <div className="flex justify-between items-center mb-12">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 bg-white px-6 py-3 rounded-2xl shadow-md text-orange-500 font-title hover:scale-105 transition-transform"
          >
            <ArrowLeft size={24} />
            <span>돌아가기</span>
          </button>
          
          <div className="bg-yellow-100 px-8 py-3 rounded-3xl shadow-inner border-2 border-yellow-200">
            <span className="text-2xl font-title text-orange-600">
              배고픈 친구들에게 먹이를 주세요! ({fedAnimals.length}/{ANIMALS.length})
            </span>
          </div>

          <button
            onClick={resetGame}
            className="flex items-center gap-2 bg-white px-6 py-3 rounded-2xl shadow-md text-blue-500 font-title hover:scale-105 transition-transform"
          >
            <RotateCcw size={24} />
            <span>다시하기</span>
          </button>
        </div>

        {/* Game Content */}
        <div className="flex-1 flex flex-col justify-around gap-12">
          {/* Animals Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ANIMALS.map((animal) => (
              <AnimalZone
                key={animal.id}
                animal={animal}
                isFed={fedAnimals.includes(animal.id)}
                onFeed={(foodId) => handleFeed(foodId, animal.id, animal.food)}
              />
            ))}
          </div>

          {/* Foods Row */}
          <div className="bg-white/50 backdrop-blur-md p-8 rounded-[50px] shadow-inner border-4 border-dashed border-white/80">
            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              {shuffledFoods.map((food) => (
                <FoodItem
                  key={food.id}
                  food={food}
                  isUsed={fedAnimals.some(aId => ANIMALS.find(a => a.id === aId)?.food === food.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Clear Modal */}
        <AnimatePresence>
          {showClear && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.5, y: 100 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-[50px] p-12 text-center shadow-2xl max-w-md w-full"
              >
                <div className="text-8xl mb-6">🎉</div>
                <h2 className="text-5xl font-title text-orange-600 mb-4">참 잘했어요!</h2>
                <p className="text-2xl font-body text-gray-600 mb-8">
                  가온이 시온이 덕분에 동물 친구들이 배가 불러요!
                </p>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={resetGame}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-white py-5 rounded-3xl font-title text-2xl shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    <RotateCcw size={28} />
                    한 번 더 놀기
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-5 rounded-3xl font-title text-2xl shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    다른 놀이 선택하기
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DndProvider>
  );
}
