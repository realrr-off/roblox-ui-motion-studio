import { useSyncExternalStore } from 'react';

export type EasingStyle =
  | 'Linear'
  | 'Sine'
  | 'Quad'
  | 'Cubic'
  | 'Quart'
  | 'Quint'
  | 'Expo'
  | 'Circ'
  | 'Elastic'
  | 'Back'
  | 'Bounce'
  | 'CustomBezier';

export type EasingDirection = 'In' | 'Out' | 'InOut';

export type TargetProperty =
  | 'Position'
  | 'Size'
  | 'Rotation'
  | 'BackgroundColor3'
  | 'Transparency'
  | 'BorderColor3'
  | 'TextTransparency'
  | 'TextSize'
  | 'AnchorPoint';

export type UIObjectType = 'Frame' | 'Button' | 'Label' | 'Icon';

export type CustomBezier = [number, number, number, number];

export interface PropertyValues {
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  backgroundColor: string;
  transparency: number;
  borderColor: string;
  textTransparency: number;
  textSize: number;
  anchorPoint: { x: number; y: number };
}

export interface UIObject {
  id: string;
  name: string;
  type: UIObjectType;
  parentId: string | null;
  inheritTransform: boolean;
  properties: PropertyValues;
}

export interface Keyframe {
  id: string;
  targetId: string;
  property: TargetProperty;
  time: number; // seconds
  value: any;
  easingStyle: EasingStyle;
  easingDirection: EasingDirection;
  customBezier?: CustomBezier;
  isHold?: boolean;
}

export interface TimelineState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isLooping: boolean;
  playbackSpeed: number;
  selectedObjectId: string | null;
  selectedKeyframeId: string | null;
}

export interface LaneSettings {
  showEmptyLanes: boolean;
  hiddenProperties: TargetProperty[];
  collapsedObjects: Record<string, boolean>;
  mergeOptimization: boolean;
  simulationFps: number;
  useFrameAccuratePlayback: boolean;
}

export interface TweenState {
  objects: Record<string, UIObject>;
  keyframes: Record<string, Keyframe>;
  timeline: TimelineState;
  laneSettings: LaneSettings;
  exportFormat: 'Script' | 'ModuleScript' | 'Function';
  activeTab: 'timeline' | 'bezier' | 'config';
}

export type Action =
  | { type: 'SELECT_OBJECT'; payload: string | null }
  | { type: 'SELECT_KEYFRAME'; payload: string | null }
  | { type: 'ADD_OBJECT'; payload: { name: string; type: UIObjectType; parentId: string | null; properties?: Partial<PropertyValues> } }
  | { type: 'REMOVE_OBJECT'; payload: string }
  | { type: 'UPDATE_OBJECT_PROP'; payload: { id: string; prop: TargetProperty; value: any } }
  | { type: 'TOGGLE_INHERIT_TRANSFORM'; payload: string }
  | { type: 'ADD_KEYFRAME'; payload: Omit<Keyframe, 'id'> }
  | { type: 'UPDATE_KEYFRAME'; payload: { id: string; updates: Partial<Keyframe> } }
  | { type: 'REMOVE_KEYFRAME'; payload: string }
  | { type: 'SET_TIMELINE_TIME'; payload: number }
  | { type: 'SET_TIMELINE_PLAYING'; payload: boolean }
  | { type: 'SET_TIMELINE_DURATION'; payload: number }
  | { type: 'SET_TIMELINE_LOOP'; payload: boolean }
  | { type: 'SET_PLAYBACK_SPEED'; payload: number }
  | { type: 'SET_EXPORT_FORMAT'; payload: 'Script' | 'ModuleScript' | 'Function' }
  | { type: 'SET_ACTIVE_TAB'; payload: 'timeline' | 'bezier' | 'config' }
  | { type: 'SET_LANE_SHOW_EMPTY'; payload: boolean }
  | { type: 'TOGGLE_LANE_PROPERTY'; payload: TargetProperty }
  | { type: 'TOGGLE_OBJECT_LANES_COLLAPSED'; payload: string }
  | { type: 'SET_MERGE_OPTIMIZATION'; payload: boolean }
  | { type: 'SET_SIMULATION_FPS'; payload: number }
  | { type: 'SET_FRAME_ACCURATE_PLAYBACK'; payload: boolean }
  | { type: 'BATCH_APPLY_PRESET'; payload: { targetIds: string[]; presetType: string } }
  | { type: 'RESET_STATE' };

