import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router';
import confetti from 'canvas-confetti';

const CARD_DATA = [
  { id: 1, img: '🦁' }, { id: 2, img: '🦁' },
  { id: 3, img: '🐵' }, { id: 4, img: '🐵' },
  { id: 5, img: '🦒' }, { id: 6, img: '🦒' },
  { id: 7, img: '🐘' }, { id: 8, img: '🐘' },
  { id: 9, img: '🐷' }, { id: 10, img: '🐷' },
  { id: 11, img: '🐸' }, { id: 12, img: '🐸' },
];

export default function MatchingGame() {
  const navigate = useNavigate();
  const [cards, setCards] = useState<any[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [solved, setSolved] = useState<number[]>([]);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const shuffled = [...CARD_DATA].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setSolved([]);
    setFlipped([]);
    setDisabled(false);
  };

  const handleCardClick = (id: number) => {
    if (disabled || flipped.includes(id) || solved.includes(id)) return;

    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setDisabled(true);
      const [firstId, secondId] = newFlipped;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (firstCard.img === secondCard.img) {
        setSolved([...solved, firstId, secondId]);
        setFlipped([]);
        setDisabled(false);
        if (solved.length + 2 === cards.length) {
          confetti({ particleCount: 150, spread: 70 });
        }
      } else {
        setTimeout(() => {
          setFlipped([]);
          setDisabled(false);
        }, 1000);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-12">
        <button onClick={() => navigate('/')} className="p-4 bg-white rounded-2xl shadow-md text-orange-500 hover:scale-110 transition-transform">
          <ArrowLeft size={32} />
        </button>
        <h2 className="text-4xl font-title text-orange-600">똑같은 그림 찾기</h2>
        <button onClick={initializeGame} className="p-4 bg-white rounded-2xl shadow-md text-blue-500 hover:scale-110 transition-transform">
          <RotateCcw size={32} />
        </button>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
        {cards.map((card) => {
          const isFlipped = flipped.includes(card.id) || solved.includes(card.id);
          return (
            <motion.button
              key={card.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCardClick(card.id)}
              className={`h-32 md:h-48 rounded-3xl text-5xl md:text-7xl shadow-xl flex items-center justify-center transition-all duration-500 preserve-3d ${
                isFlipped ? 'bg-white rotate-y-180' : 'bg-orange-400'
              }`}
            >
              {isFlipped ? card.img : '?'}
            </motion.button>
          );
        })}
      </div>

      {solved.length === cards.length && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-12 text-center p-8 bg-yellow-100 rounded-[40px] border-4 border-yellow-400 shadow-xl">
          <p className="text-3xl font-title text-orange-600 mb-6">전부 다 찾았어요! 짝짝짝!</p>
          <button onClick={initializeGame} className="bg-orange-500 text-white px-12 py-4 rounded-2xl font-title text-xl shadow-lg">다시 하기</button>
        </motion.div>
      )}
    </div>
  );
}
