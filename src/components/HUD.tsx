/**
 * Reality Shift: Neon Rush - In-Game HUD Overlay
 */

import React from 'react';
import { GameStats, Reality } from '../types/game';
import { Zap, Pause, Volume2, VolumeX, ShieldAlert, Sparkles, Gauge } from 'lucide-react';

interface HUDProps {
  stats: GameStats;
  onPause: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
  nearMissBanner: string | null;
  realityShiftFlash: Reality | null;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  onPause,
  onToggleMute,
  isMuted,
  nearMissBanner,
  realityShiftFlash,
}) => {
  const isCyan = stats.currentReality === 'CYAN';

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
      {/* Fullscreen Reality Shift Color Flash Effect */}
      {realityShiftFlash && (
        <div
          className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
            realityShiftFlash === 'CYAN'
              ? 'bg-cyan-500/25 ring-8 ring-cyan-400 inset-ring'
              : 'bg-fuchsia-600/25 ring-8 ring-fuchsia-400 inset-ring'
          }`}
          style={{ animation: 'pulse 0.3s ease-out' }}
        />
      )}

      {/* Top Header Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 w-full">
        {/* Left: Score & Distance */}
        <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800/80 rounded-xl px-4 py-2.5 backdrop-blur-none pointer-events-auto shadow-lg shadow-black/40">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Score</div>
            <div className="text-xl sm:text-2xl font-black font-display tracking-tight text-white flex items-center gap-2">
              {stats.score.toLocaleString()}
              {stats.combo > 1 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded font-black tracking-wide ${
                    isCyan
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-fuchsia-500 text-white'
                  }`}
                >
                  {stats.combo}x COMBO
                </span>
              )}
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Distance</div>
            <div className="text-lg sm:text-xl font-bold font-display text-slate-200">
              {stats.distance} <span className="text-xs text-slate-400">m</span>
            </div>
          </div>
        </div>

        {/* Center: Current Reality Badge */}
        <div className="flex items-center gap-2 bg-slate-950/85 border border-slate-800 rounded-xl px-4 py-2 pointer-events-auto">
          <div
            className={`w-3.5 h-3.5 rounded-full border-2 ${
              isCyan
                ? 'bg-cyan-400 border-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.9)]'
                : 'bg-fuchsia-500 border-fuchsia-200 shadow-[0_0_12px_rgba(236,72,153,0.9)]'
            }`}
          />
          <div>
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Active Reality</div>
            <div
              className={`text-sm sm:text-base font-black font-display tracking-wider ${
                isCyan ? 'text-cyan-400 text-glow-cyan' : 'text-fuchsia-400 text-glow-magenta'
              }`}
            >
              {isCyan ? 'CYAN DIMENSION' : 'MAGENTA DIMENSION'}
            </div>
          </div>
          <div className="hidden sm:block ml-2 text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded font-mono font-bold">
            SHIFT [E]
          </div>
        </div>

        {/* Right: Collectibles & Buttons */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Energy Orbs */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800/80 rounded-xl px-3.5 py-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <div className="text-base sm:text-lg font-bold font-display text-amber-300">
              {stats.energyCollected}
            </div>
          </div>

          {/* Near Misses */}
          <div className="hidden md:flex items-center gap-2 bg-slate-950/80 border border-slate-800/80 rounded-xl px-3.5 py-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <div className="text-base sm:text-lg font-bold font-display text-emerald-300">
              {stats.nearMisses}
            </div>
          </div>

          {/* Speed Indicator */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-950/80 border border-slate-800/80 rounded-xl px-3.5 py-2">
            <Gauge className="w-4 h-4 text-sky-400" />
            <div className="text-base font-bold font-display text-slate-200">
              {stats.speed} <span className="text-[10px] text-slate-400">km/h</span>
            </div>
          </div>

          {/* Audio Mute Button */}
          <button
            onClick={onToggleMute}
            aria-label="Toggle Sound"
            className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
          </button>

          {/* Pause Button */}
          <button
            onClick={onPause}
            aria-label="Pause Game"
            className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Floating Alerts (Near Miss Banner) */}
      <div className="flex flex-col items-center justify-center pointer-events-none">
        {nearMissBanner && (
          <div
            className="bg-amber-500/90 text-slate-950 font-black text-lg sm:text-2xl font-display px-6 py-2 rounded-full border-2 border-white shadow-[0_0_25px_rgba(245,158,11,0.9)] tracking-wider"
            style={{ animation: 'bounce 0.5s ease-out' }}
          >
            {nearMissBanner}
          </div>
        )}
      </div>

      {/* Bottom Mini Reality Tip */}
      <div className="flex justify-center items-center pointer-events-none pb-2">
        <div className="bg-slate-950/70 border border-slate-800/60 rounded-full px-4 py-1 text-xs text-slate-400 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          <span>
            {isCyan ? 'Cyan obstacles collide!' : 'Magenta obstacles collide!'}{' '}
            <strong className="text-slate-200">Opposite reality phases harmlessly.</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
