import sampleParkUrl from '../../assets/hidden/sample-park.svg';

/**
 * Classic hidden-picture ("숨은그림찾기") data.
 *
 * Each puzzle is ONE illustration where the objects are drawn INTO the scene,
 * plus a "find list" and the hotspot (normalized x/y + radius) of where each
 * object is hidden. The player taps the spot in the picture to find it.
 *
 * Coordinates are authored per illustration — use the in-game "위치 찍기" dev tool
 * (…?edit) to read coordinates off a new image. See README.
 */

export interface HiddenTarget {
  id: string;
  name: string; // find-list label
  icon?: string; // find-list thumbnail: emoji (or use iconSrc for an outline image)
  iconSrc?: string;
  x: number; // 0..1 — hotspot center within the image
  y: number;
  r: number; // 0..1 (fraction of image width) — tap tolerance radius
}

export interface HiddenPuzzle {
  id: string;
  title: string;
  image: string; // the illustration
  targets: HiddenTarget[];
}

// Auto-discover illustrations dropped into the folder (build-safe: missing files
// are simply skipped). Save images as e.g. src/assets/hidden/curios.png.
const files = import.meta.glob('../../assets/hidden/*.{png,jpg,jpeg,webp,PNG,JPG,JPEG,WEBP}', {
  eager: true,
  query: '?url',
  import: 'default',
});
function imgUrl(name: string): string | undefined {
  const key = Object.keys(files).find((k) => k.endsWith('/' + name));
  return key ? (files[key] as string) : undefined;
}

type Def = { id: string; title: string; file: string; targets: HiddenTarget[] };

