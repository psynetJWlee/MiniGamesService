import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { GameShell } from '../components/GameShell';
import { ResultModal } from '../components/ResultModal';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { shuffle } from '../lib/shuffle';
import { playCorrect } from '../lib/sound';
import { burstSmall } from '../lib/celebrate';
import { starsForLower } from '../lib/scoring';
import { useWrongFeedback } from '../lib/useWrongFeedback';
import { useGameProgress } from '../lib/useGameProgress';

interface Country {
  code: string; // ISO-3166 alpha-2, lowercase (flagcdn)
  name: string;
}

const COUNTRIES: Country[] = [
  { code: 'kr', name: '대한민국' },
  { code: 'jp', name: '일본' },
  { code: 'cn', name: '중국' },
  { code: 'us', name: '미국' },
  { code: 'gb', name: '영국' },
  { code: 'fr', name: '프랑스' },
  { code: 'de', name: '독일' },
  { code: 'it', name: '이탈리아' },
  { code: 'es', name: '스페인' },
  { code: 'ca', name: '캐나다' },
  { code: 'br', name: '브라질' },
  { code: 'au', name: '호주' },
  { code: 'in', name: '인도' },
  { code: 'ru', name: '러시아' },
  { code: 'mx', name: '멕시코' },
  { code: 'ch', name: '스위스' },
  { code: 'se', name: '스웨덴' },
  { code: 'nl', name: '네덜란드' },
  { code: 'gr', name: '그리스' },
  { code: 'th', name: '태국' },
  { code: 'vn', name: '베트남' },
  { code: 'eg', name: '이집트' },
  { code: 'za', name: '남아프리카공화국' },
  { code: 'tr', name: '튀르키예' },
];

const flagUrl = (code: string) => `https://flagcdn.com/w320/${code}.png`;

interface Level {
  label: string;
  options: number;
  questions: number;
  stars: { three: number; two: number };
}

const LEVELS: Level[] = [
  { label: '쉬워요', options: 3, questions: 5, stars: { three: 0, two: 2 } },
  { label: '보통이에요', options: 4, questions: 5, stars: { three: 1, two: 3 } },
  { label: '어려워요', options: 5, questions: 6, stars: { three: 1, two: 4 } },
];

interface Question {
  country: Country;
  options: string[];
}

function buildRound(level: Level): Question[] {
  const chosen = shuffle(COUNTRIES).slice(0, level.questions);
  return chosen.map((country) => {
    const distractors = shuffle(COUNTRIES.filter((c) => c.code !== country.code))
      .slice(0, level.options - 1)
      .map((c) => c.name);
    return { country, options: shuffle([country.name, ...distractors]) };
  });
}

export default function FlagGame() {
  const navigate = useNavigate();
  const wrong = useWrongFeedback();
  const { level, setLevel, submitResult } = useGameProgress('flags');
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

  const handleSelect = (name: string) => {
    if (isCorrect) return;
    setSelected(name);
    const correct = name === quiz.country.name;
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
        const stars = starsForLower(mistakes, config.stars);
        setEarnedStars(stars);
        submitResult({ stars, level: levelIndex });
        setCleared(true);
      }
    }, 1200);
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
      title="국기 맞추기"
      levelIndex={levelIndex}
      levelCount={LEVELS.length}
      status={status}
      onReset={() => startRound(config)}
      contentClassName="relative z-10 px-4 pt-28 pb-10 max-w-3xl mx-auto"
    >
      {wrong.overlay}

      {/* Flag */}
      <div className="bg-white rounded-[50px] p-8 md:p-10 shadow-2xl text-center mb-8 border-8 border-yellow-100">
        <motion.div
          key={current}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-auto mb-5 w-[280px] max-w-full rounded-2xl overflow-hidden shadow-lg border-4 border-gray-100"
        >
          <ImageWithFallback
            src={flagUrl(quiz.country.code)}
            alt="국기"
            className="w-full h-auto block"
          />
        </motion.div>
        <p className="text-3xl font-title text-gray-700">이 나라는 어디일까요?</p>
      </div>

      {/* Options */}
      <div className={`grid gap-4 ${config.options >= 4 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        {quiz.options.map((option) => {
          const isPicked = selected === option;
          const isAnswer = option === quiz.country.name;
          return (
            <button
              key={option}
              disabled={isCorrect === true}
              onClick={() => handleSelect(option)}
              className={`py-5 rounded-[26px] text-2xl md:text-3xl font-title shadow-lg transition-all ${
                isPicked
                  ? isAnswer
                    ? 'bg-green-500 text-white scale-105'
                    : 'bg-red-500 text-white scale-95'
                  : 'bg-white text-gray-700 hover:bg-gray-50 active:scale-95'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>

      <ResultModal
        open={cleared}
        stars={earnedStars}
        title="국기 박사님!"
        subtitle={`${round.length}개 나라 완료! (틀린 횟수 ${mistakes})`}
        hasNextLevel={levelIndex < LEVELS.length - 1}
        onNext={goNextLevel}
        onRetry={() => startRound(config)}
        onHome={() => navigate('/')}
      />
    </GameShell>
  );
}
