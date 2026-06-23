import { useState } from 'react';
import { motion } from 'motion/react';
import { Thermometer, Bandage, Pill, Syringe } from 'lucide-react';
import { useNavigate } from 'react-router';
import { GameShell } from '../components/GameShell';
import { ResultModal } from '../components/ResultModal';
import { shuffle } from '../lib/shuffle';
import { playCorrect } from '../lib/sound';
import { burstSmall } from '../lib/celebrate';
import { starsForLower } from '../lib/scoring';
import { useWrongFeedback } from '../lib/useWrongFeedback';
import { useGameProgress } from '../lib/useGameProgress';

type ToolId = 'thermometer' | 'bandage' | 'pill' | 'injection';

const TOOLS: { id: ToolId; label: string; icon: typeof Thermometer; color: string }[] = [
  { id: 'thermometer', label: '온도 재기', icon: Thermometer, color: 'bg-yellow-400' },
  { id: 'bandage', label: '밴드 붙이기', icon: Bandage, color: 'bg-pink-400' },
  { id: 'pill', label: '물약 주기', icon: Pill, color: 'bg-blue-400' },
  { id: 'injection', label: '주사 놓기', icon: Syringe, color: 'bg-green-400' },
];

interface Patient {
  emoji: string;
  name: string;
  symptom: string;
  tool: ToolId;
}

const PATIENTS: Patient[] = [
  { emoji: '🐱', name: '고냥이', symptom: '열이 나요', tool: 'thermometer' },
  { emoji: '🐶', name: '댕댕이', symptom: '아야 했어요', tool: 'bandage' },
  { emoji: '🐰', name: '토끼', symptom: '기침을 해요', tool: 'pill' },
  { emoji: '🐻', name: '곰돌이', symptom: '예방 주사 맞을래요', tool: 'injection' },
  { emoji: '🐷', name: '꿀꿀이', symptom: '이마가 뜨거워요', tool: 'thermometer' },
  { emoji: '🦆', name: '꽥꽥이', symptom: '무릎이 까졌어요', tool: 'bandage' },
  { emoji: '🐸', name: '개굴이', symptom: '콜록콜록 해요', tool: 'pill' },
  { emoji: '🐧', name: '뚱뚱이', symptom: '주사가 필요해요', tool: 'injection' },
];

interface Level {
  label: string;
  count: number;
  tools: ToolId[];
  stars: { three: number; two: number };
}

const LEVELS: Level[] = [
  { label: '쉬워요', count: 3, tools: ['thermometer', 'bandage', 'pill'], stars: { three: 0, two: 2 } },
  { label: '보통이에요', count: 5, tools: ['thermometer', 'bandage', 'pill', 'injection'], stars: { three: 1, two: 3 } },
  { label: '어려워요', count: 7, tools: ['thermometer', 'bandage', 'pill', 'injection'], stars: { three: 1, two: 4 } },
];

function buildRound(level: Level): Patient[] {
  const allowed = PATIENTS.filter((p) => level.tools.includes(p.tool));
  return shuffle(allowed).slice(0, level.count);
}

export default function HospitalGame() {
  const navigate = useNavigate();
  const wrong = useWrongFeedback();
  const { level, setLevel, submitResult } = useGameProgress('hospital');
  const levelIndex = Math.min(level, LEVELS.length - 1);
  const config = LEVELS[levelIndex];

  const [patients, setPatients] = useState<Patient[]>(() => buildRound(config));
  const [current, setCurrent] = useState(0);
  const [healed, setHealed] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  const patient = patients[current];
  const toolButtons = TOOLS.filter((t) => config.tools.includes(t.id));

  const startRound = (cfg: Level) => {
    setPatients(buildRound(cfg));
    setCurrent(0);
    setHealed(false);
    setMistakes(0);
    setCleared(false);
  };

  const handleTreat = (tool: ToolId) => {
    if (healed) return;
    if (tool !== patient.tool) {
      setMistakes((m) => m + 1);
      wrong.trigger();
      return;
    }

    setHealed(true);
    playCorrect();
    burstSmall();
    setTimeout(() => {
      if (current < patients.length - 1) {
        setCurrent((c) => c + 1);
        setHealed(false);
      } else {
        const stars = starsForLower(mistakes, config.stars);
        setEarnedStars(stars);
        submitResult({ stars, level: levelIndex });
        setCleared(true);
      }
    }, 1400);
  };

  const goNextLevel = () => {
    const next = Math.min(levelIndex + 1, LEVELS.length - 1);
    setLevel(next);
    startRound(LEVELS[next]);
  };

  const status = (
    <div className="bg-white/90 px-4 py-2 rounded-2xl shadow-md text-orange-500 font-title text-xl">
      {current + 1}/{patients.length}
    </div>
  );

  return (
    <GameShell
      title="동물 병원 놀이"
      levelIndex={levelIndex}
      levelCount={LEVELS.length}
      status={status}
      onReset={() => startRound(config)}
      contentClassName="relative z-10 px-4 pt-28 pb-10 max-w-4xl mx-auto"
    >
      {wrong.overlay}

      <div className="bg-white rounded-[60px] p-10 md:p-12 shadow-2xl flex flex-col md:flex-row items-center gap-10 border-8 border-blue-100 mb-12">
        <motion.div
          animate={healed ? { scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] } : {}}
          transition={{ duration: 0.6 }}
          className="text-8xl md:text-[11rem] bg-blue-50 rounded-[40px] p-8"
        >
          {patient.emoji}
        </motion.div>
        <div className="text-center md:text-left">
          <h3 className="text-5xl font-title text-gray-800 mb-4">{patient.name}</h3>
          <p className="text-3xl md:text-4xl font-body text-red-500 font-bold">"{patient.symptom}"</p>
          {healed && (
            <motion.p
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-3xl text-green-600 mt-4 font-title"
            >
              고마워요! 다 나았어요! ❤️
            </motion.p>
          )}
        </div>
      </div>

      <div className={`grid gap-5 ${toolButtons.length >= 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3'}`}>
        {toolButtons.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => handleTreat(t.id)}
              className={`${t.color} text-white p-7 rounded-[40px] shadow-xl hover:scale-105 active:scale-95 transition-all flex flex-col items-center gap-3`}
            >
              <Icon size={48} />
              <span className="text-xl md:text-2xl font-title">{t.label}</span>
            </button>
          );
        })}
      </div>

      <ResultModal
        open={cleared}
        stars={earnedStars}
        title="최고의 의사 선생님!"
        subtitle={`동물 친구들이 다 나았어요! (틀린 횟수 ${mistakes})`}
        hasNextLevel={levelIndex < LEVELS.length - 1}
        onNext={goNextLevel}
        onRetry={() => startRound(config)}
        onHome={() => navigate('/')}
      />
    </GameShell>
  );
}
