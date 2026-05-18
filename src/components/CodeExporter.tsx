import React, { useState, useEffect, useMemo } from 'react';
import type { TweenState } from '../state/store';
import { store } from '../state/store';
import { CodeCompiler } from '../core/CodeCompiler';
import { Copy, Check, Download } from 'lucide-react';

interface CodeExporterProps {
  state: TweenState;
  embedded?: boolean;
}

export const CodeExporter: React.FC<CodeExporterProps> = React.memo(({ state, embedded }) => {
  const [copied, setCopied] = useState(false);
  const compiledCode = useMemo(() => CodeCompiler.compile(state), [state]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(compiledCode);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = compiledCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopied(true);
  };

  const handleDownload = () => {
    const blob = new Blob([compiledCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tween_${state.exportFormat}.lua`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (embedded) {
    return (
      <>
        <div className="code-header !border-t border-white/5">
          <select
            className="format-select"
            value={state.exportFormat}
            onChange={(e) => store.dispatch({ type: 'SET_EXPORT_FORMAT', payload: e.target.value as TweenState['exportFormat'] })}
          >
            <option value="Script">Script</option>
            <option value="ModuleScript">Module</option>
            <option value="Function">Function</option>
          </select>
          <div className="flex gap-1.5">
            <button type="button" className="btn-action copy-btn" onClick={handleCopy}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button type="button" className="btn-action" onClick={handleDownload}>
              <Download size={14} />
            </button>
          </div>
        </div>
        <div className="code-editor-viewport">
          <pre className="code-content m-0">
            <code>{compiledCode}</code>
          </pre>
        </div>
      </>
    );
  }

  return (
    <section className="code-exporter-card">
      <div className="code-header">
        <span className="code-title">Luau export</span>
        <div className="flex gap-2 items-center">
          <select
            className="format-select"
            value={state.exportFormat}
            onChange={(e) => store.dispatch({ type: 'SET_EXPORT_FORMAT', payload: e.target.value as TweenState['exportFormat'] })}
          >
            <option value="Script">Script</option>
            <option value="ModuleScript">Module</option>
            <option value="Function">Function</option>
          </select>
          <button type="button" className="btn-action copy-btn" onClick={handleCopy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <button type="button" className="btn-action" onClick={handleDownload}>
            <Download size={14} />
          </button>
        </div>
      </div>
      <div className="code-editor-viewport">
        <pre className="code-content m-0">
          <code>{compiledCode}</code>
        </pre>
      </div>
    </section>
  );
});

CodeExporter.displayName = 'CodeExporter';
