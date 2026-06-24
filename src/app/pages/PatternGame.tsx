import { Fragment, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowDown } from 'lucide-react';
import { useNavigate } from 'react-router';
import { GameShell } from '../components/GameShell';
import { ResultModal } from '../components/ResultModal';
import { shuffle } from '../lib/shuffle';
import { playCorrect } from '../lib/sound';
import { burstSmall } from '../lib/celebrate';
import { starsForLower } from '../lib/scoring';
import { useWrongFeedback } from '../lib/useWrongFeedback';
import { useGameProgress } from '../lib/useGameProgress';

const ri = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Emoji sets used for repeating patterns. Distractors come from the same set
// so the choice is a real pattern question, not "spot the odd emoji".
const SYMBOL_SETS = [
  ['🔴', '🔵', '🟡', '🟢', '🟣', '🟠'],
  ['🐶', '🐱', '🐰', '🦁', '🐼', '🐸'],
  ['🍎', '🍌', '🍇', '🍓', '🍊', '🍉'],
  ['⭐', '🌙', '☀️', '❤️', '⚡', '🌈'],
];
const JAMO = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ'];
const GANADA = ['가', '나', '다', '라', '마', '바', '사', '아', '자', '차', '카', '타'];

interface Question {
  tokens: (string | null)[]; // null = the blank (❓)
  answer: string;
  options: string[];
  story?: boolean; // text-story question (rendered as cards, not tiles)
}

type PatternType = 'ab' | 'midAB' | 'abc' | 'aabb' | 'countUp' | 'skip' | 'countDown' | 'hangul' | 'story';

// Hand-authored cause-and-effect / sequence stories. Each story's full steps
// are correct; one step is hidden and the child picks what belongs there.
const STORIES: { steps: string[]; blank: number; distractors: string[] }[] = [
  { steps: ['씨앗을 심어요', '물을 줘요', '싹이 나와요', '꽃이 피어요'], blank: 3, distractors: ['잠을 자요', '자동차를 타요'] },
  { steps: ['알을 낳아요', '알이 따뜻해요', '알이 깨져요', '병아리가 나와요'], blank: 3, distractors: ['눈이 내려요', '풍선이 날아가요'] },
  { steps: ['배가 고파요', '밥을 먹어요', '배가 불러요'], blank: 2, distractors: ['더 배고파요', '신발을 신어요'] },
  { steps: ['손이 더러워요', '비누로 씻어요', '손이 깨끗해요'], blank: 2, distractors: ['손이 더 더러워요', '노래를 불러요'] },
  { steps: ['졸려요', '이를 닦아요', '잠을 자요', '아침에 일어나요'], blank: 3, distractors: ['더 졸려요', '공을 차요'] },
  { steps: ['눈사람을 만들어요', '해가 쨍쨍 떠요', '눈사람이 녹아요'], blank: 2, distractors: ['눈사람이 더 커져요', '비행기가 날아요'] },
  { steps: ['풍선에 바람을 넣어요', '풍선이 점점 커져요', '펑! 터져요'], blank: 2, distractors: ['풍선이 작아져요', '잠이 들어요'] },
  { steps: ['비가 내려요', '해가 나와요', '무지개가 떠요'], blank: 2, distractors: ['눈이 쌓여요', '불이 나요'] },
  { steps: ['반죽을 만들어요', '오븐에 넣어요', '빵이 구워져요'], blank: 2, distractors: ['반죽이 사라져요', '물에 빠져요'] },
  { steps: ['얼음을 꺼내요', '따뜻해져요', '물이 돼요'], blank: 2, distractors: ['더 단단해져요', '하늘로 날아가요'] },
  { steps: ['넘어졌어요', '아야 울어요', '약을 발라요', '다 나았어요'], blank: 3, distractors: ['더 아파요', '춤을 춰요'] },
  { steps: ['양치를 안 했어요', '이가 아파요', '치과에 가요'], blank: 2, distractors: ['이가 튼튼해요', '사탕을 더 먹어요'] },
];

interface Level {
  label: string;
  questions: number;
  options: number;
  types: PatternType[];
  stars: { three: number; two: number };
}

const LEVELS: Level[] = [
  { label: '쉬워요', questions: 5, options: 3, types: ['ab'], stars: { three: 0, two: 2 } },
  { label: '보통이에요', questions: 5, options: 4, types: ['ab', 'abc', 'countUp'], stars: { three: 1, two: 3 } },
  {
    label: '어려워요',
    questions: 6,
    options: 4,
    types: ['abc', 'aabb', 'skip', 'countDown', 'hangul', 'midAB'],
    stars: { three: 1, two: 4 },
  },
  {
    label: '이야기 순서',
    questions: 5,
    options: 3,
    types: ['story'],
    stars: { three: 0, two: 2 },
  },
];

function pickSet() {
  return SYMBOL_SETS[ri(0, SYMBOL_SETS.length - 1)];
}

function symbolOptions(answer: string, set: string[], count: number): string[] {
  const pool = set.filter((s) => s !== answer);
  return shuffle([answer, ...shuffle(pool).slice(0, count - 1)]);
}

function numberOptions(answer: number, count: number): string[] {
  const opts = new Set<number>([answer]);
  while (opts.size < count) {
    const v = answer + ri(1, count) * (Math.random() < 0.5 ? -1 : 1);
    if (v >= 0) opts.add(v);
  }
  return shuffle([...opts]).map(String);
}

