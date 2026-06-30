/**
 * Tiny offline sound helper built on the Web Audio API.
 *
 * The Figma export pulled success sounds from a hard-coded external URL
 * (assets.mixkit.co), which can fail offline or be blocked by the network.
 * Synthesizing short tones locally keeps the games working anywhere and
 * needs zero audio assets.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AudioCtx =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  // Browsers suspend the context until a user gesture; resume on demand.
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, startOffset: number, duration: number, type: OscillatorType = 'sine', peak = 0.2) {
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  const start = audio.currentTime + startOffset;

  osc.type = type;
  osc.frequency.value = freq;

  // Soft attack/decay so it sounds gentle rather than clicky.
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gain).connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Cheerful rising two-note chime for a correct action. */
export function playCorrect() {
  tone(523.25, 0, 0.15); // C5
  tone(783.99, 0.12, 0.2); // G5
}

/** Gentle low "boop" for a wrong action — not harsh, this is for little kids. */
export function playWrong() {
  tone(220, 0, 0.18, 'triangle'); // A3
}

/** Quick bright "pop" — for catching/popping things. */
export function playPop() {
  tone(880, 0, 0.08); // A5
}

/** Soft short "tap" for each step taken (e.g. moving through a maze). */
export function playStep() {
  tone(300, 0, 0.05, 'triangle', 0.1); // low, gentle, quiet — fine to repeat rapidly
}

/** Rising three-note flourish when a level is cleared / advanced. */
export function playLevelUp() {
  tone(523.25, 0, 0.12); // C5
  tone(659.25, 0.1, 0.12); // E5
  tone(783.99, 0.2, 0.18); // G5
}

/** Bigger celebratory fanfare for finishing a game (final clear). */
export function playFanfare() {
  tone(523.25, 0, 0.14); // C5
  tone(659.25, 0.13, 0.14); // E5
  tone(783.99, 0.26, 0.14); // G5
  tone(1046.5, 0.39, 0.3); // C6
}

/**
 * Speak a short bit of text out loud (Korean by default) using the Web Speech
 * API. Used by the "animal sounds" quiz so the play button actually makes a
 * sound — the Figma export had a play button that did nothing.
 */
export function speak(text: string, lang = 'ko-KR') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9;
  utterance.pitch = 1.2; // a touch higher — friendlier for kids
  window.speechSynthesis.speak(utterance);
}
