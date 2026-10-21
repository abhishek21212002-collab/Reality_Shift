/**
 * Reality Shift: Neon Rush - 3D Game Canvas Container
 * Manages Three.js WebGL viewport lifecycle and touch swipe gestures
 */

import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../game/GameEngine';

interface GameCanvasProps {
  onEngineReady: (engine: GameEngine) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ onEngineReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Touch Swipe tracking
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Instantiate game engine
    const engine = new GameEngine(containerRef.current);
    engineRef.current = engine;
    onEngineReady(engine);

    // Touch event listeners for intuitive swipe controls
    const container = containerRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: performance.now(),
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Prevent browser default pull-to-refresh or bounce
      e.preventDefault();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || !engineRef.current) return;
      const endTouch = e.changedTouches[0];
      const dx = endTouch.clientX - touchStartRef.current.x;
      const dy = endTouch.clientY - touchStartRef.current.y;
      const dt = performance.now() - touchStartRef.current.time;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      const minSwipeDist = 30;

      if (absX > minSwipeDist && absX > absY) {
        // Horizontal swipe: lane change
        if (dx > 0) {
          engineRef.current.moveLane(1);
        } else {
          engineRef.current.moveLane(-1);
        }
      } else if (absY > minSwipeDist && absY > absX) {
        // Vertical swipe: jump or slide
        if (dy < 0) {
          engineRef.current.jump();
        } else {
          engineRef.current.slide();
        }
      } else if (absX < 15 && absY < 15 && dt < 280) {
        // Quick tap anywhere on upper canvas: Reality Shift
        // (if tap is not on lower buttons)
        if (endTouch.clientY < window.innerHeight * 0.7) {
          engineRef.current.shiftReality();
        }
      }

      touchStartRef.current = null;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden bg-slate-950 touch-none"
    />
  );
};
