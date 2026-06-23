import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router';
import confetti from 'canvas-confetti';

export default function DinoGame() {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [dinoY, setDinoY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const obstacleRef = useRef<HTMLDivElement>(null);
  const dinoRef = useRef<HTMLDivElement>(null);

  const jump = () => {
    if (!isJumping && isPlaying) {
      setIsJumping(true);
      setDinoY(-150);
      setTimeout(() => {
        setDinoY(0);
        setIsJumping(false);
      }, 500);
    }
  };

  useEffect(() => {
    let checkCollision: any;
    if (isPlaying) {
      checkCollision = setInterval(() => {
        if (!obstacleRef.current || !dinoRef.current) return;
        
        const dinoRect = dinoRef.current.getBoundingClientRect();
        const obsRect = obstacleRef.current.getBoundingClientRect();

        if (
          obsRect.left < dinoRect.right &&
          obsRect.right > dinoRect.left &&
          obsRect.top < dinoRect.bottom
        ) {
          setIsGameOver(true);
          setIsPlaying(false);
        } else if (obsRect.right < dinoRect.left && obsRect.right > dinoRect.left - 5) {
          setScore(s => s + 1);
        }
      }, 50);
    }
    return () => clearInterval(checkCollision);
  }, [isPlaying]);

  return (
    <div className="h-screen bg-green-50 overflow-hidden font-kids select-none" onClick={jump}>
      <div className="absolute top-6 left-6 flex items-center gap-8 z-20">
        <button onClick={(e) => { e.stopPropagation(); navigate('/'); }} className="p-4 bg-white rounded-2xl shadow-md text-orange-500"><ArrowLeft size={32} /></button>
        <div className="text-4xl font-title text-gray-700">점수: {score}</div>
      </div>

      <div className="relative h-full w-full flex flex-col justify-end pb-32">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-100 to-green-50 pointer-events-none" />
        
        {/* Dino */}
        <motion.div
          ref={dinoRef}
          animate={{ y: dinoY }}
          transition={{ duration: 0.25, type: 'spring' }}
          className="ml-20 text-8xl md:text-9xl relative z-10"
        >
          🦖
        </motion.div>

        {/* Obstacle */}
        {isPlaying && (
          <motion.div
            ref={obstacleRef}
            initial={{ x: '100vw' }}
            animate={{ x: '-10vw' }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="absolute bottom-32 text-7xl md:text-8xl"
          >
            🌵
          </motion.div>
        )}

        {/* Ground */}
        <div className="h-4 bg-yellow-700/20 w-full" />
      </div>

      {(!isPlaying || isGameOver) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-12 rounded-[50px] text-center shadow-2xl border-8 border-green-300">
            <span className="text-9xl mb-8 block">🦖</span>
            <h2 className="text-5xl font-title text-orange-600 mb-6">{isGameOver ? '쿵! 다시 도전해볼까요?' : '공룡 점프 놀이!'}</h2>
            <button
              onClick={(e) => { e.stopPropagation(); setIsPlaying(true); setIsGameOver(false); setScore(0); }}
              className="bg-green-500 text-white px-12 py-5 rounded-3xl font-title text-3xl shadow-xl flex items-center gap-4 mx-auto"
            >
              <RotateCcw size={40} />
              시작하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
