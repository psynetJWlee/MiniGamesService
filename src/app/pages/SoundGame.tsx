import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Play, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router';
import confetti from 'canvas-confetti';

const SOUND_QUIZ = [
  { id: 1, sound: '🐶', name: '강아지', hint: '멍멍!', options: ['강아지', '고양이', '오리'] },
  { id: 2, sound: '🐱', name: '고양이', hint: '야옹!', options: ['호랑이', '고양이', '사자'] },
  { id: 3, sound: '🐤', name: '오리', hint: '꽥꽥!', options: ['오리', '닭', '참새'] },
  { id: 4, sound: '🦁', name: '사자', hint: '어흥!', options: ['곰', '사자', '원숭이'] },
  { id: 5, sound: '🐘', name: '코끼리', hint: '뿌우~', options: ['하마', '기린', '코끼리'] },
];

export default function SoundGame() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const quiz = SOUND_QUIZ[current];

  const handleSelect = (option: string) => {
    setSelected(option);
    const correct = option === quiz.name;
    setIsCorrect(correct);
    if (correct) {
      confetti({ particleCount: 50, spread: 60 });
      setTimeout(() => {
        if (current < SOUND_QUIZ.length - 1) {
          setCurrent(current + 1);
          setSelected(null);
          setIsCorrect(null);
        }
      }, 1500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 font-kids">
      <div className="flex justify-between items-center mb-16">
        <button onClick={() => navigate('/')} className="p-4 bg-white rounded-2xl shadow-md text-orange-500 hover:scale-110">
          <ArrowLeft size={32} />
        </button>
        <h2 className="text-4xl font-title text-orange-600">누구의 소리일까요?</h2>
        <div className="w-16" />
      </div>

      <div className="bg-white rounded-[50px] p-12 shadow-2xl text-center mb-12 border-8 border-yellow-100">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-48 h-48 bg-yellow-400 rounded-full flex items-center justify-center text-white mx-auto mb-8 shadow-xl"
        >
          <Play size={80} fill="currentColor" />
        </motion.button>
        <p className="text-5xl font-title text-gray-700">"{quiz.hint}"</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quiz.options.map((option) => (
          <button
            key={option}
            disabled={isCorrect === true}
            onClick={() => handleSelect(option)}
            className={`p-8 rounded-[30px] text-3xl font-title transition-all shadow-lg flex items-center justify-between ${
              selected === option
                ? option === quiz.name
                  ? 'bg-green-500 text-white scale-105'
                  : 'bg-red-500 text-white scale-95'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {option}
            {selected === option && (
              option === quiz.name ? <CheckCircle2 size={40} /> : <XCircle size={40} />
            )}
          </button>
        ))}
      </div>

      {current === SOUND_QUIZ.length - 1 && isCorrect && (
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-16 text-center">
          <h3 className="text-4xl font-title text-green-600 mb-6">모두 다 맞췄어요! 최고!</h3>
          <button onClick={() => navigate('/')} className="bg-orange-500 text-white px-12 py-5 rounded-3xl font-title text-2xl shadow-xl">다른 놀이 하러 가기</button>
        </motion.div>
      )}
    </div>
  );
}
