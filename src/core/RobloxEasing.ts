import type { EasingStyle, EasingDirection, CustomBezier } from '../state/store';

export type EasingFunc = (t: number) => number;

const easings: Record<string, EasingFunc> = {
  Linear: (t) => t,
  Quad: (t) => t * t,
  Cubic: (t) => t * t * t,
  Quart: (t) => t * t * t * t,
  Quint: (t) => t * t * t * t * t,
  Sine: (t) => 1 - Math.cos((t * Math.PI) / 2),
  Expo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
  Circ: (t) => 1 - Math.sqrt(1 - t * t),
  Elastic: (t) => {
    if (t === 0 || t === 1) return t;
    const p = 0.3;
    const s = p / 4;
    const tAdj = t - 1;
    return -Math.pow(2, 10 * tAdj) * Math.sin(((tAdj - s) * (2 * Math.PI)) / p);
  },
  Back: (t) => {
    const s = 1.70158;
    return t * t * ((s + 1) * t - s);
  },
  Bounce: (t) => {
    let x = t;
    if (x < 1 / 2.75) {
      return 7.5625 * x * x;
    } else if (x < 2 / 2.75) {
      return 7.5625 * (x -= 1.5 / 2.75) * x + 0.75;
    } else if (x < 2.5 / 2.75) {
      return 7.5625 * (x -= 2.25 / 2.75) * x + 0.9375;
    }
    return 7.5625 * (x -= 2.625 / 2.75) * x + 0.984375;
  },
};

export const getBezierY = (mX1: number, mY1: number, mX2: number, mY2: number, x: number): number => {
  if (mX1 === mY1 && mX2 === mY2) return x;

  let t = x;
  for (let i = 0; i < 8; ++i) {
    const currentX =
      3 * Math.pow(1 - t, 2) * t * mX1 +
      3 * (1 - t) * Math.pow(t, 2) * mX2 +
      Math.pow(t, 3) -
      x;
    if (Math.abs(currentX) < 0.0001) break;
    const derivativeX =
      3 * Math.pow(1 - t, 2) * mX1 +
      6 * (1 - t) * t * (mX2 - mX1) +
      3 * Math.pow(t, 2) * (1 - mX2);
    if (Math.abs(derivativeX) < 1e-6) break;
    t -= currentX / derivativeX;
  }
  t = Math.max(0, Math.min(1, t));
  return 3 * Math.pow(1 - t, 2) * t * mY1 + 3 * (1 - t) * Math.pow(t, 2) * mY2 + Math.pow(t, 3);
};

export const applyEasing = (
  t: number,
  style: EasingStyle,
  direction: EasingDirection,
  bezier?: CustomBezier,
): number => {
  if (style === 'CustomBezier' && bezier) {
    return getBezierY(bezier[0], bezier[1], bezier[2], bezier[3], t);
  }

  const baseFunc = easings[style] || easings.Linear;

  if (style === 'Bounce') {
    if (direction === 'Out') return baseFunc(t);
    if (direction === 'In') return 1 - baseFunc(1 - t);
    return t < 0.5 ? (1 - baseFunc(1 - 2 * t)) / 2 : (1 + baseFunc(2 * t - 1)) / 2;
  }

  if (direction === 'In') return baseFunc(t);
  if (direction === 'Out') return 1 - baseFunc(1 - t);
  return t < 0.5 ? baseFunc(2 * t) / 2 : 1 - baseFunc(2 * (1 - t)) / 2;
};

/** Roblox Heartbeat default — 60 Hz */
export const ROBLOX_DEFAULT_FPS = 60;

export const robloxFrameDuration = (fps: number = ROBLOX_DEFAULT_FPS): number => 1 / fps;

/** Quantize time to the nearest simulation frame boundary */
export const quantizeToFrame = (time: number, fps: number = ROBLOX_DEFAULT_FPS): number => {
  const frame = robloxFrameDuration(fps);
  return Math.round(time / frame) * frame;
};
