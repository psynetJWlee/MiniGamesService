import React from 'react';
import { motion } from 'motion/react';
import { Settings, Info } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#FFFBEB] font-kids">
      {/* Playful background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-100 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] bg-blue-100 rounded-full blur-3xl opacity-60" />
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-yellow-100 rounded-full blur-3xl opacity-60" />
      </div>

      <header className="relative z-10 p-6 flex justify-between items-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-3"
        >
          <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
            <span className="text-2xl">🧸</span>
          </div>
          <h1 className="text-4xl font-title text-orange-600 drop-shadow-sm">가온이랑 시온이랑 놀자</h1>
        </motion.div>

        <div className="flex gap-4">
          <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md text-orange-500 hover:scale-110 transition-transform">
            <Info size={24} />
          </button>
          <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md text-orange-500 hover:scale-110 transition-transform">
            <Settings size={24} />
          </button>
        </div>
      </header>

      <main className="relative z-10 px-6 pb-12">
        {children}
      </main>

      <footer className="relative z-10 p-6 text-center text-orange-300 font-body">
        <p>© 2026 가온이랑 시온이랑 놀자. 우리 아이 첫 미니게임</p>
      </footer>
    </div>
  );
}
