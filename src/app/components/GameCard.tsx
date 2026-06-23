import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Play } from 'lucide-react';
import { StarRating } from './StarRating';

interface GameCardProps {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  color: string;
  icon: string;
  /** Best stars earned for this game, 0–3. */
  stars?: number;
  onClick: () => void;
}

export function GameCard({ title, description, imageUrl, color, icon, stars = 0, onClick }: GameCardProps) {
  return (
    <motion.button
      whileHover={{ y: -10, scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative w-full text-left group"
    >
      <div 
        className={`h-full rounded-[40px] overflow-hidden shadow-xl transition-all duration-300 group-hover:shadow-2xl flex flex-col`}
        style={{ backgroundColor: color }}
      >
        <div className="relative h-64 overflow-hidden">
          <ImageWithFallback
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 flex items-center gap-2 shadow-sm">
            <span className="text-2xl">{icon}</span>
            <span className="font-title text-gray-800 text-lg">{title}</span>
          </div>
          {/* Best stars earned so far */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-2xl px-3 py-1.5 shadow-sm">
            <StarRating value={stars} size={18} />
          </div>
        </div>

        <div className="p-8 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-3xl font-title text-white mb-3 drop-shadow-md">
              {title}
            </h3>
            <p className="text-xl font-body text-white/90 leading-relaxed">
              {description}
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-lg group-hover:bg-yellow-400 group-hover:text-white transition-colors">
              <Play size={32} fill="currentColor" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative sparkles */}
      <div className="absolute -top-4 -right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-4xl animate-bounce inline-block">✨</span>
      </div>
    </motion.button>
  );
}