const DEFS: Def[] = [
  {
    id: 'library',
    title: '마법사의 서재',
    file: 'library.png',
    // Hotspots authored with ?edit.
    targets: [
      { id: 'cat', name: '고양이', icon: '🐈', x: 0.514, y: 0.871, r: 0.055 },
      { id: 'owl', name: '올빼미', icon: '🦉', x: 0.688, y: 0.095, r: 0.05 },
      { id: 'starmap', name: '별자리 지도', icon: '🌌', x: 0.333, y: 0.326, r: 0.06 },
      { id: 'quill', name: '깃털 펜', icon: '🪶', x: 0.565, y: 0.661, r: 0.055 },
      { id: 'broom', name: '빗자루', icon: '🧹', x: 0.255, y: 0.646, r: 0.055 },
      { id: 'crystal', name: '크리스탈', icon: '💎', x: 0.573, y: 0.938, r: 0.06 },
      { id: 'hourglass', name: '모래시계', icon: '⏳', x: 0.625, y: 0.454, r: 0.05 },
    ],
  },
  {
    id: 'curios',
    title: '골동품 가게',
    file: 'curios.png',
    targets: [
      { id: 'cat', name: '고양이', icon: '🐈', x: 0.402, y: 0.709, r: 0.055 },
      { id: 'doll', name: '인형', icon: '🧸', x: 0.033, y: 0.426, r: 0.055 },
      { id: 'worldmap', name: '세계지도', icon: '🗺️', x: 0.537, y: 0.188, r: 0.06 },
      { id: 'register', name: '계산대', icon: '🪙', x: 0.658, y: 0.599, r: 0.055 },
      { id: 'chest', name: '보물상자', icon: '📦', x: 0.034, y: 0.694, r: 0.055 },
      { id: 'clock', name: '괘종시계', icon: '⏰', x: 0.718, y: 0.469, r: 0.055 },
      { id: 'globe', name: '지구본', icon: '🌍', x: 0.25, y: 0.795, r: 0.055 },
    ],
  },
  {
    id: 'future',
    title: '미래 도시',
    file: 'future-city.png',
    targets: [
      { id: 'drone', name: '드론', icon: '🛸', x: 0.547, y: 0.104, r: 0.05 },
      { id: 'bus', name: '미래버스', icon: '🚡', x: 0.551, y: 0.553, r: 0.055 },
      { id: 'alienfruit', name: '외계과일', icon: '🐙', x: 0.073, y: 0.912, r: 0.055 },
      { id: 'robot', name: '로봇손님', icon: '🤖', x: 0.829, y: 0.709, r: 0.055 },
      { id: 'alien', name: '외계인', icon: '👽', x: 0.086, y: 0.672, r: 0.05 },
      { id: 'neon', name: '네온간판', icon: '🪧', x: 0.343, y: 0.437, r: 0.06 },
      { id: 'plant', name: '식물외계인', icon: '🌱', x: 0.054, y: 0.802, r: 0.05 },
    ],
  },
  {
    id: 'fairy',
    title: '요정 숲',
    file: 'elf-forest.png',
    targets: [
      { id: 'watermill', name: '물레방아', icon: '🎡', x: 0.735, y: 0.893, r: 0.055 },
      { id: 'bee', name: '꿀벌', icon: '🐝', x: 0.435, y: 0.303, r: 0.05 },
      { id: 'oaksign', name: '오크 간판', icon: '🪵', x: 0.574, y: 0.335, r: 0.055 },
      { id: 'crystal', name: '보라수정', icon: '💎', x: 0.604, y: 0.932, r: 0.055 },
      { id: 'fairy', name: '요정', icon: '🧚', x: 0.046, y: 0.121, r: 0.05 },
      { id: 'mushroom', name: '버섯집', icon: '🍄', x: 0.369, y: 0.482, r: 0.055 },
      { id: 'merchant', name: '요정상인', icon: '🏪', x: 0.121, y: 0.8, r: 0.055 },
    ],
  },
  {
    id: 'toyshop',
    title: '한밤의 장난감 가게',
    file: 'toy-shop.png',
    targets: [
      { id: 'train', name: '기차', icon: '🚂', x: 0.344, y: 0.849, r: 0.055 },
      { id: 'griffin', name: '그리핀 인형', icon: '🦁', x: 0.222, y: 0.72, r: 0.055 },
      { id: 'robot', name: '태엽 로봇', icon: '🤖', x: 0.139, y: 0.24, r: 0.05 },
      { id: 'puppet', name: '나무 인형', icon: '🪵', x: 0.546, y: 0.125, r: 0.055 },
      { id: 'fishdoll', name: '물고기 인형', icon: '🧜', x: 0.193, y: 0.921, r: 0.055 },
      { id: 'key', name: '태엽 열쇠', icon: '🔑', x: 0.664, y: 0.936, r: 0.05 },
      { id: 'butterfly', name: '나비 요정', icon: '🦋', x: 0.797, y: 0.104, r: 0.05 },
    ],
  },
  {
    id: 'sea',
    title: '바다 축제',
    file: 'under-the-sea.png',
    targets: [
      { id: 'sled', name: '해마 마차', icon: '🎡', x: 0.722, y: 0.873, r: 0.055 },
      { id: 'seahorse', name: '아기 해마', icon: '🐠', x: 0.526, y: 0.927, r: 0.05 },
      { id: 'seadragon', name: '바다룡', icon: '🐉', x: 0.89, y: 0.793, r: 0.055 },
      { id: 'crown', name: '조개 간판', icon: '🐚', x: 0.62, y: 0.622, r: 0.05 },
      { id: 'lookout', name: '전망대 인어', icon: '🧜', x: 0.782, y: 0.21, r: 0.055 },
      { id: 'jar', name: '유리 병', icon: '🧪', x: 0.618, y: 0.713, r: 0.05 },
      { id: 'dancer', name: '보라 인어', icon: '💜', x: 0.294, y: 0.873, r: 0.055 },
    ],
  },
  {
    id: 'sweet',
    title: '달콤한 나라',
    file: 'sweet-land.png',
    targets: [
      { id: 'fountain', name: '초콜릿 분수', icon: '🍫', x: 0.283, y: 0.715, r: 0.055 },
      { id: 'carousel', name: '회전목마', icon: '🎠', x: 0.509, y: 0.774, r: 0.055 },
      { id: 'gummy', name: '젤리곰', icon: '🧸', x: 0.408, y: 0.925, r: 0.05 },
      { id: 'ginger', name: '진저브레드', icon: '🍪', x: 0.588, y: 0.923, r: 0.05 },
      { id: 'applecandy', name: '사과 사탕', icon: '🍎', x: 0.784, y: 0.09, r: 0.05 },
      { id: 'tower', name: '디저트 탑', icon: '🍦', x: 0.496, y: 0.229, r: 0.06 },
      { id: 'chimney', name: '솜사탕 굴뚝', icon: '☁️', x: 0.072, y: 0.199, r: 0.055 },
    ],
  },
  {
    id: 'repair',
    title: '골동품 비행선 수리소',
    file: 'airship-shop.png',
    // Temporary spread positions — tune with ?edit.
    targets: [
      { id: 'gear', name: '톱니바퀴', icon: '⚙️', x: 0.638, y: 0.402, r: 0.05 },
      { id: 'magnifier', name: '돋보기', icon: '🔍', x: 0.13, y: 0.584, r: 0.05 },
      { id: 'wingkey', name: '날개 열쇠', icon: '🔑', x: 0.813, y: 0.199, r: 0.05 },
      { id: 'compass', name: '나침반 병', icon: '🧭', x: 0.818, y: 0.582, r: 0.05 },
      { id: 'gembottle', name: '유리병 보석', icon: '💎', x: 0.524, y: 0.742, r: 0.05 },
      { id: 'map', name: '작은 지도', icon: '🗺️', x: 0.165, y: 0.56, r: 0.05 },
      { id: 'spanner', name: '스패너', icon: '🔧', x: 0.804, y: 0.835, r: 0.05 },
    ],
  },
];

export const PUZZLES: HiddenPuzzle[] = DEFS.flatMap((d) => {
  const image = imgUrl(d.file);
  return image ? [{ id: d.id, title: d.title, image, targets: d.targets }] : [];
});

// If no real illustrations are present, fall back to the built-in sample so the
// game still runs.
if (PUZZLES.length === 0) {
  PUZZLES.push({
    id: 'sample-park',
    title: '공원 (샘플)',
    image: sampleParkUrl,
    targets: [
      { id: 'banana', name: '바나나', icon: '🍌', x: 0.72, y: 0.255, r: 0.06 },
      { id: 'star', name: '별', icon: '⭐', x: 0.15, y: 0.17, r: 0.06 },
      { id: 'fish', name: '물고기', icon: '🐟', x: 0.3, y: 0.8, r: 0.06 },
      { id: 'key', name: '열쇠', icon: '🔑', x: 0.62, y: 0.857, r: 0.06 },
      { id: 'mitten', name: '장갑', icon: '🧤', x: 0.84, y: 0.61, r: 0.06 },
      { id: 'pencil', name: '연필', icon: '✏️', x: 0.2, y: 0.915, r: 0.06 },
    ],
  });
}
