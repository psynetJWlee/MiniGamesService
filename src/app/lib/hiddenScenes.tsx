import type { ReactNode } from 'react';
import { motion } from 'motion/react';

// Authored hidden-object scenes. Each scene is hand-drawn SVG, so the exact
// position of every hidden object is known — hotspots are perfect, it works
// offline, scales without blur, and has no licensing concerns.

export interface SceneProps {
  found: string[];
  hint: boolean;
  onFind: (id: string) => void;
}

export interface SceneDef {
  id: string;
  title: string;
  bg: string; // outer background tint behind the svg
  objects: { id: string; name: string }[];
  render: (p: SceneProps) => ReactNode;
}

// Clickable hidden object: generous transparent hit area + a green ring when
// found, and a purple pulse when the hint is active.
function Spot({
  id,
  cx,
  cy,
  r,
  p,
  children,
}: {
  id: string;
  cx: number;
  cy: number;
  r: number;
  p: SceneProps;
  children: ReactNode;
}) {
  const isFound = p.found.includes(id);
  return (
    <g onClick={() => p.onFind(id)} style={{ cursor: 'pointer' }}>
      <circle cx={cx} cy={cy} r={r + 10} fill="transparent" />
      {children}
      {isFound && <circle cx={cx} cy={cy} r={r} fill="none" stroke="#22c55e" strokeWidth={5} />}
      {!isFound && p.hint && (
        <motion.circle
          cx={cx}
          cy={cy}
          fill="none"
          stroke="#a855f7"
          strokeWidth={5}
          initial={{ r, opacity: 0 }}
          animate={{ r: [r, r * 1.5, r], opacity: [0.2, 0.9, 0] }}
          transition={{ duration: 1.2, repeat: 1 }}
        />
      )}
    </g>
  );
}

function Flower({ x, y, c }: { x: number; y: number; c: string }) {
  return (
    <g>
      <line x1={x} y1={y + 18} x2={x} y2={y} stroke="#3E8E3E" strokeWidth={3} />
      {[0, 72, 144, 216, 288].map((a) => (
        <circle
          key={a}
          cx={x + 7 * Math.cos((a * Math.PI) / 180)}
          cy={y + 7 * Math.sin((a * Math.PI) / 180)}
          r={5}
          fill={c}
        />
      ))}
      <circle cx={x} cy={y} r={4} fill="#FFD23F" />
    </g>
  );
}