const defaultLaneSettings = (): LaneSettings => ({
  showEmptyLanes: true,
  hiddenProperties: [],
  collapsedObjects: {},
  mergeOptimization: true,
  simulationFps: 60,
  useFrameAccuratePlayback: true,
});

const defaultPropValues = (): PropertyValues => ({
  position: { x: 0.5, y: 0.5 },
  size: { width: 0.4, height: 0.4 },
  rotation: 0,
  backgroundColor: '#1e293b',
  transparency: 0,
  borderColor: '#38bdf8',
  textTransparency: 0,
  textSize: 18,
  anchorPoint: { x: 0.5, y: 0.5 },
});

const initialObjects: Record<string, UIObject> = {
  'obj_modal': {
    id: 'obj_modal',
    name: 'Modal Dialog Frame',
    type: 'Frame',
    parentId: null,
    inheritTransform: true,
    properties: {
      ...defaultPropValues(),
      position: { x: 0.5, y: 0.5 },
      size: { width: 0.35, height: 0.5 },
      backgroundColor: '#0f172a',
      borderColor: '#8a2be2',
    },
  },
  'obj_btn': {
    id: 'obj_btn',
    name: 'Primary Action Button',
    type: 'Button',
    parentId: 'obj_modal',
    inheritTransform: true,
    properties: {
      ...defaultPropValues(),
      position: { x: 0.5, y: 0.85 },
      size: { width: 0.75, height: 0.12 },
      backgroundColor: '#00f0ff',
      borderColor: '#ffffff',
      textSize: 22,
    },
  },
  'obj_icon': {
    id: 'obj_icon',
    name: 'Sparkle Icon',
    type: 'Icon',
    parentId: 'obj_btn',
    inheritTransform: true,
    properties: {
      ...defaultPropValues(),
      position: { x: 0.15, y: 0.5 },
      size: { width: 0.12, height: 0.55 },
      backgroundColor: '#fbbf24',
      borderColor: '#f59e0b',
    },
  },
  'obj_label': {
    id: 'obj_label',
    name: 'Button Label Text',
    type: 'Label',
    parentId: 'obj_btn',
    inheritTransform: true,
    properties: {
      ...defaultPropValues(),
      position: { x: 0.55, y: 0.5 },
      size: { width: 0.6, height: 0.6 },
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textSize: 20,
    },
  },
};

const initialKeyframes: Record<string, Keyframe> = {
  'kf_modal_start': {
    id: 'kf_modal_start',
    targetId: 'obj_modal',
    property: 'Position',
    time: 0.0,
    value: { x: 0.5, y: 1.2 },
    easingStyle: 'Quint',
    easingDirection: 'Out',
  },
  'kf_modal_in': {
    id: 'kf_modal_in',
    targetId: 'obj_modal',
    property: 'Position',
    time: 0.6,
    value: { x: 0.5, y: 0.5 },
    easingStyle: 'Quint',
    easingDirection: 'Out',
  },
  'kf_modal_trans_start': {
    id: 'kf_modal_trans_start',
    targetId: 'obj_modal',
    property: 'Transparency',
    time: 0.0,
    value: 1.0,
    easingStyle: 'Linear',
    easingDirection: 'In',
  },
  'kf_modal_trans_in': {
    id: 'kf_modal_trans_in',
    targetId: 'obj_modal',
    property: 'Transparency',
    time: 0.4,
    value: 0.0,
    easingStyle: 'Linear',
    easingDirection: 'In',
  },
  'kf_btn_scale_start': {
    id: 'kf_btn_scale_start',
    targetId: 'obj_btn',
    property: 'Size',
    time: 0.5,
    value: { width: 0.05, height: 0.05 },
    easingStyle: 'Bounce',
    easingDirection: 'Out',
  },
  'kf_btn_scale_in': {
    id: 'kf_btn_scale_in',
    targetId: 'obj_btn',
    property: 'Size',
    time: 1.2,
    value: { width: 0.75, height: 0.12 },
    easingStyle: 'Bounce',
    easingDirection: 'Out',
  },
  'kf_icon_rot_start': {
    id: 'kf_icon_rot_start',
    targetId: 'obj_icon',
    property: 'Rotation',
    time: 1.0,
    value: -180,
    easingStyle: 'Elastic',
    easingDirection: 'Out',
  },
  'kf_icon_rot_in': {
    id: 'kf_icon_rot_in',
    targetId: 'obj_icon',
    property: 'Rotation',
    time: 1.8,
    value: 0,
    easingStyle: 'Elastic',
    easingDirection: 'Out',
  },
};

