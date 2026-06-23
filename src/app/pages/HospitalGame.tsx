import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Thermometer, Bandage, Pill } from 'lucide-react';
import { useNavigate } from 'react-router';
import confetti from 'canvas-confetti';

const PATIENTS = [
  { id: 'cat', emoji: '🐱', name: '고냥이', symptom: '열이 나요', tool: 'thermometer' },
  { id: 'dog', emoji: '🐶', name: '댕댕이', symptom: '아야 했어요', tool: 'bandage' },
  { id: 'rabbit', emoji: '🐰', name: '토끼', symptom: '기침을 해요', tool: 'pill' },
];

export default function HospitalGame() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [solved, setSolved] = useState<string[]>([]);
  const patient = PATIENTS[current];

  const handleTreat = (tool: string) => {
    if (tool === patient.tool) {
      setSolved([...solved, patient.id]);
      confetti({ particleCount: 50, spread: 60 });
      setTimeout(() => {
        if (current < PATIENTS.length - 1) {
          setCurrent(current + 1);
        }
      }, 1500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 font-kids">
      <div className="flex justify-between items-center mb-16">
        <button onClick={() => navigate('/')} className="p-4 bg-white rounded-2xl shadow-md text-orange-500"><ArrowLeft size={32} /></button>
        <h2 className="text-4xl font-title text-orange-600">동물 병원 놀이</h2>
        <div className="w-16" />
      </div>

      <div className="bg-white rounded-[60px] p-12 shadow-2xl flex flex-col md:flex-row items-center gap-12 border-8 border-blue-100 mb-16">
        <motion.div 
          animate={solved.includes(patient.id) ? { scale: [1, 1.2, 1] } : {}}
          className="text-9xl md:text-[12rem] bg-blue-50 rounded-[40px] p-8"
        >
          {patient.emoji}
        </motion.div>
        <div className="text-center md:text-left">
          <h3 className="text-5xl font-title text-gray-800 mb-4">{patient.name}</h3>
          <p className="text-4xl font-body text-red-500 font-bold">"{patient.symptom}"</p>
          {solved.includes(patient.id) && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl text-green-600 mt-4 font-title">고마워요! 다 나았어요! ❤️</motion.p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <ToolButton icon={<Thermometer size={50} />} label="온도 재기" onClick={() => handleTreat('thermometer')} color="bg-yellow-400" />
        <ToolButton icon={<Bandage size={50} />} label="밴드 붙이기" onClick={() => handleTreat('bandage')} color="bg-pink-400" />
        <ToolButton icon={<Pill size={50} />} label="물약 주기" onClick={() => handleTreat('pill')} color="bg-blue-400" />
      </div>

      {solved.length === PATIENTS.length && (
        <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-50">
          <div className="text-center p-12 bg-white rounded-[50px] shadow-2xl border-8 border-green-300">
            <span className="text-9xl mb-8 block">👩‍⚕️</span>
            <h2 className="text-6xl font-title text-orange-600 mb-6">최고의 의사선생님!</h2>
            <button onClick={() => navigate('/')} className="bg-orange-500 text-white px-12 py-5 rounded-3xl font-title text-2xl">병원 문 닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolButton({ icon, label, onClick, color }: any) {
  return (
    <button onClick={onClick} className={`${color} text-white p-8 rounded-[40px] shadow-xl hover:scale-105 active:scale-95 transition-all flex flex-col items-center gap-4`}>
      {icon}
      <span className="text-2xl font-title">{label}</span>
    </button>
  );
}
