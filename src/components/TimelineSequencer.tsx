import React, { useMemo, useRef, useState, useEffect } from 'react';
import type { Action, TweenState, Keyframe, TargetProperty } from '../state/store';
import { buildObjectLaneGroups, PROPERTY_LANE_COLORS } from '../core/PropertyLanes';
import { detectAllConflicts, getConflictsForKeyframe } from '../core/TweenConflictDetector';
import { Play, Pause, SkipBack, ChevronDown, ChevronRight, AlertTriangle, Repeat } from 'lucide-react';

interface TimelineSequencerProps {
  state: TweenState;
  dispatch: (action: Action) => void;
}

export const TimelineSequencer: React.FC<TimelineSequencerProps> = ({ state, dispatch }) => {
  const { objects, timeline } = state;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draggingPlayhead, setDraggingPlayhead] = useState(false);
  const [draggingKeyframeId, setDraggingKeyframeId] = useState<string | null>(null);

  const laneGroups = useMemo(() => buildObjectLaneGroups(state), [state]);
  const conflicts = useMemo(() => detectAllConflicts(state), [state.keyframes, state.objects]);

  const timeFromClientX = (clientX: number, rect: DOMRect) => {
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    return (x / rect.width) * timeline.duration;
  };

  const scrub = (clientX: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    dispatch({ type: 'SET_TIMELINE_TIME', payload: timeFromClientX(clientX, rect) });
  };

  const moveKeyframe = (clientX: number, el: HTMLElement) => {
    if (!draggingKeyframeId) return;
    const rect = el.getBoundingClientRect();
    const time = Math.round(timeFromClientX(clientX, rect) * 10) / 10;
    dispatch({ type: 'UPDATE_KEYFRAME', payload: { id: draggingKeyframeId, updates: { time } } });
  };

  const [scrubEl, setScrubEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!draggingPlayhead && !draggingKeyframeId) return;
    const onMove = (e: PointerEvent) => {
      const el = scrubEl ?? document.querySelector<HTMLElement>('.timeline-row-track');
      if (!el) return;
      if (draggingPlayhead) scrub(e.clientX, el);
      else moveKeyframe(e.clientX, el);
    };
    const onUp = () => {
      setDraggingPlayhead(false);
      setDraggingKeyframeId(null);
      setScrubEl(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [draggingPlayhead, draggingKeyframeId, scrubEl, timeline.duration]);

  const addKeyframeAt = (e: React.MouseEvent, targetId: string, property: TargetProperty) => {
    const el = e.currentTarget as HTMLElement;
    const time = Math.round(timeFromClientX(e.clientX, el.getBoundingClientRect()) * 10) / 10;
    const obj = objects[targetId];
    const valMap: Partial<Record<TargetProperty, unknown>> = {
      Position: obj.properties.position,
      Size: obj.properties.size,
      Rotation: obj.properties.rotation,
      Transparency: obj.properties.transparency,
      BackgroundColor3: obj.properties.backgroundColor,
      BorderColor3: obj.properties.borderColor,
      TextTransparency: obj.properties.textTransparency,
      TextSize: obj.properties.textSize,
      AnchorPoint: obj.properties.anchorPoint,
    };
    dispatch({
      type: 'ADD_KEYFRAME',
      payload: { targetId, property, time, value: valMap[property], easingStyle: 'Quint', easingDirection: 'Out' },
    });
  };

  const progress = timeline.duration > 0 ? timeline.currentTime / timeline.duration : 0;

  return (
    <section className="timeline-panel panel">
      <header className="timeline-toolbar">
        <div className="timeline-transport">
          <button type="button" className="btn-icon" title="Go to start" onClick={() => dispatch({ type: 'SET_TIMELINE_TIME', payload: 0 })}>
            <SkipBack size={16} />
          </button>
          <button
            type="button"
            className={`btn-icon btn-icon-lg ${timeline.isPlaying ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_TIMELINE_PLAYING', payload: !timeline.isPlaying })}
          >
            {timeline.isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            type="button"
            className={`btn-icon ${timeline.isLooping ? 'active' : ''}`}
            title="Loop"
            onClick={() => dispatch({ type: 'SET_TIMELINE_LOOP', payload: !timeline.isLooping })}
          >
            <Repeat size={16} />
          </button>
          <span className="time-display">{timeline.currentTime.toFixed(2)}s</span>
        </div>
        <div className="timeline-toolbar-right">
          {conflicts.length > 0 && (
            <span className="stat-pill warn">
              <AlertTriangle size={12} /> {conflicts.length} conflicts
            </span>
          )}
          <label className="toolbar-field">
            <span>Duration</span>
            <input type="number" value={timeline.duration} step={0.5} min={1} max={30}
              onChange={(e) => dispatch({ type: 'SET_TIMELINE_DURATION', payload: parseFloat(e.target.value) || 1 })} />
            <span className="unit">s</span>
          </label>
          <label className="toolbar-field">
            <span>Speed</span>
            <input type="number" value={timeline.playbackSpeed} step={0.1} min={0.1} max={3}
              onChange={(e) => dispatch({ type: 'SET_PLAYBACK_SPEED', payload: parseFloat(e.target.value) || 1 })} />
            <span className="unit">×</span>
          </label>
        </div>
      </header>

      <p className="timeline-hint">Double-click a lane to add a keyframe · Drag keyframes to retime · Click tracks to scrub</p>

      <div ref={scrollRef} className="timeline-scroll custom-scrollbar">
        <div className="timeline-grid">
          <div className="timeline-ruler-label">Lanes</div>
          <div
            className="timeline-ruler-track"
            onPointerDown={(e) => {
              if ((e.target as HTMLElement).closest('.timeline-keyframe')) return;
              setScrubEl(e.currentTarget as HTMLElement);
              setDraggingPlayhead(true);
              scrub(e.clientX, e.currentTarget as HTMLElement);
            }}
          >
            {Array.from({ length: Math.floor(timeline.duration / 0.5) + 1 }, (_, i) => i * 0.5).map((t) => (
              <div key={t} className="timeline-ruler-tick" style={{ left: `${(t / timeline.duration) * 100}%` }}>
                <span>{t.toFixed(1)}s</span>
              </div>
            ))}
          </div>

          {laneGroups.map((group) => {
            if (group.lanes.length === 0) return null;
            const collapsed = group.collapsed;
            return (
              <React.Fragment key={group.object.id}>
                <div className="timeline-object-header">
                  <button type="button" className="timeline-collapse-btn"
                    onClick={() => dispatch({ type: 'TOGGLE_OBJECT_LANES_COLLAPSED', payload: group.object.id })}>
                    {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <button type="button" className="timeline-object-name"
                    onClick={() => dispatch({ type: 'SELECT_OBJECT', payload: group.object.id })}>
                    {group.object.name}
                  </button>
                  <span className="timeline-object-type">{group.object.type}</span>
                </div>

                {!collapsed && group.lanes.map((lane) => {
                  const color = PROPERTY_LANE_COLORS[lane.property];
                  const sorted = [...lane.keyframes].sort((a, b) => a.time - b.time);
                  return (
                    <React.Fragment key={`${lane.targetId}_${lane.property}`}>
                      <div className={`timeline-row-label ${!lane.hasKeyframes ? 'is-empty' : ''}`}>
                        <span className="lane-dot" style={{ backgroundColor: color }} />
                        <span className="lane-name">{lane.property}</span>
                      </div>
                      <div
                        className={`timeline-row-track ${!lane.hasKeyframes ? 'is-empty' : ''}`}
                        onDoubleClick={(e) => addKeyframeAt(e, lane.targetId, lane.property)}
                        onPointerDown={(e) => {
                          if ((e.target as HTMLElement).closest('.timeline-keyframe')) return;
                          setScrubEl(e.currentTarget as HTMLElement);
                          setDraggingPlayhead(true);
                          scrub(e.clientX, e.currentTarget as HTMLElement);
                        }}
                      >
                        {sorted.slice(0, -1).map((start, i) => {
                          const end = sorted[i + 1];
                          return (
                            <div key={`${start.id}_${end.id}`} className="timeline-segment"
                              style={{
                                left: `${(start.time / timeline.duration) * 100}%`,
                                width: `${((end.time - start.time) / timeline.duration) * 100}%`,
                                backgroundColor: color,
                              }} />
                          );
                        })}
                        {lane.keyframes.map((kf) => (
                          <KeyframeDiamond key={kf.id} kf={kf} color={color} duration={timeline.duration}
                            isSelected={timeline.selectedKeyframeId === kf.id}
                            hasConflict={getConflictsForKeyframe(conflicts, kf.id).some((c) => c.severity === 'error')}
                            onDragStart={() => { setDraggingKeyframeId(kf.id); dispatch({ type: 'SELECT_KEYFRAME', payload: kf.id }); }}
                            property={lane.property} />
                        ))}
                      </div>
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
        <div className="timeline-playhead-overlay" style={{ left: `calc(var(--timeline-label-w) + (100% - var(--timeline-label-w)) * ${progress})` }} />
      </div>
    </section>
  );
};

function KeyframeDiamond({ kf, color, duration, isSelected, hasConflict, onDragStart, property }: {
  kf: Keyframe; color: string; duration: number; isSelected: boolean; hasConflict: boolean;
  onDragStart: () => void; property: string;
}) {
  return (
    <div
      className={`timeline-keyframe ${isSelected ? 'selected' : ''} ${hasConflict ? 'conflict' : ''}`}
      style={{ left: `${(kf.time / duration) * 100}%`, borderColor: hasConflict ? undefined : color, backgroundColor: hasConflict ? undefined : '#1a2332' }}
      onPointerDown={(e) => { e.stopPropagation(); onDragStart(); }}
      title={`${property} @ ${kf.time}s`}
    />
  );
}
