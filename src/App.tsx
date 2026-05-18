import React, { useState } from 'react';
import { store, useStore } from './state/store';
import { Navbar } from './components/Navbar';
import { ExplorerTree } from './components/ExplorerTree';
import { TargetConfigurator } from './components/TargetConfigurator';
import { PreviewCanvas } from './components/PreviewCanvas';
import { BezierEditor } from './components/BezierEditor';
import { TimelineSequencer } from './components/TimelineSequencer';
import { CodeExporter } from './components/CodeExporter';
import { TweenAnalysisPanel } from './components/TweenAnalysisPanel';
import { Sliders, Spline } from 'lucide-react';

type InspectorTab = 'properties' | 'easing';

export const App: React.FC = () => {
  const state = useStore();
  const dispatch = store.dispatch;
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('properties');

  return (
    <div className="app-container">
      <Navbar dispatch={dispatch} />

      <div className="workspace-top">
        <div className="workspace-sidebar">
          <ExplorerTree
            objects={state.objects}
            selectedObjectId={state.timeline.selectedObjectId}
            dispatch={dispatch}
          />
        </div>

        <div className="workspace-center">
          <PreviewCanvas state={state} dispatch={dispatch} />
        </div>

        <div className="workspace-inspector">
          <section className="panel inspector-panel">
            <header className="panel-header">
              <span className="panel-title">Inspector</span>
            </header>
            <nav className="inspector-tabs" aria-label="Inspector sections">
              <button
                type="button"
                className={`inspector-tab ${inspectorTab === 'properties' ? 'active' : ''}`}
                onClick={() => setInspectorTab('properties')}
              >
                <Sliders size={14} />
                Properties
              </button>
              <button
                type="button"
                className={`inspector-tab ${inspectorTab === 'easing' ? 'active' : ''}`}
                onClick={() => setInspectorTab('easing')}
              >
                <Spline size={14} />
                Easing curve
              </button>
            </nav>
            <div className="inspector-content">
              {inspectorTab === 'properties' ? (
                <TargetConfigurator state={state} dispatch={dispatch} embedded />
              ) : (
                <BezierEditor state={state} dispatch={dispatch} embedded />
              )}
            </div>
          </section>
        </div>
      </div>

      <TweenAnalysisPanel state={state} dispatch={dispatch} />

      <TimelineSequencer state={state} dispatch={dispatch} />

      <CodeExporter state={state} />
    </div>
  );
};

export default App;
