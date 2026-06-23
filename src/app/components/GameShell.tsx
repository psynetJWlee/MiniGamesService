import type { ReactNode } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router';

interface GameShellProps {
  title: string;
  /** Current level (0-based) — shows the ●●○ dots when levelCount > 1. */
  levelIndex?: number;
  levelCount?: number;
  /** Right-aligned status node, e.g. score or a star count. */
  status?: ReactNode;
  /** Back handler (defaults to navigating home). */
  onBack?: () => void;
  /** When provided, shows a reset button in the top bar. */
  onReset?: () => void;
  /** Background classes for the outer container (default warm cream). */
  bgClassName?: string;
  /** Show the playful pastel blobs (off for dark-background games). */
  showBlobs?: boolean;
  /** Classes for the <main> content wrapper. */
  contentClassName?: string;
  children: ReactNode;
}

function LevelDots({ index, count }: { index: number; count: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={`w-3 h-3 rounded-full transition-colors ${i <= index ? 'bg-orange-400' : 'bg-orange-200'}`}
        />
      ))}
    </div>
  );
}

/**
 * Consistent frame around every game: pastel background, a top bar with
 * back / title / level dots / status / reset, and a content slot. Replaces the
 * bespoke headers each game used to hand-roll, and brings back the playful
 * background blobs that only the home Layout had.
 */
export function GameShell({
  title,
  levelIndex,
  levelCount,
  status,
  onBack,
  onReset,
  bgClassName = 'bg-[#FFFBEB]',
  showBlobs = true,
  contentClassName = 'relative z-10 px-4 pt-28 pb-10 max-w-6xl mx-auto',
  children,
}: GameShellProps) {
  const navigate = useNavigate();
  const back = onBack ?? (() => navigate('/'));
  const showDots = typeof levelIndex === 'number' && typeof levelCount === 'number' && levelCount > 1;

  return (
    <div className={`relative min-h-screen overflow-hidden font-kids ${bgClassName}`}>
      {showBlobs && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-100 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] bg-blue-100 rounded-full blur-3xl opacity-60" />
          <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-yellow-100 rounded-full blur-3xl opacity-60" />
        </div>
      )}

      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between gap-3 p-5">
        <button
          onClick={back}
          aria-label="돌아가기"
          className="p-3 md:p-4 bg-white rounded-2xl shadow-md text-orange-500 hover:scale-110 transition-transform shrink-0"
        >
          <ArrowLeft size={28} />
        </button>

        <div className="flex flex-col items-center gap-1 min-w-0">
          <h2 className="text-2xl md:text-3xl font-title text-orange-600 truncate max-w-[60vw]">{title}</h2>
          {showDots && <LevelDots index={levelIndex!} count={levelCount!} />}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {status}
          {onReset && (
            <button
              onClick={onReset}
              aria-label="다시 하기"
              className="p-3 md:p-4 bg-white rounded-2xl shadow-md text-blue-500 hover:scale-110 transition-transform"
            >
              <RotateCcw size={28} />
            </button>
          )}
        </div>
      </header>

      <main className={contentClassName}>{children}</main>
    </div>
  );
}
