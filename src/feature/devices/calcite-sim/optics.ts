import { Vector3, Quaternion, Euler } from 'three';
import { WAVELENGTH_PRESETS, type IWavelengthPreset } from './calcite';
import type { CrystalGeometry, CrystalDims, CrystalShape } from './crystal';
import { intersectConvex } from './crystal';

// ─── Types ───
export interface ISimulationConfig {
  /** 入射光方向：方位角（度，0-360） */
  incidenceAzimuth: number;
  /** 入射光方向：仰角（度，0-90） */
  incidenceElevation: number;
  /** 光轴方向：方位角（度，0-360） */
  opticAxisAzimuth: number;
  /** 光轴方向：仰角（度，-90~90） */
  opticAxisElevation: number;
  /** 晶体形状 */
  crystalShape: CrystalShape;
  /** 晶体长宽高 */
  crystalDims: CrystalDims;
  /** 锁定长宽高比例（等比缩放） */
  lockDimensions: boolean;
  /** 晶体姿态：俯仰角（度） */
  crystalPitch: number;
  /** 晶体姿态：偏航角（度） */
  crystalYaw: number;
  /** 光轴与晶体相对位置锁定（晶体旋转时光轴同步旋转） */
  axisCrystalLock: boolean;
  /** 锁定时捕获的光轴世界方向 [dx, dy, dz] */
  lockedOpticDirection: [number, number, number] | null;
  /** 入射光偏振态 */
  polarization: 'natural' | 'linear' | 'circular';
  /** 线偏振角（度，0 = 平行主平面→纯 e 光；90 = 垂直主平面→纯 o 光） */
  polarizationAngle: number;
  /** 光源波长预设 id */
  wavelengthId: string;
  /** 显示选项 */
  showOpticAxis: boolean;
  showLabels: boolean;
  showGrid: boolean;
  showAnimation: boolean;
  showExitRays: boolean;
  showPolarization: boolean;
}

export interface IExitRay {
  start: [number, number, number];
  end: [number, number, number];
  dir: [number, number, number];
}

export interface IPolarizationInfo {
  type: 'natural' | 'linear' | 'circular';
  /** o 光相对强度 0-1 */
  oIntensity: number;
  /** e 光相对强度 0-1 */
  eIntensity: number;
  /** o 光偏振方向（垂直主平面） */
  oPolDir: [number, number, number] | null;
  /** e 光偏振方向（主平面内、垂直传播方向） */
  ePolDir: [number, number, number] | null;
  /** 入射线偏振的电矢量方向（仅线偏振） */
  incidentPolDir: [number, number, number] | null;
  /** 入射光主平面内方向（垂直入射传播方向） */
  incidentParDir: [number, number, number] | null;
}

export interface IRefractionResult {
  hit: boolean;
  missed: boolean;
  sourcePos: [number, number, number];
  entryPoint: [number, number, number] | null;
  incidentPath: [number, number, number][];
  /** o 光晶体内部路径（入射点→出射点） */
  oRayPath: [number, number, number][];
  /** e 光晶体内部路径 */
  eRayPath: [number, number, number][];
  /** o 光出射段（可单独显示/隐藏） */
  oExitRay: IExitRay | null;
  eExitRay: IExitRay | null;
  incidenceAngle: number;
  oRefractionAngle: number;
  eRefractionAngle: number;
  separationAngle: number;
  totalInternalReflection: { o: boolean; e: boolean };
  polarization: IPolarizationInfo;
  wavelength: IWavelengthPreset;
}

export const DEFAULT_CONFIG: ISimulationConfig = {
  incidenceAzimuth: 30,
  incidenceElevation: 22,
  opticAxisAzimuth: 90,
  opticAxisElevation: 40,
  crystalShape: 'rhombohedron',
  crystalDims: { width: 2.2, height: 2.4, depth: 2.2 },
  lockDimensions: false,
  crystalPitch: 0,
  crystalYaw: 0,
  axisCrystalLock: false,
  lockedOpticDirection: null,
  polarization: 'natural',
  polarizationAngle: 45,
  wavelengthId: '589nm',
  showOpticAxis: true,
  showLabels: true,
  showGrid: true,
  showAnimation: true,
  showExitRays: true,
  showPolarization: true,
};

