import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Home, ArrowRight } from 'lucide-react';
import { StarRating } from './StarRating';
import { burstBig, starRain } from '../lib/celebrate';
import { playFanfare, playLevelUp } from '../lib/sound';
import { usePlayer } from '../lib/player';
import { awardStickers, type AwardedSticker } from '../lib/stickers';

interface ResultModalProps {
  open: boolean;
  /** Stars earned this round, 0–3. */
  stars: number;
  /** Headline, e.g. "참 잘했어요!". */
  title?: string;
  /** Smaller line under the title. */
  subtitle?: string;
  /** Whether a harder level remains — shows the "다음 단계" button. */
  hasNextLevel: boolean;
  onNext: () => void;
  onRetry: () => void;
  onHome: () => void;
}

/**
 * Shared "you cleared it" modal — stars, a praise line, and the standard
 * next / retry / home actions. Replaces the bespoke clear screens that each
 * game used to hand-roll. Fires confetti + sound when it opens.
 */
export function ResultModal({
  open,
  stars,
  title = '참 잘했어요!',
  subtitle,
  hasNextLevel,
  onNext,
  onRetry,
  onHome,
}: ResultModalProps) {
  const { player } = usePlayer();
  const [awarded, setAwarded] = useState<AwardedSticker[]>([]);

  useEffect(() => {
    if (!open) return;
    if (stars >= 3) {
      starRain();
      playFanfare();
    } else {
      burstBig();
      playLevelUp();
    }
    // Award stickers for this clear (per player). Skip if no player chosen.
    setAwarded(player ? awardStickers(player, stars) : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stars]);

  // Rendered with a plain conditional (no AnimatePresence) so closing instantly
  // removes the backdrop from the DOM — an exit animation that leaves an
  // invisible full-screen overlay behind would swallow clicks on the next level.
  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-kids"
    >
          <motion.div
            initial={{ scale: 0.5, y: 80 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            className="bg-white rounded-[50px] p-10 md:p-12 text-center shadow-2xl max-w-md w-full border-8 border-yellow-200"
          >
            <div className="mb-6">
              <StarRating value={stars} size={56} animate />
            </div>
            <h2 className="text-4xl md:text-5xl font-title text-orange-600 mb-2">{title}</h2>
            {player && (
              <p className="text-2xl md:text-3xl font-title text-pink-500 mb-2">{player}, 정말 멋져요! 🎉</p>
            )}
            {subtitle && <p className="text-lg md:text-xl font-body text-gray-500 mb-4">{subtitle}</p>}

            {/* Stickers earned this clear */}
            {awarded.length > 0 && (
              <div className="bg-yellow-50 rounded-3xl p-4 mb-5 border-2 border-yellow-200">
                <p className="font-title text-lg text-orange-500 mb-2">스티커 획득! 🏷️</p>
                <div className="flex justify-center gap-2 flex-wrap">
                  {awarded.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2 + i * 0.15, type: 'spring', stiffness: 300, damping: 12 }}
                      className="relative w-14 h-14 bg-white rounded-2xl border-2 border-orange-100 shadow flex items-center justify-center text-3xl"
                    >
                      {s.emoji}
                      {s.isNew && (
                        <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-[10px] font-title px-1.5 py-0.5 rounded-full shadow">
                          NEW
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 mt-4">
              {hasNextLevel && (
                <button
                  onClick={onNext}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-white py-5 rounded-3xl font-title text-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <ArrowRight size={28} />
                  다음 단계
                </button>
              )}
              <button
                onClick={onRetry}
                className="w-full bg-blue-400 hover:bg-blue-500 text-white py-4 rounded-3xl font-title text-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <RotateCcw size={24} />
                다시 하기
              </button>
              <button
                onClick={onHome}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-3xl font-title text-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Home size={24} />
                다른 놀이
              </button>
            </div>
          </motion.div>
    </motion.div>
  );
}