// Build a question from a cyclic emoji pattern.
function cyclic(set: string[], full: string[], blankPos: number, options: number): Question {
  const answer = full[blankPos];
  return { tokens: full.map((t, i) => (i === blankPos ? null : t)), answer, options: symbolOptions(answer, set, options) };
}

function makeQuestion(level: Level): Question {
  const type = level.types[ri(0, level.types.length - 1)];
  const opt = level.options;

  if (type === 'story') {
    const s = STORIES[ri(0, STORIES.length - 1)];
    const answer = s.steps[s.blank];
    return {
      tokens: s.steps.map((step, i) => (i === s.blank ? null : step)),
      answer,
      options: shuffle([answer, ...s.distractors]),
      story: true,
    };
  }
  if (type === 'ab' || type === 'midAB') {
    const set = pickSet();
    const [a, b] = shuffle(set);
    const full = [a, b, a, b, a];
    const blankPos = type === 'midAB' ? 2 : 4;
    return cyclic(set, full, blankPos, opt);
  }
  if (type === 'abc') {
    const set = pickSet();
    const [a, b, c] = shuffle(set);
    return cyclic(set, [a, b, c, a, b, c], 5, opt);
  }
  if (type === 'aabb') {
    const set = pickSet();
    const [a, b] = shuffle(set);
    return cyclic(set, [a, a, b, b, a], 4, opt);
  }
  if (type === 'hangul') {
    const list = Math.random() < 0.5 ? JAMO : GANADA;
    const start = ri(0, list.length - 5);
    const full = [list[start], list[start + 1], list[start + 2], list[start + 3]];
    const answer = list[start + 3];
    const pool = list.filter((x) => x !== answer);
    return { tokens: [full[0], full[1], full[2], null], answer, options: shuffle([answer, ...shuffle(pool).slice(0, opt - 1)]) };
  }

  // number patterns
  let step = 1;
  let descending = false;
  if (type === 'skip') step = ri(2, 3);
  if (type === 'countDown') {
    descending = true;
    step = ri(1, 2);
  }
  const len = 5;
  const start = descending ? ri(len * step, len * step + 9) : ri(0, 9);
  const s = descending ? -step : step;
  const nums = Array.from({ length: len }, (_, i) => start + i * s);
  const answer = nums[len - 1];
  return {
    tokens: nums.map((v, i) => (i === len - 1 ? null : String(v))),
    answer: String(answer),
    options: numberOptions(answer, opt),
  };
}

function buildRound(level: Level): Question[] {
  return Array.from({ length: level.questions }, () => makeQuestion(level));
}

export default function PatternGame() {
  const navigate = useNavigate();
  const wrong = useWrongFeedback();
  const { level, setLevel, submitResult } = useGameProgress('pattern');
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

  const handleSelect = (value: string) => {
    if (isCorrect) return;
    setSelected(value);
    const correct = value === quiz.answer;
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
    }, 1100);
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
      title="패턴 찾기"
      levelIndex={levelIndex}
      levelCount={LEVELS.length}
      status={status}
      onReset={() => startRound(config)}
      contentClassName="relative z-10 px-4 pt-28 pb-10 max-w-3xl mx-auto"
    >
      {wrong.overlay}

      {/* Pattern sequence */}
      <div className="bg-white rounded-[50px] p-8 md:p-10 shadow-2xl text-center mb-8 border-8 border-yellow-100">
        <p className="text-2xl font-title text-gray-500 mb-6">❓ 에 들어갈 것은?</p>
        {quiz.story ? (
          <motion.div key={current} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-2">
            {quiz.tokens.map((tok, i) => (
              <Fragment key={i}>
                <div
                  className={`w-full max-w-sm py-4 px-5 rounded-3xl text-2xl md:text-3xl font-title ${
                    tok === null
                      ? 'bg-yellow-200 border-4 border-dashed border-yellow-400 text-yellow-600'
                      : 'bg-orange-50 text-gray-700'
                  }`}
                >
                  {tok === null ? '❓' : tok}
                </div>
                {i < quiz.tokens.length - 1 && <ArrowDown className="text-orange-300" size={28} />}
              </Fragment>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center flex-wrap gap-2 md:gap-3"
          >
            {quiz.tokens.map((tok, i) => (
              <div
                key={i}
                className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-4xl md:text-5xl font-title ${
                  tok === null ? 'bg-yellow-200 border-4 border-dashed border-yellow-400 text-yellow-600' : 'bg-gray-50'
                }`}
              >
                {tok === null ? '❓' : tok}
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Options */}
      <div className={quiz.story ? 'flex flex-col gap-3' : `grid gap-4 ${config.options >= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {quiz.options.map((option) => {
          const isPicked = selected === option;
          const isAnswer = option === quiz.answer;
          return (
            <button
              key={option}
              disabled={isCorrect === true}
              onClick={() => handleSelect(option)}
              className={`shadow-lg transition-all font-title ${
                quiz.story ? 'py-5 rounded-[26px] text-2xl md:text-3xl' : 'py-6 rounded-[26px] text-4xl md:text-5xl'
              } ${
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
        title="패턴 박사님!"
        subtitle={`규칙을 척척 찾았어요! (틀린 횟수 ${mistakes})`}
        hasNextLevel={levelIndex < LEVELS.length - 1}
        onNext={goNextLevel}
        onRetry={() => startRound(config)}
        onHome={() => navigate('/')}
      />
    </GameShell>
  );
}
