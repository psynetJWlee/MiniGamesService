import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { playWrong } from './sound';

const MESSAGES = ['다시 해볼까? 🤔', '음~ 아니야!', '한 번 더 해보자!', '괜찮아, 또 도전!'];

/**
 * Shared gentle wrong-answer feedback for the kids games.
 *
 * The Figma export either did nothing on a wrong choice (`console.log`,
 * empty branches) or only flashed a red color. For 6-year-olds we want a
 * soft, encouraging reaction — a low "boop" plus a friendly floating
 * message — never anything that feels like a punishment.
 *
 * Usage:
 *   const wrong = useWrongFeedback();
 *   ...
 *   if (!correct) wrong.trigger();
 *   ...
 *   return <>{...} {wrong.overlay}</>;
 */
export function useWrongFeedback() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const trigger = useCallback(() => {
    playWrong();
    setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(null), 1100);
  }, []);

  const overlay = (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed left-1/2 bottom-12 z-[60] -translate-x-1/2 pointer-events-none"
        >
          <div className="bg-white/95 backdrop-blur-sm px-8 py-4 rounded-[30px] shadow-2xl border-4 border-orange-200">
            <span className="text-3xl font-title text-orange-500">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return { trigger, overlay };
}
