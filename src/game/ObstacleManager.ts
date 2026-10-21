/**
 * Reality Shift: Neon Rush - 3D Obstacle Manager
 * Handles procedural spawn patterns, fair generation, 3D obstacle models,
 * dynamic reality collision gating, holographic ghosting for inactive reality,
 * and near-miss detection.
 */

import * as THREE from 'three';
import { Obstacle, ObstacleReality, ObstacleType, Reality } from '../types/game';
import { LANE_WIDTH, LANE_X_POSITIONS, REALITY_COLORS } from './constants';

export class ObstacleManager {
  public scene: THREE.Scene;
  public obstacles: Obstacle[] = [];
  private nextId: number = 1;
  private currentReality: Reality = 'CYAN';

  // Procedural spawn tracking
  private lastSpawnZ: number = -40;
  private minSpawnGap: number = 22; // distance between obstacle clusters

  // Reusable materials
  private cyanActiveMat: THREE.MeshStandardMaterial;
  private magentaActiveMat: THREE.MeshStandardMaterial;
  private dualActiveMat: THREE.MeshStandardMaterial;

  private cyanGhostMat: THREE.MeshStandardMaterial;
  private magentaGhostMat: THREE.MeshStandardMaterial;

  private frameMat: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.cyanActiveMat = new THREE.MeshStandardMaterial({
      color: REALITY_COLORS.CYAN.primary,
      emissive: REALITY_COLORS.CYAN.primary,
      emissiveIntensity: 2.2,
      roughness: 0.2,
      metalness: 0.8,
    });

    this.magentaActiveMat = new THREE.MeshStandardMaterial({
      color: REALITY_COLORS.MAGENTA.primary,
      emissive: REALITY_COLORS.MAGENTA.primary,
      emissiveIntensity: 2.2,
      roughness: 0.2,
      metalness: 0.8,
    });

    this.dualActiveMat = new THREE.MeshStandardMaterial({
      color: REALITY_COLORS.DUAL.primary,
      emissive: REALITY_COLORS.DUAL.primary,
      emissiveIntensity: 2.4,
      roughness: 0.2,
      metalness: 0.8,
    });

    // Inactive "Ghost" holographic materials
    this.cyanGhostMat = new THREE.MeshStandardMaterial({
      color: REALITY_COLORS.CYAN.primary,
      emissive: REALITY_COLORS.CYAN.primary,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.25,
      wireframe: true,
      roughness: 0.9,
    });

    this.magentaGhostMat = new THREE.MeshStandardMaterial({
      color: REALITY_COLORS.MAGENTA.primary,
      emissive: REALITY_COLORS.MAGENTA.primary,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.25,
      wireframe: true,
      roughness: 0.9,
    });

