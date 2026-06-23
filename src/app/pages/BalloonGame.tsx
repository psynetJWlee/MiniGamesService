import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router';
import confetti from 'canvas-confetti';

const TARGET_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const COLORS = ['#FF9B9B', '#7BC9FF', '#A1EEBD', '#F9D949', '#D09CFA', '#FFB84C'];

interface Balloon {
  id: number;
  value: number;
  color: string;
  x: number;
  duration: number;
}

export default function BalloonGame() {
  const navigate = useNavigate();
  const [target, setTarget] = useState(1);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!gameOver) {
        const newBalloon: Balloon = {
          id: Date.now(),
          value: Math.floor(Math.random() * 5) + 1, // Random number 1-5 for simplicity
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          x: Math.random() * 80 + 10, // 10% to 90%
          duration: Math.random() * 2 + 4, // 4-6 seconds
        };
        setBalloons((prev) => [...prev, newBalloon]);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [gameOver]);

  // Clean up balloons that flew away
  useEffect(() => {
    const interval = setInterval(() => {
      setBalloons((prev) => prev.filter((b) => Date.now() - b.id < 7000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePop = (balloon: Balloon) => {
    if (balloon.value === target) {
      setScore((s) => s + 1);
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { x: balloon.x / 100, y: 0.5 },
        colors: [balloon.color]
      });
      
      // Update target periodically or every time
      setTarget(Math.floor(Math.random() * 5) + 1);

      if (score + 1 >= 10) {
        setGameOver(true);
        confetti({ particleCount: 150, spread: 70 });
      }
    }
    setBalloons((prev) => prev.filter((b) => b.id !== balloon.id));
  };

  return (
    <div className="relative h-screen bg-blue-50 overflow-hidden font-kids">
      {/* HUD */}
      <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-center">
        <button onClick={() => navigate('/')} className="p-4 bg-white rounded-2xl shadow-lg text-orange-500 hover:scale-110 transition-transform">
          <ArrowLeft size={32} />
        </button>
        
        <div className="bg-white/90 backdrop-blur-md px-10 py-4 rounded-[30px] shadow-xl border-4 border-blue-200 text-center">
          <span className="text-3xl font-title text-blue-600 block">숫자 {target}을 찾아서 팡팡!</span>
          <span className="text-xl font-body text-gray-500">지금까지 {score}개 터뜨렸어요</span>
        </div>

        <button onClick={() => { setScore(0); setGameOver(false); setBalloons([]); }} className="p-4 bg-white rounded-2xl shadow-lg text-blue-500 hover:scale-110 transition-transform">
          <RotateCcw size={32} />
        </button>
      </div>

      {/* Game Canvas */}
      <AnimatePresence>
        {balloons.map((balloon) => (
          <motion.button
            key={balloon.id}
            initial={{ y: '110vh', x: `${balloon.x}vw`, scale: 0.8 }}
            animate={{ y: '-20vh', x: `${balloon.x + (Math.sin(balloon.id) * 5)}vw`, scale: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: balloon.duration, ease: 'linear' }}
            onClick={() => handlePop(balloon)}
            className="absolute cursor-pointer group"
          >
            <div 
              className="w-24 h-32 md:w-32 md:h-40 rounded-[50%] relative shadow-lg flex items-center justify-center transition-transform group-active:scale-90"
              style={{ backgroundColor: balloon.color }}
            >
              <span className="text-4xl md:text-5xl font-title text-white drop-shadow-md">
                {balloon.value}
              </span>
              {/* Balloon string */}
              <div className="absolute bottom-[-20px] left-1/2 w-1 h-20 bg-gray-300 -translate-x-1/2" />
            </div>
          </motion.button>
        ))}
      </AnimatePresence>

      {/* Clear Screen */}
      <AnimatePresence>
        {gameOver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-white/80 backdrop-blur-md flex items-center justify-center">
            <div className="text-center p-12 bg-white rounded-[50px] shadow-2xl border-8 border-yellow-300">
              <span className="text-9xl mb-8 block animate-bounce">🎈</span>
              <h2 className="text-6xl font-title text-orange-600 mb-6">최고예요!</h2>
              <p className="text-2xl font-body text-gray-600 mb-10">숫자 왕 가온이 시온이!</p>
              <div className="flex gap-4 justify-center">
                <button onClick={() => { setScore(0); setGameOver(false); setBalloons([]); }} className="bg-blue-500 text-white px-10 py-5 rounded-3xl font-title text-2xl shadow-lg active:scale-95 transition-all">다시 놀기</button>
                <button onClick={() => navigate('/')} className="bg-orange-500 text-white px-10 py-5 rounded-3xl font-title text-2xl shadow-lg active:scale-95 transition-all">그만 놀기</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
