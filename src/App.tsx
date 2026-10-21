/**
 * Reality Shift: Neon Rush - Main Application Entry
 * Full-featured 3D arcade runner with dual-reality shifting mechanics
 */

import React, { useState, useEffect, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { StartScreen } from './components/StartScreen';
import { PauseScreen } from './components/PauseScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { MobileControls } from './components/MobileControls';
import { GameEngine } from './game/GameEngine';
import { soundManager } from './audio/SoundManager';
import { GameState, GameStats, Reality } from './types/game';

export default function App() {
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('START');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    distance: 0,
    energyCollected: 0,
    nearMisses: 0,
    combo: 1,
    maxCombo: 1,
    speed: 86,
    currentReality: 'CYAN',
    bestScore: 0,
    bestDistance: 0,
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => soundManager.getIsMuted());
  const [nearMissBanner, setNearMissBanner] = useState<string | null>(null);
  const [realityShiftFlash, setRealityShiftFlash] = useState<Reality | null>(null);
  const bannerTimeoutRef = useRef<number | null>(null);
  const flashTimeoutRef = useRef<number | null>(null);

  // Load saved high scores
  useEffect(() => {
    const savedScore = parseInt(localStorage.getItem('neon_rush_high_score') || '0', 10);
    const savedDist = parseInt(localStorage.getItem('neon_rush_best_dist') || '0', 10);
    setStats(prev => ({
      ...prev,
      bestScore: savedScore,
      bestDistance: savedDist,
    }));
  }, []);

  const handleEngineReady = (engine: GameEngine) => {
    engineRef.current = engine;

    engine.onStatsUpdate = (newStats: GameStats) => {
      setStats(newStats);
    };

    engine.onStateChange = (newState: GameState) => {
      setGameState(newState);
    };

    engine.onNearMissFeedback = (msg: string) => {
      setNearMissBanner(msg);
      if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
      bannerTimeoutRef.current = window.setTimeout(() => {
        setNearMissBanner(null);
      }, 1200);
    };

    engine.onRealityShiftFeedback = (reality: Reality) => {
      setRealityShiftFlash(reality);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = window.setTimeout(() => {
        setRealityShiftFlash(null);
      }, 350);
    };
  };

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const handleStartGame = () => {
    soundManager.init();
    if (engineRef.current) {
      engineRef.current.startGame();
    }
  };

  const handlePauseGame = () => {
    if (engineRef.current) {
      engineRef.current.pauseGame();
    }
  };

  const handleResumeGame = () => {
    if (engineRef.current) {
      engineRef.current.resumeGame();
    }
  };

  const handleRestartGame = () => {
    if (engineRef.current) {
      engineRef.current.restartGame();
    }
  };

  const handleExitToMenu = () => {
    if (engineRef.current) {
      engineRef.current.exitToMenu();
    }
  };

  // Mobile control callbacks
  const handleMoveLeft = () => engineRef.current?.moveLane(-1);
  const handleMoveRight = () => engineRef.current?.moveLane(1);
  const handleJump = () => engineRef.current?.jump();
  const handleSlide = () => engineRef.current?.slide();
  const handleShiftReality = () => engineRef.current?.shiftReality();

  return (
    <div className="relative w-full h-full min-h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D WebGL Canvas Layer */}
      <GameCanvas onEngineReady={handleEngineReady} />

      {/* Retro Cyberpunk Scanlines */}
      <div className="absolute inset-0 pointer-events-none scanlines opacity-35 z-10" />

      {/* Screen Vignette */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.85)] z-10" />

      {/* Game State Views */}
      {gameState === 'START' && (
        <StartScreen
          onStart={handleStartGame}
          bestScore={stats.bestScore}
          bestDistance={stats.bestDistance}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <>
          <HUD
            stats={stats}
            onPause={handlePauseGame}
            onToggleMute={handleToggleMute}
            isMuted={isMuted}
            nearMissBanner={nearMissBanner}
            realityShiftFlash={realityShiftFlash}
          />

          {gameState === 'PLAYING' && (
            <MobileControls
              onMoveLeft={handleMoveLeft}
              onMoveRight={handleMoveRight}
              onJump={handleJump}
              onSlide={handleSlide}
              onShiftReality={handleShiftReality}
              currentReality={stats.currentReality}
            />
          )}
        </>
      )}

      {gameState === 'PAUSED' && (
        <PauseScreen
          onResume={handleResumeGame}
          onRestart={handleRestartGame}
          onExit={handleExitToMenu}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {gameState === 'GAMEOVER' && (
        <GameOverScreen
          stats={stats}
          onRestart={handleRestartGame}
          onExit={handleExitToMenu}
        />
      )}
    </div>
  );
}
