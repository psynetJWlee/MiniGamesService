import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { GameShell } from '../components/GameShell';
import { ResultModal } from '../components/ResultModal';
import { shuffle } from '../lib/shuffle';
import { playPop } from '../lib/sound';
import { burstSmall } from '../lib/celebrate';
import { starsForLower } from '../lib/scoring';
import { useWrongFeedback } from '../lib/useWrongFeedback';
import { useGameProgress } from '../lib/useGameProgress';
import { compose, decompose } from '../lib/hangul';

// Palette pools — only simple jamo (no doubles / complex vowels) so the words
// below decompose into easy, kid-friendly choices.
const SIMPLE_CONS = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const SIMPLE_VOWELS = ['ㅏ', 'ㅐ', 'ㅓ', 'ㅔ', 'ㅗ', 'ㅜ', 'ㅡ', 'ㅣ', 'ㅑ', 'ㅕ', 'ㅛ', 'ㅠ'];

interface Word {
  text: string;
  emoji: string;
}

interface Level {
  label: string;
  words: Word[];
  stars: { three: number; two: number };
}

// Every word is 받침-free and uses only the simple jamo above.
const LEVELS: Level[] = [
  {
    label: '한 글자',
    stars: { three: 0, two: 2 },
    words: [
      { text: '코', emoji: '🐽' },
      { text: '소', emoji: '🐮' },
      { text: '차', emoji: '🚗' },
      { text: '배', emoji: '🍐' },
      { text: '해', emoji: '☀️' },
      { text: '비', emoji: '🌧️' },
      { text: '무', emoji: '🥬' },
      { text: '새', emoji: '🐤' },
      { text: '게', emoji: '🦀' },
    ],
  },
  {
    label: '두 글자',
    stars: { three: 1, two: 3 },
    words: [
      { text: '나비', emoji: '🦋' },
      { text: '모자', emoji: '🧢' },
      { text: '우유', emoji: '🥛' },
      { text: '바지', emoji: '👖' },
      { text: '포도', emoji: '🍇' },
      { text: '오리', emoji: '🦆' },
      { text: '거미', emoji: '🕷️' },
      { text: '다리', emoji: '🦵' },
      { text: '가지', emoji: '🍆' },
    ],
  },
  {
    label: '세 글자',
    stars: { three: 1, two: 4 },
    words: [
      { text: '바나나', emoji: '🍌' },
      { text: '너구리', emoji: '🦝' },
      { text: '고구마', emoji: '🍠' },
      { text: '라디오', emoji: '📻' },
      { text: '도토리', emoji: '🌰' },
      { text: '무지개', emoji: '🌈' },
    ],
  },
];

interface JamoStep {
  char: string;
  vowel: boolean;
}

// Flatten a word into its jamo sequence (cho, jung per syllable — no 받침).
function toSequence(text: string): JamoStep[] {
  const seq: JamoStep[] = [];
  for (const ch of text) {
    const parts = decompose(ch);
    if (!parts) continue;
    seq.push({ char: parts.cho, vowel: false });
    seq.push({ char: parts.jung, vowel: true });
  }
  return seq;
}

// Compose the jamo placed so far back into readable text (last lone consonant
// shows on its own while waiting for its vowel).
function buildText(placed: string[]): string {
  let out = '';
  for (let i = 0; i < placed.length; i += 2) {
    out += i + 1 < placed.length ? compose(placed[i], placed[i + 1]) : placed[i];
  }
  return out;
}

export default function HangulGame() {
  const navigate = useNavigate();
  const wrong = useWrongFeedback();
  const { level, setLevel, submitResult } = useGameProgress('hangul');
  const levelIndex = Math.min(level, LEVELS.length - 1);
  const config = LEVELS[levelIndex];

  const [word, setWord] = useState<Word>(() => config.words[Math.floor(Math.random() * config.words.length)]);
  const [placed, setPlaced] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  const seq = useMemo(() => toSequence(word.text), [word.text]);
  const expected = seq[placed.length] as JamoStep | undefined;

  // Palette for the current step — correct jamo + same-type distractors.
  // Regenerates only when the step (or word) changes.
  const palette = useMemo(() => {
    const step = seq[placed.length];
    if (!step) return [];
    const pool = (step.vowel ? SIMPLE_VOWELS : SIMPLE_CONS).filter((j) => j !== step.char);
    return shuffle([step.char, ...shuffle(pool).slice(0, 5)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.text, placed.length]);

  const startRound = (cfg: Level) => {
    setWord(cfg.words[Math.floor(Math.random() * cfg.words.length)]);
    setPlaced([]);
    setMistakes(0);
    setCleared(false);
  };

  const handleJamo = (jamo: string) => {
    if (!expected) return;
    if (jamo !== expected.char) {
      setMistakes((m) => m + 1);
      wrong.trigger();
      return;
    }
    playPop();
    const next = [...placed, jamo];
    setPlaced(next);
    if (next.length === seq.length) {
      burstSmall();
      const stars = starsForLower(mistakes, config.stars);
      setEarnedStars(stars);
      submitResult({ stars, level: levelIndex });
      setTimeout(() => setCleared(true), 700);
    }
  };

  const goNextLevel = () => {
    const next = Math.min(levelIndex + 1, LEVELS.length - 1);
    setLevel(next);
    startRound(LEVELS[next]);
  };

  const built = buildText(placed);

  return (
    <GameShell
      title="한글 만들기"
      levelIndex={levelIndex}
      levelCount={LEVELS.length}
      onReset={() => startRound(config)}
      contentClassName="relative z-10 px-4 pt-28 pb-10 max-w-3xl mx-auto"
    >
      {wrong.overlay}

      {/* Target word + meaning */}
      <div className="bg-white rounded-[50px] p-8 md:p-10 shadow-2xl text-center mb-8 border-8 border-yellow-100">
        <div className="text-7xl mb-3">{word.emoji}</div>
        <p className="text-2xl font-body text-gray-400 mb-4">이 글자를 만들어 보아요</p>
        {/* faint guide */}
        <p className="text-5xl font-title text-gray-300 mb-4 tracking-widest">{word.text}</p>
        {/* what the child has built so far */}
        <div className="min-h-[72px] flex items-center justify-center">
          <motion.span
            key={built}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-6xl md:text-7xl font-title text-orange-500 tracking-widest"
          >
            {built || '…'}
          </motion.span>
        </div>
      </div>

      {/* Hint of what to tap next */}
      <p className="text-center text-xl font-body text-gray-500 mb-3">
        {expected ? (expected.vowel ? '모음을 골라요' : '자음을 골라요') : ''}
      </p>

      {/* Jamo palette */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {palette.map((jamo) => (
          <button
            key={jamo}
            onClick={() => handleJamo(jamo)}
            className="py-6 rounded-3xl text-4xl md:text-5xl font-title bg-white text-gray-700 shadow-lg hover:bg-yellow-50 active:scale-95 transition-all"
          >
            {jamo}
          </button>
        ))}
      </div>

      <ResultModal
        open={cleared}
        stars={earnedStars}
        title="한글 완성!"
        subtitle={`'${word.text}' 글자를 만들었어요! (틀린 횟수 ${mistakes})`}
        hasNextLevel={levelIndex < LEVELS.length - 1}
        onNext={goNextLevel}
        onRetry={() => startRound(config)}
        onHome={() => navigate('/')}
      />
    </GameShell>
  );
}
