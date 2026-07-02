import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { GameShell } from '../components/GameShell';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { PUZZLES } from '../lib/hiddenScenes';

export default function HiddenSelect() {
  const navigate = useNavigate();

  return (
    <GameShell
      title="숨은 그림 찾기"
      contentClassName="relative z-10 h-[100dvh] overflow-y-auto px-4 pt-24 pb-6"
    >
      <div className="max-w-5xl mx-auto">
      <h3 className="text-2xl md:text-3xl font-title text-orange-600 mb-1 text-center">어떤 그림에서 찾아볼까?</h3>
      <p className="text-base md:text-lg font-body text-gray-500 mb-5 text-center">그림을 골라줘!</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
        {PUZZLES.map((p, i) => (
          <motion.button
            key={p.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/game/hidden/${p.id}`)}
            className="relative rounded-3xl overflow-hidden shadow-xl border-8 border-white text-left group"
          >
            <ImageWithFallback
              src={p.image}
              alt={p.title}
              className="block w-full aspect-[16/9] object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 pt-8 pb-3">
              <span className="font-title text-white text-xl md:text-2xl drop-shadow">{p.title}</span>
              <span className="ml-2 font-body text-white/80 text-sm">숨은 그림 {p.targets.length}개</span>
            </div>
          </motion.button>
        ))}
      </div>
      </div>
    </GameShell>
  );
}
