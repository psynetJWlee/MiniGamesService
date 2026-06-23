import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Volume2, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router';
import { GameShell } from '../components/GameShell';
import { ResultModal } from '../components/ResultModal';
import { shuffle } from '../lib/shuffle';
import { playCorrect, speak } from '../lib/sound';
import { burstSmall } from '../lib/celebrate';
import { starsForLower } from '../lib/scoring';
import { useWrongFeedback } from '../lib/useWrongFeedback';
import { useGameProgress } from '../lib/useGameProgress';

interface Animal {
  name: string;
  emoji: string;
  sound: string; // onomatopoeia spoken aloud
}

const ANIMALS: Animal[] = [
  { name: '강아지', emoji: '🐶', sound: '멍멍!' },
  { name: '고양이', emoji: '🐱', sound: '야옹!' },
  { name: '오리', emoji: '🦆', sound: '꽥꽥!' },
  { name: '사자', emoji: '🦁', sound: '어흥!' },
  { name: '코끼리', emoji: '🐘', sound: '뿌우~' },
  { name: '소', emoji: '🐮', sound: '음메~' },
  { name: '돼지', emoji: '🐷', sound: '꿀꿀!' },
  { name: '양', emoji: '🐑', sound: '매에~' },
  { name: '개구리', emoji: '🐸', sound: '개굴개굴!' },
  { name: '닭', emoji: '🐔', sound: '꼬끼오!' },
  { name: '부엉이', emoji: '🦉', sound: '부엉부엉!' },
  { name: '말', emoji: '🐴', sound: '히이잉!' },
];

interface Level {
  label: string;
  optionCount: number;
  questions: number;
  /** Max wrong taps for 3 / 2 stars (clearing always gives ≥1). */
  stars: { three: number; two: number };
}

const LEVELS: Level[] = [
  { label: '쉬워요', optionCount: 3, questions: 4, stars: { three: 0, two: 2 } },
  { label: '보통이에요', optionCount: 4, questions: 5, stars: { three: 1, two: 3 } },
  { label: '어려워요', optionCount: 4, questions: 6, stars: { three: 1, two: 4 } },
];

interface Question {
  animal: Animal;
  options: string[];
}

function buildRound(level: Level): Question[] {
  const chosen = shuffle(ANIMALS).slice(0, level.questions);
  return chosen.map((animal) => {
    const distractors = shuffle(ANIMALS.filter((a) => a.name !== animal.name))
      .slice(0, level.optionCount - 1)
      .map((a) => a.name);
    return { animal, options: shuffle([animal.name, ...distractors]) };
  });
}

export default function SoundGame() {
  const navigate = useNavigate();
  const wrong = useWrongFeedback();
  const { level, setLevel, submitResult } = useGameProgress('sounds');
  const levelIndex = Math.min(level, LEVELS.length - 1);
  const config = LEVELS[levelIndex];

  const [round, setRound] = useState<Question[]>(() => buildRound(config));
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  const quiz = round[current];

  const startRound = useMemo(
    () => (cfg: Level) => {
      setRound(buildRound(cfg));
      setCurrent(0);
      setSelected(null);
      setIsCorrect(null);
      setMistakes(0);
      setCleared(false);
    },
    [],
  );

  // Say the animal sound whenever a new question appears.
  useEffect(() => {
    if (quiz) speak(quiz.animal.sound);
  }, [current, quiz]);

  const handleSelect = (option: string) => {
    if (isCorrect) return;
    setSelected(option);
    const correct = option === quiz.animal.name;
    setIsCorrect(correct);

    if (!correct) {
      setMistakes((m) => m + 1);
      wrong.trigger();
      return;
    }

    playCorrect();
    burstSmall();
    setTimeout(() => {
      if (current < round.length - 1) {
        setCurrent((c) => c + 1);
        setSelected(null);
        setIsCorrect(null);
      } else {
        // Round finished — rate by total wrong taps.
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
      {current + 1}/{round.length}
    </div>
  );

  return (
    <GameShell
      title="누구의 소리일까요?"
      levelIndex={levelIndex}
      levelCount={LEVELS.length}
      status={status}
      onReset={() => startRound(config)}
      contentClassName="relative z-10 px-4 pt-28 pb-10 max-w-4xl mx-auto"
    >
      {wrong.overlay}

      <div className="bg-white rounded-[50px] p-10 md:p-12 shadow-2xl text-center mb-10 border-8 border-yellow-100">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => speak(quiz.animal.sound)}
          aria-label="동물 소리 듣기"
          className="relative w-44 h-44 bg-yellow-400 rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-xl"
        >
          {/* Animated sound waves */}
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute rounded-full border-4 border-yellow-300"
              style={{ width: '100%', height: '100%' }}
              animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
            />
          ))}
          <Volume2 size={72} />
        </motion.button>

        {/* Reveal the animal once answered correctly, else a question mark. */}
        <div className="text-7xl mb-2 h-20 flex items-center justify-center">
          {isCorrect ? (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
              {quiz.animal.emoji}
            </motion.span>
          ) : (
            <span className="text-gray-300">❓</span>
          )}
        </div>
        <p className="text-4xl font-title text-gray-700">"{quiz.animal.sound}"</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {quiz.options.map((option) => {
          const isPicked = selected === option;
          const isAnswer = option === quiz.animal.name;
          return (
            <button
              key={option}
              disabled={isCorrect === true}
              onClick={() => handleSelect(option)}
              className={`p-7 rounded-[30px] text-3xl font-title transition-all shadow-lg flex items-center justify-between ${
                isPicked
                  ? isAnswer
                    ? 'bg-green-500 text-white scale-105'
                    : 'bg-red-500 text-white scale-95'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {option}
              {isPicked && (isAnswer ? <CheckCircle2 size={40} /> : <XCircle size={40} />)}
            </button>
          );
        })}
      </div>

      <ResultModal
        open={cleared}
        stars={earnedStars}
        title="모두 다 맞췄어요!"
        subtitle={`소리 박사 가온이 시온이! (틀린 횟수 ${mistakes})`}
        hasNextLevel={levelIndex < LEVELS.length - 1}
        onNext={goNextLevel}
        onRetry={() => startRound(config)}
        onHome={() => navigate('/')}
      />
    </GameShell>
  );
}
