/**
 * Reality Shift: Neon Rush - Main 3D Game Engine
 * Orchestrates Scene, Camera, Lighting, Player, Track, Obstacles, Particles, Audio, and Input
 */

import * as THREE from 'three';
import { PlayerModel } from './PlayerModel';
import { TrackManager } from './TrackManager';
import { ObstacleManager } from './ObstacleManager';
import { CollectibleManager } from './CollectibleManager';
import { ParticleSystem } from './ParticleSystem';
import { soundManager } from '../audio/SoundManager';
import {
  GameState,
  GameStats,
  Reality,
} from '../types/game';
import {
  INITIAL_SPEED,
  JUMP_DURATION,
  LANE_X_POSITIONS,
  MAX_SPEED,
  REALITY_COLORS,
  SLIDE_DURATION,
  SPEED_ACCELERATION,
} from './constants';

export class GameEngine {
  public container: HTMLElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;

  // Subsystems
  public player: PlayerModel;
  public trackManager: TrackManager;
  public obstacleManager: ObstacleManager;
  public collectibleManager: CollectibleManager;
  public particleSystem: ParticleSystem;

  // Lights & Fog
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private playerLight: THREE.PointLight;
  private fog: THREE.FogExp2;

  // Game Loop & State
  private animationFrameId: number = 0;
  private lastTime: number = 0;
  public gameState: GameState = 'START';
  public currentReality: Reality = 'CYAN';

  // Player State
  private currentLane: -1 | 0 | 1 = 0;
  private isJumping: boolean = false;
  private jumpTimer: number = 0;
  private isSliding: boolean = false;
  private slideTimer: number = 0;

  // Dynamics & Speeds
  private playerZ: number = 0;
  private speed: number = INITIAL_SPEED;
  private distanceRun: number = 0;
  private score: number = 0;
  private energyCount: number = 0;
  private nearMissCount: number = 0;
  private combo: number = 1;
  private comboTimer: number = 0;
  private maxCombo: number = 1;

  // Camera Dynamics & FX
  private cameraShakeIntensity: number = 0;
  private baseFov: number = 65;
  private targetFov: number = 65;

  // UI Event Callbacks
  public onStatsUpdate?: (stats: GameStats) => void;
  public onStateChange?: (state: GameState) => void;
  public onNearMissFeedback?: (msg: string) => void;
  public onRealityShiftFeedback?: (reality: Reality) => void;

  private isSoftwareGl: boolean = false;
  private isDisposed: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;

    // Detect software WebGL as instructed in Three.js skill
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // 1. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 2. Scene & Fog Setup
    this.scene = new THREE.Scene();
    this.fog = new THREE.FogExp2(REALITY_COLORS.CYAN.fog, 0.018);
    this.scene.fog = this.fog;
    this.scene.background = new THREE.Color(REALITY_COLORS.CYAN.fog);

    // 3. Camera Setup
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(this.baseFov, aspect, 0.1, 300);
    this.camera.position.set(0, 3.8, 5.2);
    this.camera.lookAt(0, 1.4, -6);

    // 4. Lighting Rig
    this.dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    this.dirLight.position.set(15, 25, 10);
    this.dirLight.castShadow = !this.isSoftwareGl;
    if (this.dirLight.castShadow) {
      this.dirLight.shadow.mapSize.width = 1024;
      this.dirLight.shadow.mapSize.height = 1024;
      this.dirLight.shadow.camera.near = 1;
      this.dirLight.shadow.camera.far = 60;
      this.dirLight.shadow.camera.left = -15;
      this.dirLight.shadow.camera.right = 15;
      this.dirLight.shadow.camera.top = 15;
      this.dirLight.shadow.camera.bottom = -15;
      this.dirLight.shadow.bias = -0.0005;
    }
    this.scene.add(this.dirLight);

    this.hemiLight = new THREE.HemisphereLight(0x00f0ff, 0x030d1a, 1.2);
    this.scene.add(this.hemiLight);

    this.playerLight = new THREE.PointLight(REALITY_COLORS.CYAN.primary, 3.0, 14);
    this.playerLight.position.set(0, 2, 0);
    this.scene.add(this.playerLight);

    // 5. Initialize Subsystems
    this.player = new PlayerModel();
    this.scene.add(this.player.group);

