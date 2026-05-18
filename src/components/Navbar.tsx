import React from 'react';
import type { Action } from '../state/store';
import { RefreshCw, Sparkles } from 'lucide-react';

interface NavbarProps {
  dispatch: (action: Action) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ dispatch }) => {
  return (
    <header className="app-header">
      <div className="flex items-center gap-3">
        <div className="logo-icon">
          <Sparkles size={18} />
        </div>
        <div>
          <h1 className="font-heading text-base font-semibold text-slate-100 m-0">Tween Studio</h1>
          <p className="text-[11px] text-slate-500 m-0">Roblox UI animation editor</p>
        </div>
      </div>

      <button
        type="button"
        className="btn-danger-ghost"
        onClick={() => dispatch({ type: 'RESET_STATE' })}
        title="Reset project"
      >
        <RefreshCw size={14} />
        Reset
      </button>
    </header>
  );
};
