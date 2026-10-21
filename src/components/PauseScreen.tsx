/**
 * Reality Shift: Neon Rush - Pause Overlay
 */

import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';

interface PauseScreenProps {
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseScreen: React.FC<PauseScreenProps> = ({
  onResume,
  onRestart,
  onExit,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/85 flex items-center justify-center p-6 z-40 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-sm w-full p-6 sm:p-8 text-center shadow-2xl">
        <div className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-1">
          SYSTEM INTERRUPT
        </div>
        <h2 className="text-3xl font-black font-display text-white mb-6 tracking-wide">
          PAUSED
        </h2>

        <div className="space-y-3">
          <button
            onClick={onResume}
            className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black font-display text-base tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg active:scale-95"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>RESUME</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold font-display text-sm tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all border border-slate-700 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART</span>
          </button>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onToggleMute}
              className="flex-1 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer border border-slate-700 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              <span>{isMuted ? 'UNMUTE' : 'MUTE'}</span>
            </button>

            <button
              onClick={onExit}
              className="flex-1 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer border border-slate-700 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>MAIN MENU</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
