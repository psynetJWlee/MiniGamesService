import { motion } from 'motion/react';
import { GameCard } from '../components/GameCard';
import { useNavigate } from 'react-router';
import { getGameRecord, getTotalStars, type GameId } from '../lib/storage';

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
];

export default function Home() {
  const navigate = useNavigate();
  // Read once per mount — the home screen is re-mounted when returning from a game.
  const totalStars = getTotalStars();

  return (
    <div className="max-w-7xl mx-auto pt-8">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-12 text-center"
      >
        <h2 className="text-3xl font-title text-gray-700 mb-2">어떤 놀이를 시작해볼까?</h2>
        <p className="text-xl font-body text-gray-500 mb-5">가온이랑 시온이랑 재미있게 놀아보아요!</p>
        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full shadow-md border-2 border-yellow-200">
          <span className="text-2xl">⭐</span>
          <span className="text-2xl font-title text-orange-500">모은 별 {totalStars}개</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
        {GAMES.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GameCard
              {...game}
              stars={getGameRecord(game.id as GameId).stars}
              onClick={() => {
                navigate(`/game/${game.id}`);
              }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