export const SOURCE_DISTANCE = 7;
export const EXIT_RAY_LENGTH = 6;
export const AXIS_HANDLE_RADIUS = 3.4;
export const DIM_MIN = 0.6;
export const DIM_MAX = 4;

const DEG = Math.PI / 180;

export function getWavelength(id: string): IWavelengthPreset {
  return WAVELENGTH_PRESETS.find(w => w.id === id) ?? WAVELENGTH_PRESETS[0];
}

// ─── Direction helpers ───
export function directionFromAngles(azimuthDeg: number, elevationDeg: number): Vector3 {
  const az = azimuthDeg * DEG;
  const el = elevationDeg * DEG;
  return new Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
}

export function anglesFromDirection(d: Vector3): { azimuth: number; elevation: number } {
  const len = d.length();
  const el = Math.asin(Math.max(-1, Math.min(1, d.y / len)));
  let az = Math.atan2(d.z, d.x);
  if (az < 0) az += Math.PI * 2;
  return { azimuth: az / DEG, elevation: el / DEG };
}

/** 晶体当前姿态四元数 */
export function crystalOrientation(config: ISimulationConfig): Quaternion {
  return new Quaternion().setFromEuler(
    new Euler(config.crystalPitch * DEG, config.crystalYaw * DEG, 0, 'YXZ'),
  );
}

// ─── E-wave physics (wavelength-dependent indices) ───
/** Effective refractive index for wave normal direction k̂ relative to optic axis */
export function effectiveIndex(kDir: Vector3, opticAxis: Vector3, nO: number, nE: number): number {
  const c = Math.min(1, Math.abs(kDir.dot(opticAxis)));
  const s2 = 1 - c * c;
  return 1 / Math.sqrt(s2 / (nE * nE) + c * c / (nO * nO));
}

/** Poynting (ray/energy) direction for an e-wave with wave normal k̂ */
export function eRayDirection(kDir: Vector3, opticAxis: Vector3, nO: number, nE: number): Vector3 {
  const kd = kDir.dot(opticAxis);
  const beta = 1 / (nO * nO) - 1 / (nE * nE);
  return kDir
    .clone()
    .multiplyScalar(1 / (nE * nE))
    .add(opticAxis.clone().multiplyScalar(kd * beta))
    .normalize();
}

/** Isotropic vector Snell refraction. normal: unit, points toward incident side. Returns null on TIR. */
export function refractIsotropic(dir: Vector3, normal: Vector3, n1: number, n2: number): Vector3 | null {
  const eta = n1 / n2;
  const cosi = -dir.dot(normal);
  if (cosi <= 0) return null;
  const sin2t = eta * eta * (1 - cosi * cosi);
  if (sin2t > 1) return null;
  const cost = Math.sqrt(Math.max(0, 1 - sin2t));
  return dir
    .clone()
    .multiplyScalar(eta)
    .add(normal.clone().multiplyScalar(eta * cosi - cost))
    .normalize();
}

/**
 * E-wave refraction entering the crystal (air → crystal).
 * Solves the index-ellipsoid quadratic for the transmitted wave normal
 * with tangential wave-vector conservation. Returns unit wave normal inside.
 */
export function refractEWaveIntoCrystal(
  dir: Vector3,
  outwardNormal: Vector3,
  opticAxis: Vector3,
  nO: number,
  nE: number,
): Vector3 | null {
  const invNe2 = 1 / (nE * nE);
  const beta = 1 / (nO * nO) - invNe2;
  const dn = dir.dot(outwardNormal); // < 0 when entering
  const kt = dir.clone().add(outwardNormal.clone().multiplyScalar(-dn)); // tangential part
  const na = outwardNormal.dot(opticAxis);
  const ka = kt.dot(opticAxis);

  const A = invNe2 + beta * na * na;
  const B = 2 * beta * ka * na;
  const C = invNe2 * kt.lengthSq() + beta * ka * ka - 1;

  const disc = B * B - 4 * A * C;
  if (disc < 0) return null;
  const sq = Math.sqrt(disc);
  const roots = [(-B - sq) / (2 * A), (-B + sq) / (2 * A)];

  for (const t of roots) {
    const k = kt.clone().add(outwardNormal.clone().multiplyScalar(t)).normalize();
    const s = eRayDirection(k, opticAxis, nO, nE);
    if (s.dot(outwardNormal) < 0) return k;
  }
  const t = Math.min(roots[0], roots[1]);
  return kt.clone().add(outwardNormal.clone().multiplyScalar(t)).normalize();
}

