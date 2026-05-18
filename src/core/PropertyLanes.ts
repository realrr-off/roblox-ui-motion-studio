import type { Keyframe, TargetProperty, TweenState, UIObject } from '../state/store';

/** Canonical property lanes — isolated editable tracks per Roblox instance property */
export const PROPERTY_LANE_ORDER: TargetProperty[] = [
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

export const PROPERTY_LANE_COLORS: Record<TargetProperty, string> = {
  Position: '#00f0ff',
  Size: '#a78bfa',
  Rotation: '#f472b6',
  Transparency: '#94a3b8',
  BackgroundColor3: '#fbbf24',
  BorderColor3: '#34d399',
  TextTransparency: '#60a5fa',
  TextSize: '#fb923c',
  AnchorPoint: '#e879f9',
};

export const PROPERTY_LANE_SHORT: Record<TargetProperty, string> = {
  Position: 'Pos',
  Size: 'Size',
  Rotation: 'Rot',
  Transparency: 'Trans',
  BackgroundColor3: 'Bg',
  BorderColor3: 'Border',
  TextTransparency: 'TxtT',
  TextSize: 'TxtSz',
  AnchorPoint: 'Anchor',
};

export interface PropertyLane {
  targetId: string;
  property: TargetProperty;
  keyframes: Keyframe[];
  hasKeyframes: boolean;
}

export interface ObjectLaneGroup {
  object: UIObject;
  lanes: PropertyLane[];
  collapsed: boolean;
}

export const groupKeyframesByLane = (
  keyframes: Record<string, Keyframe>,
): Record<string, Record<TargetProperty, Keyframe[]>> => {
  const grouped: Record<string, Record<TargetProperty, Keyframe[]>> = {};

  Object.values(keyframes).forEach((kf) => {
    if (!grouped[kf.targetId]) grouped[kf.targetId] = {} as Record<TargetProperty, Keyframe[]>;
    if (!grouped[kf.targetId][kf.property]) grouped[kf.targetId][kf.property] = [];
    grouped[kf.targetId][kf.property].push(kf);
  });

  Object.keys(grouped).forEach((targetId) => {
    PROPERTY_LANE_ORDER.forEach((prop) => {
      if (grouped[targetId][prop]) {
        grouped[targetId][prop].sort((a, b) => a.time - b.time);
      }
    });
  });

  return grouped;
};

export const buildObjectLaneGroups = (
  state: TweenState,
  options?: { showEmptyLanes?: boolean; hiddenProperties?: TargetProperty[] },
): ObjectLaneGroup[] => {
  const grouped = groupKeyframesByLane(state.keyframes);
  const showEmpty = options?.showEmptyLanes ?? state.laneSettings.showEmptyLanes;
  const hidden = new Set(options?.hiddenProperties ?? state.laneSettings.hiddenProperties);

  return Object.values(state.objects).map((obj) => {
    const lanes: PropertyLane[] = [];

    PROPERTY_LANE_ORDER.forEach((property) => {
      if (hidden.has(property)) return;
      const kfs = grouped[obj.id]?.[property] ?? [];
      if (!showEmpty && kfs.length === 0) return;
      lanes.push({
        targetId: obj.id,
        property,
        keyframes: kfs,
        hasKeyframes: kfs.length > 0,
      });
    });

    return {
      object: obj,
      lanes,
      collapsed: state.laneSettings.collapsedObjects[obj.id] ?? false,
    };
  });
};

export const getLaneKeyframes = (
  keyframes: Record<string, Keyframe>,
  targetId: string,
  property: TargetProperty,
): Keyframe[] => {
  return Object.values(keyframes)
    .filter((kf) => kf.targetId === targetId && kf.property === property)
    .sort((a, b) => a.time - b.time);
};