export const SCENES: SceneDef[] = [
  // 1) PARK
  {
    id: 'park',
    title: '공원',
    bg: 'bg-[#EAF6FF]',
    objects: [
      { id: 'key', name: '열쇠' },
      { id: 'star', name: '별' },
      { id: 'fish', name: '물고기' },
      { id: 'butterfly', name: '나비' },
    ],
    render: (p) => (
      <>
        <rect x="0" y="0" width="800" height="330" fill="#CDE8FF" />
        <rect x="0" y="300" width="800" height="220" fill="#A6E08A" />
        <ellipse cx="160" cy="320" rx="200" ry="50" fill="#94D67A" />
        <ellipse cx="640" cy="322" rx="220" ry="52" fill="#94D67A" />
        <circle cx="700" cy="70" r="42" fill="#FFD23F" />
        <g fill="#ffffff">
          <ellipse cx="160" cy="80" rx="52" ry="28" />
          <circle cx="122" cy="84" r="24" />
          <circle cx="200" cy="86" r="26" />
        </g>
        <rect x="120" y="170" width="26" height="84" rx="6" fill="#C0884F" />
        <g fill="#62B86A">
          <circle cx="133" cy="156" r="54" />
          <circle cx="92" cy="176" r="34" />
          <circle cx="174" cy="176" r="34" />
        </g>
        <rect x="640" y="150" width="30" height="100" rx="6" fill="#C0884F" />
        <g fill="#57AE63">
          <circle cx="655" cy="132" r="62" />
          <circle cx="606" cy="158" r="38" />
          <circle cx="704" cy="158" r="38" />
        </g>
        <ellipse cx="250" cy="420" rx="140" ry="52" fill="#7CC5EF" />
        <ellipse cx="225" cy="410" rx="80" ry="24" fill="#A6D9F5" />
        <Flower x={430} y={360} c="#FF8FA3" />
        <Flower x={500} y={380} c="#C9A7EB" />
        <Flower x={360} y={470} c="#FFD23F" />
        <Flower x={600} y={430} c="#FF8FA3" />

        <Spot id="key" cx={112} cy={452} r={24} p={p}>
          <g transform="translate(98,440) rotate(35)">
            <circle cx="0" cy="0" r="9" fill="none" stroke="#E0A800" strokeWidth="6" />
            <rect x="7" y="-3" width="30" height="6" rx="2" fill="#E0A800" />
            <rect x="30" y="3" width="6" height="8" rx="1.5" fill="#E0A800" />
            <rect x="22" y="3" width="5" height="7" rx="1.5" fill="#E0A800" />
          </g>
        </Spot>
        <Spot id="star" cx={690} cy={120} r={22} p={p}>
          <path
            d="M690 104 L695 116 L708 117 L698 126 L701 139 L690 132 L679 139 L682 126 L672 117 L685 116 Z"
            fill="#FFD23F"
            stroke="#E0A800"
            strokeWidth="1.5"
          />
        </Spot>
        <Spot id="fish" cx={252} cy={425} r={22} p={p}>
          <g transform="translate(252,425)">
            <ellipse cx="0" cy="0" rx="17" ry="10" fill="#FF9F45" />
            <path d="M15 0 L28 -9 L28 9 Z" fill="#FF7F22" />
            <circle cx="-8" cy="-2" r="2.4" fill="#3a2a18" />
          </g>
        </Spot>
        <Spot id="butterfly" cx={560} cy={350} r={20} p={p}>
          <g transform="translate(560,350)">
            <ellipse cx="-7" cy="-5" rx="8" ry="10" fill="#FF6FA5" />
            <ellipse cx="7" cy="-5" rx="8" ry="10" fill="#FF6FA5" />
            <ellipse cx="-7" cy="8" rx="7" ry="8" fill="#FFA6C9" />
            <ellipse cx="7" cy="8" rx="7" ry="8" fill="#FFA6C9" />
            <rect x="-1.5" y="-12" width="3" height="24" rx="1.5" fill="#5F3B1A" />
          </g>
        </Spot>
      </>
    ),
  },

  // 2) ROOM
  {
    id: 'room',
    title: '아이 방',
    bg: 'bg-[#FFF3E6]',
    objects: [
      { id: 'ball', name: '공' },
      { id: 'book', name: '책' },
      { id: 'cup', name: '컵' },
      { id: 'pencil', name: '연필' },
    ],
    render: (p) => (
      <>
        <rect x="0" y="0" width="800" height="360" fill="#FBE3C9" />
        <rect x="0" y="340" width="800" height="180" fill="#D8B38A" />
        <ellipse cx="400" cy="440" rx="260" ry="60" fill="#FFC2D4" />
        <rect x="560" y="60" width="180" height="140" rx="10" fill="#BFE6FF" />
        <rect x="560" y="60" width="180" height="140" rx="10" fill="none" stroke="#fff" strokeWidth="8" />
        <line x1="650" y1="60" x2="650" y2="200" stroke="#fff" strokeWidth="6" />
        <rect x="40" y="220" width="300" height="150" rx="14" fill="#F6A6B8" />
        <rect x="40" y="190" width="120" height="60" rx="12" fill="#FFFFFF" />
        <rect x="40" y="250" width="300" height="60" rx="10" fill="#FFE3EA" />
        <rect x="430" y="150" width="230" height="22" rx="6" fill="#C0884F" />
        <rect x="450" y="110" width="18" height="42" rx="3" fill="#E24B4A" />
        <rect x="472" y="108" width="18" height="44" rx="3" fill="#379ADD" />
        <rect x="494" y="112" width="18" height="40" rx="3" fill="#63A922" />
        <rect x="640" y="250" width="120" height="120" rx="14" fill="#9AD0F0" />
        <rect x="640" y="250" width="120" height="30" rx="10" fill="#7CC0E8" />

        <Spot id="ball" cx={300} cy={430} r={26} p={p}>
          <g transform="translate(300,430)">
            <circle cx="0" cy="0" r="24" fill="#E24B4A" />
            <path d="M-24 0 A24 24 0 0 1 24 0" fill="#fff" opacity="0.85" />
            <circle cx="0" cy="0" r="24" fill="none" stroke="#A32D2D" strokeWidth="2" />
          </g>
        </Spot>
        <Spot id="book" cx={520} cy={140} r={22} p={p}>
          <g transform="translate(500,120)">
            <rect x="0" y="0" width="42" height="30" rx="3" fill="#7A5BD8" />
            <rect x="0" y="0" width="10" height="30" fill="#5A3FB0" />
            <line x1="16" y1="8" x2="36" y2="8" stroke="#fff" strokeWidth="2" />
            <line x1="16" y1="15" x2="36" y2="15" stroke="#fff" strokeWidth="2" />
          </g>
        </Spot>
        <Spot id="cup" cx={210} cy={410} r={20} p={p}>
          <g transform="translate(196,394)">
            <rect x="0" y="0" width="26" height="30" rx="4" fill="#FFD23F" />
            <path d="M26 6 q12 0 12 10 q0 10 -12 10" fill="none" stroke="#E0A800" strokeWidth="4" />
          </g>
        </Spot>
        <Spot id="pencil" cx={585} cy={172} r={18} p={p}>
          <g transform="translate(560,168) rotate(-8)">
            <rect x="0" y="0" width="46" height="9" rx="2" fill="#FFC857" />
            <path d="M46 0 L56 4.5 L46 9 Z" fill="#E8B07A" />
            <path d="M52 2 L56 4.5 L52 7 Z" fill="#5F5E5A" />
            <rect x="0" y="0" width="7" height="9" fill="#FF8FA3" />
          </g>
        </Spot>
      </>
    ),
  },

  // 3) OCEAN
  {
    id: 'sea',
    title: '바닷속',
    bg: 'bg-[#DDF2FF]',
    objects: [
      { id: 'starfish', name: '불가사리' },
      { id: 'shell', name: '조개' },
      { id: 'crab', name: '게' },
      { id: 'fish', name: '물고기' },
    ],
    render: (p) => (
      <>
        <rect x="0" y="0" width="800" height="520" fill="#3FA9DE" />
        <rect x="0" y="0" width="800" height="170" fill="#62C0EA" />
        <rect x="0" y="120" width="800" height="120" fill="#4FB4E4" />
        <rect x="0" y="430" width="800" height="90" fill="#F2DCA8" />
        <ellipse cx="400" cy="432" rx="460" ry="40" fill="#EBD08F" />
        <g fill="#2E9C6E">
          <path d="M120 430 q-18 -60 6 -120 q14 -30 0 -70" stroke="#2E9C6E" strokeWidth="14" fill="none" strokeLinecap="round" />
          <path d="M150 430 q14 -50 -4 -100" stroke="#34B07C" strokeWidth="12" fill="none" strokeLinecap="round" />
        </g>
        <g fill="#2E9C6E">
          <path d="M690 430 q20 -70 -4 -130" stroke="#34B07C" strokeWidth="14" fill="none" strokeLinecap="round" />
        </g>
        <g fill="#F58FB0">
          <circle cx="560" cy="420" r="18" />
          <circle cx="585" cy="412" r="14" />
          <circle cx="540" cy="408" r="13" />
        </g>
        <g fill="#ffffff" opacity="0.6">
          <circle cx="240" cy="120" r="7" />
          <circle cx="260" cy="90" r="5" />
          <circle cx="470" cy="150" r="6" />
          <circle cx="500" cy="110" r="4" />
        </g>

        <Spot id="starfish" cx={180} cy={460} r={24} p={p}>
          <g transform="translate(180,460)" fill="#FF8A3D">
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse
                key={a}
                cx={16 * Math.cos(((a - 90) * Math.PI) / 180)}
                cy={16 * Math.sin(((a - 90) * Math.PI) / 180)}
                rx="7"
                ry="15"
                transform={`rotate(${a} ${16 * Math.cos(((a - 90) * Math.PI) / 180)} ${16 * Math.sin(((a - 90) * Math.PI) / 180)})`}
              />
            ))}
            <circle cx="0" cy="0" r="9" fill="#FFB37A" />
          </g>
        </Spot>
        <Spot id="shell" cx={470} cy={462} r={20} p={p}>
          <g transform="translate(470,470)">
            <path d="M0 0 A22 22 0 0 1 -22 0 Z" fill="#FFC2D4" />
            <path d="M-15 -2 L-15 -16 M-7 -2 L-7 -20 M0 -2 L0 -22 M7 -2 L7 -20 M15 -2 L15 -16" stroke="#E58AA8" strokeWidth="2" />
          </g>
        </Spot>
        <Spot id="crab" cx={650} cy={460} r={22} p={p}>
          <g transform="translate(650,460)" fill="#E24B4A">
            <ellipse cx="0" cy="0" rx="20" ry="13" />
            <circle cx="-7" cy="-8" r="4" fill="#fff" />
            <circle cx="7" cy="-8" r="4" fill="#fff" />
            <circle cx="-7" cy="-8" r="2" fill="#000" />
            <circle cx="7" cy="-8" r="2" fill="#000" />
            <path d="M-20 0 q-10 -6 -14 2" stroke="#E24B4A" strokeWidth="4" fill="none" />
            <path d="M20 0 q10 -6 14 2" stroke="#E24B4A" strokeWidth="4" fill="none" />
          </g>
        </Spot>
        <Spot id="fish" cx={330} cy={210} r={22} p={p}>
          <g transform="translate(330,210)">
            <ellipse cx="0" cy="0" rx="18" ry="11" fill="#FFD23F" />
            <path d="M16 0 L30 -10 L30 10 Z" fill="#F2B600" />
            <circle cx="-9" cy="-2" r="2.6" fill="#222" />
          </g>
        </Spot>
      </>
    ),
  },

  // 4) KITCHEN
  {
    id: 'kitchen',
    title: '주방',
    bg: 'bg-[#FFF1E0]',
    objects: [
      { id: 'apple', name: '사과' },
      { id: 'carrot', name: '당근' },
      { id: 'spoon', name: '숟가락' },
      { id: 'cup', name: '컵' },
    ],
    render: (p) => (
      <>
        <rect x="0" y="0" width="800" height="330" fill="#FCEBD2" />
        <rect x="0" y="300" width="800" height="60" fill="#C97B4A" />
        <rect x="0" y="360" width="800" height="160" fill="#EAD9C2" />
        <rect x="40" y="360" width="720" height="160" rx="6" fill="#E2C9A8" />
        <line x1="270" y1="360" x2="270" y2="520" stroke="#C9A87F" strokeWidth="4" />
        <line x1="530" y1="360" x2="530" y2="520" stroke="#C9A87F" strokeWidth="4" />
        <rect x="560" y="70" width="180" height="150" rx="8" fill="#BFE6FF" />
        <rect x="560" y="70" width="180" height="150" rx="8" fill="none" stroke="#fff" strokeWidth="8" />
        <rect x="80" y="120" width="150" height="20" rx="4" fill="#C0884F" />
        <rect x="100" y="80" width="22" height="40" rx="3" fill="#9AD0F0" />
        <rect x="130" y="78" width="22" height="42" rx="3" fill="#F6A6B8" />
        <ellipse cx="400" cy="300" rx="70" ry="14" fill="#8a6d4a" />
        <rect x="340" y="250" width="120" height="50" rx="8" fill="#5F5E5A" />
        <rect x="360" y="238" width="80" height="14" rx="6" fill="#444441" />

        <Spot id="apple" cx={150} cy={285} r={20} p={p}>
          <g transform="translate(150,288)">
            <circle cx="0" cy="0" r="16" fill="#E24B4A" />
            <path d="M0 -16 q6 -8 12 -6" stroke="#63A922" strokeWidth="4" fill="none" />
            <rect x="-1.5" y="-22" width="3" height="8" rx="1.5" fill="#8a5a2a" />
          </g>
        </Spot>
        <Spot id="carrot" cx={600} cy={430} r={20} p={p}>
          <g transform="translate(600,430) rotate(20)">
            <path d="M-8 -14 L8 -14 L0 24 Z" fill="#FF7F22" />
            <path d="M-8 -14 q-6 -14 -2 -20 M0 -14 q0 -16 0 -22 M8 -14 q6 -14 2 -20" stroke="#63A922" strokeWidth="4" fill="none" />
          </g>
        </Spot>
        <Spot id="spoon" cx={300} cy={440} r={18} p={p}>
          <g transform="translate(300,420) rotate(20)">
            <ellipse cx="0" cy="0" rx="9" ry="13" fill="#C9CDD4" />
            <rect x="-3" y="10" width="6" height="34" rx="3" fill="#C9CDD4" />
          </g>
        </Spot>
        <Spot id="cup" cx={690} cy={440} r={20} p={p}>
          <g transform="translate(676,424)">
            <rect x="0" y="0" width="28" height="32" rx="4" fill="#379ADD" />
            <path d="M28 6 q12 0 12 10 q0 10 -12 10" fill="none" stroke="#185FA5" strokeWidth="4" />
          </g>
        </Spot>
      </>
    ),
  },

  // 5) SPACE
  {
    id: 'space',
    title: '우주',
    bg: 'bg-[#0B1030]',
    objects: [
      { id: 'star', name: '별' },
      { id: 'rocket', name: '로켓' },
      { id: 'moon', name: '달' },
      { id: 'comet', name: '혜성' },
    ],
    render: (p) => (
      <>
        <rect x="0" y="0" width="800" height="520" fill="#0E1440" />
        <g fill="#ffffff">
          {[
            [60, 80],
            [140, 200],
            [220, 60],
            [300, 320],
            [380, 140],
            [470, 70],
            [520, 380],
            [600, 220],
            [690, 120],
            [740, 320],
            [120, 420],
            [420, 460],
            [660, 440],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2.6 : 1.6} />
          ))}
        </g>
        <g>
          <circle cx="160" cy="360" r="80" fill="#6C63C7" />
          <ellipse cx="160" cy="360" rx="120" ry="22" fill="none" stroke="#B9A6F2" strokeWidth="8" transform="rotate(-18 160 360)" />
          <circle cx="135" cy="335" r="16" fill="#574FAE" />
          <circle cx="190" cy="380" r="22" fill="#574FAE" />
        </g>
        <g fill="#A89BF0" opacity="0.35">
          <circle cx="640" cy="160" r="60" />
          <circle cx="690" cy="180" r="44" />
        </g>

        <Spot id="star" cx={470} cy={300} r={20} p={p}>
          <path
            d="M470 286 L474 297 L486 298 L477 306 L480 318 L470 311 L460 318 L463 306 L454 298 L466 297 Z"
            fill="#FFD23F"
            stroke="#E0A800"
            strokeWidth="1.5"
          />
        </Spot>
        <Spot id="rocket" cx={560} cy={420} r={26} p={p}>
          <g transform="translate(560,420)">
            <path d="M0 -28 q14 16 14 34 L-14 6 q0 -18 14 -34 Z" fill="#EDEFF5" />
            <circle cx="0" cy="-6" r="6" fill="#379ADD" />
            <path d="M-14 6 L-24 22 L-8 14 Z" fill="#E24B4A" />
            <path d="M14 6 L24 22 L8 14 Z" fill="#E24B4A" />
            <path d="M-7 14 q7 18 14 0 Z" fill="#FFB347" />
          </g>
        </Spot>
        <Spot id="moon" cx={700} cy={400} r={22} p={p}>
          <g transform="translate(700,400)">
            <path d="M0 -18 a18 18 0 1 0 12 32 a14 14 0 1 1 -12 -32 Z" fill="#E8E6D6" />
          </g>
        </Spot>
        <Spot id="comet" cx={300} cy={130} r={20} p={p}>
          <g transform="translate(300,130)">
            <path d="M-6 6 L-40 30 L2 10 Z" fill="#9AD0F0" opacity="0.7" />
            <circle cx="0" cy="0" r="11" fill="#BFE6FF" />
            <circle cx="0" cy="0" r="6" fill="#fff" />
          </g>
        </Spot>
      </>
    ),
  },

  // 6) BEACH
  {
    id: 'beach',
    title: '해변',
    bg: 'bg-[#EAF6FF]',
    objects: [
      { id: 'shell', name: '조개' },
      { id: 'starfish', name: '불가사리' },
      { id: 'bucket', name: '양동이' },
      { id: 'ball', name: '공' },
    ],
    render: (p) => (
      <>
        <rect x="0" y="0" width="800" height="240" fill="#CDE8FF" />
        <rect x="0" y="220" width="800" height="110" fill="#5BC0E8" />
        <rect x="0" y="300" width="800" height="220" fill="#F2DCA8" />
        <ellipse cx="400" cy="305" rx="500" ry="30" fill="#EBD08F" />
        <path d="M0 250 q60 -16 120 0 t120 0 t120 0 t120 0 t120 0 t80 0 v40 H0 Z" fill="#7CD0EE" opacity="0.6" />
        <circle cx="700" cy="80" r="44" fill="#FFD23F" />
        <g stroke="#FFD23F" strokeWidth="5" strokeLinecap="round">
          <line x1="700" y1="18" x2="700" y2="2" />
          <line x1="762" y1="80" x2="780" y2="80" />
          <line x1="744" y1="36" x2="756" y2="24" />
        </g>
        <rect x="120" y="120" width="14" height="200" rx="4" fill="#B07A3A" />
        <g fill="#3FA96B">
          <path d="M127 120 q-60 -10 -90 -34 q40 4 90 18 Z" />
          <path d="M127 120 q60 -10 90 -34 q-40 4 -90 18 Z" />
          <path d="M127 122 q-50 18 -78 50 q44 -16 78 -28 Z" />
          <path d="M127 122 q50 18 78 50 q-44 -16 -78 -28 Z" />
        </g>
        <g transform="translate(330,360)">
          <path d="M-70 0 a70 70 0 0 1 140 0 Z" fill="#E24B4A" />
          <rect x="-6" y="-78" width="12" height="78" rx="4" fill="#8a5a2a" />
        </g>

        <Spot id="shell" cx={520} cy={420} r={20} p={p}>
          <g transform="translate(520,428)">
            <path d="M0 0 A22 22 0 0 1 -22 0 Z" fill="#FFB37A" />
            <path d="M-15 -2 L-15 -16 M-7 -2 L-7 -20 M0 -2 L0 -22 M7 -2 L7 -20 M15 -2 L15 -16" stroke="#E08A4A" strokeWidth="2" />
          </g>
        </Spot>
        <Spot id="starfish" cx={620} cy={470} r={22} p={p}>
          <g transform="translate(620,470)" fill="#FF8A3D">
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse
                key={a}
                cx={15 * Math.cos(((a - 90) * Math.PI) / 180)}
                cy={15 * Math.sin(((a - 90) * Math.PI) / 180)}
                rx="6"
                ry="14"
                transform={`rotate(${a} ${15 * Math.cos(((a - 90) * Math.PI) / 180)} ${15 * Math.sin(((a - 90) * Math.PI) / 180)})`}
              />
            ))}
            <circle cx="0" cy="0" r="8" fill="#FFB37A" />
          </g>
        </Spot>
        <Spot id="bucket" cx={200} cy={440} r={24} p={p}>
          <g transform="translate(200,420)">
            <path d="M-22 0 L22 0 L17 44 L-17 44 Z" fill="#379ADD" />
            <rect x="-24" y="-4" width="48" height="8" rx="4" fill="#185FA5" />
            <path d="M-20 0 a20 12 0 0 1 40 0" fill="none" stroke="#185FA5" strokeWidth="4" />
          </g>
        </Spot>
        <Spot id="ball" cx={430} cy={470} r={22} p={p}>
          <g transform="translate(430,470)">
            <circle cx="0" cy="0" r="20" fill="#fff" />
            <path d="M0 -20 a20 20 0 0 1 17 10 L0 0 Z" fill="#E24B4A" />
            <path d="M17 10 a20 20 0 0 1 -34 0 L0 0 Z" fill="#FFD23F" />
            <path d="M-17 10 a20 20 0 0 1 17 -30 L0 0 Z" fill="#379ADD" />
            <circle cx="0" cy="0" r="20" fill="none" stroke="#cccccc" strokeWidth="1.5" />
          </g>
        </Spot>
      </>
    ),
  },
];