/**
 * Refraction exiting the crystal (crystal → air). Returns null on total internal reflection.
 */
export function refractOutOfCrystal(kDir: Vector3, nInside: number, outwardNormal: Vector3): Vector3 | null {
  const dn = kDir.dot(outwardNormal);
  const kt = kDir.clone().add(outwardNormal.clone().multiplyScalar(-dn)).multiplyScalar(nInside);
  const t2 = kt.lengthSq();
  if (t2 > 1) return null; // TIR
  const nComp = Math.sqrt(Math.max(0, 1 - t2));
  return kt.add(outwardNormal.clone().multiplyScalar(nComp)).normalize();
}

function reflectDir(dir: Vector3, normal: Vector3): Vector3 {
  return dir.clone().sub(normal.clone().multiplyScalar(2 * dir.dot(normal))).normalize();
}

// ─── Beam tracing inside the crystal ───
interface BeamTrace {
  /** 晶体内部路径：起点 → 各反射点 → 出射点 */
  points: Vector3[];
  /** 出射方向（未发生无法折出时为 null） */
  exitDir: Vector3 | null;
  tir: boolean;
}

function traceBeam(
  poly: CrystalGeometry,
  start: Vector3,
  kDirIn: Vector3,
  kind: 'o' | 'e',
  opticAxis: Vector3,
  nO: number,
  nE: number,
  maxBounces = 4,
): BeamTrace {
  const points: Vector3[] = [start.clone()];
  let kDir = kDirIn.clone().normalize();
  let pos = start.clone();
  let tir = false;

  for (let bounce = 0; bounce <= maxBounces; bounce++) {
    const s = kind === 'o' ? kDir.clone() : eRayDirection(kDir, opticAxis, nO, nE);
    const origin = pos.clone().add(s.clone().multiplyScalar(1e-4));
    const hitInfo = intersectConvex(poly.faces, origin, s);
    if (!hitInfo) break;

    const exitPoint = pos.clone().add(s.clone().multiplyScalar(hitInfo.tExit));
    points.push(exitPoint.clone());

    const faceNormal = poly.faces[hitInfo.exitFaceIndex].normal;
    const nEff = kind === 'o' ? nO : effectiveIndex(kDir, opticAxis, nO, nE);
    const outDir = refractOutOfCrystal(kDir, nEff, faceNormal);

    if (outDir) {
      return { points, exitDir: outDir, tir };
    }
    // Total internal reflection: bounce inside
    tir = true;
    kDir = reflectDir(kDir, faceNormal);
    pos = exitPoint;
  }
  return { points, exitDir: null, tir };
}

function perpendicular(a: Vector3, b: Vector3): Vector3 | null {
  const p = new Vector3().crossVectors(a, b);
  if (p.lengthSq() < 1e-12) return null;
  return p.normalize();
}

function fallbackPerp(k: Vector3): Vector3 {
  const ref = Math.abs(k.y) < 0.9 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
  return new Vector3().crossVectors(k, ref).normalize();
}

