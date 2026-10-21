/**
 * Reality Shift: Neon Rush - Game Over Screen
 */

import React from 'react';
import { GameStats } from '../types/game';
import { RotateCcw, Home, Trophy, Sparkles, ShieldAlert, Award } from 'lucide-react';

interface GameOverScreenProps {
  stats: GameStats;
  onRestart: () => void;
  onExit: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  stats,
  onRestart,
  onExit,
}) => {
  const isNewRecord = stats.score > 0 && stats.score >= stats.bestScore;

  return (
    <div className="absolute inset-0 bg-slate-950/90 flex items-center justify-center p-6 z-40 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
        {/* Glow ambient accent */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-xs uppercase tracking-widest text-rose-400 font-mono mb-1 font-bold">
          COLLISION DETECTED
        </div>
        <h2 className="text-3xl sm:text-4xl font-black font-display text-white mb-2 tracking-tight">
          RUN TERMINATED
        </h2>

        {/* New Record Banner */}
        {isNewRecord && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-bold font-display tracking-wider">
            <Award className="w-4 h-4 text-amber-400" />
            <span>NEW PERSONAL BEST!</span>
          </div>
        )}

        {/* Big Score Display */}
        <div className="my-5 p-5 rounded-2xl bg-slate-950/70 border border-slate-800">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
            Final Score
          </div>
          <div className="text-4xl sm:text-5xl font-black font-display text-cyan-400 text-glow-cyan tracking-tight">
            {stats.score.toLocaleString()}
          </div>
        </div>

        {/* Run Breakdown Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6 text-left">
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Distance</div>
            <div className="text-lg font-bold font-display text-slate-200">
              {stats.distance} <span className="text-xs text-slate-400">m</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Energy Orbs</span>
            </div>
            <div className="text-lg font-bold font-display text-amber-300">
              {stats.energyCollected}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-emerald-400" />
              <span>Near Misses</span>
            </div>
            <div className="text-lg font-bold font-display text-emerald-300">
              {stats.nearMisses}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
              <Trophy className="w-3 h-3 text-fuchsia-400" />
              <span>Best Score</span>
            </div>
            <div className="text-lg font-bold font-display text-fuchsia-300">
              {stats.bestScore.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onRestart}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-slate-950 font-black font-display text-base tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            onClick={onExit}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold font-display text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer border border-slate-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
