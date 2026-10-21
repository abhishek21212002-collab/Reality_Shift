/**
 * Reality Shift: Neon Rush - 3D Track & Environment Manager
 * Infinite procedural neon track with cyberpunk cityscape and dimension-responsive architecture
 */

import * as THREE from 'three';
import { LANE_WIDTH, REALITY_COLORS, TRACK_SEGMENT_LENGTH } from './constants';
import { Reality } from '../types/game';

interface TrackSegment {
  group: THREE.Group;
  roadMesh: THREE.Mesh;
  borders: THREE.Mesh[];
  laneLines: THREE.LineSegments[];
  buildings: THREE.Group[];
  z: number;
}

export class TrackManager {
  public scene: THREE.Scene;
  private segments: TrackSegment[] = [];
  private numSegments: number = 6;
  private trackWidth: number = LANE_WIDTH * 3.4;
  private currentReality: Reality = 'CYAN';

  // Materials with reality color references
  private roadMaterial: THREE.MeshStandardMaterial;
  private borderMaterial: THREE.MeshStandardMaterial;
  private laneLineMaterial: THREE.LineBasicMaterial;
  private buildingGlowMaterials: THREE.MeshStandardMaterial[] = [];
  private buildingBodyMaterial: THREE.MeshStandardMaterial;
  private floatingRings: THREE.Group[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Materials
    this.roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x050a14,
      roughness: 0.85,
      metalness: 0.2,
    });

    this.borderMaterial = new THREE.MeshStandardMaterial({
      color: REALITY_COLORS.CYAN.primary,
      emissive: REALITY_COLORS.CYAN.primary,
      emissiveIntensity: 2.0,
      roughness: 0.3,
      metalness: 0.8,
    });

    this.laneLineMaterial = new THREE.LineBasicMaterial({
      color: REALITY_COLORS.CYAN.primary,
      linewidth: 2,
    });

    this.buildingBodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x090e1a,
      roughness: 0.6,
      metalness: 0.7,
    });

    // Create segments
    for (let i = 0; i < this.numSegments; i++) {
      const zPos = -i * TRACK_SEGMENT_LENGTH;
      const seg = this.createSegment(zPos);
      this.segments.push(seg);
      this.scene.add(seg.group);
    }
  }

  private createSegment(zPos: number): TrackSegment {
    const group = new THREE.Group();
    group.position.z = zPos;

    // 1. Main Asphalt Surface
    const roadGeo = new THREE.PlaneGeometry(this.trackWidth, TRACK_SEGMENT_LENGTH);
    const roadMesh = new THREE.Mesh(roadGeo, this.roadMaterial);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.y = 0;
    roadMesh.receiveShadow = true;
    group.add(roadMesh);

    // 2. Glowing Road Borders (Left and Right)
    const borderGeo = new THREE.BoxGeometry(0.35, 0.45, TRACK_SEGMENT_LENGTH);
    const borderL = new THREE.Mesh(borderGeo, this.borderMaterial);
    borderL.position.set(-this.trackWidth / 2, 0.22, 0);
    group.add(borderL);

    const borderR = new THREE.Mesh(borderGeo, this.borderMaterial);
    borderR.position.set(this.trackWidth / 2, 0.22, 0);
    group.add(borderR);

    // 3. Dashed Lane Divider Lines (between Left-Center and Center-Right)
    const laneLines: THREE.LineSegments[] = [];
    const dividers = [-LANE_WIDTH / 2, LANE_WIDTH / 2];

    dividers.forEach(xPos => {
      const linePositions: number[] = [];
      const dashLength = 3.5;
      const gapLength = 2.5;
      const step = dashLength + gapLength;
      const count = Math.floor(TRACK_SEGMENT_LENGTH / step);

      for (let d = 0; d < count; d++) {
        const startZ = -TRACK_SEGMENT_LENGTH / 2 + d * step;
        const endZ = startZ + dashLength;
        linePositions.push(xPos, 0.02, startZ);
        linePositions.push(xPos, 0.02, endZ);
      }

      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      const lineMesh = new THREE.LineSegments(lineGeo, this.laneLineMaterial);
      group.add(lineMesh);
      laneLines.push(lineMesh);
    });

    // 4. Procedural Cyberpunk Buildings and Floating Monoliths on Sides
    const buildings: THREE.Group[] = [];
    const buildingCounts = 5;
    for (let b = 0; b < buildingCounts; b++) {
      const bZ = -TRACK_SEGMENT_LENGTH / 2 + (b + 0.5) * (TRACK_SEGMENT_LENGTH / buildingCounts);

      // Left building
      const bLeft = this.createCyberBuilding(-14 - Math.random() * 8, bZ, true);
      group.add(bLeft);
      buildings.push(bLeft);

      // Right building
      const bRight = this.createCyberBuilding(14 + Math.random() * 8, bZ, false);
      group.add(bRight);
      buildings.push(bRight);
    }

    // 5. Overhead Gateway / Arch every alternate segment
    if (Math.abs(zPos) % (TRACK_SEGMENT_LENGTH * 2) === 0) {
      const arch = this.createOverheadArch();
      group.add(arch);
      this.floatingRings.push(arch);
    }

    return {
      group,
      roadMesh,
      borders: [borderL, borderR],
      laneLines,
      buildings,
      z: zPos,
    };
  }

  private createCyberBuilding(x: number, z: number, isLeft: boolean): THREE.Group {
    const bGroup = new THREE.Group();
    bGroup.position.set(x, 0, z);

    const height = 18 + Math.random() * 28;
    const width = 6 + Math.random() * 6;
    const depth = 8 + Math.random() * 8;

    // Main tower
    const towerGeo = new THREE.BoxGeometry(width, height, depth);
    const towerMesh = new THREE.Mesh(towerGeo, this.buildingBodyMaterial);
    towerMesh.position.y = height / 2;
    bGroup.add(towerMesh);

    // Neon Accent Edges / Windows
    const glowMat = new THREE.MeshStandardMaterial({
      color: this.currentReality === 'CYAN' ? REALITY_COLORS.CYAN.primary : REALITY_COLORS.MAGENTA.primary,
      emissive: this.currentReality === 'CYAN' ? REALITY_COLORS.CYAN.primary : REALITY_COLORS.MAGENTA.primary,
      emissiveIntensity: 1.6,
      roughness: 0.2,
      metalness: 0.8,
    });
    this.buildingGlowMaterials.push(glowMat);

    // Vertical neon light strip
    const stripGeo = new THREE.BoxGeometry(0.3, height * 0.85, 0.4);
    const strip = new THREE.Mesh(stripGeo, glowMat);
    strip.position.set(isLeft ? width / 2 + 0.1 : -width / 2 - 0.1, height / 2, 0);
    bGroup.add(strip);

    // Horizontal window bands
    const bandGeo = new THREE.BoxGeometry(width + 0.1, 0.4, depth + 0.1);
    for (let h = 4; h < height - 3; h += 6 + Math.random() * 4) {
      const band = new THREE.Mesh(bandGeo, glowMat);
      band.position.y = h;
      bGroup.add(band);
    }

    // Rooftop antenna / spire
    const spireGeo = new THREE.CylinderGeometry(0.1, 0.4, 8, 4);
    const spire = new THREE.Mesh(spireGeo, glowMat);
    spire.position.set(0, height + 4, 0);
    bGroup.add(spire);

    return bGroup;
  }

  private createOverheadArch(): THREE.Group {
    const archGroup = new THREE.Group();
    const span = this.trackWidth + 3.5;
    const height = 7.5;

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.4,
      metalness: 0.8,
    });

    const glowMat = new THREE.MeshStandardMaterial({
      color: this.currentReality === 'CYAN' ? REALITY_COLORS.CYAN.primary : REALITY_COLORS.MAGENTA.primary,
      emissive: this.currentReality === 'CYAN' ? REALITY_COLORS.CYAN.primary : REALITY_COLORS.MAGENTA.primary,
      emissiveIntensity: 2.2,
    });
    this.buildingGlowMaterials.push(glowMat);

    // Left pillar
    const pillarGeo = new THREE.BoxGeometry(0.8, height, 0.8);
    const pLeft = new THREE.Mesh(pillarGeo, frameMat);
    pLeft.position.set(-span / 2, height / 2, 0);
    archGroup.add(pLeft);

    // Right pillar
    const pRight = new THREE.Mesh(pillarGeo, frameMat);
    pRight.position.set(span / 2, height / 2, 0);
    archGroup.add(pRight);

    // Overhead crossbar
    const crossGeo = new THREE.BoxGeometry(span, 0.7, 0.8);
    const cross = new THREE.Mesh(crossGeo, frameMat);
    cross.position.set(0, height, 0);
    archGroup.add(cross);

    // Glowing neon underside
    const neonBeamGeo = new THREE.BoxGeometry(span - 1, 0.2, 0.2);
    const neonBeam = new THREE.Mesh(neonBeamGeo, glowMat);
    neonBeam.position.set(0, height - 0.4, 0);
    archGroup.add(neonBeam);

    return archGroup;
  }

  public setReality(reality: Reality) {
    this.currentReality = reality;
    const targetColor = new THREE.Color(
      reality === 'CYAN' ? REALITY_COLORS.CYAN.primary : REALITY_COLORS.MAGENTA.primary
    );

    this.borderMaterial.color.copy(targetColor);
    this.borderMaterial.emissive.copy(targetColor);
    this.laneLineMaterial.color.copy(targetColor);

    this.buildingGlowMaterials.forEach(mat => {
      mat.color.copy(targetColor);
      mat.emissive.copy(targetColor);
    });
  }

  public update(playerZ: number) {
    // Check if back segments need to be recycled to the front
    const frontMostZ = Math.min(...this.segments.map(s => s.z));

    this.segments.forEach(seg => {
      // If segment is far behind the player (e.g. > 40 units behind)
      if (seg.z > playerZ + 40) {
        seg.z = frontMostZ - TRACK_SEGMENT_LENGTH;
        seg.group.position.z = seg.z;
      }
    });
  }

  public reset() {
    for (let i = 0; i < this.segments.length; i++) {
      const zPos = -i * TRACK_SEGMENT_LENGTH;
      this.segments[i].z = zPos;
      this.segments[i].group.position.z = zPos;
    }
  }

  public dispose() {
    this.segments.forEach(seg => {
      seg.group.traverse((obj: any) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose());
          else obj.material.dispose();
        }
      });
      this.scene.remove(seg.group);
    });
    this.segments = [];
  }
}
