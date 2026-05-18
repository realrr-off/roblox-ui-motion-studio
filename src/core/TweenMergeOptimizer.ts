import type { Keyframe, TargetProperty, TweenState } from '../state/store';
import { groupKeyframesByLane } from './PropertyLanes';

export interface TweenSegment {
  targetId: string;
  property: TargetProperty;
  startTime: number;
  endTime: number;
  startValue: unknown;
  endValue: unknown;
  easingStyle: Keyframe['easingStyle'];
  easingDirection: Keyframe['easingDirection'];
  customBezier?: Keyframe['customBezier'];
  startKeyframeId: string;
  endKeyframeId: string;
}

export interface MergedTweenCall {
  targetId: string;
  startTime: number;
  duration: number;
  easingStyle: Keyframe['easingStyle'];
  easingDirection: Keyframe['easingDirection'];
  customBezier?: Keyframe['customBezier'];
  goals: Partial<Record<TargetProperty, unknown>>;
  segmentIds: string[];
  mergedProperties: TargetProperty[];
}

const easingKeyFromSegment = (seg: Pick<TweenSegment, 'easingStyle' | 'easingDirection' | 'customBezier'>): string => {
  const bezier = seg.customBezier?.join(',') ?? '';
  return `${seg.easingStyle}|${seg.easingDirection}|${bezier}`;
};

export const extractSegments = (state: TweenState): TweenSegment[] => {
  const grouped = groupKeyframesByLane(state.keyframes);
  const segments: TweenSegment[] = [];

  Object.keys(grouped).forEach((targetId) => {
    Object.keys(grouped[targetId]).forEach((prop) => {
      const property = prop as TargetProperty;
      const kfs = grouped[targetId][property];
      for (let i = 0; i < kfs.length - 1; i++) {
        const start = kfs[i];
        const end = kfs[i + 1];
        if (end.time <= start.time) continue;
        segments.push({
          targetId,
          property,
          startTime: start.time,
          endTime: end.time,
          startValue: start.value,
          endValue: end.value,
          easingStyle: start.easingStyle,
          easingDirection: start.easingDirection,
          customBezier: start.customBezier,
          startKeyframeId: start.id,
          endKeyframeId: end.id,
        });
      }
    });
  });

  return segments;
};

const canMergeSegments = (a: TweenSegment, b: TweenSegment): boolean => {
  return (
    a.targetId === b.targetId &&
    Math.abs(a.startTime - b.startTime) < 0.001 &&
    Math.abs(a.endTime - b.endTime) < 0.001 &&
    easingKeyFromSegment(a) === easingKeyFromSegment(b)
  );
};

/**
 * Combine compatible property tweens (same target, window, easing) into single TweenService calls.
 */
export const optimizeMergedTweens = (state: TweenState): MergedTweenCall[] => {
  const segments = extractSegments(state);
  const merged: MergedTweenCall[] = [];
  const used = new Set<number>();

  segments.forEach((seg, idx) => {
    if (used.has(idx)) return;

    const group: TweenSegment[] = [seg];
    used.add(idx);

    segments.forEach((other, otherIdx) => {
      if (used.has(otherIdx)) return;
      if (canMergeSegments(seg, other)) {
        group.push(other);
        used.add(otherIdx);
      }
    });

    const goals: Partial<Record<TargetProperty, unknown>> = {};
    const segmentIds: string[] = [];
    const mergedProperties: TargetProperty[] = [];

    group.forEach((g) => {
      goals[g.property] = g.endValue;
      segmentIds.push(`${g.startKeyframeId}->${g.endKeyframeId}`);
      mergedProperties.push(g.property);
    });

    merged.push({
      targetId: seg.targetId,
      startTime: seg.startTime,
      duration: Math.max(0.01, seg.endTime - seg.startTime),
      easingStyle: seg.easingStyle,
      easingDirection: seg.easingDirection,
      customBezier: seg.customBezier,
      goals,
      segmentIds,
      mergedProperties,
    });
  });

  return merged.sort((a, b) => a.startTime - b.startTime || a.targetId.localeCompare(b.targetId));
};

export const getMergeStats = (state: TweenState): { rawCalls: number; mergedCalls: number; saved: number } => {
  const segments = extractSegments(state);
  const merged = optimizeMergedTweens(state);
  return {
    rawCalls: segments.length,
    mergedCalls: merged.length,
    saved: Math.max(0, segments.length - merged.length),
  };
};
