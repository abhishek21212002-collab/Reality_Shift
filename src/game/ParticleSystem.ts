/**
 * Reality Shift: Neon Rush - High-Performance Particle Engine
 * Handles reality shift bursts, speed streaks, collection glints, and crash debris.
 */

import * as THREE from 'three';
import { Reality } from '../types/game';
import { REALITY_COLORS } from './constants';

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  r: number;
  g: number;
  b: number;
}

export class ParticleSystem {
  public scene: THREE.Scene;

  // 1. Dynamic Bursts & FX Particles Pool
  private maxBurstParticles: number = 300;
  private burstParticles: Particle[] = [];
  private burstGeo: THREE.BufferGeometry;
  private burstMat: THREE.PointsMaterial;
  private burstPoints: THREE.Points;
  private burstPositions: Float32Array;
  private burstColors: Float32Array;

  // 2. Speed Streaks (Ambient Warp Stars / Streaks)
  private maxStreaks: number = 200;
  private streakGeo: THREE.BufferGeometry;
  private streakMat: THREE.PointsMaterial;
  private streakPoints: THREE.Points;
  private streakPositions: Float32Array;
  private streakColors: Float32Array;

  private currentReality: Reality = 'CYAN';

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // --- Burst Particles Setup ---
    this.burstGeo = new THREE.BufferGeometry();
    this.burstPositions = new Float32Array(this.maxBurstParticles * 3);
    this.burstColors = new Float32Array(this.maxBurstParticles * 3);

    this.burstGeo.setAttribute('position', new THREE.BufferAttribute(this.burstPositions, 3));
    this.burstGeo.setAttribute('color', new THREE.BufferAttribute(this.burstColors, 3));

    this.burstMat = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.burstPoints = new THREE.Points(this.burstGeo, this.burstMat);
    this.burstPoints.frustumCulled = false;
    this.scene.add(this.burstPoints);

    // Initialize all burst particles as dead (off-screen)
    for (let i = 0; i < this.maxBurstParticles; i++) {
      this.burstPositions[i * 3 + 1] = -9999;
    }
    this.burstGeo.attributes.position.needsUpdate = true;

    // --- Speed Streaks Setup ---
    this.streakGeo = new THREE.BufferGeometry();
    this.streakPositions = new Float32Array(this.maxStreaks * 3);
    this.streakColors = new Float32Array(this.maxStreaks * 3);

    for (let i = 0; i < this.maxStreaks; i++) {
      this.resetStreak(i, -Math.random() * 120);
    }

    this.streakGeo.setAttribute('position', new THREE.BufferAttribute(this.streakPositions, 3));
    this.streakGeo.setAttribute('color', new THREE.BufferAttribute(this.streakColors, 3));

