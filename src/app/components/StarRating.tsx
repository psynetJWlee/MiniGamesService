import { motion } from 'motion/react';

interface StarRatingProps {
  /** How many stars are filled, 0–3. */
  value: number;
  /** Total stars to show (default 3). */
  max?: number;
  /** Pixel size of each star (default 48). */
  size?: number;
  /** Animate the filled stars popping in one-by-one. */
  animate?: boolean;
}

/**
 * Row of stars (filled / empty). Used in the result modal and as small badges
 * on the home cards.
 */
export function StarRating({ value, max = 3, size = 48, animate = false }: StarRatingProps) {
  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < value;
        return (
          <motion.span
            key={i}
            initial={animate ? { scale: 0, rotate: -30 } : false}
            animate={animate ? { scale: 1, rotate: 0 } : undefined}
            transition={animate ? { delay: 0.15 * i, type: 'spring', stiffness: 300, damping: 12 } : undefined}
            style={{ fontSize: size, lineHeight: 1 }}
            className={filled ? 'drop-shadow-md' : 'opacity-30 grayscale'}
          >
            ⭐
          </motion.span>
        );
      })}
    </div>
  );
}
