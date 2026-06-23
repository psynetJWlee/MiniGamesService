import React from 'react';
import { motion } from 'motion/react';
import { GameCard } from '../components/GameCard';
import { useNavigate } from 'react-router';

const GAMES = [
  {
    id: 'jigsaw',
    title: '동물 퍼즐',
    description: '귀여운 동물 친구들을 퍼즐로 맞춰보아요! 3x3 퍼즐이라 누구나 할 수 있어요.',
    imageUrl: 'https://images.unsplash.com/photo-1730804518415-75297e8d2a41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwamlnc2F3JTIwcHV6emxlJTIwcGllY2VzJTIwYmFja2dyb3VuZHxlbnwxfHx8fDE3ODIxOTUyOTZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    color: '#FF9B9B', // Soft Red
    icon: '🧩',
  },
  {
    id: 'animals',
    title: '누굴까요?',
    description: '울음소리를 듣거나 모습을 보고 어떤 동물인지 이름을 맞춰보는 게임이에요.',
    imageUrl: 'https://images.unsplash.com/photo-1597802109425-17ffb0349d8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwY29sb3JmdWwlMjBpbGx1c3RyYXRpb24lMjBmb3IlMjBraWRzJTIwYW5pbWFsfGVufDF8fHx8MTc4MjE5NTI5Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    color: '#7BC9FF', // Soft Blue
    icon: '🦁',
  },
  {
    id: 'flags',
    title: '나라 국기 맞추기',
    description: '전 세계 여러 나라의 예쁜 국기들을 배워보아요! 어떤 나라 국기일까요?',
    imageUrl: 'https://images.unsplash.com/photo-1592487501226-7ed5e5dc80f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xvcmZ1bCUyMHdvcmxkJTIwZmxhZ3MlMjBjb2xsYWdlfGVufDF8fHx8MTc4MjE5NTI5Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    color: '#A1EEBD', // Soft Green
    icon: '🚩',
  },
  {
    id: 'maze',
    title: '미로 탈출',
    description: '복잡한 길을 따라가서 출구를 찾아보아요. 길을 잃지 않게 조심하세요!',
    imageUrl: 'https://images.unsplash.com/photo-1752154344437-44bd7480e8ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaW1wbGUlMjBtYXplJTIwaWxsdXN0cmF0aW9uJTIwZm9yJTIwY2hpbGRyZW58ZW58MXx8fHwxNzgyMTk1Mjk2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    color: '#F9D949', // Soft Yellow
    icon: '🌀',
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto pt-8">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-12 text-center"
      >
        <h2 className="text-3xl font-title text-gray-700 mb-2">어떤 놀이를 시작해볼까?</h2>
        <p className="text-xl font-body text-gray-500">가온이랑 시온이랑 재미있게 놀아보아요!</p>
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
              onClick={() => {
                // For now, just show an alert or navigate to a placeholder
                alert(`${game.title} 게임을 곧 시작할게요!`);
              }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
