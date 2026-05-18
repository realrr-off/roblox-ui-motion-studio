import React from 'react';
import type { TweenState, Action, TargetProperty, EasingStyle, EasingDirection } from '../state/store';
import { PROPERTY_LANE_COLORS, PROPERTY_LANE_ORDER } from '../core/PropertyLanes';
import { Slider } from './Slider';
import { Dropdown } from './Dropdown';
import { Target, Trash2, Plus } from 'lucide-react';

interface TargetConfiguratorProps {
  state: TweenState;
  dispatch: (action: Action) => void;
  embedded?: boolean;
}

export const TargetConfigurator: React.FC<TargetConfiguratorProps> = ({ state, dispatch, embedded }) => {
  const selectedKeyframe = state.timeline.selectedKeyframeId ? state.keyframes[state.timeline.selectedKeyframeId] : null;
  const selectedObject = state.timeline.selectedObjectId ? state.objects[state.timeline.selectedObjectId] : null;

  const body = (content: React.ReactNode) =>
    embedded ? <div className="panel-body inspector-body">{content}</div> : content;

  const addKeyframeForProperty = (property: TargetProperty) => {
    if (!selectedObject) return;
    const p = selectedObject.properties;
    const valMap: Record<TargetProperty, unknown> = {
      Position: p.position,
      Size: p.size,
      Rotation: p.rotation,
      Transparency: p.transparency,
      BackgroundColor3: p.backgroundColor,
      BorderColor3: p.borderColor,
      TextTransparency: p.textTransparency,
      TextSize: p.textSize,
      AnchorPoint: p.anchorPoint,
    };
    dispatch({
      type: 'ADD_KEYFRAME',
      payload: {
        targetId: selectedObject.id,
        property,
        time: state.timeline.currentTime,
        value: valMap[property],
        easingStyle: 'Quint',
        easingDirection: 'Out',
      },
    });
  };

  if (selectedKeyframe) {
    const obj = state.objects[selectedKeyframe.targetId];
    return body(
      <>
        <div className="inspector-section-head">
          <div>
            <p className="inspector-kicker">Keyframe</p>
            <p className="inspector-object-name">{obj?.name}</p>
          </div>
          <span className="time-badge">{selectedKeyframe.time.toFixed(2)}s</span>
        </div>

        <p className="property-badge" style={{ borderColor: PROPERTY_LANE_COLORS[selectedKeyframe.property] }}>
          {selectedKeyframe.property}
        </p>

        <div className="grid-2">
          <Dropdown
            label="Easing style"
            value={selectedKeyframe.easingStyle}
            options={['Linear', 'Sine', 'Quad', 'Cubic', 'Quart', 'Quint', 'Expo', 'Circ', 'Elastic', 'Back', 'Bounce', 'CustomBezier'].map((s) => ({
              label: s,
              value: s as EasingStyle,
            }))}
            onChange={(val) => dispatch({ type: 'UPDATE_KEYFRAME', payload: { id: selectedKeyframe.id, updates: { easingStyle: val as EasingStyle } } })}
          />
          <Dropdown
            label="Direction"
            value={selectedKeyframe.easingDirection}
            options={['In', 'Out', 'InOut'].map((s) => ({ label: s, value: s as EasingDirection }))}
            onChange={(val) => dispatch({ type: 'UPDATE_KEYFRAME', payload: { id: selectedKeyframe.id, updates: { easingDirection: val as EasingDirection } } })}
          />
        </div>

        <div className="inspector-section">
          <p className="section-label">Value at keyframe</p>
          {renderPropertyValueInput(selectedKeyframe.property, selectedKeyframe.value, (v) =>
            dispatch({ type: 'UPDATE_KEYFRAME', payload: { id: selectedKeyframe.id, updates: { value: v } } }),
          )}
        </div>

        <button type="button" className="btn-danger-ghost w-full justify-center"
          onClick={() => dispatch({ type: 'REMOVE_KEYFRAME', payload: selectedKeyframe.id })}>
          <Trash2 size={14} /> Delete keyframe
        </button>
        <p className="hint-text">Use the <strong>Easing curve</strong> tab to edit custom bezier handles.</p>
      </>,
    );
  }

  if (selectedObject) {
    return body(
      <>
        <div className="inspector-section-head">
          <div>
            <p className="inspector-kicker">{selectedObject.type}</p>
            <p className="inspector-object-name">{selectedObject.name}</p>
          </div>
        </div>

        <div className="inspector-section">
          <p className="section-label">Add keyframe at playhead ({state.timeline.currentTime.toFixed(2)}s)</p>
          <div className="property-chips">
            {PROPERTY_LANE_ORDER.map((prop) => (
              <button key={prop} type="button" className="property-chip"
                style={{ borderColor: PROPERTY_LANE_COLORS[prop] }}
                onClick={() => addKeyframeForProperty(prop)}>
                <Plus size={12} /> {prop}
              </button>
            ))}
          </div>
        </div>

        <div className="inspector-section">
          <p className="section-label">Layout & transform</p>
          {renderPropertyValueInput('Position', selectedObject.properties.position, (v) => updateObjProp(selectedObject.id, 'Position', v, dispatch))}
          {renderPropertyValueInput('Size', selectedObject.properties.size, (v) => updateObjProp(selectedObject.id, 'Size', v, dispatch))}
          {renderPropertyValueInput('AnchorPoint', selectedObject.properties.anchorPoint, (v) => updateObjProp(selectedObject.id, 'AnchorPoint', v, dispatch))}
          {renderPropertyValueInput('Rotation', selectedObject.properties.rotation, (v) => updateObjProp(selectedObject.id, 'Rotation', v, dispatch))}
        </div>

        <div className="inspector-section">
          <p className="section-label">Appearance</p>
          {renderPropertyValueInput('BackgroundColor3', selectedObject.properties.backgroundColor, (v) => updateObjProp(selectedObject.id, 'BackgroundColor3', v, dispatch))}
          {renderPropertyValueInput('Transparency', selectedObject.properties.transparency, (v) => updateObjProp(selectedObject.id, 'Transparency', v, dispatch))}
          {renderPropertyValueInput('BorderColor3', selectedObject.properties.borderColor, (v) => updateObjProp(selectedObject.id, 'BorderColor3', v, dispatch))}
        </div>

        {(selectedObject.type === 'Label' || selectedObject.type === 'Button') && (
          <div className="inspector-section">
            <p className="section-label">Text</p>
            {renderPropertyValueInput('TextTransparency', selectedObject.properties.textTransparency, (v) => updateObjProp(selectedObject.id, 'TextTransparency', v, dispatch))}
            {renderPropertyValueInput('TextSize', selectedObject.properties.textSize, (v) => updateObjProp(selectedObject.id, 'TextSize', v, dispatch))}
          </div>
        )}
      </>,
    );
  }

  return (
    <div className={embedded ? 'empty-state' : 'empty-state panel m-4'}>
      <Target size={32} />
      <p>Select an object in the hierarchy or a keyframe on the timeline</p>
    </div>
  );
};

