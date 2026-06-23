import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import confetti from 'canvas-confetti';

const HIDDEN_ITEMS = [
  { id: 'star', emoji: '★', name: '별', x: 20, y: 30 },
  { id: 'apple', emoji: '🍎', name: '사과', x: 75, y: 45 },
  { id: 'car', emoji: '🚗', name: '자동차', x: 40, y: 80 },
];

export default function HiddenGame() {
  const navigate = useNavigate();
  const [found, setFound] = useState<string[]>([]);

  const handleFind = (id: string) => {
    if (!found.includes(id)) {
      setFound([...found, id]);
      confetti({ particleCount: 50, spread: 60 });
      if (found.length + 1 === HIDDEN_ITEMS.length) {
        confetti({ particleCount: 200, spread: 90 });
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-kids">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => navigate('/')} className="p-4 bg-white rounded-2xl shadow-md text-orange-500"><ArrowLeft size={32} /></button>
        <div className="flex gap-4">
          {HIDDEN_ITEMS.map(item => (
            <div key={item.id} className={`p-4 rounded-2xl border-4 transition-all ${found.includes(item.id) ? 'bg-green-100 border-green-500 scale-90 opacity-50' : 'bg-white border-yellow-400'}`}>
              <span className="text-3xl">{item.emoji}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative aspect-video rounded-[50px] overflow-hidden shadow-2xl border-8 border-white">
        <ImageWithFallback 
          src="https://images.unsplash.com/photo-1724421815419-21f4c87c259b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg"
          alt="Hidden objects landscape"
          className="w-full h-full object-cover"
        />
        
        {HIDDEN_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => handleFind(item.id)}
            className="absolute w-20 h-20 flex items-center justify-center transition-all"
            style={{ left: `${item.x}%`, top: `${item.y}%`, opacity: found.includes(item.id) ? 1 : 0.01 }}
          >
            <span className={`text-4xl ${found.includes(item.id) ? 'animate-bounce' : ''}`}>{item.emoji}</span>
            {found.includes(item.id) && <div className="absolute inset-0 border-4 border-green-500 rounded-full" />}
          </button>
        ))}
      </div>

      {found.length === HIDDEN_ITEMS.length && (
        <div className="mt-12 text-center">
          <h2 className="text-5xl font-title text-orange-600 mb-6">모두 다 찾았어요! 대단해요!</h2>
          <button onClick={() => navigate('/')} className="bg-orange-500 text-white px-12 py-5 rounded-3xl font-title text-2xl">홈으로 가기</button>
        </div>
      )}
    </div>
  );
}
