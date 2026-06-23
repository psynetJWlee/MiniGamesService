import { useEffect } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Home, ArrowRight } from 'lucide-react';
import { StarRating } from './StarRating';
import { burstBig, starRain } from '../lib/celebrate';
import { playFanfare, playLevelUp } from '../lib/sound';

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
  useEffect(() => {
    if (!open) return;
    if (stars >= 3) {
      starRain();
      playFanfare();
    } else {
      burstBig();
      playLevelUp();
    }
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
            <h2 className="text-4xl md:text-5xl font-title text-orange-600 mb-3">{title}</h2>
            {subtitle && <p className="text-xl md:text-2xl font-body text-gray-500 mb-6">{subtitle}</p>}

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
