/**
 * Reality Shift: Neon Rush - Constants & Tuning
 */

export const LANE_WIDTH = 2.4;
export const LANES = [-1, 0, 1] as const;
export const LANE_X_POSITIONS = {
  '-1': -LANE_WIDTH,
  '0': 0,
  '1': LANE_WIDTH,
};

export const INITIAL_SPEED = 24.0; // units per second
export const MAX_SPEED = 64.0;
export const SPEED_ACCELERATION = 0.5; // speed increase per 100 meters

export const JUMP_DURATION = 0.7; // seconds
export const JUMP_HEIGHT = 2.2;
export const SLIDE_DURATION = 0.65; // seconds

export const PLAYER_COLLISION_BOX = {
  width: 0.9,
  heightNormal: 1.8,
  heightSliding: 0.8,
  depth: 0.9,
};

// Colors for Reality A (Cyan) and Reality B (Magenta)
export const REALITY_COLORS = {
  CYAN: {
    primary: 0x00f0ff,
    secondary: 0x0077ff,
    dark: 0x031326,
    fog: 0x020d1a,
    ambient: 0x002244,
    accent: 0x38bdf8,
    glowHex: '#00f0ff',
  },
  MAGENTA: {
    primary: 0xff007f,
    secondary: 0xa800ff,
    dark: 0x1f0321,
    fog: 0x140217,
    ambient: 0x330033,
    accent: 0xf43f5e,
    glowHex: '#ff007f',
  },
  DUAL: {
    primary: 0xfacc15, // Golden / Amber for universal hazards
    secondary: 0xf97316,
    glowHex: '#facc15',
  }
};

export const TRACK_SEGMENT_LENGTH = 80;
export const NUM_TRACK_SEGMENTS = 5;
export const SPAWN_DISTANCE = -140; // Where obstacles appear in front of player
export const DESPAWN_DISTANCE = 15; // Behind the player camera
