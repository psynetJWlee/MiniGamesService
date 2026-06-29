import { useState } from 'react';
import { motion } from 'motion/react';
import { GameCard } from '../components/GameCard';
import { useNavigate } from 'react-router';
import { getGameRecord, getTotalStars, resetProgress, type GameId } from '../lib/storage';
import { resetStickers } from '../lib/stickers';
import { usePlayer, PLAYERS } from '../lib/player';
import gaonPhoto from '../../assets/players/gaon-1.jpg';
import sionPhoto from '../../assets/players/sion-1.jpg';

const PLAYER_PHOTOS: Record<string, string> = {
  가온이: gaonPhoto,
  시온이: sionPhoto,
};

// Inline SVG thumbnail (no external image needed, never breaks).
const thumb = (text: string, bg: string) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260"><rect width="100%" height="100%" fill="${bg}"/><text x="50%" y="54%" font-family="sans-serif" font-weight="bold" font-size="120" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${text}</text></svg>`,
  );

const GAMES = [
  {
    id: 'feeding',
    title: '동물 먹이 주기',
    description: '배고픈 동물 친구들에게 맛있는 음식을 드래그해서 나눠주세요!',
    imageUrl: 'https://images.unsplash.com/photo-1706533078712-abfd34feb160?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwcmFiYml0JTIwZWF0aW5nJTIwY2Fycm90JTIwaWxsdXN0cmF0aW9ufGVufDF8fHx8MTc4MjE5NTk1MHww&ixlib=rb-4.1.0&q=80&w=1080',
    color: '#FF9B9B',
    icon: '🥕',
  },
  {
    id: 'balloons',
    title: '풍선 터뜨리기',
    description: '숫자와 글자가 적힌 풍선을 팡팡! 터뜨리며 재미있게 배워보아요.',
    imageUrl: 'https://images.unsplash.com/photo-1550850395-c17a8e90ad0a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xvcmZ1bCUyMGJhbGxvb25zJTIwZmxvYXRpbmclMjBmb3IlMjBraWRzfGVufDF8fHx8MTc4MjE5NTk1MHww&ixlib=rb-4.1.0&q=80&w=1080',
    color: '#7BC9FF',
    icon: '🎈',
  },
  {
    id: 'matching',
    title: '같은 그림 찾기',
    description: '어디에 숨었을까? 똑같은 그림 카드를 두 장씩 찾아보세요.',
    imageUrl: 'https://images.unsplash.com/photo-1733297190207-06b9190381d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwbWVtb3J5JTIwbWF0Y2glMjBjYXJkJTIwZ2FtZSUyMGZvciUyMGNoaWxkcmVufGVufDF8fHx8MTc4MjE5NTk1MHww&ixlib=rb-4.1.0&q=80&w=1080',
    color: '#A1EEBD',
    icon: '🃏',
  },
  {
    id: 'monsters',
    title: '색깔 몬스터 잡기',
    description: '무지개 색깔 몬스터들이 나타났어요! 빨간 몬스터는 어디 있을까요?',
    imageUrl: 'https://images.unsplash.com/photo-1593538573197-4e3ee8a864d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xvcmZ1bCUyMGN1dGUlMjBtb25zdGVycyUyMGlsbHVzdHJhdGlvbnxlbnwxfHx8fDE3ODIxOTU5NTB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    color: '#F9D949',
    icon: '👾',
  },
  {
    id: 'sounds',
    title: '동물 소리 맞추기',
    description: '멍멍! 냐옹! 소리를 듣고 어떤 동물 친구인지 맞춰보아요.',
    imageUrl: 'https://images.unsplash.com/photo-1515532389667-6373451c5053?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwcHVwcHklMjBiYXJraW5nJTIwaWxsdXN0cmF0aW9ufGVufDF8fHx8MTc4MjE5NTk1MHww&ixlib=rb-4.1.0&q=80&w=1080',
    color: '#FFB84C',
    icon: '🔊',
  },
  {
    id: 'maze',
    title: '길 찾기 미로',
    description: '요리조리 미로를 탈출해서 맛있는 쿠키를 먹으러 가볼까요?',
    imageUrl: 'https://images.unsplash.com/photo-1752154344437-44bd7480e8ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaW1wbGUlMjBtYXplJTIwaWxsdXN0cmF0aW9uJTIwZm9yJTIwY2hpbGRyZW58ZW58MXx8fHwxNzgyMTk1Mjk2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    color: '#CDFCF6',
    icon: '🍪',
  },
  {
    id: 'hidden',
    title: '숨은 그림 찾기',
    description: '커다란 그림 속에 숨겨진 보물들을 돋보기로 찾아보세요!',
    imageUrl: 'https://images.unsplash.com/photo-1579478575321-5addbfd43db9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaWRkZW4lMjBvYmplY3RzJTIwcHV6emxlJTIwZm9yJTIwa2lkcyUyMGlsbHVzdHJhdGlvbnxlbnwxfHx8fDE3ODIxOTU5NTF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    color: '#D09CFA',
    icon: '🔍',
  },
  {
    id: 'dino',
    title: '공룡 점프 게임',
    description: '용감한 공룡이 장애물을 넘어가요! 화면을 눌러 점프해보세요.',
    imageUrl: 'https://images.unsplash.com/photo-1725575268896-fa1c209ded5c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwZGlub3NhdXIlMjBqdW1waW5nJTIwaWxsdXN0cmF0aW9ufGVufDF8fHx8MTc4MjE5NTk1MXww&ixlib=rb-4.1.0&q=80&w=1080',
    color: '#98EECC',
    icon: '🦖',
  },
  {
    id: 'hospital',
    title: '동물 병원 놀이',
    description: '아픈 동물 친구들을 돌봐주세요. 밴드도 붙이고 열도 재볼까요?',
    imageUrl: 'https://images.unsplash.com/photo-1729856984663-5a32e8cc8f75?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwYW5pbWFsJTIwaG9zcGl0YWwlMjBkb2N0b3IlMjBnYW1lJTIwaWxsdXN0cmF0aW9ufGVufDF8fHx8MTc4MjE5NTk1MXww&ixlib=rb-4.1.0&q=80&w=1080',
    color: '#B4E4FF',
    icon: '🏥',
  },
  {
    id: 'math',
    title: '산수 놀이',
    description: '더하기 빼기를 척척! 숫자 친구들과 신나게 계산해보아요.',
    imageUrl: thumb('3 + 1', '#FF8FA3'),
    color: '#FFB5A7',
    icon: '➕',
  },
  {
    id: 'flags',
    title: '국기 맞추기',
    description: '펄럭펄럭! 여러 나라의 국기를 보고 어디인지 맞춰보세요.',
    imageUrl: 'https://flagcdn.com/w320/kr.png',
    color: '#A0E7E5',
    icon: '🚩',
  },
  {
    id: 'hangul',
    title: '한글 만들기',
    description: '자음과 모음을 모아서 글자를 만들어요. 가나다라!',
    imageUrl: thumb('가', '#7AA2F7'),
    color: '#B5C7F7',
    icon: '🔤',
  },
  {
    id: 'puzzle',
    title: '직소 퍼즐',
    description: '흩어진 조각을 드래그해서 그림을 완성해보아요!',
    imageUrl: thumb('퍼즐', '#9B7EDE'),
    color: '#C9B6F0',
    icon: '🧩',
  },
  {
    id: 'pattern',
    title: '패턴 찾기',
    description: '규칙을 보고 빈칸에 들어갈 그림을 맞춰보아요!',
    imageUrl: thumb('패턴', '#4FB3A0'),
    color: '#A8E6CF',
    icon: '🧠',
  },
  {
    id: 'compare',
    title: '누가 더 클까?',
    description: '둘 중에 더 크거나 더 많은 쪽을 골라보아요!',
    imageUrl: thumb('비교', '#EAA64D'),
    color: '#FFD9A0',
    icon: '⚖️',
  },
  {
    id: 'clock',
    title: '시계 보기',
    description: '시계의 바늘을 보고 몇 시인지 맞춰보아요!',
    imageUrl: thumb('시계', '#5C9CE0'),
    color: '#B5D8F7',
    icon: '🕐',
  },
  {
    id: 'shopping',
    title: '마트 장보기',
    description: '물건 값을 더해서 모두 얼마인지 계산해보아요!',
    imageUrl: thumb('마트', '#E07BA0'),
    color: '#F7C2D9',
    icon: '🛒',
  },
];

