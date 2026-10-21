/**
 * Reality Shift: Neon Rush - Mobile Touch Control Overlay
 * Large, responsive buttons for touch devices with tactile neon feedback
 */

import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { Reality } from '../types/game';

interface MobileControlsProps {
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onJump: () => void;
  onSlide: () => void;
  onShiftReality: () => void;
  currentReality: Reality;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMoveLeft,
  onMoveRight,
  onJump,
  onSlide,
  onShiftReality,
  currentReality,
}) => {
  const isCyan = currentReality === 'CYAN';

  const handleTouch = (action: () => void) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  return (
    <div className="absolute inset-x-0 bottom-4 pointer-events-none px-4 flex justify-between items-end z-20">
      {/* Left Pad: Lane Steering */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onTouchStart={handleTouch(onMoveLeft)}
          onMouseDown={handleTouch(onMoveLeft)}
          aria-label="Move Left"
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-slate-900/90 border-2 border-slate-700 active:border-cyan-400 active:bg-cyan-950/60 flex items-center justify-center text-slate-200 active:text-cyan-300 shadow-xl active:scale-95 transition-transform touch-manipulation cursor-pointer"
        >
          <ArrowLeft className="w-8 h-8" />
        </button>

        <button
          onTouchStart={handleTouch(onMoveRight)}
          onMouseDown={handleTouch(onMoveRight)}
          aria-label="Move Right"
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-slate-900/90 border-2 border-slate-700 active:border-cyan-400 active:bg-cyan-950/60 flex items-center justify-center text-slate-200 active:text-cyan-300 shadow-xl active:scale-95 transition-transform touch-manipulation cursor-pointer"
        >
          <ArrowRight className="w-8 h-8" />
        </button>
      </div>

      {/* Center: Large Reality Shift Thumb Button */}
      <div className="pointer-events-auto pb-1">
        <button
          onTouchStart={handleTouch(onShiftReality)}
          onMouseDown={handleTouch(onShiftReality)}
          aria-label="Shift Reality"
          className={`px-5 py-4 sm:px-6 sm:py-5 rounded-2xl font-black font-display text-sm tracking-wider flex flex-col items-center justify-center gap-1 shadow-2xl active:scale-95 transition-all touch-manipulation cursor-pointer border-2 ${
            isCyan
              ? 'bg-fuchsia-600/90 border-fuchsia-400 text-white shadow-[0_0_20px_rgba(236,72,153,0.5)]'
              : 'bg-cyan-500/90 border-cyan-300 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.5)]'
          }`}
        >
          <RefreshCw className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
          <span>SHIFT</span>
        </button>
      </div>

      {/* Right Pad: Jump & Slide */}
      <div className="flex flex-col gap-3 pointer-events-auto">
        <button
          onTouchStart={handleTouch(onJump)}
          onMouseDown={handleTouch(onJump)}
          aria-label="Jump"
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-slate-900/90 border-2 border-slate-700 active:border-amber-400 active:bg-amber-950/60 flex flex-col items-center justify-center text-slate-200 active:text-amber-300 shadow-xl active:scale-95 transition-transform touch-manipulation cursor-pointer"
        >
          <ArrowUp className="w-7 h-7" />
          <span className="text-[10px] font-bold uppercase tracking-tight">Jump</span>
        </button>

        <button
          onTouchStart={handleTouch(onSlide)}
          onMouseDown={handleTouch(onSlide)}
          aria-label="Slide"
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-slate-900/90 border-2 border-slate-700 active:border-purple-400 active:bg-purple-950/60 flex flex-col items-center justify-center text-slate-200 active:text-purple-300 shadow-xl active:scale-95 transition-transform touch-manipulation cursor-pointer"
        >
          <ArrowDown className="w-7 h-7" />
          <span className="text-[10px] font-bold uppercase tracking-tight">Slide</span>
        </button>
      </div>
    </div>
  );
};
