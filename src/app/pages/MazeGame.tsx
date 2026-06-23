import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import confetti from 'canvas-confetti';

const GRID_SIZE = 7;
const MAZE = [
  [0, 1, 0, 0, 0, 0, 0],
  [0, 1, 0, 1, 1, 1, 0],
  [0, 0, 0, 1, 0, 0, 0],
  [1, 1, 0, 1, 0, 1, 1],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 2], // 2 is goal
];

export default function MazeGame() {
  const navigate = useNavigate();
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [won, setWon] = useState(false);

  const move = (dx: number, dy: number) => {
    if (won) return;
    const nx = pos.x + dx;
    const ny = pos.y + dy;

    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && MAZE[ny][nx] !== 1) {
      setPos({ x: nx, y: ny });
      if (MAZE[ny][nx] === 2) {
        setWon(true);
        confetti({ particleCount: 150, spread: 70 });
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 font-kids">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => navigate('/')} className="p-4 bg-white rounded-2xl shadow-md text-orange-500"><ArrowLeft size={32} /></button>
        <h2 className="text-3xl font-title text-orange-600">쿠키를 찾으러 가요!</h2>
        <div className="w-16" />
      </div>

      <div className="bg-white p-4 rounded-[40px] shadow-2xl aspect-square grid grid-cols-7 gap-2 mb-12 border-8 border-yellow-100">
        {MAZE.map((row, y) => row.map((cell, x) => (
          <div key={`${x}-${y}`} className={`rounded-xl flex items-center justify-center text-3xl md:text-5xl ${
            cell === 1 ? 'bg-orange-200' : 'bg-orange-50'
          }`}>
            {pos.x === x && pos.y === y && (
              <motion.span layoutId="player" className="filter drop-shadow-md">🏃</motion.span>
            )}
            {cell === 2 && '🍪'}
          </div>
        )))}
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-[300px] mx-auto">
        <div />
        <ControlButton icon={<ChevronUp />} onClick={() => move(0, -1)} />
        <div />
        <ControlButton icon={<ChevronLeft />} onClick={() => move(-1, 0)} />
        <ControlButton icon={<ChevronDown />} onClick={() => move(0, 1)} />
        <ControlButton icon={<ChevronRight />} onClick={() => move(1, 0)} />
      </div>

      {won && (
        <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-50">
          <div className="text-center p-12 bg-white rounded-[50px] shadow-2xl border-8 border-yellow-300">
            <span className="text-9xl mb-8 block animate-bounce">🍪</span>
            <h2 className="text-6xl font-title text-orange-600 mb-6">맛있게 냠냠!</h2>
            <button onClick={() => navigate('/')} className="bg-orange-500 text-white px-12 py-5 rounded-3xl font-title text-2xl shadow-xl">다른 길 찾기</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ControlButton({ icon, onClick }: { icon: any, onClick: () => void }) {
  return (
    <button onClick={onClick} className="h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center text-orange-500 hover:bg-orange-50 active:scale-90 transition-all border-b-4 border-gray-200">
      {React.cloneElement(icon, { size: 40 })}
    </button>
  );
}