// ─── Main computation ───
export function computeRefraction(config: ISimulationConfig, poly: CrystalGeometry): IRefractionResult {
  const wavelength = getWavelength(config.wavelengthId);
  const nO = wavelength.nO;
  const nE = wavelength.nE;

  const emptyPol: IPolarizationInfo = {
    type: config.polarization,
    oIntensity: 0,
    eIntensity: 0,
    oPolDir: null,
    ePolDir: null,
    incidentPolDir: null,
    incidentParDir: null,
  };
  const empty: IRefractionResult = {
    hit: false,
    missed: true,
    sourcePos: [SOURCE_DISTANCE, 0, 0],
    entryPoint: null,
    incidentPath: [],
    oRayPath: [],
    eRayPath: [],
    oExitRay: null,
    eExitRay: null,
    incidenceAngle: 0,
    oRefractionAngle: 0,
    eRefractionAngle: 0,
    separationAngle: 0,
    totalInternalReflection: { o: false, e: false },
    polarization: emptyPol,
    wavelength,
  };

  const srcDir = directionFromAngles(config.incidenceAzimuth, config.incidenceElevation);
  const sourcePos = srcDir.clone().multiplyScalar(SOURCE_DISTANCE);
  const propDir = srcDir.clone().negate(); // propagation direction: toward crystal
  const opticAxis = directionFromAngles(config.opticAxisAzimuth, config.opticAxisElevation);

  const hitInfo = intersectConvex(poly.faces, sourcePos, propDir);
  if (!hitInfo || hitInfo.tEnter < 0 || hitInfo.tEnter === -Infinity) {
    return { ...empty, sourcePos: toArray(sourcePos) };
  }

  const entry = sourcePos.clone().add(propDir.clone().multiplyScalar(hitInfo.tEnter));
  const entryNormal = poly.faces[hitInfo.enterFaceIndex].normal; // outward
  const inward = entryNormal.clone().negate();

  const oDir = refractIsotropic(propDir, entryNormal, 1, nO);
  const eWave = refractEWaveIntoCrystal(propDir, entryNormal, opticAxis, nO, nE);

  const incidenceAngle = Math.acos(Math.min(1, Math.max(-1, -propDir.dot(entryNormal)))) / DEG;

  // ── Polarization intensities & directions ──
  const perp = perpendicular(propDir, opticAxis) ?? fallbackPerp(propDir);
  const par = new Vector3().crossVectors(perp, propDir).normalize();
  let oIntensity = 1;
  let eIntensity = 1;
  let incidentPolDir: Vector3 | null = null;
  if (config.polarization === 'linear') {
    const alpha = config.polarizationAngle * DEG;
    oIntensity = Math.sin(alpha) ** 2;
    eIntensity = Math.cos(alpha) ** 2;
    incidentPolDir = par.clone().multiplyScalar(Math.cos(alpha)).add(perp.clone().multiplyScalar(Math.sin(alpha))).normalize();
  } else if (config.polarization === 'circular') {
    oIntensity = 0.5;
    eIntensity = 0.5;
  }

  if (!oDir || !eWave) {
    return {
      ...empty,
      sourcePos: toArray(sourcePos),
      entryPoint: toArray(entry),
      incidentPath: [toArray(sourcePos), toArray(entry)],
      incidenceAngle,
      missed: false,
      polarization: { ...emptyPol, oIntensity, eIntensity, incidentParDir: toArray(par) },
    };
  }

  const oTrace = traceBeam(poly, entry, oDir, 'o', opticAxis, nO, nE);
  const eTrace = traceBeam(poly, entry, eWave, 'e', opticAxis, nO, nE);

  const oRefractionAngle = Math.acos(Math.min(1, Math.max(-1, oDir.dot(inward)))) / DEG;
  const eRefractionAngle = Math.acos(Math.min(1, Math.max(-1, eWave.dot(inward)))) / DEG;

  const eRayDir = eRayDirection(eWave, opticAxis, nO, nE);
  const separationAngle = Math.acos(Math.min(1, Math.max(-1, oDir.dot(eRayDir)))) / DEG;

  const oExitRay = buildExitRay(oTrace);
  const eExitRay = buildExitRay(eTrace);

  // 偏振方向：o 光 ⊥ 主平面；e 光在主平面内且 ⊥ 传播方向
  const oPol = perpendicular(oDir, opticAxis) ?? perpendicular(oDir, inward) ?? fallbackPerp(oDir);
  const ePolBase = opticAxis.clone().sub(eWave.clone().multiplyScalar(eWave.dot(opticAxis)));
  const ePol = ePolBase.lengthSq() > 1e-12 ? ePolBase.normalize() : fallbackPerp(eWave);

  return {
    hit: true,
    missed: false,
    sourcePos: toArray(sourcePos),
    entryPoint: toArray(entry),
    incidentPath: [toArray(sourcePos), toArray(entry)],
    oRayPath: oTrace.points.map(toArray),
    eRayPath: eTrace.points.map(toArray),
    oExitRay,
    eExitRay,
    incidenceAngle,
    oRefractionAngle,
    eRefractionAngle,
    separationAngle,
    totalInternalReflection: { o: oTrace.tir, e: eTrace.tir },
    polarization: {
      type: config.polarization,
      oIntensity,
      eIntensity,
      oPolDir: toArray(oPol),
      ePolDir: toArray(ePol),
      incidentPolDir: incidentPolDir ? toArray(incidentPolDir) : null,
      incidentParDir: toArray(par),
    },
    wavelength,
  };
}

