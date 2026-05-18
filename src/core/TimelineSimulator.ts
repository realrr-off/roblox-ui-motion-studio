import type { Keyframe, TargetProperty, TweenState, UIObject } from '../state/store';
import { applyEasing, quantizeToFrame, robloxFrameDuration, ROBLOX_DEFAULT_FPS } from './RobloxEasing';
import { groupKeyframesByLane } from './PropertyLanes';

export interface SimulatedPropertyValue {
  property: TargetProperty;
  value: unknown;
}

export interface SimulatedObjectState {
  targetId: string;
  properties: Partial<Record<TargetProperty, unknown>>;
}

export interface SimulationFrame {
  frameIndex: number;
  time: number;
  objects: SimulatedObjectState[];
}

const hexToRgb = (hex: string) => {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
};

const getInitialValue = (obj: UIObject, prop: TargetProperty): unknown => {
  const p = obj.properties;
  switch (prop) {
    case 'Position':
      return p.position;
    case 'Size':
      return p.size;
    case 'Rotation':
      return p.rotation;
    case 'BackgroundColor3':
      return p.backgroundColor;
    case 'Transparency':
      return p.transparency;
    case 'BorderColor3':
      return p.borderColor;
    case 'TextTransparency':
      return p.textTransparency;
    case 'TextSize':
      return p.textSize;
    case 'AnchorPoint':
      return p.anchorPoint;
    default:
      return 0;
  }
};

export const interpolateProperty = (
  start: unknown,
  end: unknown,
  prop: TargetProperty,
  alpha: number,
): unknown => {
  if (prop === 'Position' || prop === 'Size' || prop === 'AnchorPoint') {
    const s = start as Record<string, number>;
    const e = end as Record<string, number>;
    const result: Record<string, number> = {};
    if (s.x !== undefined && e.x !== undefined) result.x = s.x + (e.x - s.x) * alpha;
    if (s.y !== undefined && e.y !== undefined) result.y = s.y + (e.y - s.y) * alpha;
    if (s.width !== undefined && e.width !== undefined) result.width = s.width + (e.width - s.width) * alpha;
    if (s.height !== undefined && e.height !== undefined) result.height = s.height + (e.height - s.height) * alpha;
    return result;
  }

  if (prop === 'BackgroundColor3' || prop === 'BorderColor3') {
    const rgbStart = hexToRgb(start as string);
    const rgbEnd = hexToRgb(end as string);
    const r = Math.round(rgbStart.r + (rgbEnd.r - rgbStart.r) * alpha);
    const g = Math.round(rgbStart.g + (rgbEnd.g - rgbStart.g) * alpha);
    const b = Math.round(rgbStart.b + (rgbEnd.b - rgbStart.b) * alpha);
    return `rgb(${r}, ${g}, ${b})`;
  }

  return (start as number) + ((end as number) - (start as number)) * alpha;
};

const evaluateLaneAtTime = (
  obj: UIObject,
  prop: TargetProperty,
  kfs: Keyframe[],
  time: number,
): unknown => {
  let value = getInitialValue(obj, prop);

  if (kfs.length === 0) return value;

  if (time <= kfs[0].time) {
    if (time < kfs[0].time) return value;
    return kfs[0].value;
  }

  if (time >= kfs[kfs.length - 1].time) {
    return kfs[kfs.length - 1].value;
  }

  for (let i = 0; i < kfs.length - 1; i++) {
    const kfStart = kfs[i];
    const kfEnd = kfs[i + 1];
    if (time >= kfStart.time && time < kfEnd.time) {
      const duration = kfEnd.time - kfStart.time;
      const t = (time - kfStart.time) / duration;
      const alpha = kfStart.isHold
        ? 0
        : applyEasing(t, kfStart.easingStyle, kfStart.easingDirection, kfStart.customBezier);
      return interpolateProperty(kfStart.value, kfEnd.value, prop, alpha);
    }
    if (time === kfEnd.time) {
      return kfEnd.value;
    }
  }

  return kfs[kfs.length - 1].value;
};

/**
 * Deterministic Roblox TweenService-style evaluation at a quantized frame time.
 */
export const evaluateAtSimTime = (
  state: TweenState,
  time: number,
  fps: number = ROBLOX_DEFAULT_FPS,
): SimulatedObjectState[] => {
  const quantized = quantizeToFrame(time, fps);
  const grouped = groupKeyframesByLane(state.keyframes);
  const props: TargetProperty[] = [
    'Position',
    'Size',
    'Rotation',
    'Transparency',
    'BackgroundColor3',
    'BorderColor3',
    'TextTransparency',
    'TextSize',
    'AnchorPoint',
  ];

  return Object.values(state.objects).map((obj) => {
    const properties: Partial<Record<TargetProperty, unknown>> = {};
    props.forEach((prop) => {
      const kfs = grouped[obj.id]?.[prop] ?? [];
      properties[prop] = evaluateLaneAtTime(obj, prop, kfs, quantized);
    });
    return { targetId: obj.id, properties };
  });
};

/**
 * Precompute every frame in [0, duration] for scrubbing / export validation.
 */
export const simulateTimeline = (
  state: TweenState,
  fps: number = state.laneSettings.simulationFps,
): SimulationFrame[] => {
  const frameDt = robloxFrameDuration(fps);
  const frames: SimulationFrame[] = [];
  const totalFrames = Math.ceil(state.timeline.duration / frameDt) + 1;

  for (let i = 0; i < totalFrames; i++) {
    const time = Math.min(i * frameDt, state.timeline.duration);
    frames.push({
      frameIndex: i,
      time,
      objects: evaluateAtSimTime(state, time, fps),
    });
  }

  return frames;
};

export class TimelineSimulator {
  private frames: SimulationFrame[] = [];
  private fps: number = ROBLOX_DEFAULT_FPS;

  rebuild(state: TweenState): void {
    this.fps = state.laneSettings.simulationFps;
    this.frames = simulateTimeline(state, this.fps);
  }

  getFrameCount(): number {
    return this.frames.length;
  }

  getFps(): number {
    return this.fps;
  }

  getFrameAtTime(time: number): SimulationFrame | null {
    if (this.frames.length === 0) return null;
    const frameDt = robloxFrameDuration(this.fps);
    const idx = Math.min(Math.round(time / frameDt), this.frames.length - 1);
    return this.frames[idx] ?? null;
  }

  evaluate(time: number, state: TweenState): SimulatedObjectState[] {
    return evaluateAtSimTime(state, time, this.fps);
  }
}
