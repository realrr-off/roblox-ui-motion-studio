import React, { useEffect, useLayoutEffect, useRef } from 'react';
import type { TweenState, UIObject, Action } from '../state/store';
import { PlaybackEngine } from '../core/PlaybackEngine';
import { Play, RotateCcw, Pause, Monitor } from 'lucide-react';

interface PreviewCanvasProps {
  state: TweenState;
  dispatch: (action: Action) => void;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({ state, dispatch }) => {
  const engineRef = useRef<PlaybackEngine | null>(null);

  useEffect(() => {
    const engine = new PlaybackEngine();
    engineRef.current = engine;
    engine.setOnTimeUpdate((time) => {
      dispatch({ type: 'SET_TIMELINE_TIME', payload: time });
    });
    return () => engine.stop();
  }, [dispatch]);

  useLayoutEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.setState(state);
    if (!state.timeline.isPlaying) {
      engineRef.current.evaluateAtTime(state.timeline.currentTime);
    } else {
      engineRef.current.start();
    }
  }, [state, state.timeline.currentTime, state.timeline.isPlaying]);

  useLayoutEffect(() => {
    if (!engineRef.current) return;
    if (state.timeline.isPlaying) engineRef.current.start();
    else engineRef.current.stop();
  }, [state.timeline.isPlaying]);

  const handleReset = () => {
    dispatch({ type: 'SET_TIMELINE_PLAYING', payload: false });
    dispatch({ type: 'SET_TIMELINE_TIME', payload: 0 });
  };

  const getChildren = (parentId: string | null) =>
    Object.values(state.objects).filter((obj) => obj.parentId === parentId);

  const renderObject = (obj: UIObject) => {
    const children = getChildren(obj.id);
    const isSelected = state.timeline.selectedObjectId === obj.id;

    return (
      <div
        key={obj.id}
        ref={(el) => engineRef.current?.registerElement(obj.id, el)}
        className={`animated-target ${isSelected ? 'ring-2 ring-teal-400/60 ring-offset-1 ring-offset-[#06080e] z-50' : ''}`}
        style={{
          borderStyle: obj.properties.borderColor !== 'transparent' ? 'solid' : 'none',
          borderWidth: '1px',
        }}
        onClick={(e) => {
          e.stopPropagation();
          dispatch({ type: 'SELECT_OBJECT', payload: obj.id });
        }}
      >
        {(obj.type === 'Label' || obj.type === 'Button') && (
          <span className="target-label truncate px-1">{obj.name}</span>
        )}
        {children.map(renderObject)}
      </div>
    );
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <span className="panel-title">
          <Monitor size={15} className="text-teal-400" />
          Preview
          {state.timeline.isPlaying && (
            <span className="ml-2 text-[10px] font-normal text-emerald-400/90">● Live</span>
          )}
        </span>
        <div className="flex gap-1.5">
          <button
            type="button"
            className={`btn-icon ${state.timeline.isPlaying ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_TIMELINE_PLAYING', payload: !state.timeline.isPlaying })}
          >
            {state.timeline.isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button type="button" className="btn-icon" onClick={handleReset} title="Reset">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="panel-body !pt-0">
        <div className="viewport-screen">
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.15]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          {getChildren(null).map(renderObject)}
        </div>
      </div>
    </section>
  );
};