function buildExitRay(trace: BeamTrace): IExitRay | null {
  if (!trace.exitDir || trace.points.length < 2) return null;
  const start = trace.points[trace.points.length - 1];
  const end = start.clone().add(trace.exitDir.clone().multiplyScalar(EXIT_RAY_LENGTH));
  return { start: toArray(start), end: toArray(end), dir: toArray(trace.exitDir) };
}

function toArray(v: Vector3): [number, number, number] {
  return [v.x, v.y, v.z];
}

// ─── Scene presets ───
export interface IScenePreset {
  id: string;
  name: string;
  description: string;
  config: Partial<ISimulationConfig>;
}

export const SCENE_PRESETS: IScenePreset[] = [
  {
    id: 'classic',
    name: '经典斜入射',
    description: '菱面体 + 斜入射，o 光/e 光明显分离',
    config: {
      incidenceAzimuth: 30,
      incidenceElevation: 22,
      opticAxisAzimuth: 90,
      opticAxisElevation: 40,
      crystalShape: 'rhombohedron',
      crystalDims: { width: 2.2, height: 2.4, depth: 2.2 },
      crystalPitch: 0,
      crystalYaw: 0,
      axisCrystalLock: false,
      lockedOpticDirection: null,
      polarization: 'natural',
    },
  },
  {
    id: 'along-axis',
    name: '沿光轴入射',
    description: '传播方向与光轴平行，无双折射，两光重合',
    config: {
      incidenceAzimuth: 30,
      incidenceElevation: 22,
      opticAxisAzimuth: 210,
      opticAxisElevation: -22,
      crystalShape: 'rhombohedron',
      crystalDims: { width: 2.2, height: 2.4, depth: 2.2 },
      crystalPitch: 0,
      crystalYaw: 0,
      axisCrystalLock: false,
      lockedOpticDirection: null,
      polarization: 'natural',
    },
  },
  {
    id: 'axis-perp',
    name: '光轴垂直入射面',
    description: '光轴垂直于入射面，e 光行为趋近寻常光',
    config: {
      incidenceAzimuth: 0,
      incidenceElevation: 65,
      opticAxisAzimuth: 90,
      opticAxisElevation: 0,
      crystalShape: 'cuboid',
      crystalDims: { width: 2.6, height: 1.7, depth: 1.5 },
      crystalPitch: 0,
      crystalYaw: 0,
      axisCrystalLock: false,
      lockedOpticDirection: null,
      polarization: 'natural',
    },
  },
  {
    id: 'pure-e',
    name: '线偏振 → 纯 e 光',
    description: '偏振平行主平面，只剩 e 光折射',
    config: {
      incidenceAzimuth: 30,
      incidenceElevation: 22,
      opticAxisAzimuth: 90,
      opticAxisElevation: 40,
      crystalShape: 'rhombohedron',
      crystalDims: { width: 2.2, height: 2.4, depth: 2.2 },
      polarization: 'linear',
      polarizationAngle: 0,
    },
  },
];
