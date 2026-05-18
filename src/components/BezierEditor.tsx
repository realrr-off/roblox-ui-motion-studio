import React, { useState, useRef, useEffect } from 'react';
import type { Action, TweenState, CustomBezier } from '../state/store';
import { Spline } from 'lucide-react';

interface BezierEditorProps {
  state: TweenState;
  dispatch: (action: Action) => void;
  embedded?: boolean;
}

const ROBLOX_PRESETS: Record<string, CustomBezier> = {
  Linear: [0, 0, 1, 1],
  Quad: [0.11, 0, 0.5, 0],
  Cubic: [0.32, 0, 0.67, 0],
  Quart: [0.5, 0, 0.75, 0],
  Quint: [0.64, 0, 0.84, 0],
  Sine: [0.36, 0, 0.66, -0.56],
  Expo: [0.7, 0, 0.84, 0],
};

export const BezierEditor: React.FC<BezierEditorProps> = ({ state, dispatch, embedded }) => {
  const selectedKeyframe = state.timeline.selectedKeyframeId ? state.keyframes[state.timeline.selectedKeyframeId] : null;
  const [points, setPoints] = useState<CustomBezier>([0.25, 0.1, 0.25, 1.0]);
  const [draggingPoint, setDraggingPoint] = useState<'p1' | 'p2' | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!selectedKeyframe) return;
    if (selectedKeyframe.easingStyle === 'CustomBezier' && selectedKeyframe.customBezier) {
      setPoints(selectedKeyframe.customBezier);
    } else if (ROBLOX_PRESETS[selectedKeyframe.easingStyle]) {
      setPoints(ROBLOX_PRESETS[selectedKeyframe.easingStyle]);
    }
  }, [selectedKeyframe]);

  if (!selectedKeyframe) {
    return (
      <div className={embedded ? 'empty-state' : 'empty-state panel m-4'}>
        <Spline size={32} />
        <p>Select a keyframe to edit its easing curve</p>
      </div>
    );
  }

  const p1x = points[0] * 100;
  const p1y = 100 - points[1] * 100;
  const p2x = points[2] * 100;
  const p2y = 100 - points[3] * 100;

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingPoint || !svgRef.current || !selectedKeyframe) return;
    const rect = svgRef.current.getBoundingClientRect();
    let x = (e.clientX - rect.left) / rect.width;
    let y = 1 - (e.clientY - rect.top) / rect.height;
    x = Math.max(0, Math.min(1, x));
    y = Math.max(-0.5, Math.min(1.5, y));
    const newPoints = [...points] as CustomBezier;
    if (draggingPoint === 'p1') {
      newPoints[0] = x;
      newPoints[1] = y;
    } else {
      newPoints[2] = x;
      newPoints[3] = y;
    }
    setPoints(newPoints);
    dispatch({
      type: 'UPDATE_KEYFRAME',
      payload: { id: selectedKeyframe.id, updates: { customBezier: newPoints, easingStyle: 'CustomBezier' } },
    });
  };

  return (
    <div className={embedded ? 'panel-body space-y-3' : 'panel-body space-y-3'}>
      <p className="text-[11px] font-mono text-teal-400/90 text-center">
        cubic-bezier({points.map((p) => p.toFixed(2)).join(', ')})
      </p>

      <div className="bg-[#06080e] rounded-lg border border-white/5 p-4 aspect-[4/3] max-h-48">
        <svg
          ref={svgRef}
          viewBox="0 -50 100 200"
          className="w-full h-full touch-none cursor-crosshair"
          onPointerMove={handlePointerMove}
          onPointerUp={() => setDraggingPoint(null)}
        >
          <path d={`M 0 100 C ${p1x} ${p1y}, ${p2x} ${p2y}, 100 0`} fill="none" stroke="#5eead4" strokeWidth="2.5" />
          <line x1="0" y1="100" x2={p1x} y2={p1y} stroke="#a78bfa" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="100" y1="0" x2={p2x} y2={p2y} stroke="#fbbf24" strokeWidth="1" strokeDasharray="3 3" />
          <circle
            cx={p1x}
            cy={p1y}
            r="5"
            fill="#a78bfa"
            onPointerDown={() => setDraggingPoint('p1')}
          />
          <circle
            cx={p2x}
            cy={p2y}
            r="5"
            fill="#fbbf24"
            onPointerDown={() => setDraggingPoint('p2')}
          />
          <circle cx="0" cy="100" r="3" fill="#fff" opacity="0.5" />
          <circle cx="100" cy="0" r="3" fill="#fff" opacity="0.5" />
        </svg>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {Object.keys(ROBLOX_PRESETS).map((presetKey) => (
          <button
            key={presetKey}
            type="button"
            className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors ${
              selectedKeyframe.easingStyle === presetKey
                ? 'bg-teal-400/15 border-teal-400/40 text-teal-300'
                : 'bg-white/5 border-transparent text-slate-500 hover:text-slate-300'
            }`}
            onClick={() =>
              dispatch({
                type: 'UPDATE_KEYFRAME',
                payload: { id: selectedKeyframe.id, updates: { easingStyle: presetKey as never, customBezier: ROBLOX_PRESETS[presetKey] } },
              })
            }
          >
            {presetKey}
          </button>
        ))}
      </div>
    </div>
  );
};
