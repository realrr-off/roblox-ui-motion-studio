import React, { useMemo } from 'react';
import type { Action, TweenState } from '../state/store';
import { detectAllConflicts } from '../core/TweenConflictDetector';
import { getMergeStats } from '../core/TweenMergeOptimizer';
import { simulateTimeline } from '../core/TimelineSimulator';

interface TweenAnalysisPanelProps {
  state: TweenState;
  dispatch: (action: Action) => void;
}

export const TweenAnalysisPanel: React.FC<TweenAnalysisPanelProps> = ({ state, dispatch }) => {
  const conflicts = useMemo(() => detectAllConflicts(state), [state.keyframes, state.objects]);
  const mergeStats = useMemo(() => getMergeStats(state), [state.keyframes, state.objects]);
  const frameCount = useMemo(() => simulateTimeline(state).length, [state.keyframes, state.objects, state.timeline.duration, state.laneSettings.simulationFps]);
  const { laneSettings } = state;

  return (
    <section className="engine-bar panel">
      <div className="engine-bar-stats">
        <span className="engine-stat">
          <strong>{conflicts.length}</strong> conflicts
        </span>
        <span className="engine-stat">
          <strong>{mergeStats.saved}</strong> merges saved ({mergeStats.rawCalls} → {mergeStats.mergedCalls} tweens)
        </span>
        <span className="engine-stat">
          <strong>{frameCount}</strong> sim frames @ {laneSettings.simulationFps} FPS
        </span>
      </div>
      <div className="engine-bar-toggles">
        <label className="engine-toggle">
          <input type="checkbox" checked={laneSettings.mergeOptimization}
            onChange={(e) => dispatch({ type: 'SET_MERGE_OPTIMIZATION', payload: e.target.checked })} />
          Merge on export
        </label>
        <label className="engine-toggle">
          <input type="checkbox" checked={laneSettings.useFrameAccuratePlayback}
            onChange={(e) => dispatch({ type: 'SET_FRAME_ACCURATE_PLAYBACK', payload: e.target.checked })} />
          Frame-accurate playback
        </label>
        <label className="engine-toggle">
          <input type="checkbox" checked={laneSettings.showEmptyLanes}
            onChange={(e) => dispatch({ type: 'SET_LANE_SHOW_EMPTY', payload: e.target.checked })} />
          Show all property lanes
        </label>
        <label className="engine-toggle">
          Sim FPS
          <input type="number" min={30} max={120} value={laneSettings.simulationFps}
            onChange={(e) => dispatch({ type: 'SET_SIMULATION_FPS', payload: parseInt(e.target.value, 10) || 60 })} />
        </label>
      </div>
    </section>
  );
};