    this.frameMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.5,
      metalness: 0.8,
    });
  }

  public setReality(reality: Reality) {
    this.currentReality = reality;
    this.updateObstacleAppearance();
  }

  private updateObstacleAppearance() {
    this.obstacles.forEach(obs => {
      const isActive = obs.reality === 'DUAL' || obs.reality === this.currentReality;
      this.applyObstacleMaterial(obs, isActive);
    });
  }

  private applyObstacleMaterial(obs: Obstacle, isActive: boolean) {
    const isCyan = obs.reality === 'CYAN';
    const isMagenta = obs.reality === 'MAGENTA';
    const isDual = obs.reality === 'DUAL';

    let targetMat: THREE.Material;
    if (isDual) {
      targetMat = this.dualActiveMat;
    } else if (isActive) {
      targetMat = isCyan ? this.cyanActiveMat : this.magentaActiveMat;
    } else {
      targetMat = isCyan ? this.cyanGhostMat : this.magentaGhostMat;
    }

    obs.meshGroup.traverse((child: any) => {
      if (child.isMesh && child.userData.isNeonPart) {
        child.material = targetMat;
      } else if (child.isMesh && child.userData.isFramePart) {
        child.material = isActive ? this.frameMat : (isCyan ? this.cyanGhostMat : this.magentaGhostMat);
      }
    });
  }

  /**
   * Spawns a balanced procedural pattern of obstacles ahead of the player.
   * Crucial rule: Always guarantee at least one safe path (via lane change, jump, slide, OR reality shift)!
   */
  public updateSpawning(playerZ: number, currentSpeed: number) {
    // Dynamic gap based on speed to ensure player has sufficient reaction time
    const dynamicGap = Math.max(18, 20 + (currentSpeed - 24) * 0.4);

    while (this.lastSpawnZ > playerZ - 130) {
      const spawnZ = this.lastSpawnZ - dynamicGap;
      this.generateFairObstaclePattern(spawnZ);
      this.lastSpawnZ = spawnZ;
    }

    // Despawn obstacles passed far behind
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      if (obs.z > playerZ + 20) {
        this.scene.remove(obs.meshGroup);
        obs.meshGroup.traverse((child: any) => {
          if (child.geometry) child.geometry.dispose();
        });
        this.obstacles.splice(i, 1);
      }
    }
  }

  private generateFairObstaclePattern(z: number) {
    const patternType = Math.floor(Math.random() * 5);

    // Pick realities
    const rCyan: ObstacleReality = 'CYAN';
    const rMagenta: ObstacleReality = 'MAGENTA';
    const rDual: ObstacleReality = 'DUAL';

    switch (patternType) {
      case 0: {
        // Single jumpable barrier in one lane, single slide beam in another
        const lane1 = (Math.floor(Math.random() * 3) - 1) as -1 | 0 | 1;
        let lane2 = (Math.floor(Math.random() * 3) - 1) as -1 | 0 | 1;
        while (lane2 === lane1) {
          lane2 = (Math.floor(Math.random() * 3) - 1) as -1 | 0 | 1;
        }
        this.createObstacle(lane1, z, 'LOW_BARRIER', Math.random() > 0.5 ? rCyan : rMagenta);
        this.createObstacle(lane2, z, 'HIGH_BEAM', Math.random() > 0.5 ? rCyan : rMagenta);
        break;
      }

      case 1: {
        // Reality Shift Check:
        // Two lanes blocked by CYAN, remaining lane blocked by MAGENTA
        // Player must either shift to Cyan to pass the Magenta barrier,
        // or shift to Magenta to pass the Cyan barriers!
        const safeReality = Math.random() > 0.5 ? 'CYAN' : 'MAGENTA';
        const hazardReality = safeReality === 'CYAN' ? rMagenta : rCyan;
        const matchingReality = safeReality === 'CYAN' ? rCyan : rMagenta;

        const singleLane = (Math.floor(Math.random() * 3) - 1) as -1 | 0 | 1;
        this.createObstacle(singleLane, z, 'TALL_PILLAR', matchingReality);

        const otherLanes = [-1, 0, 1].filter(l => l !== singleLane) as (-1 | 0 | 1)[];
        otherLanes.forEach(lane => {
          this.createObstacle(lane, z, 'TALL_PILLAR', hazardReality);
        });
        break;
      }

      case 2: {
        // Universal Dual Barrier in one lane (must avoid lane) + Low barrier in another
        const dualLane = (Math.floor(Math.random() * 3) - 1) as -1 | 0 | 1;
        this.createObstacle(dualLane, z, 'TALL_PILLAR', rDual);

        const remainingLanes = [-1, 0, 1].filter(l => l !== dualLane) as (-1 | 0 | 1)[];
        const secondLane = remainingLanes[Math.floor(Math.random() * remainingLanes.length)];
        this.createObstacle(secondLane, z, 'LOW_BARRIER', Math.random() > 0.5 ? rCyan : rMagenta);
        break;
      }

      case 3: {
        // High Slide Beams spanning across 2 lanes, with 1 clear lane or duck opportunity
        const clearLane = (Math.floor(Math.random() * 3) - 1) as -1 | 0 | 1;
        const blockLanes = [-1, 0, 1].filter(l => l !== clearLane) as (-1 | 0 | 1)[];
        blockLanes.forEach(lane => {
          this.createObstacle(lane, z, 'HIGH_BEAM', Math.random() > 0.4 ? rDual : (Math.random() > 0.5 ? rCyan : rMagenta));
        });
        break;
      }

      case 4: {
        // Staggered hurdles: 1 low barrier in lane 0, followed shortly by tall barrier in lane 1
        this.createObstacle(0, z, 'LOW_BARRIER', Math.random() > 0.5 ? rCyan : rMagenta);
        const sideLane = Math.random() > 0.5 ? -1 : 1;
        this.createObstacle(sideLane, z - 8, 'TALL_PILLAR', Math.random() > 0.5 ? rCyan : rMagenta);
        break;
      }
    }
  }

  private createObstacle(
    lane: -1 | 0 | 1,
    z: number,
    type: ObstacleType,
    reality: ObstacleReality
  ): Obstacle {
    const group = new THREE.Group();
    const posX = LANE_X_POSITIONS[String(lane) as '-1' | '0' | '1'];
    group.position.set(posX, 0, z);

    const isActive = reality === 'DUAL' || reality === this.currentReality;
    const isCyan = reality === 'CYAN';
    const isMagenta = reality === 'MAGENTA';
    const isDual = reality === 'DUAL';

    let activeMat: THREE.Material = isDual ? this.dualActiveMat : (isCyan ? this.cyanActiveMat : this.magentaActiveMat);
    let ghostMat: THREE.Material = isCyan ? this.cyanGhostMat : this.magentaGhostMat;
    let currentNeonMat = isDual ? this.dualActiveMat : (isActive ? activeMat : ghostMat);

    if (type === 'LOW_BARRIER') {
      // 3-part Low Hurdle: Two base stands + glowing laser cross-hurdle
      const width = LANE_WIDTH * 0.88;
      const height = 0.7;

      // Base posts
      const postGeo = new THREE.BoxGeometry(0.18, height, 0.25);
      const postL = new THREE.Mesh(postGeo, this.frameMat);
      postL.position.set(-width / 2 + 0.1, height / 2, 0);
      postL.userData.isFramePart = true;
      group.add(postL);

      const postR = new THREE.Mesh(postGeo, this.frameMat);
      postR.position.set(width / 2 - 0.1, height / 2, 0);
      postR.userData.isFramePart = true;
      group.add(postR);

      // Glowing crossbar
      const barGeo = new THREE.BoxGeometry(width, 0.22, 0.2);
      const bar = new THREE.Mesh(barGeo, currentNeonMat);
      bar.position.set(0, height - 0.1, 0);
      bar.userData.isNeonPart = true;
      group.add(bar);

      // Energy laser line across bottom
      const laserGeo = new THREE.BoxGeometry(width - 0.2, 0.08, 0.08);
      const laser = new THREE.Mesh(laserGeo, currentNeonMat);
      laser.position.set(0, 0.2, 0);
      laser.userData.isNeonPart = true;
      group.add(laser);

    } else if (type === 'HIGH_BEAM') {
      // High Overhead Laser: High crossbar you must SLIDE under!
      const width = LANE_WIDTH * 0.95;
      const height = 2.4;
      const beamY = 1.6;

      // Tall vertical frame posts
      const postGeo = new THREE.BoxGeometry(0.18, height, 0.22);
      const postL = new THREE.Mesh(postGeo, this.frameMat);
      postL.position.set(-width / 2 + 0.1, height / 2, 0);
      postL.userData.isFramePart = true;
      group.add(postL);

      const postR = new THREE.Mesh(postGeo, this.frameMat);
      postR.position.set(width / 2 - 0.1, height / 2, 0);
      postR.userData.isFramePart = true;
      group.add(postR);

      // Heavy neon beam at eye level (must slide beneath)
      const beamGeo = new THREE.BoxGeometry(width, 0.45, 0.3);
      const beam = new THREE.Mesh(beamGeo, currentNeonMat);
      beam.position.set(0, beamY, 0);
      beam.userData.isNeonPart = true;
      group.add(beam);

      // Warning laser projector
      const topGeo = new THREE.BoxGeometry(width, 0.18, 0.22);
      const topBar = new THREE.Mesh(topGeo, this.frameMat);
      topBar.position.set(0, height, 0);
      topBar.userData.isFramePart = true;
      group.add(topBar);

    } else {
      // TALL_PILLAR: Full vertical monolithic obstacle
      const width = LANE_WIDTH * 0.85;
      const height = 3.6;

      // Solid central pillar
      const coreGeo = new THREE.BoxGeometry(width * 0.8, height, 0.6);
      const core = new THREE.Mesh(coreGeo, currentNeonMat);
      core.position.set(0, height / 2, 0);
      core.userData.isNeonPart = true;
      group.add(core);

      // Armor frame borders
      const borderGeo = new THREE.BoxGeometry(width, 0.25, 0.65);
      const borderBottom = new THREE.Mesh(borderGeo, this.frameMat);
      borderBottom.position.set(0, 0.12, 0);
      borderBottom.userData.isFramePart = true;
      group.add(borderBottom);

      const borderTop = new THREE.Mesh(borderGeo, this.frameMat);
      borderTop.position.set(0, height - 0.12, 0);
      borderTop.userData.isFramePart = true;
      group.add(borderTop);

      // Floating diamond hazard emblem in center
      const iconGeo = new THREE.OctahedronGeometry(0.3, 0);
      const icon = new THREE.Mesh(iconGeo, currentNeonMat);
      icon.position.set(0, height / 2, 0.35);
      icon.userData.isNeonPart = true;
      group.add(icon);
    }

    this.scene.add(group);

    const obstacle: Obstacle = {
      id: this.nextId++,
      lane,
      z,
      type,
      reality,
      passed: false,
      nearMissAwarded: false,
      meshGroup: group,
    };

    this.obstacles.push(obstacle);
    return obstacle;
  }

  /**
   * Collision Detection Logic:
   * Returns true if player collides with an ACTIVE obstacle.
   * Inactive obstacles in the opposite reality pass right through!
   */
  public checkCollision(
    playerLaneX: number,
    playerY: number,
    playerZ: number,
    isJumping: boolean,
    isSliding: boolean
  ): { collided: boolean; nearMiss: boolean; obstacleId?: number } {
    let collided = false;
    let nearMiss = false;
    let hitId: number | undefined;

    const hitDepth = 0.9;
    const laneCollisionThreshold = LANE_WIDTH * 0.44;

    for (const obs of this.obstacles) {
      const zDiff = Math.abs(obs.z - playerZ);

      // Check for NEAR MISS:
      // Player is very close to an active obstacle on Z, but dodged via lane, jump or slide
      if (!obs.nearMissAwarded && zDiff < 1.4) {
        const isActive = obs.reality === 'DUAL' || obs.reality === this.currentReality;
        if (isActive) {
          const obsX = LANE_X_POSITIONS[String(obs.lane) as '-1' | '0' | '1'];
          const xDiff = Math.abs(obsX - playerLaneX);

          // Did player just barely dodge by adjacent lane or timely action?
          if (xDiff > laneCollisionThreshold && xDiff < LANE_WIDTH * 1.1) {
            obs.nearMissAwarded = true;
            nearMiss = true;
          } else if (xDiff <= laneCollisionThreshold) {
            // Player is in the obstacle's lane: check if safely jumped or slided
            if (obs.type === 'LOW_BARRIER' && isJumping && playerY > 0.8) {
              obs.nearMissAwarded = true;
              nearMiss = true;
            } else if (obs.type === 'HIGH_BEAM' && isSliding) {
              obs.nearMissAwarded = true;
              nearMiss = true;
            }
          }
        }
      }

      // Check for ACTUAL COLLISION:
      if (zDiff < hitDepth) {
        const isActive = obs.reality === 'DUAL' || obs.reality === this.currentReality;
        
        // Critical: Non-active reality obstacles do NOT collide!
        if (!isActive) {
          continue;
        }

        const obsX = LANE_X_POSITIONS[String(obs.lane) as '-1' | '0' | '1'];
        const xDiff = Math.abs(obsX - playerLaneX);

        if (xDiff <= laneCollisionThreshold) {
          // Lane matches! Check Y-axis kinematics:
          if (obs.type === 'LOW_BARRIER') {
            // Cleared if jumping higher than barrier height
            if (playerY < 0.75) {
              collided = true;
              hitId = obs.id;
              break;
            }
          } else if (obs.type === 'HIGH_BEAM') {
            // Cleared if sliding; hits if standing or jumping!
            if (!isSliding || playerY > 0.5) {
              collided = true;
              hitId = obs.id;
              break;
            }
          } else {
            // TALL_PILLAR cannot be jumped or slid under!
            collided = true;
            hitId = obs.id;
            break;
          }
        }
      }
    }

    return { collided, nearMiss, obstacleId: hitId };
  }

  public reset() {
    this.obstacles.forEach(obs => {
      this.scene.remove(obs.meshGroup);
      obs.meshGroup.traverse((child: any) => {
        if (child.geometry) child.geometry.dispose();
      });
    });
    this.obstacles = [];
    this.lastSpawnZ = -40;
    this.nextId = 1;
  }

  public dispose() {
    this.reset();
    this.cyanActiveMat.dispose();
    this.magentaActiveMat.dispose();
    this.dualActiveMat.dispose();
    this.cyanGhostMat.dispose();
    this.magentaGhostMat.dispose();
    this.frameMat.dispose();
  }
}