// Games grouped by the skill each one helps grow, so parents can pick by
// purpose ("수리력", "추리력"…). Each game belongs to exactly one category;
// the order here is the order shown on the home screen.
interface Category {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  badge: string; // tailwind classes for the emoji badge
  ids: string[];
}

const CATEGORIES: Category[] = [
  {
    id: 'number',
    emoji: '🔢',
    title: '수리·계산력',
    subtitle: '수와 계산이 쑥쑥 자라요',
    badge: 'bg-orange-100 text-orange-500',
    ids: ['math', 'shopping', 'clock', 'compare', 'balloons'],
  },
  {
    id: 'logic',
    emoji: '🧩',
    title: '사고·추리력',
    subtitle: '생각하는 힘을 길러요',
    badge: 'bg-violet-100 text-violet-500',
    ids: ['pattern', 'maze', 'puzzle'],
  },
  {
    id: 'observe',
    emoji: '👀',
    title: '관찰·기억력',
    subtitle: '집중해서 찾고 기억해요',
    badge: 'bg-sky-100 text-sky-500',
    ids: ['matching', 'hidden', 'monsters', 'sounds'],
  },
  {
    id: 'language',
    emoji: '🗣️',
    title: '언어·상식',
    subtitle: '새로운 것을 배워요',
    badge: 'bg-emerald-100 text-emerald-500',
    ids: ['hangul', 'flags'],
  },
  {
    id: 'play',
    emoji: '🤗',
    title: '교감·생활 놀이',
    subtitle: '손과 마음이 함께 자라요',
    badge: 'bg-pink-100 text-pink-500',
    ids: ['feeding', 'hospital', 'dino'],
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { player, setPlayer } = usePlayer();
  const [confirmingReset, setConfirmingReset] = useState(false);
  // Read once per mount — the home screen is re-mounted when returning from a game.
  const totalStars = getTotalStars();

  const handleReset = () => {
    resetProgress();
    resetStickers();
    // Reload so every screen (cards, header badge, total stars) reflects the wipe.
    window.location.reload();
  };

  // Look up each game by id (with its best stars) so categories can pull the
  // games they list, in order.
  const byId = Object.fromEntries(
    GAMES.map((g) => [g.id, { ...g, stars: getGameRecord(g.id as GameId).stars }]),
  );

  return (
    <div className="max-w-7xl mx-auto pt-8">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-12 text-center"
      >
        {player ? (
          <h2 className="text-3xl font-title text-gray-700 mb-2">{player}야, 어떤 놀이를 시작해볼까?</h2>
        ) : (
          <h2 className="text-3xl font-title text-gray-700 mb-2">누구랑 놀까?</h2>
        )}
        <p className="text-xl font-body text-gray-500 mb-5">
          {player ? `${player}랑 재미있게 놀아보아요!` : '친구를 골라봐!'}
        </p>

        {/* Player picker — selecting a name personalizes the whole app. */}
        <div className="flex justify-center gap-4 mb-5">
          {PLAYERS.map((name) => {
            const selected = player === name;
            return (
              <button
                key={name}
                onClick={() => setPlayer(name)}
                className={`flex items-center gap-3 pl-2 pr-6 py-2 rounded-full font-title text-2xl shadow-md border-4 transition-all active:scale-95 ${
                  selected
                    ? 'bg-orange-400 text-white border-orange-400 scale-105'
                    : 'bg-white text-orange-500 border-orange-200 hover:scale-105'
                }`}
              >
                <img
                  src={PLAYER_PHOTOS[name]}
                  alt={name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                />
                {name}
              </button>
            );
          })}
        </div>

        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full shadow-md border-2 border-yellow-200">
          <span className="text-2xl">⭐</span>
          <span className="text-2xl font-title text-orange-500">모은 별 {totalStars}개</span>
        </div>
      </motion.div>

      {CATEGORIES.map((cat) => {
        // Mastered (3-star) games sink to the bottom within their category so
        // the ones still to clear stay on top. sort() is stable.
        const catGames = cat.ids
          .map((id) => byId[id])
          .filter(Boolean)
          .sort((a, b) => (a.stars >= 3 ? 1 : 0) - (b.stars >= 3 ? 1 : 0));
        if (!catGames.length) return null;
        return (
          <section key={cat.id} className="mb-14">
            <div className="flex items-center gap-4 mb-6">
              <span
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm shrink-0 ${cat.badge}`}
              >
                {cat.emoji}
              </span>
              <div className="min-w-0">
                <h3 className="text-2xl md:text-3xl font-title text-gray-700">{cat.title}</h3>
                <p className="font-body text-gray-500">{cat.subtitle}</p>
              </div>
              <span className="ml-auto font-title text-gray-300 text-lg shrink-0">{catGames.length}개</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
              {catGames.map((game, index) => (
                <motion.div
                  key={game.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GameCard
                    {...game}
                    stars={game.stars}
                    onClick={() => {
                      navigate(`/game/${game.id}`);
                    }}
                  />
                </motion.div>
              ))}
            </div>
          </section>
        );
      })}

      {/* Small, faint reset for parents — wipes all stars and stickers. */}
      <div className="mt-12 mb-4 text-center">
        {confirmingReset ? (
          <div className="inline-flex items-center gap-3 font-body text-gray-400">
            <span className="text-sm">정말 모든 별과 스티커를 지울까요?</span>
            <button onClick={handleReset} className="text-sm text-red-400 underline hover:text-red-500">
              네, 초기화
            </button>
            <button onClick={() => setConfirmingReset(false)} className="text-sm underline hover:text-gray-600">
              취소
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingReset(true)}
            className="text-xs text-gray-300 hover:text-gray-400 underline font-body"
          >
            별·스티커 모두 초기화
          </button>
        )}
      </div>
    </div>
  );
}
