import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { GameShell } from '../components/GameShell';
import { usePlayer } from '../lib/player';
import { ALBUMS, getCollection, getProgress } from '../lib/stickers';

export default function StickerBook() {
  const navigate = useNavigate();
  const { player } = usePlayer();

  if (!player) {
    return (
      <GameShell title="내 스티커" contentClassName="relative z-10 px-4 pt-28 pb-10 max-w-3xl mx-auto">
        <div className="text-center mt-16">
          <div className="text-7xl mb-4">🏷️</div>
          <p className="text-2xl font-title text-gray-600 mb-8">먼저 친구를 골라줘!</p>
          <button
            onClick={() => navigate('/')}
            className="bg-orange-500 text-white px-10 py-4 rounded-3xl font-title text-2xl shadow-lg active:scale-95 transition-all"
          >
            친구 고르러 가기
          </button>
        </div>
      </GameShell>
    );
  }

  const owned = getCollection(player);
  const progress = getProgress(player);

  const status = (
    <div className="bg-white/90 px-4 py-2 rounded-2xl shadow-md text-orange-500 font-title text-xl">
      {progress.collected}/{progress.total}
    </div>
  );

  return (
    <GameShell
      title={`${player}의 스티커`}
      status={status}
      contentClassName="relative z-10 px-4 pt-28 pb-10 max-w-4xl mx-auto"
    >
      <div className="flex flex-col gap-6">
        {ALBUMS.map((album) => {
          const got = album.stickers.filter((s) => owned[s.id]).length;
          const complete = got === album.stickers.length;
          return (
            <div
              key={album.id}
              className={`rounded-[36px] p-6 shadow-lg border-4 ${
                album.special
                  ? 'bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-300'
                  : 'bg-white/80 border-white'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{album.icon}</span>
                <h3 className="text-2xl font-title text-gray-700">{album.title}</h3>
                <span className="ml-auto font-title text-lg text-orange-400">
                  {got}/{album.stickers.length}
                  {complete && ' ✓'}
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {album.stickers.map((s) => {
                  const count = owned[s.id] ?? 0;
                  const has = count > 0;
                  return (
                    <motion.div
                      key={s.id}
                      whileHover={has ? { scale: 1.12, rotate: -4 } : {}}
                      className={`relative aspect-square rounded-2xl flex items-center justify-center text-4xl md:text-5xl shadow-sm ${
                        has ? 'bg-white border-2 border-orange-100' : 'bg-gray-100/70'
                      }`}
                    >
                      {has ? (
                        <span className="drop-shadow-sm">{s.emoji}</span>
                      ) : (
                        <span className="text-gray-300">?</span>
                      )}
                      {count > 1 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-orange-400 text-white text-xs font-title w-6 h-6 rounded-full flex items-center justify-center shadow">
                          {count}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center font-body text-gray-400 mt-8 text-lg">
        게임을 클리어하면 별 개수만큼 스티커를 받아요! ⭐ 3개면 반짝이 스티커도! ✨
      </p>
    </GameShell>
  );
}
