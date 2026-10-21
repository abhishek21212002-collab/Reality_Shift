/**
 * Reality Shift: Neon Rush - Core Types
 */

export type Reality = 'CYAN' | 'MAGENTA';

export type ObstacleReality = 'CYAN' | 'MAGENTA' | 'DUAL';

export type ObstacleType = 
  | 'LOW_BARRIER'    // Jumpable (must jump over or change lane)
  | 'HIGH_BEAM'      // Slidable (must slide under or change lane)
  | 'TALL_PILLAR'    // Non-jumpable/non-slidable (must change lane or shift reality if single-reality)
  | 'ENERGY_GATE';   // Dual-phase gate with specific safe reality or lane

export interface Obstacle {
  id: number;
  lane: number;           // -1 (Left), 0 (Center), 1 (Right)
  z: number;              // Position along track (negative Z is forward)
  type: ObstacleType;
  reality: ObstacleReality;
  passed: boolean;
  nearMissAwarded: boolean;
  meshGroup: any;         // THREE.Group
}

export interface Collectible {
  id: number;
  lane: number;
  z: number;
  y: number;
  reality: ObstacleReality;
  collected: boolean;
  meshGroup: any;         // THREE.Group
}

export type GameState = 'START' | 'COUNTDOWN' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export interface GameStats {
  score: number;
  distance: number;
  energyCollected: number;
  nearMisses: number;
  combo: number;
  maxCombo: number;
  speed: number;
  currentReality: Reality;
  bestScore: number;
  bestDistance: number;
}