const initialState: TweenState = {
  objects: initialObjects,
  keyframes: initialKeyframes,
  timeline: {
    currentTime: 0,
    duration: 3.0,
    isPlaying: false,
    isLooping: true,
    playbackSpeed: 1.0,
    selectedObjectId: 'obj_modal',
    selectedKeyframeId: null,
  },
  laneSettings: defaultLaneSettings(),
  exportFormat: 'Script',
  activeTab: 'timeline',
};

const reducer = (state: TweenState, action: Action): TweenState => {
  switch (action.type) {
    case 'SELECT_OBJECT':
      return {
        ...state,
        timeline: { ...state.timeline, selectedObjectId: action.payload, selectedKeyframeId: null },
      };
    case 'SELECT_KEYFRAME':
      return {
        ...state,
        timeline: { ...state.timeline, selectedKeyframeId: action.payload },
      };
    case 'ADD_OBJECT': {
      const newId = `obj_${Date.now()}`;
      return {
        ...state,
        objects: {
          ...state.objects,
          [newId]: {
            id: newId,
            name: action.payload.name,
            type: action.payload.type,
            parentId: action.payload.parentId,
            inheritTransform: true,
            properties: { ...defaultPropValues(), ...(action.payload.properties || {}) },
          },
        },
        timeline: { ...state.timeline, selectedObjectId: newId },
      };
    }
    case 'REMOVE_OBJECT': {
      const idToRemove = action.payload;
      const updatedObjects = { ...state.objects };
      delete updatedObjects[idToRemove];
      // remove any child objects or keyframes associated
      Object.keys(updatedObjects).forEach((key) => {
        if (updatedObjects[key].parentId === idToRemove) {
          delete updatedObjects[key];
        }
      });
      const updatedKeyframes = { ...state.keyframes };
      Object.keys(updatedKeyframes).forEach((k) => {
        if (updatedKeyframes[k].targetId === idToRemove) {
          delete updatedKeyframes[k];
        }
      });
      return {
        ...state,
        objects: updatedObjects,
        keyframes: updatedKeyframes,
        timeline: {
          ...state.timeline,
          selectedObjectId: state.timeline.selectedObjectId === idToRemove ? null : state.timeline.selectedObjectId,
        },
      };
    }
    case 'UPDATE_OBJECT_PROP': {
      const { id, prop, value } = action.payload;
      const obj = state.objects[id];
      if (!obj) return state;
      let newProps = { ...obj.properties };
      if (prop === 'Position') newProps.position = value;
      else if (prop === 'Size') newProps.size = value;
      else if (prop === 'Rotation') newProps.rotation = value;
      else if (prop === 'BackgroundColor3') newProps.backgroundColor = value;
      else if (prop === 'Transparency') newProps.transparency = value;
      else if (prop === 'BorderColor3') newProps.borderColor = value;
      else if (prop === 'TextTransparency') newProps.textTransparency = value;
      else if (prop === 'TextSize') newProps.textSize = value;
      else if (prop === 'AnchorPoint') newProps.anchorPoint = value;
      return {
        ...state,
        objects: { ...state.objects, [id]: { ...obj, properties: newProps } },
      };
    }
    case 'TOGGLE_INHERIT_TRANSFORM': {
      const id = action.payload;
      const obj = state.objects[id];
      if (!obj) return state;
      return {
        ...state,
        objects: { ...state.objects, [id]: { ...obj, inheritTransform: !obj.inheritTransform } },
      };
    }
    case 'ADD_KEYFRAME': {
      const newId = `kf_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      return {
        ...state,
        keyframes: {
          ...state.keyframes,
          [newId]: { id: newId, ...action.payload },
        },
        timeline: { ...state.timeline, selectedKeyframeId: newId },
      };
    }
    case 'UPDATE_KEYFRAME': {
      const { id, updates } = action.payload;
      const kf = state.keyframes[id];
      if (!kf) return state;
      return {
        ...state,
        keyframes: { ...state.keyframes, [id]: { ...kf, ...updates } },
      };
    }
    case 'REMOVE_KEYFRAME': {
      const updatedKeyframes = { ...state.keyframes };
      delete updatedKeyframes[action.payload];
      return {
        ...state,
        keyframes: updatedKeyframes,
        timeline: {
          ...state.timeline,
          selectedKeyframeId: state.timeline.selectedKeyframeId === action.payload ? null : state.timeline.selectedKeyframeId,
        },
      };
    }
    case 'SET_TIMELINE_TIME':
      return { ...state, timeline: { ...state.timeline, currentTime: Math.max(0, Math.min(state.timeline.duration, action.payload)) } };
    case 'SET_TIMELINE_PLAYING':
      return { ...state, timeline: { ...state.timeline, isPlaying: action.payload } };
    case 'SET_TIMELINE_DURATION':
      return { ...state, timeline: { ...state.timeline, duration: Math.max(1.0, action.payload) } };
    case 'SET_TIMELINE_LOOP':
      return { ...state, timeline: { ...state.timeline, isLooping: action.payload } };
    case 'SET_PLAYBACK_SPEED':
      return { ...state, timeline: { ...state.timeline, playbackSpeed: action.payload } };
    case 'SET_EXPORT_FORMAT':
      return { ...state, exportFormat: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_LANE_SHOW_EMPTY':
      return { ...state, laneSettings: { ...state.laneSettings, showEmptyLanes: action.payload } };
    case 'TOGGLE_LANE_PROPERTY': {
      const prop = action.payload;
      const hidden = state.laneSettings.hiddenProperties.includes(prop)
        ? state.laneSettings.hiddenProperties.filter((p) => p !== prop)
        : [...state.laneSettings.hiddenProperties, prop];
      return { ...state, laneSettings: { ...state.laneSettings, hiddenProperties: hidden } };
    }
    case 'TOGGLE_OBJECT_LANES_COLLAPSED': {
      const id = action.payload;
      const collapsed = { ...state.laneSettings.collapsedObjects };
      collapsed[id] = !collapsed[id];
      return { ...state, laneSettings: { ...state.laneSettings, collapsedObjects: collapsed } };
    }
    case 'SET_MERGE_OPTIMIZATION':
      return { ...state, laneSettings: { ...state.laneSettings, mergeOptimization: action.payload } };
    case 'SET_SIMULATION_FPS':
      return {
        ...state,
        laneSettings: {
          ...state.laneSettings,
          simulationFps: Math.max(30, Math.min(120, action.payload)),
        },
      };
    case 'SET_FRAME_ACCURATE_PLAYBACK':
      return { ...state, laneSettings: { ...state.laneSettings, useFrameAccuratePlayback: action.payload } };
    case 'BATCH_APPLY_PRESET': {
      const { targetIds, presetType } = action.payload;
      let newKeyframes = { ...state.keyframes };
      targetIds.forEach((id, idx) => {
        const offset = idx * 0.15;
        const kf1Id = `kf_batch_${id}_1_${Date.now()}`;
        const kf2Id = `kf_batch_${id}_2_${Date.now()}`;
        if (presetType === 'pop') {
          newKeyframes[kf1Id] = {
            id: kf1Id,
            targetId: id,
            property: 'Size',
            time: offset,
            value: { width: 0.05, height: 0.05 },
            easingStyle: 'Bounce',
            easingDirection: 'Out',
          };
          newKeyframes[kf2Id] = {
            id: kf2Id,
            targetId: id,
            property: 'Size',
            time: offset + 0.6,
            value: { width: 0.4, height: 0.4 },
            easingStyle: 'Bounce',
            easingDirection: 'Out',
          };
        } else if (presetType === 'fade') {
          newKeyframes[kf1Id] = {
            id: kf1Id,
            targetId: id,
            property: 'Transparency',
            time: offset,
            value: 1.0,
            easingStyle: 'Quad',
            easingDirection: 'InOut',
          };
          newKeyframes[kf2Id] = {
            id: kf2Id,
            targetId: id,
            property: 'Transparency',
            time: offset + 0.5,
            value: 0.0,
            easingStyle: 'Quad',
            easingDirection: 'InOut',
          };
        }
      });
      return { ...state, keyframes: newKeyframes };
    }
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
};

class TweenStore {
  private state: TweenState;
  private listeners: Set<() => void> = new Set();

  constructor(initial: TweenState) {
    this.state = initial;
  }

  getState = (): TweenState => {
    return this.state;
  };

  dispatch = (action: Action): void => {
    this.state = reducer(this.state, action);
    this.listeners.forEach((listener) => listener());
  };

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
}

export const store = new TweenStore(initialState);

export const useStore = (): TweenState => {
  return useSyncExternalStore(store.subscribe, store.getState);
};
