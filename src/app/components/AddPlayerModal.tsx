import { useRef, useState, type ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { Camera, Check, X } from 'lucide-react';

interface AddPlayerModalProps {
  /** Names already taken (built-in + custom) — used to block duplicates. */
  existingNames: string[];
  onClose: () => void;
  onAdd: (name: string, photo: string | null) => void;
}

/**
 * Downscale a picked photo to a small square avatar (data URL) so localStorage
 * never fills up with multi-megabyte images. Cover-crops to a centered square.
 */
function fileToAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode failed'));
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('no canvas'));
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * "새 친구 추가" dialog — pick a photo from the device and type a name.
 */
export function AddPlayerModal({ existingNames, onClose, onAdd }: AddPlayerModalProps) {
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      setPhoto(await fileToAvatar(file));
    } catch {
      setError('이미지를 불러오지 못했어요. 다른 사진을 골라줘!');
    } finally {
      setBusy(false);
    }
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('이름을 입력해 주세요.');
      return;
    }
    if (existingNames.includes(trimmed)) {
      setError('이미 있는 이름이에요. 다른 이름으로!');
      return;
    }
    onAdd(trimmed, photo);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-kids"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.6, y: 60 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[40px] p-8 md:p-10 text-center shadow-2xl w-full max-w-sm border-8 border-orange-200 relative"
      >
        <button
          onClick={onClose}
          aria-label="닫기"
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <X size={22} />
        </button>

        <h2 className="text-3xl font-title text-orange-600 mb-6">새 친구 추가</h2>

        {/* Avatar picker */}
        <button
          onClick={() => fileRef.current?.click()}
          className="relative mx-auto mb-6 w-32 h-32 rounded-full overflow-hidden shadow-lg border-4 border-orange-200 bg-orange-50 flex items-center justify-center active:scale-95 transition-transform"
        >
          {photo ? (
            <img src={photo} alt="새 친구" className="w-full h-full object-cover" />
          ) : (
            <span className="text-5xl">🙂</span>
          )}
          <span className="absolute bottom-0 inset-x-0 bg-black/45 text-white py-1.5 flex items-center justify-center gap-1">
            <Camera size={18} />
            <span className="font-title text-sm">{busy ? '불러오는 중…' : '사진'}</span>
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handlePick}
          className="hidden"
        />

        {/* Name */}
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          maxLength={10}
          placeholder="이름을 적어줘"
          className="w-full text-center text-2xl font-title text-gray-700 bg-orange-50 rounded-2xl px-4 py-3 border-2 border-orange-100 focus:border-orange-300 focus:outline-none placeholder:text-gray-300"
        />

        {error && <p className="mt-3 text-base font-body text-red-400">{error}</p>}

        <div className="flex gap-3 mt-7">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-500 py-4 rounded-3xl font-title text-xl active:scale-95 transition-all"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-3xl font-title text-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Check size={24} />
            추가
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
