import type { Keyframe, TargetProperty, TweenState } from '../state/store';
import { getLaneKeyframes } from './PropertyLanes';

export type ConflictSeverity = 'error' | 'warning';

export type ConflictType =
  | 'duplicate_timestamp'
  | 'zero_duration_segment'
  | 'overlapping_segments'
  | 'non_monotonic_time';

export interface TweenConflict {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  targetId: string;
  property: TargetProperty;
  time: number;
  message: string;
  keyframeIds: string[];
}

const valuesEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;
  return JSON.stringify(a) === JSON.stringify(b);
};

interface Segment {
  startTime: number;
  endTime: number;
  startId: string;
  endId: string;
}

const buildSegments = (keyframes: Keyframe[]): Segment[] => {
  const segments: Segment[] = [];
  for (let i = 0; i < keyframes.length - 1; i++) {
    segments.push({
      startTime: keyframes[i].time,
      endTime: keyframes[i + 1].time,
      startId: keyframes[i].id,
      endId: keyframes[i + 1].id,
    });
  }
  return segments;
};

const segmentsOverlap = (a: Segment, b: Segment): boolean => {
  return a.startTime < b.endTime && b.startTime < a.endTime;
};

export const detectLaneConflicts = (
  targetId: string,
  property: TargetProperty,
  keyframes: Keyframe[],
): TweenConflict[] => {
  const conflicts: TweenConflict[] = [];
  if (keyframes.length === 0) return conflicts;

  const sorted = [...keyframes].sort((a, b) => a.time - b.time);

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].time < sorted[i - 1].time) {
      conflicts.push({
        id: `conflict_non_mono_${sorted[i].id}`,
        type: 'non_monotonic_time',
        severity: 'error',
        targetId,
        property,
        time: sorted[i].time,
        message: `Keyframe at ${sorted[i].time.toFixed(2)}s is before ${sorted[i - 1].time.toFixed(2)}s on ${property}`,
        keyframeIds: [sorted[i - 1].id, sorted[i].id],
      });
    }
  }

  const byTime = new Map<number, Keyframe[]>();
  sorted.forEach((kf) => {
    const rounded = Math.round(kf.time * 1000) / 1000;
    const list = byTime.get(rounded) ?? [];
    list.push(kf);
    byTime.set(rounded, list);
  });

  byTime.forEach((atTime, time) => {
    if (atTime.length < 2) return;

    const distinctValues = atTime.some((kf, _, arr) => !valuesEqual(kf.value, arr[0].value));
    conflicts.push({
      id: `conflict_dup_${targetId}_${property}_${time}`,
      type: 'duplicate_timestamp',
      severity: distinctValues ? 'error' : 'warning',
      targetId,
      property,
      time,
      message: distinctValues
        ? `${atTime.length} keyframes at ${time.toFixed(2)}s on ${property} with conflicting values`
        : `${atTime.length} duplicate keyframes at ${time.toFixed(2)}s on ${property}`,
      keyframeIds: atTime.map((kf) => kf.id),
    });
  });

  const segments = buildSegments(sorted);
  segments.forEach((seg) => {
    if (seg.endTime <= seg.startTime) {
      conflicts.push({
        id: `conflict_zero_${seg.startId}_${seg.endId}`,
        type: 'zero_duration_segment',
        severity: 'error',
        targetId,
        property,
        time: seg.startTime,
        message: `Zero-duration tween on ${property} at ${seg.startTime.toFixed(2)}s (overlapping timestamps)`,
        keyframeIds: [seg.startId, seg.endId],
      });
    }
  });

  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      if (segmentsOverlap(segments[i], segments[j])) {
        conflicts.push({
          id: `conflict_overlap_${segments[i].startId}_${segments[j].startId}`,
          type: 'overlapping_segments',
          severity: 'error',
          targetId,
          property,
          time: Math.max(segments[i].startTime, segments[j].startTime),
          message: `Overlapping tweens on ${property} between ${segments[i].startTime.toFixed(2)}s–${segments[i].endTime.toFixed(2)}s and ${segments[j].startTime.toFixed(2)}s–${segments[j].endTime.toFixed(2)}s`,
          keyframeIds: [segments[i].startId, segments[i].endId, segments[j].startId, segments[j].endId],
        });
      }
    }
  }

  return conflicts;
};

export const detectAllConflicts = (state: TweenState): TweenConflict[] => {
  const seen = new Set<string>();
  const all: TweenConflict[] = [];

  Object.keys(state.objects).forEach((targetId) => {
    const properties = new Set<TargetProperty>();
    Object.values(state.keyframes).forEach((kf) => {
      if (kf.targetId === targetId) properties.add(kf.property);
    });

    properties.forEach((property) => {
      const laneKfs = getLaneKeyframes(state.keyframes, targetId, property);
      detectLaneConflicts(targetId, property, laneKfs).forEach((c) => {
        if (!seen.has(c.id)) {
          seen.add(c.id);
          all.push(c);
        }
      });
    });
  });

  return all.sort((a, b) => a.time - b.time);
};

export const getConflictsForKeyframe = (
  conflicts: TweenConflict[],
  keyframeId: string,
): TweenConflict[] => {
  return conflicts.filter((c) => c.keyframeIds.includes(keyframeId));
};