    this.trackManager = new TrackManager(this.scene);
    this.obstacleManager = new ObstacleManager(this.scene);
    this.collectibleManager = new CollectibleManager(this.scene);
    this.particleSystem = new ParticleSystem(this.scene);

    // Bind listeners
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('keydown', this.handleKeyDown);

    // Start render loop
    this.lastTime = performance.now();
    this.startLoop();
  }

  // --- Keyboard & Input Handling ---
  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return;

    if (e.code === 'KeyP' || e.code === 'Escape') {
      if (this.gameState === 'PLAYING') {
        this.pauseGame();
      } else if (this.gameState === 'PAUSED') {
        this.resumeGame();
      }
      return;
    }

    if (this.gameState !== 'PLAYING') return;

    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.moveLane(-1);
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.moveLane(1);
        break;
      case 'ArrowUp':
      case 'Space':
      case 'KeyW':
        this.jump();
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.slide();
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
      case 'KeyE':
      case 'KeyQ':
        this.shiftReality();
        break;
    }
  };

  // Public controls (used by mobile touch buttons and swipe handlers)
  public moveLane(direction: -1 | 1) {
    if (this.gameState !== 'PLAYING') return;
    const newLane = (this.currentLane + direction) as -1 | 0 | 1;
    if (newLane >= -1 && newLane <= 1) {
      this.currentLane = newLane;
      const targetX = LANE_X_POSITIONS[String(this.currentLane) as '-1' | '0' | '1'];
      this.player.setTargetLane(targetX);
    }
  }

  public jump() {
    if (this.gameState !== 'PLAYING' || this.isJumping) return;
    this.isJumping = true;
    this.jumpTimer = 0;
    this.isSliding = false; // Cancel slide if jump pressed
    soundManager.playJump();
  }

  public slide() {
    if (this.gameState !== 'PLAYING' || this.isSliding) return;
    this.isSliding = true;
    this.slideTimer = 0;
    soundManager.playSlide();
  }

  public shiftReality() {
    if (this.gameState !== 'PLAYING') return;
    const newReality: Reality = this.currentReality === 'CYAN' ? 'MAGENTA' : 'CYAN';
    this.setReality(newReality);
  }

  public setReality(newReality: Reality) {
    this.currentReality = newReality;

    // 1. Audio
    soundManager.setReality(newReality);
    soundManager.playRealityShift(newReality);

    // 2. Scene Fog & Background
    const colorInfo = REALITY_COLORS[newReality];
    const fogCol = new THREE.Color(colorInfo.fog);
    this.fog.color.copy(fogCol);
    this.scene.background = fogCol;

    // 3. Lights
    this.hemiLight.color.copy(new THREE.Color(colorInfo.primary));
    this.hemiLight.groundColor.copy(new THREE.Color(colorInfo.dark));
    this.playerLight.color.copy(new THREE.Color(colorInfo.primary));

    // 4. Subsystems
    this.player.setReality(newReality);
    this.trackManager.setReality(newReality);
    this.obstacleManager.setReality(newReality);
    this.collectibleManager.setReality(newReality);
    this.particleSystem.setReality(newReality);

    // 5. Emit shockwave particles & camera impulse
    this.particleSystem.emitRealityShift(this.player.getPosition(), newReality);
    this.cameraShakeIntensity = 0.25;

    // 6. UI Feedback
    if (this.onRealityShiftFeedback) {
      this.onRealityShiftFeedback(newReality);
    }
  }

  // --- Game State Flow ---
  public startGame() {
    this.resetRun();
    this.setGameState('PLAYING');
    soundManager.startBGM();
  }

  public pauseGame() {
    if (this.gameState !== 'PLAYING') return;
    this.setGameState('PAUSED');
  }

  public resumeGame() {
    if (this.gameState !== 'PAUSED') return;
    this.setGameState('PLAYING');
    this.lastTime = performance.now();
  }

  public restartGame() {
    this.resetRun();
    this.setGameState('PLAYING');
    soundManager.startBGM();
  }

  public exitToMenu() {
    this.resetRun();
    this.setGameState('START');
    soundManager.stopBGM();
  }

  private setGameState(newState: GameState) {
    this.gameState = newState;
    if (this.onStateChange) {
      this.onStateChange(newState);
    }
  }

  private resetRun() {
    this.playerZ = 0;
    this.speed = INITIAL_SPEED;
    this.distanceRun = 0;
    this.score = 0;
    this.energyCount = 0;
    this.nearMissCount = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.maxCombo = 1;

    this.currentLane = 0;
    this.isJumping = false;
    this.jumpTimer = 0;
    this.isSliding = false;
    this.slideTimer = 0;
    this.cameraShakeIntensity = 0;

    this.player.setTargetLane(0);
    this.player.group.position.set(0, 0, 0);

    this.trackManager.reset();
    this.obstacleManager.reset();
    this.collectibleManager.reset();
    this.particleSystem.reset();

    this.setReality('CYAN');
    soundManager.setSpeedFactor(0);
  }

  private gameOver() {
    this.setGameState('GAMEOVER');
    soundManager.stopBGM();
    soundManager.playCollision();

    // Camera impact shake & debris burst
    this.cameraShakeIntensity = 0.65;
    this.particleSystem.emitCollision(this.player.getPosition());

    // Save best score to localStorage
    const savedBestScore = parseInt(localStorage.getItem('neon_rush_high_score') || '0', 10);
    const savedBestDist = parseInt(localStorage.getItem('neon_rush_best_dist') || '0', 10);

    if (this.score > savedBestScore) {
      localStorage.setItem('neon_rush_high_score', String(Math.floor(this.score)));
    }
    if (this.distanceRun > savedBestDist) {
      localStorage.setItem('neon_rush_best_dist', String(Math.floor(this.distanceRun)));
    }
  }

  // --- Animation & Physics Tick ---
  private startLoop() {
    const tick = (now: number) => {
      if (this.isDisposed) return;

      const delta = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;

      this.update(delta, now / 1000);
      this.render();

      this.animationFrameId = requestAnimationFrame(tick);
    };

    this.animationFrameId = requestAnimationFrame(tick);
  }

  private update(delta: number, time: number) {
    if (this.gameState === 'PLAYING') {
      // 1. Accelerate speed gradually with distance
      this.speed = Math.min(MAX_SPEED, INITIAL_SPEED + (this.distanceRun / 100) * SPEED_ACCELERATION);
      const speedRatio = (this.speed - INITIAL_SPEED) / (MAX_SPEED - INITIAL_SPEED);
      soundManager.setSpeedFactor(speedRatio);

      // 2. Advance player forward along track (negative Z)
      const forwardDelta = this.speed * delta;
      this.playerZ -= forwardDelta;
      this.distanceRun += forwardDelta;
      this.score += forwardDelta * 2 * this.combo;

      this.player.group.position.z = this.playerZ;

      // 3. Jump Physics
      let jumpProgress = 0;
      if (this.isJumping) {
        this.jumpTimer += delta;
        jumpProgress = this.jumpTimer / JUMP_DURATION;
        if (jumpProgress >= 1.0) {
          this.isJumping = false;
          this.jumpTimer = 0;
          jumpProgress = 0;
        }
      }

      // 4. Slide Physics
      let slideProgress = 0;
      if (this.isSliding) {
        this.slideTimer += delta;
        slideProgress = this.slideTimer / SLIDE_DURATION;
        if (slideProgress >= 1.0) {
          this.isSliding = false;
          this.slideTimer = 0;
          slideProgress = 0;
        }
      }

      // 5. Update Player Model Kinematics
      this.player.update(
        delta,
        this.isJumping,
        jumpProgress,
        this.isSliding,
        slideProgress,
        speedRatio
      );

      // Position local light with player
      this.playerLight.position.set(this.player.group.position.x, 2.0, this.playerZ);

      // 6. Update Subsystems
      this.trackManager.update(this.playerZ);
      this.obstacleManager.updateSpawning(this.playerZ, this.speed);
      this.collectibleManager.updateSpawning(this.playerZ);
      this.collectibleManager.update(delta, time);
      this.particleSystem.update(delta, this.playerZ, this.speed);

      // 7. Check Collisions & Near Misses
      const collisionResult = this.obstacleManager.checkCollision(
        this.player.group.position.x,
        this.player.group.position.y,
        this.playerZ,
        this.isJumping,
        this.isSliding
      );

      if (collisionResult.collided) {
        this.gameOver();
        return;
      }

      if (collisionResult.nearMiss) {
        this.nearMissCount++;
        this.combo = Math.min(8, this.combo + 1);
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.comboTimer = 5.0; // seconds before combo expires
        this.score += 250 * this.combo;

        soundManager.playNearMiss();
        this.cameraShakeIntensity = 0.2;

        if (this.onNearMissFeedback) {
          this.onNearMissFeedback(`NEAR MISS! +${250 * this.combo}`);
        }
      }

      // 8. Check Collectible Pickups
      const collectionResult = this.collectibleManager.checkCollection(
        this.player.group.position.x,
        this.player.group.position.y,
        this.playerZ
      );

      if (collectionResult.collectedCount > 0) {
        this.energyCount += collectionResult.collectedCount;
        this.score += collectionResult.points * this.combo;
        this.comboTimer = 5.0; // Refresh combo timer

        soundManager.playCollect(this.combo);

        collectionResult.positions.forEach(pos => {
          this.particleSystem.emitCollection(pos);
        });
      }

      // 9. Combo decay
      if (this.combo > 1) {
        this.comboTimer -= delta;
        if (this.comboTimer <= 0) {
          this.combo = 1;
        }
      }

      // 10. Update Camera to Follow Player
      const targetCamX = this.player.group.position.x * 0.45;
      const targetCamY = 3.6 + (this.isJumping ? this.player.group.position.y * 0.4 : 0);
      const targetCamZ = this.playerZ + 5.2;

      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 12, delta);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamY, 12, delta);
      this.camera.position.z = targetCamZ;

      // Dynamic FOV based on speed
      this.targetFov = this.baseFov + speedRatio * 15;
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, this.targetFov, 6, delta);
      this.camera.updateProjectionMatrix();

      // Camera LookAt
      this.camera.lookAt(targetCamX * 0.2, 1.4, this.playerZ - 10);

      // Camera Shake
      if (this.cameraShakeIntensity > 0) {
        this.camera.position.x += (Math.random() - 0.5) * this.cameraShakeIntensity;
        this.camera.position.y += (Math.random() - 0.5) * this.cameraShakeIntensity;
        this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - delta * 2.5);
      }

      // 11. Broadcast Stats to UI
      if (this.onStatsUpdate) {
        const savedBestScore = parseInt(localStorage.getItem('neon_rush_high_score') || '0', 10);
        const savedBestDist = parseInt(localStorage.getItem('neon_rush_best_dist') || '0', 10);

        this.onStatsUpdate({
          score: Math.floor(this.score),
          distance: Math.floor(this.distanceRun),
          energyCollected: this.energyCount,
          nearMisses: this.nearMissCount,
          combo: this.combo,
          maxCombo: this.maxCombo,
          speed: Math.round(this.speed * 3.6), // km/h representation
          currentReality: this.currentReality,
          bestScore: Math.max(savedBestScore, Math.floor(this.score)),
          bestDistance: Math.max(savedBestDist, Math.floor(this.distanceRun)),
        });
      }

    } else if (this.gameState === 'START') {
      // Idle 3D preview: Runner running in place, track gently scrolling, camera orbiting
      this.player.update(delta, false, 0, false, 0, 0.2);
      this.playerZ -= 12 * delta;
      this.player.group.position.z = this.playerZ;
      this.trackManager.update(this.playerZ);

      // Gentle camera orbit preview
      const orbitAngle = time * 0.4;
      this.camera.position.x = Math.sin(orbitAngle) * 3.0;
      this.camera.position.y = 3.2 + Math.cos(orbitAngle * 0.7) * 0.5;
      this.camera.position.z = this.playerZ + 5.5;
      this.camera.lookAt(0, 1.3, this.playerZ - 4);
    }
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize = () => {
    if (!this.container || this.isDisposed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  };

  public dispose() {
    this.isDisposed = true;
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('keydown', this.handleKeyDown);

    soundManager.stopBGM();

    this.player.dispose();
    this.trackManager.dispose();
    this.obstacleManager.dispose();
    this.collectibleManager.dispose();
    this.particleSystem.dispose();

    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
