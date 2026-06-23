import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router';
import confetti from 'canvas-confetti';

const MONSTER_COLORS = [
  { name: '빨강', color: '#ef4444', emoji: '👹' },
  { name: '파랑', color: '#3b82f6', emoji: '🥶' },
  { name: '노랑', color: '#eab308', emoji: '🥴' },
  { name: '초록', color: '#22c55e', emoji: '🤢' },
];

export default function MonsterGame() {
  const navigate = useNavigate();
  const [target, setTarget] = useState(MONSTER_COLORS[0]);
  const [monsters, setMonsters] = useState<any[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    generateMonsters();
  }, [score]);

  const generateMonsters = () => {
    const newTarget = MONSTER_COLORS[Math.floor(Math.random() * MONSTER_COLORS.length)];
    setTarget(newTarget);
    
    const count = 6;
    const newMonsters = Array.from({ length: count }).map((_, i) => {
      // Half are target color, half are random
      const colorObj = i < 2 ? newTarget : MONSTER_COLORS[Math.floor(Math.random() * MONSTER_COLORS.length)];
      return {
        id: i,
        ...colorObj,
        x: Math.random() * 80 + 10,
        y: Math.random() * 60 + 20,
        delay: Math.random() * 2,
      };
    }).sort(() => Math.random() - 0.5);
    
    setMonsters(newMonsters);
  };

  const handleCatch = (monster: any) => {
    if (monster.name === target.name) {
      setScore(s => s + 1);
      confetti({ particleCount: 30, spread: 50, colors: [monster.color] });
      if (score + 1 >= 5) {
        confetti({ particleCount: 100, spread: 70 });
      }
    } else {
      // Wrong one
    }
  };

  return (
    <div className="h-screen bg-slate-900 overflow-hidden font-kids">
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
        <button onClick={() => navigate('/')} className="p-4 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-all">
          <ArrowLeft size={32} />
        </button>
        <div className="bg-white px-8 py-4 rounded-[30px] shadow-2xl border-4" style={{ borderColor: target.color }}>
          <span className="text-3xl font-title text-gray-800">
            <span style={{ color: target.color }}>{target.name}</span> 몬스터를 잡아라!
          </span>
        </div>
        <div className="text-white font-title text-3xl">점수: {score}</div>
      </div>

      <div className="relative h-full w-full">
        <AnimatePresence>
          {monsters.map((monster) => (
            <motion.button
              key={`${score}-${monster.id}`}
              initial={{ scale: 0, x: `${monster.x}%`, y: `${monster.y}%` }}
              animate={{ 
                scale: 1,
                x: [`${monster.x}%`, `${(monster.x + 10) % 90}%`, `${monster.x}%`],
                y: [`${monster.y}%`, `${(monster.y + 10) % 80}%`, `${monster.y}%`]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                delay: monster.delay,
                ease: "easeInOut"
              }}
              onClick={() => handleCatch(monster)}
              className="absolute text-8xl md:text-9xl filter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              {monster.emoji}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {score >= 5 && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-white p-12 rounded-[50px] text-center shadow-2xl">
            <h2 className="text-5xl font-title text-orange-600 mb-6">몬스터를 다 잡았어요!</h2>
            <button onClick={() => { setScore(0); generateMonsters(); }} className="bg-yellow-400 text-white px-12 py-5 rounded-3xl font-title text-2xl">또 잡으러 가기</button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
