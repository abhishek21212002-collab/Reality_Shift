/**
 * Reality Shift: Neon Rush - 3D Energy Orbs / Collectibles Manager
 */

import * as THREE from 'three';
import { Collectible, ObstacleReality, Reality } from '../types/game';
import { LANE_WIDTH, LANE_X_POSITIONS, REALITY_COLORS } from './constants';

export class CollectibleManager {
  public scene: THREE.Scene;
  public collectibles: Collectible[] = [];
  private nextId: number = 1;
  private currentReality: Reality = 'CYAN';
  private lastSpawnZ: number = -30;

  // Shared Geometries & Materials
  private orbGeo: THREE.IcosahedronGeometry;
  private ringGeo: THREE.TorusGeometry;

  private cyanMat: THREE.MeshStandardMaterial;
  private magentaMat: THREE.MeshStandardMaterial;
  private dualMat: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.orbGeo = new THREE.IcosahedronGeometry(0.3, 2);
    this.ringGeo = new THREE.TorusGeometry(0.48, 0.04, 8, 24);

    this.cyanMat = new THREE.MeshStandardMaterial({
      color: REALITY_COLORS.CYAN.primary,
      emissive: REALITY_COLORS.CYAN.primary,
      emissiveIntensity: 2.5,
      roughness: 0.1,
      metalness: 0.9,
    });

    this.magentaMat = new THREE.MeshStandardMaterial({
      color: REALITY_COLORS.MAGENTA.primary,
      emissive: REALITY_COLORS.MAGENTA.primary,
      emissiveIntensity: 2.5,
      roughness: 0.1,
      metalness: 0.9,
    });

    this.dualMat = new THREE.MeshStandardMaterial({
      color: REALITY_COLORS.DUAL.primary,
      emissive: REALITY_COLORS.DUAL.primary,
      emissiveIntensity: 2.8,
      roughness: 0.1,
      metalness: 0.9,
    });
  }

  public setReality(reality: Reality) {
    this.currentReality = reality;
  }

  public updateSpawning(playerZ: number) {
    while (this.lastSpawnZ > playerZ - 120) {
      const spawnZ = this.lastSpawnZ - 14 - Math.random() * 8;
      this.spawnOrbCluster(spawnZ);
      this.lastSpawnZ = spawnZ;
    }

    // Despawn orbs passed behind player
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const c = this.collectibles[i];
      if (c.z > playerZ + 15 || c.collected) {
        this.scene.remove(c.meshGroup);
        this.collectibles.splice(i, 1);
      }
    }
  }

  private spawnOrbCluster(startZ: number) {
    const lane = (Math.floor(Math.random() * 3) - 1) as -1 | 0 | 1;
    const realityType: ObstacleReality = Math.random() > 0.4 ? 'DUAL' : (Math.random() > 0.5 ? 'CYAN' : 'MAGENTA');
    const clusterCount = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < clusterCount; i++) {
      const z = startZ - i * 3.5;
      this.createOrb(lane, z, 0.8, realityType);
    }
  }

  private createOrb(lane: -1 | 0 | 1, z: number, y: number, reality: ObstacleReality) {
    const group = new THREE.Group();
    const posX = LANE_X_POSITIONS[String(lane) as '-1' | '0' | '1'];
    group.position.set(posX, y, z);

    let mat = this.dualMat;
    if (reality === 'CYAN') mat = this.cyanMat;
    if (reality === 'MAGENTA') mat = this.magentaMat;

    // Glowing core orb
    const core = new THREE.Mesh(this.orbGeo, mat);
    group.add(core);

    // Orbiting gyroscopic ring
    const ring = new THREE.Mesh(this.ringGeo, mat);
    ring.rotation.x = Math.PI / 4;
    group.add(ring);

    this.scene.add(group);

    this.collectibles.push({
      id: this.nextId++,
      lane,
      z,
      y,
      reality,
      collected: false,
      meshGroup: group,
    });
  }

  public update(delta: number, time: number) {
    // Animate spinning and floating
    for (const c of this.collectibles) {
      if (c.collected) continue;
      c.meshGroup.rotation.y += delta * 3.0;
      c.meshGroup.children[1].rotation.x += delta * 2.0;
      c.meshGroup.children[1].rotation.y += delta * 1.5;
      c.meshGroup.position.y = c.y + Math.sin(time * 4.0 + c.id) * 0.18;
    }
  }

  /**
   * Check if player collides with any energy orb.
   * Universal orbs can always be collected.
   * Dimension orbs award double points if collected in the matching reality!
   */
  public checkCollection(
    playerLaneX: number,
    playerY: number,
    playerZ: number
  ): { collectedCount: number; points: number; positions: THREE.Vector3[] } {
    let collectedCount = 0;
    let points = 0;
    const positions: THREE.Vector3[] = [];

    const hitDepth = 1.3;
    const laneThreshold = LANE_WIDTH * 0.45;

    for (const c of this.collectibles) {
      if (c.collected) continue;

      const zDiff = Math.abs(c.z - playerZ);
      if (zDiff < hitDepth) {
        const cX = LANE_X_POSITIONS[String(c.lane) as '-1' | '0' | '1'];
        const xDiff = Math.abs(cX - playerLaneX);

        if (xDiff <= laneThreshold) {
          // Check Y-axis reachability
          const yDiff = Math.abs((c.y + 0.2) - (playerY + 0.8));
          if (yDiff < 1.4) {
            c.collected = true;
            this.scene.remove(c.meshGroup);
            positions.push(c.meshGroup.position.clone());
            collectedCount++;

            // Matching reality bonus
            const isMatch = c.reality === this.currentReality || c.reality === 'DUAL';
            points += isMatch ? 150 : 75;
          }
        }
      }
    }

    return { collectedCount, points, positions };
  }

  public reset() {
    this.collectibles.forEach(c => {
      this.scene.remove(c.meshGroup);
    });
    this.collectibles = [];
    this.lastSpawnZ = -30;
    this.nextId = 1;
  }

  public dispose() {
    this.reset();
    this.orbGeo.dispose();
    this.ringGeo.dispose();
    this.cyanMat.dispose();
    this.magentaMat.dispose();
    this.dualMat.dispose();
  }
}