    this.streakMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.streakPoints = new THREE.Points(this.streakGeo, this.streakMat);
    this.streakPoints.frustumCulled = false;
    this.scene.add(this.streakPoints);
  }

  private resetStreak(i: number, zPos: number) {
    const idx = i * 3;
    // Spread in a cylinder around the track
    const angle = Math.random() * Math.PI * 2;
    const radius = 4.0 + Math.random() * 10.0;
    this.streakPositions[idx] = Math.cos(angle) * radius;
    this.streakPositions[idx + 1] = Math.sin(angle) * radius + 3.0;
    this.streakPositions[idx + 2] = zPos;

    const col = this.currentReality === 'CYAN' ? new THREE.Color(0x00f0ff) : new THREE.Color(0xff007f);
    this.streakColors[idx] = col.r;
    this.streakColors[idx + 1] = col.g;
    this.streakColors[idx + 2] = col.b;
  }

  public setReality(reality: Reality) {
    this.currentReality = reality;
    const col = reality === 'CYAN' ? new THREE.Color(0x00f0ff) : new THREE.Color(0xff007f);
    for (let i = 0; i < this.maxStreaks; i++) {
      const idx = i * 3;
      this.streakColors[idx] = col.r;
      this.streakColors[idx + 1] = col.g;
      this.streakColors[idx + 2] = col.b;
    }
    this.streakGeo.attributes.color.needsUpdate = true;
  }

  /**
   * Spawn Reality Shift Shockwave burst around the player
   */
  public emitRealityShift(pos: THREE.Vector3, newReality: Reality) {
    const col = newReality === 'CYAN' ? new THREE.Color(0x00f0ff) : new THREE.Color(0xff007f);
    const count = 70;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 8 + Math.random() * 16;
      const vy = (Math.random() - 0.2) * 8;

      this.burstParticles.push({
        x: pos.x,
        y: pos.y + 0.8,
        z: pos.z,
        vx: Math.cos(angle) * speed,
        vy,
        vz: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        size: 0.35,
        r: col.r,
        g: col.g,
        b: col.b,
      });
    }
  }

  /**
   * Spawn Collectible orb glints
   */
  public emitCollection(pos: THREE.Vector3) {
    const count = 30;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 8;

      this.burstParticles.push({
        x: pos.x,
        y: pos.y,
        z: pos.z,
        vx: Math.cos(angle) * speed,
        vy: (Math.random() - 0.5) * speed + 2,
        vz: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.25,
        maxLife: 0.65,
        size: 0.25,
        r: 1.0,
        g: 0.9,
        b: 0.2, // Golden glints
      });
    }
  }

  /**
   * Spawn Crash / Explosion burst
   */
  public emitCollision(pos: THREE.Vector3) {
    const count = 90;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 10 + Math.random() * 20;

      this.burstParticles.push({
        x: pos.x,
        y: pos.y + 0.8,
        z: pos.z,
        vx: Math.cos(angle) * speed,
        vy: Math.random() * 14,
        vz: (Math.random() - 0.5) * speed,
        life: 0.7 + Math.random() * 0.5,
        maxLife: 1.2,
        size: 0.4,
        r: 1.0,
        g: Math.random() > 0.5 ? 0.2 : 0.8,
        b: 0.1,
      });
    }
  }

  public update(delta: number, playerZ: number, currentSpeed: number) {
    // 1. Update Bursts
    for (let i = this.burstParticles.length - 1; i >= 0; i--) {
      const p = this.burstParticles[i];
      p.life -= delta;
      if (p.life <= 0) {
        this.burstParticles.splice(i, 1);
        continue;
      }

      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;
      p.vy -= 9.8 * delta; // gravity
    }

    // Write burst particles into BufferAttribute
    const activeCount = Math.min(this.burstParticles.length, this.maxBurstParticles);
    for (let i = 0; i < activeCount; i++) {
      const p = this.burstParticles[i];
      const idx = i * 3;
      this.burstPositions[idx] = p.x;
      this.burstPositions[idx + 1] = p.y;
      this.burstPositions[idx + 2] = p.z;

      const alpha = p.life / p.maxLife;
      this.burstColors[idx] = p.r * alpha;
      this.burstColors[idx + 1] = p.g * alpha;
      this.burstColors[idx + 2] = p.b * alpha;
    }

    // Clear unused slots
    for (let i = activeCount; i < this.maxBurstParticles; i++) {
      this.burstPositions[i * 3 + 1] = -9999;
    }

    this.burstGeo.attributes.position.needsUpdate = true;
    this.burstGeo.attributes.color.needsUpdate = true;

    // 2. Update Speed Streaks
    for (let i = 0; i < this.maxStreaks; i++) {
      const idx = i * 3;
      // Streaks move backward relative to player forward motion
      this.streakPositions[idx + 2] += currentSpeed * delta * 1.2;

      // If streak passed behind camera
      if (this.streakPositions[idx + 2] > playerZ + 15) {
        this.resetStreak(i, playerZ - 120 - Math.random() * 40);
      }
    }
    this.streakGeo.attributes.position.needsUpdate = true;
  }

  public reset() {
    this.burstParticles = [];
    for (let i = 0; i < this.maxBurstParticles; i++) {
      this.burstPositions[i * 3 + 1] = -9999;
    }
    this.burstGeo.attributes.position.needsUpdate = true;
  }

  public dispose() {
    this.scene.remove(this.burstPoints);
    this.scene.remove(this.streakPoints);
    this.burstGeo.dispose();
    this.burstMat.dispose();
    this.streakGeo.dispose();
    this.streakMat.dispose();
  }
}