function updateObjProp(id: string, prop: TargetProperty, value: unknown, dispatch: (action: Action) => void) {
  dispatch({ type: 'UPDATE_OBJECT_PROP', payload: { id, prop, value } });
}

function renderPropertyValueInput(property: TargetProperty, value: unknown, onChange: (val: unknown) => void) {
  switch (property) {
    case 'Position':
    case 'Size':
    case 'AnchorPoint': {
      const v = value as Record<string, number>;
      return (
        <div className="slider-group">
          <Slider label={`${property} X`} value={v.x ?? v.width} min={-0.5} max={1.5} step={0.01}
            onChange={(n) => onChange(v.x !== undefined ? { ...v, x: n } : { ...v, width: n })} />
          <Slider label={`${property} Y`} value={v.y ?? v.height} min={-0.5} max={1.5} step={0.01}
            onChange={(n) => onChange(v.y !== undefined ? { ...v, y: n } : { ...v, height: n })} />
        </div>
      );
    }
    case 'Rotation':
    case 'Transparency':
    case 'TextTransparency':
    case 'TextSize':
      return (
        <Slider label={property} value={value as number}
          min={property === 'TextSize' ? 8 : property === 'Rotation' ? -360 : 0}
          max={property === 'TextSize' ? 128 : property === 'Rotation' ? 360 : 1}
          step={property === 'TextSize' || property === 'Rotation' ? 1 : 0.05}
          onChange={onChange} />
      );
    case 'BackgroundColor3':
    case 'BorderColor3':
      return (
        <div className="color-row">
          <input type="color" value={value === 'transparent' ? '#000000' : (value as string)}
            onChange={(e) => onChange(e.target.value)} disabled={value === 'transparent'} />
          <span className="color-hex">{String(value)}</span>
          <button type="button" className="link-btn"
            onClick={() => onChange(value === 'transparent' ? '#ffffff' : 'transparent')}>
            {value === 'transparent' ? 'Set color' : 'Transparent'}
          </button>
        </div>
      );
    default:
      return null;
  }
}
