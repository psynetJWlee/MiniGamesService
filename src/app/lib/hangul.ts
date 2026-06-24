/**
 * Minimal Hangul jamo composition for the "한글 만들기" game.
 *
 * A modern Hangul syllable = (초성 × 21 + 중성) × 28 + 종성, offset from
 * U+AC00. We only need simple syllables (no 받침, no complex vowels) for the
 * kids' game, but compose/decompose handle the full set.
 */

export const CHO = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ',
  'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

export const JUNG = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ',
  'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ',
];

export const JONG = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ',
  'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ',
  'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

const BASE = 0xac00;

export interface JamoParts {
  cho: string;
  jung: string;
  jong: string;
}

/** Split a precomposed syllable into its jamo. Returns null if not Hangul. */
export function decompose(syllable: string): JamoParts | null {
  const code = syllable.charCodeAt(0) - BASE;
  if (code < 0 || code > 11171) return null;
  const jong = code % 28;
  const jung = ((code - jong) / 28) % 21;
  const cho = (((code - jong) / 28 - jung) / 21) | 0;
  return { cho: CHO[cho], jung: JUNG[jung], jong: JONG[jong] };
}

/** Build a syllable from jamo. Returns '' on an invalid combination. */
export function compose(cho: string, jung: string, jong = ''): string {
  const ci = CHO.indexOf(cho);
  const ji = JUNG.indexOf(jung);
  const ki = JONG.indexOf(jong);
  if (ci < 0 || ji < 0 || ki < 0) return '';
  return String.fromCharCode(BASE + (ci * 21 + ji) * 28 + ki);
}

/** Is this jamo a vowel (중성)? */
export function isVowel(jamo: string): boolean {
  return JUNG.includes(jamo);
}
