import React, { useState } from 'react';
import type { UIObject, UIObjectType, Action } from '../state/store';
import { Layers, Type, Square, Image as ImageIcon, Plus, Trash2, Link, Link2Off, Wand2 } from 'lucide-react';

interface ExplorerTreeProps {
  objects: Record<string, UIObject>;
  selectedObjectId: string | null;
  dispatch: (action: Action) => void;
}

export const ExplorerTree: React.FC<ExplorerTreeProps> = ({ objects, selectedObjectId, dispatch }) => {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const ObjectIcon: React.FC<{ type: UIObjectType; className?: string }> = ({ type, className = '' }) => {
    const cls = `shrink-0 opacity-70 ${className}`;
    switch (type) {
      case 'Frame':
        return <Layers size={14} className={cls} />;
      case 'Button':
        return <Square size={14} className={cls} />;
      case 'Label':
        return <Type size={14} className={cls} />;
      case 'Icon':
        return <ImageIcon size={14} className={cls} />;
      default:
        return <Layers size={14} className={cls} />;
    }
  };

  const rootObjects = Object.values(objects).filter((obj) => obj.parentId === null);
  const getChildren = (parentId: string) => Object.values(objects).filter((obj) => obj.parentId === parentId);

  const handleAddObject = (type: UIObjectType) => {
    const parentId = selectedObjectId && objects[selectedObjectId] ? selectedObjectId : null;
    dispatch({
      type: 'ADD_OBJECT',
      payload: {
        name: `New ${type}`,
        type,
        parentId,
      },
    });
    setShowAddMenu(false);
  };

  const renderObjectNode = (obj: UIObject, depth = 0) => {
    const children = getChildren(obj.id);
    const isSelected = selectedObjectId === obj.id;

    return (
      <div key={obj.id} style={{ paddingLeft: depth * 12 }}>
        <div
          className={`explorer-item ${isSelected ? 'selected' : ''}`}
          onClick={() => dispatch({ type: 'SELECT_OBJECT', payload: obj.id })}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <ObjectIcon type={obj.type} />
            <span className="text-xs truncate text-slate-200">{obj.name}</span>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            {obj.parentId && (
              <button
                type="button"
                className="btn-icon !w-7 !h-7 !border-0"
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: 'TOGGLE_INHERIT_TRANSFORM', payload: obj.id });
                }}
                title={obj.inheritTransform ? 'Inherit parent transform' : 'Independent transform'}
              >
                {obj.inheritTransform ? <Link size={12} /> : <Link2Off size={12} />}
              </button>
            )}
            <button
              type="button"
              className="btn-icon !w-7 !h-7 !border-0 hover:!text-red-400"
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: 'REMOVE_OBJECT', payload: obj.id });
              }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
        {children.map((child) => renderObjectNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <span className="panel-title">
          <Layers size={15} className="text-teal-400" />
          Hierarchy
        </span>
        <div className="relative">
          <button type="button" className="btn-primary" onClick={() => setShowAddMenu(!showAddMenu)}>
            <Plus size={14} />
            Add
          </button>
          {showAddMenu && (
            <div className="settings-popover">
              {(['Frame', 'Button', 'Label', 'Icon'] as UIObjectType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className="btn-ghost w-full justify-start mb-1"
                  onClick={() => handleAddObject(t)}
                >
                  <ObjectIcon type={t} />
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="panel-body !pt-2">
        <div className="flex gap-1.5 mb-3">
          <button type="button" className="btn-ghost flex-1 text-[11px]" onClick={() => dispatch({ type: 'BATCH_APPLY_PRESET', payload: { targetIds: Object.keys(objects), presetType: 'pop' } })}>
            <Wand2 size={12} />
            Pop
          </button>
          <button type="button" className="btn-ghost flex-1 text-[11px]" onClick={() => dispatch({ type: 'BATCH_APPLY_PRESET', payload: { targetIds: Object.keys(objects), presetType: 'fade' } })}>
            Fade
          </button>
        </div>

        <div className="max-h-[calc(100vh-280px)] overflow-y-auto space-y-0.5 pr-0.5">
          {rootObjects.length === 0 ? (
            <p className="empty-state !py-8 text-[11px]">Add an object to start</p>
          ) : (
            rootObjects.map((obj) => renderObjectNode(obj, 0))
          )}
        </div>
      </div>
    </section>
  );
};

