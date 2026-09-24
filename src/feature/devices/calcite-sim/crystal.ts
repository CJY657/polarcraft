import {
  Vector3,
  Quaternion,
  BufferGeometry,
  Float32BufferAttribute,
  EdgesGeometry,
  LineSegments,
  Mesh,
  LineBasicMaterial,
  DoubleSide,
  MeshPhysicalMaterial,
} from 'three';

// ─── Types ───
export interface FacePlane {
  normal: Vector3;
  offset: number;
}

export interface CrystalGeometry {
  vertices: Vector3[];
  faces: FacePlane[];
  faceVertices: Vector3[][];
}

export interface CrystalDims {
  width: number;
  height: number;
  depth: number;
}

export type CrystalShape = 'cuboid' | 'rhombohedron';

const DEG = Math.PI / 180;

// ─── Builder ───
/**
 * 构建晶体几何：长方体（平行平面）或菱面体（天然解理形状）。
 * 长宽高可独立调节（菱面体按包围盒各向异性缩放，教学演示可接受）。
 */
export function buildCrystal(shape: CrystalShape, dims: CrystalDims, rotation: Quaternion): CrystalGeometry {
  let verts: Vector3[];
  let quadFaces: number[][];

  if (shape === 'cuboid') {
    const hw = dims.width / 2;
    const hh = dims.height / 2;
    const hd = dims.depth / 2;
    verts = [
      new Vector3(-hw, -hh, -hd), new Vector3(hw, -hh, -hd),
      new Vector3(hw, hh, -hd), new Vector3(-hw, hh, -hd),
      new Vector3(-hw, -hh, hd), new Vector3(hw, -hh, hd),
      new Vector3(hw, hh, hd), new Vector3(-hw, hh, hd),
    ];
    quadFaces = [
      [0, 1, 2, 3], [4, 7, 6, 5], // back, front
      [0, 4, 5, 1], [1, 5, 6, 2], // bottom, right
      [2, 6, 7, 3], [3, 7, 4, 0], // top, left
    ];
  } else {
    // 菱面体：三条等长棱向量，互成 74.9°（方解石解理角）
    const phi = 74.9 * DEG;
    const c = Math.cos(phi);
    const s = Math.sin(phi);
    const u1 = new Vector3(1, 0, 0);
    const u2 = new Vector3(c, s, 0);
    const u3y = (c - c * c) / s;
    const u3z = Math.sqrt(Math.max(0.0001, 1 - c * c - u3y * u3y));
    const u3 = new Vector3(c, u3y, u3z);
    verts = [
      new Vector3(0, 0, 0),
      u1.clone(),
      u2.clone(),
      u1.clone().add(u2),
      u3.clone(),
      u1.clone().add(u3),
      u2.clone().add(u3),
      u1.clone().add(u2).add(u3),
    ];
    quadFaces = [
      [0, 1, 3, 2], [4, 6, 7, 5],
      [0, 2, 6, 4], [1, 5, 7, 3],
      [0, 4, 5, 1], [2, 3, 7, 6],
    ];
    // 居中后按长宽高对各轴缩放
    const center = verts.reduce((a, v) => a.add(v), new Vector3()).multiplyScalar(1 / verts.length);
    verts.forEach(v => v.sub(center));
    const extent = new Vector3();
    for (const v of verts) {
      extent.x = Math.max(extent.x, Math.abs(v.x));
      extent.y = Math.max(extent.y, Math.abs(v.y));
      extent.z = Math.max(extent.z, Math.abs(v.z));
    }
    const sx = extent.x > 1e-6 ? dims.width / (2 * extent.x) : 1;
    const sy = extent.y > 1e-6 ? dims.height / (2 * extent.y) : 1;
    const sz = extent.z > 1e-6 ? dims.depth / (2 * extent.z) : 1;
    verts.forEach(v => v.set(v.x * sx, v.y * sy, v.z * sz));
  }

  // 统一应用旋转（光轴-晶体锁定时传入任意四元数）
  verts.forEach(v => v.applyQuaternion(rotation));

  const faces: FacePlane[] = [];
  const faceVertices: Vector3[][] = [];
  for (const indices of quadFaces) {
    const fv = indices.map(i => verts[i].clone());
    const normal = fv[1].clone().sub(fv[0]).cross(fv[2].clone().sub(fv[0])).normalize();
    const fCentroid = fv.reduce((a, v) => a.add(v), new Vector3()).multiplyScalar(1 / fv.length);
    if (normal.dot(fCentroid) < 0) normal.negate();
    faces.push({ normal: normal.clone(), offset: normal.dot(fv[0]) });
    faceVertices.push(fv);
  }
  return { vertices: verts, faces, faceVertices };
}

