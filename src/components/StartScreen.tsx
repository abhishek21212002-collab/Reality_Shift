/**
 * Reality Shift: Neon Rush - Polished Start Screen
 */

import React, { useState } from 'react';
import { Play, Volume2, VolumeX, HelpCircle, Trophy, Zap, Sparkles, X } from 'lucide-react';

interface StartScreenProps {
  onStart: () => void;
  bestScore: number;
  bestDistance: number;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStart,
  bestScore,
  bestDistance,
  isMuted,
  onToggleMute,
}) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-10 pointer-events-auto z-30 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          <span className="text-xs uppercase tracking-widest text-slate-400 font-mono">SIMULATION v2.4</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHowToPlay(true)}
            aria-label="How to play"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-md"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>HOW TO PLAY</span>
          </button>

          <button
            onClick={onToggleMute}
            aria-label="Toggle Sound"
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white transition-all cursor-pointer shadow-md"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Main Center Title & Actions */}
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto my-auto">
        {/* Glow Title */}
        <div className="mb-2">
          <div className="text-xs sm:text-sm font-mono tracking-[0.3em] uppercase text-cyan-400 font-bold mb-1">
            HIGH-OCTANE 3D RUNNER
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black font-display tracking-tight text-white leading-none">
            <span className="text-cyan-400 text-glow-cyan">REALITY</span>{' '}
            <span className="text-fuchsia-500 text-glow-magenta">SHIFT</span>
          </h1>
          <div className="text-2xl sm:text-3xl font-black font-display tracking-widest text-slate-200 mt-1">
            NEON RUSH
          </div>
        </div>

        <p className="text-slate-400 text-sm sm:text-base font-medium max-w-md mt-2 mb-8">
          Two parallel realities. Switch dimensions instantly to bypass hazardous obstacles and survive the simulation.
        </p>

        {/* Play Button */}
        <button
          onClick={onStart}
          aria-label="Engage Run"
          className="group relative inline-flex items-center justify-center gap-3 px-10 py-4 sm:px-12 sm:py-5 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-fuchsia-600 text-slate-950 font-black font-display text-lg sm:text-xl tracking-wider shadow-[0_0_35px_rgba(6,182,212,0.6)] hover:shadow-[0_0_50px_rgba(236,72,153,0.8)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Play className="w-6 h-6 fill-current text-slate-950 transition-transform group-hover:scale-110" />
          <span>ENGAGE RUN</span>
        </button>

        {/* Personal Best Card */}
        {(bestScore > 0 || bestDistance > 0) && (
          <div className="mt-8 flex items-center gap-6 bg-slate-950/80 border border-slate-800 rounded-2xl px-6 py-3 shadow-xl">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Personal Best</div>
                <div className="text-base font-bold font-display text-amber-300">
                  {bestScore.toLocaleString()} pts
                </div>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-800" />

            <div className="text-left">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Best Distance</div>
              <div className="text-base font-bold font-display text-cyan-300">
                {bestDistance} m
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Quick Controls Overview */}
      <div className="w-full max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono">A / D</kbd>
          <span>or Arrows: Lanes</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono">SPACE / W</kbd>
          <span>Jump</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono">S</kbd>
          <span>Slide</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 bg-cyan-950 border border-cyan-500 rounded text-cyan-300 font-mono font-bold">SHIFT / E</kbd>
          <span className="text-cyan-300 font-semibold">Shift Reality</span>
        </div>
      </div>

      {/* How to Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 bg-slate-950/85 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowHowToPlay(false)}
              aria-label="Close"
              className="absolute top-5 right-5 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl sm:text-2xl font-black font-display text-white mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6 text-cyan-400" />
              HOW TO SURVIVE
            </h2>

            <div className="space-y-4 text-sm text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="font-bold text-cyan-400 mb-1 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  Reality A: Cyan Dimension
                </div>
                <p className="text-xs text-slate-400">
                  Cyan obstacles are solid and lethal. Magenta obstacles become translucent holographic ghosts that you can safely phase through!
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="font-bold text-fuchsia-400 mb-1 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-400" />
                  Reality B: Magenta Dimension
                </div>
                <p className="text-xs text-slate-400">
                  Magenta obstacles are solid and lethal. Cyan obstacles ghost out harmlessly!
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="font-bold text-amber-400 mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Universal Hazards & Orbs
                </div>
                <p className="text-xs text-slate-400">
                  Gold hazards collide in BOTH realities—dodge them by changing lanes or vaulting. Collect glowing energy crystals to boost your score combo!
                </p>
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-xs text-cyan-200">
                <strong className="text-white">Pro Tip:</strong> Shifting realities right as you pass an obstacle or narrowly clearing a barrier triggers a <span className="text-amber-300 font-bold">NEAR MISS</span> multiplier!
              </div>
            </div>

            <button
              onClick={() => setShowHowToPlay(false)}
              className="mt-6 w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-display cursor-pointer transition-colors"
            >
              GOT IT, LET'S RUN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
