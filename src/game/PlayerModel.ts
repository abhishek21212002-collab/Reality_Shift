/**
 * Reality Shift: Neon Rush - 3D Player Character Model
 * Built with modular procedural Three.js geometry (8-12 distinct parts)
 */

import * as THREE from 'three';
import { REALITY_COLORS } from './constants';
import { Reality } from '../types/game';

export class PlayerModel {
  public group: THREE.Group;
  
  // Model parts for animation
  private torso: THREE.Mesh;
  private core: THREE.Mesh;
  private head: THREE.Group;
  private visor: THREE.Mesh;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private leftLeg: THREE.Group;
  private rightLeg: THREE.Group;
  private jetpack: THREE.Group;
  private thrusterFlames: THREE.Mesh[] = [];
  private contactShadow: THREE.Mesh;

  // Materials for reality color shifting
  private glowMaterials: THREE.MeshStandardMaterial[] = [];
  private suitMaterial: THREE.MeshStandardMaterial;
  private armorMaterial: THREE.MeshStandardMaterial;
  private coreMaterial: THREE.MeshStandardMaterial;

  // Animation state
  private runCycleTime: number = 0;
  private currentLaneX: number = 0;
  private targetLaneX: number = 0;
  private rollAngle: number = 0;

  constructor() {
    this.group = new THREE.Group();

    // 1. Materials
    this.suitMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.7,
      metalness: 0.3,
    });

    this.armorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.85,
    });

    this.coreMaterial = new THREE.MeshStandardMaterial({
      color: REALITY_COLORS.CYAN.primary,
      emissive: REALITY_COLORS.CYAN.primary,
      emissiveIntensity: 2.2,
      roughness: 0.2,
      metalness: 0.5,
    });
    this.glowMaterials.push(this.coreMaterial);

    const visorMat = new THREE.MeshStandardMaterial({
      color: REALITY_COLORS.CYAN.primary,
      emissive: REALITY_COLORS.CYAN.primary,
      emissiveIntensity: 2.5,
      roughness: 0.1,
      metalness: 0.9,
    });
    this.glowMaterials.push(visorMat);

    // 2. Torso & Chestplate
    const torsoGroup = new THREE.Group();
    const torsoGeo = new THREE.BoxGeometry(0.5, 0.65, 0.32);
    this.torso = new THREE.Mesh(torsoGeo, this.suitMaterial);
    this.torso.position.y = 1.05;
    this.torso.castShadow = true;
    torsoGroup.add(this.torso);

    const chestPlateGeo = new THREE.BoxGeometry(0.52, 0.38, 0.18);
    const chestPlate = new THREE.Mesh(chestPlateGeo, this.armorMaterial);
    chestPlate.position.set(0, 0.1, 0.1);
    this.torso.add(chestPlate);

    // Glowing energy core in chest center
    const coreGeo = new THREE.OctahedronGeometry(0.12, 1);
    this.core = new THREE.Mesh(coreGeo, this.coreMaterial);
    this.core.position.set(0, 0.1, 0.2);
    this.torso.add(this.core);

    // 3. Head & Visor
    this.head = new THREE.Group();
    this.head.position.set(0, 1.5, 0);

    const helmetGeo = new THREE.BoxGeometry(0.32, 0.34, 0.34);
    const helmet = new THREE.Mesh(helmetGeo, this.armorMaterial);
    helmet.castShadow = true;
    this.head.add(helmet);

    const visorGeo = new THREE.BoxGeometry(0.34, 0.1, 0.15);
    this.visor = new THREE.Mesh(visorGeo, visorMat);
    this.visor.position.set(0, 0.04, 0.12);
    this.head.add(this.visor);
    this.group.add(this.head);

    // 4. Arms
    this.leftArm = this.createLimb(true, true);
    this.leftArm.position.set(-0.35, 1.3, 0);
    this.group.add(this.leftArm);

    this.rightArm = this.createLimb(true, false);
    this.rightArm.position.set(0.35, 1.3, 0);
    this.group.add(this.rightArm);

    // 5. Legs
    this.leftLeg = this.createLimb(false, true);
    this.leftLeg.position.set(-0.16, 0.75, 0);
    this.group.add(this.leftLeg);

    this.rightLeg = this.createLimb(false, false);
    this.rightLeg.position.set(0.16, 0.75, 0);
    this.group.add(this.rightLeg);

    // 6. Jetpack on back
    this.jetpack = new THREE.Group();
    this.jetpack.position.set(0, 0, -0.2);
    const packBodyGeo = new THREE.BoxGeometry(0.34, 0.45, 0.12);
    const packBody = new THREE.Mesh(packBodyGeo, this.armorMaterial);
    this.jetpack.add(packBody);

    // Dual thrusters
    const thrusterGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.22, 8);
    const thrusterLeft = new THREE.Mesh(thrusterGeo, this.armorMaterial);
    thrusterLeft.position.set(-0.1, -0.2, 0);
    thrusterLeft.rotation.x = Math.PI;
    this.jetpack.add(thrusterLeft);

    const thrusterRight = new THREE.Mesh(thrusterGeo, this.armorMaterial);
    thrusterRight.position.set(0.1, -0.2, 0);
    thrusterRight.rotation.x = Math.PI;
    this.jetpack.add(thrusterRight);

    // Thruster exhaust plumes
    const flameGeo = new THREE.ConeGeometry(0.07, 0.28, 8);
    const flameMat = new THREE.MeshBasicMaterial({
      color: REALITY_COLORS.CYAN.primary,
      transparent: true,
      opacity: 0.85,
    });
    const flameL = new THREE.Mesh(flameGeo, flameMat);
    flameL.position.set(-0.1, -0.38, 0);
    flameL.rotation.x = Math.PI;
    this.jetpack.add(flameL);
    this.thrusterFlames.push(flameL);

    const flameR = new THREE.Mesh(flameGeo, flameMat);
    flameR.position.set(0.1, -0.38, 0);
    flameR.rotation.x = Math.PI;
    this.jetpack.add(flameR);
    this.thrusterFlames.push(flameR);

    this.torso.add(this.jetpack);
    this.group.add(torsoGroup);

    // 7. Ground Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(1.2, 1.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    this.contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.position.y = 0.02;
    this.group.add(this.contactShadow);
  }

  private createLimb(isArm: boolean, isLeft: boolean): THREE.Group {
    const limb = new THREE.Group();
    const upperGeo = new THREE.BoxGeometry(
      isArm ? 0.12 : 0.16,
      isArm ? 0.35 : 0.4,
      isArm ? 0.12 : 0.16
    );
    const upper = new THREE.Mesh(upperGeo, this.suitMaterial);
    upper.position.y = isArm ? -0.17 : -0.2;
    limb.add(upper);

    const lowerGeo = new THREE.BoxGeometry(
      isArm ? 0.11 : 0.17,
      isArm ? 0.32 : 0.42,
      isArm ? 0.11 : 0.18
    );
    const lower = new THREE.Mesh(lowerGeo, this.armorMaterial);
    lower.position.y = isArm ? -0.45 : -0.58;
    limb.add(lower);

    // Accent glow stripe on armor
    const stripeGeo = new THREE.BoxGeometry(
      isArm ? 0.12 : 0.18,
      0.04,
      isArm ? 0.12 : 0.19
    );
    const stripeMat = new THREE.MeshStandardMaterial({
      color: REALITY_COLORS.CYAN.primary,
      emissive: REALITY_COLORS.CYAN.primary,
      emissiveIntensity: 1.8,
    });
    this.glowMaterials.push(stripeMat);
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.y = isArm ? -0.38 : -0.5;
    limb.add(stripe);

    return limb;
  }

  public setReality(reality: Reality) {
    const targetColor = new THREE.Color(
      reality === 'CYAN' ? REALITY_COLORS.CYAN.primary : REALITY_COLORS.MAGENTA.primary
    );

    this.glowMaterials.forEach(mat => {
      mat.color.copy(targetColor);
      mat.emissive.copy(targetColor);
    });

    this.thrusterFlames.forEach(flame => {
      (flame.material as THREE.MeshBasicMaterial).color.copy(targetColor);
    });
  }

  public setTargetLane(x: number) {
    this.targetLaneX = x;
  }

  public update(
    delta: number,
    isJumping: boolean,
    jumpProgress: number, // 0 to 1
    isSliding: boolean,
    slideProgress: number, // 0 to 1
    speedRatio: number
  ) {
    // Smooth lane interpolation with banking roll
    const prevX = this.currentLaneX;
    this.currentLaneX = THREE.MathUtils.damp(this.currentLaneX, this.targetLaneX, 16, delta);
    this.group.position.x = this.currentLaneX;

    // Banking roll effect during lane change
    const deltaX = this.currentLaneX - prevX;
    const targetRoll = -deltaX * 4.5;
    this.rollAngle = THREE.MathUtils.damp(this.rollAngle, targetRoll, 12, delta);
    this.group.rotation.z = this.rollAngle;

    // Core pulsing animation
    this.runCycleTime += delta * (12 + speedRatio * 8);
    const corePulse = 1.0 + Math.sin(this.runCycleTime * 2) * 0.15;
    this.core.scale.set(corePulse, corePulse, corePulse);

    // Jetpack thruster flame flicker
    const flameFlicker = 0.8 + Math.random() * 0.4;
    this.thrusterFlames.forEach(f => f.scale.set(1, flameFlicker, 1));

    // Handle Animation States: Sliding, Jumping, Running
    if (isSliding) {
      // Crouch and slide
      const slideHeight = Math.sin(slideProgress * Math.PI);
      this.group.position.y = -0.4 * slideHeight;
      this.torso.rotation.x = -Math.PI / 3;
      this.head.position.set(0, 0.7, 0.2);
      this.head.rotation.x = -Math.PI / 4;

      this.leftArm.rotation.x = -Math.PI / 2.5;
      this.rightArm.rotation.x = -Math.PI / 2.5;
      this.leftLeg.rotation.x = Math.PI / 3;
      this.rightLeg.rotation.x = Math.PI / 2.8;

      this.contactShadow.scale.set(1.5, 0.8, 1);
    } else if (isJumping) {
      // Jump arc
      const jumpY = Math.sin(jumpProgress * Math.PI) * 2.2;
      this.group.position.y = jumpY;

      this.torso.rotation.x = 0.15;
      this.head.position.set(0, 1.5, 0);
      this.head.rotation.x = 0;

      // Tuck legs in mid-air
      this.leftLeg.rotation.x = -0.6;
      this.rightLeg.rotation.x = -0.4;
      this.leftArm.rotation.x = 0.7;
      this.rightArm.rotation.x = 0.7;

      // Shadow scales down as player gets higher
      const shadowScale = Math.max(0.3, 1 - (jumpY / 3));
      this.contactShadow.scale.set(shadowScale, shadowScale, shadowScale);
    } else {
      // Normal Running
      this.group.position.y = 0;
      this.contactShadow.scale.set(1, 1, 1);

      // Natural running swing
      const stride = Math.sin(this.runCycleTime);
      const armStride = Math.cos(this.runCycleTime);

      this.leftLeg.rotation.x = stride * 0.75;
      this.rightLeg.rotation.x = -stride * 0.75;

      this.leftArm.rotation.x = -armStride * 0.75;
      this.rightArm.rotation.x = armStride * 0.75;

      // Subtle torso bobbing
      this.torso.position.y = 1.05 + Math.abs(stride) * 0.08;
      this.torso.rotation.x = 0.08; // slight forward lean
      this.head.position.set(0, 1.5 + Math.abs(stride) * 0.05, 0);
      this.head.rotation.x = -0.05;
    }
  }

  public getPosition(): THREE.Vector3 {
    return this.group.position;
  }

  public dispose() {
    this.group.traverse((obj: any) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose());
        else obj.material.dispose();
      }
    });
  }
}