// ─── Intersection helper ───
export function intersectConvex(
  faces: FacePlane[],
  origin: Vector3,
  dir: Vector3,
): { tEnter: number; tExit: number; enterFaceIndex: number; exitFaceIndex: number } | null {
  let tEnter = -Infinity, tExit = Infinity;
  let ei = -1, xi = -1;
  for (let i = 0; i < faces.length; i++) {
    const f = faces[i];
    const dn = f.normal.dot(dir);
    if (Math.abs(dn) < 1e-10) {
      if (f.normal.dot(origin) > f.offset + 1e-8) return null;
      continue;
    }
    const t = (f.offset - f.normal.dot(origin)) / dn;
    if (dn > 0) {
      if (t < tExit) { tExit = t; xi = i; }
    } else {
      if (t > tEnter) { tEnter = t; ei = i; }
    }
  }
  if (tEnter > tExit) return null;
  return { tEnter, tExit, enterFaceIndex: ei, exitFaceIndex: xi };
}

// ─── Crystal Mesh Builder ───
export function createCrystalMesh(geom: CrystalGeometry) {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  for (const fv of geom.faceVertices) {
    const fn = fv[1].clone().sub(fv[0]).cross(fv[2].clone().sub(fv[0])).normalize();
    const base = positions.length / 3;
    for (const v of fv) {
      positions.push(v.x, v.y, v.z);
      normals.push(fn.x, fn.y, fn.z);
    }
    indices.push(base, base + 1, base + 2);
    indices.push(base, base + 2, base + 3);
  }

  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);

  const mat = new MeshPhysicalMaterial({
    color: 0x5dade2,
    roughness: 0.05,
    metalness: 0.0,
    transparent: true,
    opacity: 0.2,
    side: DoubleSide,
    depthWrite: false,
  });

  const mesh = new Mesh(geo, mat);
  mesh.renderOrder = 1;

  const edgeGeo = new EdgesGeometry(geo, 15);
  const edgeMat = new LineBasicMaterial({ color: 0x38bdf8, linewidth: 1, transparent: true, opacity: 0.6 });
  const edgeLine = new LineSegments(edgeGeo, edgeMat);
  edgeLine.renderOrder = 2;
  mesh.add(edgeLine);

  return { mesh, edgeLine };
}

// ─── Helper: rebuild crystal mesh ───
export function rebuildCrystalMesh(mesh: Mesh, newGeom: CrystalGeometry) {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  for (const fv of newGeom.faceVertices) {
    const fn = fv[1].clone().sub(fv[0]).cross(fv[2].clone().sub(fv[0])).normalize();
    const base = positions.length / 3;
    for (const v of fv) {
      positions.push(v.x, v.y, v.z);
      normals.push(fn.x, fn.y, fn.z);
    }
    indices.push(base, base + 1, base + 2);
    indices.push(base, base + 2, base + 3);
  }

  mesh.geometry.dispose();
  mesh.geometry = new BufferGeometry();
  mesh.geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  mesh.geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  mesh.geometry.setIndex(indices);

  const oldEdge = mesh.children[0] as LineSegments;
  if (oldEdge) {
    oldEdge.geometry.dispose();
    oldEdge.geometry = new EdgesGeometry(mesh.geometry, 15);
  }
}
