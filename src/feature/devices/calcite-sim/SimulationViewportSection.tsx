import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import type { CrystalGeometry } from './crystal';
import { createCrystalMesh, rebuildCrystalMesh } from './crystal';
import type { ISimulationConfig, IRefractionResult, IExitRay, IPolarizationInfo } from './optics';
import {
  SOURCE_DISTANCE,
  AXIS_HANDLE_RADIUS,
  directionFromAngles,
  anglesFromDirection,
} from './optics';

interface SimulationViewportSectionProps {
  config: ISimulationConfig;
  polyhedron: CrystalGeometry;
  result: IRefractionResult;
  onConfigChange: (partial: Partial<ISimulationConfig>) => void;
  resetToken: number;
}

const COLORS = {
  o: '#f8b645',
  e: '#b160eb',
  axis: '#22d3ee',
};

const PARTICLES_PER_RAY = 6;
const SPACING = 0.55;
const DOT_POOL = 48;
const DASH_POOL = 72;

interface PathData {
  points: THREE.Vector3[];
  cumLen: number[];
  total: number;
}

function buildPathData(tuples: [number, number, number][]): PathData | null {
  if (!tuples || tuples.length < 2) return null;
  const points = tuples.map(t => new THREE.Vector3(t[0], t[1], t[2]));
  const cumLen: number[] = [0];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += points[i].distanceTo(points[i - 1]);
    cumLen.push(total);
  }
  return { points, cumLen, total };
}

function pointOnPath(path: PathData, t: number): THREE.Vector3 {
  const d = t * path.total;
  for (let i = 1; i < path.points.length; i++) {
    if (d <= path.cumLen[i]) {
      const segLen = path.cumLen[i] - path.cumLen[i - 1];
      const f = segLen > 0 ? (d - path.cumLen[i - 1]) / segLen : 0;
      return new THREE.Vector3().lerpVectors(path.points[i - 1], path.points[i], f);
    }
  }
  return path.points[path.points.length - 1].clone();
}

function samplePath(path: PathData, spacing: number): THREE.Vector3[] {
  const out: THREE.Vector3[] = [];
  if (path.total < spacing * 1.4) return out;
  let d = spacing * 0.65;
  while (d < path.total - 0.12) {
    out.push(pointOnPath(path, d / path.total));
    d += spacing;
  }
  return out;
}

function makeLine(color: string, linewidth = 2.5): THREE.Line {
  const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  const mat = new THREE.LineBasicMaterial({ color, linewidth, transparent: true, opacity: 0.95 });
  return new THREE.Line(geo, mat);
}

function setLinePoints(line: THREE.Line, tuples: [number, number, number][]) {
  (line.geometry as THREE.BufferGeometry).setFromPoints(
    tuples.map(p => new THREE.Vector3(p[0], p[1], p[2])),
  );
}

interface MarkerPool {
  meshes: THREE.Mesh[];
  cursor: number;
}

function createPool(scene: THREE.Scene, count: number, geo: THREE.BufferGeometry, mat: THREE.Material): MarkerPool {
  const meshes: THREE.Mesh[] = [];
  for (let i = 0; i < count; i++) {
    const m = new THREE.Mesh(geo, mat);
    m.visible = false;
    scene.add(m);
    meshes.push(m);
  }
  return { meshes, cursor: 0 };
}

function resetPool(pool: MarkerPool) {
  pool.cursor = 0;
  for (const m of pool.meshes) m.visible = false;
}

function nextMesh(pool: MarkerPool): THREE.Mesh | null {
  if (pool.cursor >= pool.meshes.length) return null;
  const m = pool.meshes[pool.cursor++];
  m.visible = true;
  return m;
}

const X_AXIS = new THREE.Vector3(1, 0, 0);

interface SceneData {
  renderer: THREE.WebGLRenderer;
  labelRenderer: CSS2DRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  crystalMesh: THREE.Mesh;
  incidentLine: THREE.Line;
  matIncident: THREE.LineBasicMaterial;
  matIncidentFill: THREE.MeshBasicMaterial;
  srcHandleMats: THREE.MeshBasicMaterial[];
  oLine: THREE.Line;
  eLine: THREE.Line;
  oExitLine: THREE.Line;
  eExitLine: THREE.Line;
  oExitDot: THREE.Mesh;
  eExitDot: THREE.Mesh;
  axisLine: THREE.Line;
  axisCone: THREE.Mesh;
  sourceHandle: THREE.Group;
  axisHandle: THREE.Group;
  sourcePick: THREE.Mesh;
  axisPick: THREE.Mesh;
  grid: THREE.GridHelper;
  axes: THREE.AxesHelper;
  particles: { mesh: THREE.Mesh; ray: 'incident' | 'o' | 'e'; index: number }[];
  oLabel: CSS2DObject;
  eLabel: CSS2DObject;
  oLabelAnchor: THREE.Object3D;
  eLabelAnchor: THREE.Object3D;
  paths: { incident: PathData | null; o: PathData | null; e: PathData | null };
  oDots: MarkerPool;
  eDashes: MarkerPool;
  incDots: MarkerPool;
  incDashes: MarkerPool;
  circularMarkers: THREE.Mesh[];
  clock: THREE.Clock;
  raycaster: THREE.Raycaster;
  disposed: boolean;
  animationOn: boolean;
}

export default function SimulationViewportSection({
  config,
  polyhedron,
  result,
  onConfigChange,
  resetToken,
}: SimulationViewportSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneData | null>(null);
  const [webglError, setWebglError] = useState(false);
  const polyhedronRef = useRef(polyhedron);
  const onConfigChangeRef = useRef(onConfigChange);
  polyhedronRef.current = polyhedron;
  onConfigChangeRef.current = onConfigChange;

  // ── Initialize the three.js scene once ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    try {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = 'none';

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.left = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(labelRenderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
    camera.position.set(8.5, 6, 9.5);
    camera.lookAt(0, 0, 0);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(6, 10, 6);
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0x88bbff, 0.4);
    fillLight.position.set(-6, 4, -6);
    scene.add(fillLight);

    // Grid & axes
    const grid = new THREE.GridHelper(22, 22, 0x2a3b55, 0x1d2a3f);
    grid.position.y = -3.2;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.55;
    scene.add(grid);
    const axes = new THREE.AxesHelper(3);
    axes.position.y = -3.2;
    scene.add(axes);

    // Crystal
    const { mesh: crystalMesh } = createCrystalMesh(polyhedronRef.current);
    scene.add(crystalMesh);

    // Incident ray material (color follows wavelength)
    const matIncident = new THREE.LineBasicMaterial({
      color: '#fbbf24',
      linewidth: 3,
      transparent: true,
      opacity: 0.95,
    });
    const incidentLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
      matIncident,
    );
    const matIncidentFill = new THREE.MeshBasicMaterial({ color: '#fbbf24' });
    scene.add(incidentLine);

    // O / E internal rays
    const oLine = makeLine(COLORS.o, 3);
    const eLine = makeLine(COLORS.e, 3);
    scene.add(oLine, eLine);

    // Exit rays (outside the crystal) + endpoint dots
    const oExitLine = makeLine(COLORS.o, 2);
    const eExitLine = makeLine(COLORS.e, 2);
    const oExitDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 12, 12),
      new THREE.MeshBasicMaterial({ color: COLORS.o }),
    );
    const eExitDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 12, 12),
      new THREE.MeshBasicMaterial({ color: COLORS.e }),
    );
    scene.add(oExitLine, eExitLine, oExitDot, eExitDot);

    // Optical axis (dashed) + arrow
    const axisGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const axisMat = new THREE.LineDashedMaterial({
      color: COLORS.axis,
      dashSize: 0.22,
      gapSize: 0.14,
      transparent: true,
      opacity: 0.9,
    });
    const axisLine = new THREE.Line(axisGeo, axisMat);
    scene.add(axisLine);
    const axisCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.4, 16),
      new THREE.MeshBasicMaterial({ color: COLORS.axis }),
    );
    scene.add(axisCone);

    // Draggable handles
    function makeHandle(color: string): { group: THREE.Group; pick: THREE.Mesh; mats: THREE.MeshBasicMaterial[] } {
      const group = new THREE.Group();
      const visMat = new THREE.MeshBasicMaterial({ color });
      const haloMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22 });
      const vis = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 24), visMat);
      const halo = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 24), haloMat);
      const pick = new THREE.Mesh(
        new THREE.SphereGeometry(0.62, 12, 12),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
      );
      group.add(vis, halo, pick);
      return { group, pick, mats: [visMat, haloMat] };
    }
    const src = makeHandle('#fbbf24');
    const ax = makeHandle(COLORS.axis);
    scene.add(src.group, ax.group);

    // Labels
    function makeLabel(text: string, color: string): { obj: CSS2DObject; anchor: THREE.Object3D } {
      const div = document.createElement('div');
      div.textContent = text;
      div.style.color = color;
      div.style.fontWeight = '700';
      div.style.fontSize = '13px';
      div.style.textShadow = '0 0 6px rgba(0,0,0,0.8)';
      div.style.pointerEvents = 'none';
      const obj = new CSS2DObject(div);
      const anchor = new THREE.Object3D();
      anchor.add(obj);
      scene.add(anchor);
      return { obj, anchor };
    }
    const oLab = makeLabel('o 光', COLORS.o);
    const eLab = makeLabel('e 光', COLORS.e);

    // Particles (arrows, cones pointing along travel direction)
    const particles: SceneData['particles'] = [];
    const matO = new THREE.MeshBasicMaterial({ color: COLORS.o });
    const matE = new THREE.MeshBasicMaterial({ color: COLORS.e });
    const particleMats = { incident: matIncidentFill, o: matO, e: matE };
    const coneGeo = new THREE.ConeGeometry(0.055, 0.16, 6, 1);
    (['incident', 'o', 'e'] as const).forEach(ray => {
      for (let i = 0; i < PARTICLES_PER_RAY; i++) {
        const m = new THREE.Mesh(coneGeo, particleMats[ray]);
        scene.add(m);
        particles.push({ mesh: m, ray, index: i });
      }
    });

    // Polarization marker pools: o → dots, e / incident → dashes (+ dots for natural)
    const dotGeo = new THREE.SphereGeometry(0.05, 10, 10);
    const dashGeo = new THREE.BoxGeometry(0.14, 0.02, 0.02);
    const oDots = createPool(scene, DOT_POOL, dotGeo, new THREE.MeshBasicMaterial({ color: COLORS.o }));
    const eDashes = createPool(scene, DASH_POOL, dashGeo, new THREE.MeshBasicMaterial({ color: COLORS.e }));
    const incDots = createPool(scene, DOT_POOL, dotGeo, matIncidentFill);
    const incDashes = createPool(scene, DASH_POOL, dashGeo, matIncidentFill);

    // ── Drag interaction (registered BEFORE OrbitControls) ──
    const raycaster = new THREE.Raycaster();
    let dragType: 'incident' | 'axis' | null = null;

    function getNdc(ev: PointerEvent): THREE.Vector2 {
      const rect = renderer.domElement.getBoundingClientRect();
      return new THREE.Vector2(
        ((ev.clientX - rect.left) / rect.width) * 2 - 1,
        -((ev.clientY - rect.top) / rect.height) * 2 + 1,
      );
    }

    function onPointerDown(ev: PointerEvent) {
      raycaster.setFromCamera(getNdc(ev), camera);
      const hits = raycaster.intersectObjects([src.pick, ax.pick]);
      if (hits.length === 0) return;
      dragType = hits[0].object === src.pick ? 'incident' : 'axis';
      controls.enabled = false;
      renderer.domElement.setPointerCapture(ev.pointerId);
    }

    function onPointerMove(ev: PointerEvent) {
      if (!dragType) return;
      raycaster.setFromCamera(getNdc(ev), camera);
      const ray = raycaster.ray;
      const R = dragType === 'incident' ? SOURCE_DISTANCE : AXIS_HANDLE_RADIUS;
      const o = ray.origin;
      const d = ray.direction;
      const b = o.dot(d);
      const c = o.dot(o) - R * R;
      const disc = b * b - c;
      let p: THREE.Vector3;
      if (disc >= 0) {
        const t = -b - Math.sqrt(disc);
        p = o.clone().add(d.clone().multiplyScalar(t > 0 ? t : -b + Math.sqrt(disc)));
      } else {
        const t = -b;
        p = o.clone().add(d.clone().multiplyScalar(Math.max(t, 0.5)));
      }
      if (p.length() < 0.01) return;
      const { azimuth, elevation } = anglesFromDirection(p);
      if (dragType === 'incident') {
        onConfigChangeRef.current({
          incidenceAzimuth: Math.round(azimuth),
          incidenceElevation: Math.round(Math.max(0, Math.min(90, elevation))),
        });
      } else {
        onConfigChangeRef.current({
          opticAxisAzimuth: Math.round(azimuth),
          opticAxisElevation: Math.round(Math.max(-90, Math.min(90, elevation))),
        });
      }
    }

    function onPointerUp(ev: PointerEvent) {
      if (dragType) {
        dragType = null;
        controls.enabled = true;
        try {
          renderer.domElement.releasePointerCapture(ev.pointerId);
        } catch {
          /* noop */
        }
      }
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointercancel', onPointerUp);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 4;
    controls.maxDistance = 40;
    controls.saveState();

    const clock = new THREE.Clock();

    const sd: SceneData = {
      renderer,
      labelRenderer,
      scene,
      camera,
      controls,
      crystalMesh,
      incidentLine,
      matIncident,
      matIncidentFill,
      srcHandleMats: src.mats,
      oLine,
      eLine,
      oExitLine,
      eExitLine,
      oExitDot,
      eExitDot,
      axisLine,
      axisCone,
      sourceHandle: src.group,
      axisHandle: ax.group,
      sourcePick: src.pick,
      axisPick: ax.pick,
      grid,
      axes,
      particles,
      oLabel: oLab.obj,
      eLabel: eLab.obj,
      oLabelAnchor: oLab.anchor,
      eLabelAnchor: eLab.anchor,
      paths: { incident: null, o: null, e: null },
      oDots,
      eDashes,
      incDots,
      incDashes,
      circularMarkers: [],
      clock,
      raycaster,
      disposed: false,
      animationOn: true,
    };
    sceneRef.current = sd;

    // Resize
    const ro = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      labelRenderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(container);

    // Animation loop
    const rotQ = new THREE.Quaternion();
    const yUp = new THREE.Vector3(0, 1, 0);
    const dirTmp = new THREE.Vector3();
    function animate() {
      if (sd.disposed) return;
      const t = sd.clock.getElapsedTime();
      if (sd.animationOn) {
        for (const part of sd.particles) {
          const path = sd.paths[part.ray];
          if (!path) {
            part.mesh.visible = false;
            continue;
          }
          part.mesh.visible = true;
          const frac = (t * 0.22 + part.index / PARTICLES_PER_RAY) % 1;
          const pos = pointOnPath(path, frac);
          part.mesh.position.copy(pos);
          // Arrow orientation: tangent at current position
          const nextPos = pointOnPath(path, Math.min(0.999, frac + 0.005));
          dirTmp.subVectors(nextPos, pos);
          if (dirTmp.lengthSq() > 1e-10) {
            dirTmp.normalize();
            rotQ.setFromUnitVectors(yUp, dirTmp);
            part.mesh.quaternion.copy(rotQ);
          }
        }
      } else {
        for (const part of sd.particles) part.mesh.visible = false;
      }
      // Circular polarization markers rotate around propagation direction
      for (const m of sd.circularMarkers) {
        const ud = m.userData as { axis: THREE.Vector3; baseQuat: THREE.Quaternion };
        rotQ.setFromAxisAngle(ud.axis, t * 2.4);
        m.quaternion.copy(rotQ.multiply(ud.baseQuat));
      }
      sd.controls.update();
      sd.renderer.render(sd.scene, sd.camera);
      sd.labelRenderer.render(sd.scene, sd.camera);
    }
    renderer.setAnimationLoop(animate);

    return () => {
      sd.disposed = true;
      renderer.setAnimationLoop(null);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointercancel', onPointerUp);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) container.removeChild(renderer.domElement);
      if (labelRenderer.domElement.parentElement === container) container.removeChild(labelRenderer.domElement);
      scene.traverse(obj => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
          obj.geometry.dispose();
          const m = obj.material as THREE.Material | THREE.Material[];
          if (Array.isArray(m)) m.forEach(x => x.dispose());
          else m.dispose();
        }
      });
    };
    } catch (e) {
      console.error('WebGL init failed:', String(e));
      setWebglError(true);
      return undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update scene when config / geometry / result change ──
  useEffect(() => {
    const sd = sceneRef.current;
    if (!sd) return;

    // Crystal
    rebuildCrystalMesh(sd.crystalMesh, polyhedron);

    // 防御旧数据形状（HMR/异常路径下字段缺失）
    const pol: IPolarizationInfo = result.polarization ?? {
      type: 'natural',
      oIntensity: 1,
      eIntensity: 1,
      oPolDir: null,
      ePolDir: null,
      incidentPolDir: null,
      incidentParDir: null,
    };
    const incidentPath = result.incidentPath ?? [];
    const oRayPath = result.oRayPath ?? [];
    const eRayPath = result.eRayPath ?? [];
    const oExitRay = result.oExitRay ?? null;
    const eExitRay = result.eExitRay ?? null;
    const hit = result.hit === true && !result.missed;

    // Wavelength color → incident ray / particles / markers / handle
    const wavelength = result.wavelength;
    const incColor = wavelength?.color ?? '#fbbf24';
    sd.matIncident.color.set(incColor);
    sd.matIncidentFill.color.set(incColor);
    for (const m of sd.srcHandleMats) m.color.set(incColor);

    // Incident ray
    if (incidentPath.length >= 2) {
      sd.incidentLine.visible = true;
      setLinePoints(sd.incidentLine, incidentPath);
    } else {
      sd.incidentLine.visible = false;
    }

    const setRayLine = (line: THREE.Line, path: [number, number, number][], intensity: number) => {
      const mat = line.material as THREE.LineBasicMaterial;
      if (path.length >= 2 && intensity > 0.02) {
        line.visible = true;
        mat.opacity = 0.35 + 0.6 * intensity;
        setLinePoints(line, path);
      } else {
        line.visible = false;
      }
    };
    setRayLine(sd.oLine, oRayPath, pol.oIntensity);
    setRayLine(sd.eLine, eRayPath, pol.eIntensity);

    // Exit rays (separately toggleable)
    const setExit = (line: THREE.Line, dot: THREE.Mesh, exit: IExitRay | null, intensity: number) => {
      const mat = line.material as THREE.LineBasicMaterial;
      if (config.showExitRays && exit && intensity > 0.02) {
        line.visible = true;
        mat.opacity = 0.35 + 0.6 * intensity;
        setLinePoints(line, [exit.start, exit.end]);
        dot.visible = true;
        dot.position.set(exit.end[0], exit.end[1], exit.end[2]);
      } else {
        line.visible = false;
        dot.visible = false;
      }
    };
    setExit(sd.oExitLine, sd.oExitDot, oExitRay, pol.oIntensity);
    setExit(sd.eExitLine, sd.eExitDot, eExitRay, pol.eIntensity);

    // Paths for particles (internal + exit segment)
    const withExit = (path: [number, number, number][], exit: IExitRay | null) =>
      exit ? [...path, exit.end] : path;
    sd.paths = {
      incident: buildPathData(incidentPath),
      o: pol.oIntensity > 0.02 ? buildPathData(withExit(oRayPath, oExitRay)) : null,
      e: pol.eIntensity > 0.02 ? buildPathData(withExit(eRayPath, eExitRay)) : null,
    };

    // Source handle position
    const srcDir = directionFromAngles(config.incidenceAzimuth, config.incidenceElevation);
    sd.sourceHandle.position.copy(srcDir.clone().multiplyScalar(SOURCE_DISTANCE));

    // Optical axis
    const axisDir = directionFromAngles(config.opticAxisAzimuth, config.opticAxisElevation);
    sd.axisHandle.position.copy(axisDir.clone().multiplyScalar(AXIS_HANDLE_RADIUS));
    const showAxis = config.showOpticAxis;
    sd.axisLine.visible = showAxis;
    sd.axisCone.visible = showAxis;
    sd.axisHandle.visible = showAxis;
    if (showAxis) {
      const half = AXIS_HANDLE_RADIUS;
      const a = axisDir.clone().multiplyScalar(-half);
      const b = axisDir.clone().multiplyScalar(half);
      (sd.axisLine.geometry as THREE.BufferGeometry).setFromPoints([a, b]);
      sd.axisLine.computeLineDistances();
      sd.axisCone.position.copy(axisDir.clone().multiplyScalar(half));
      sd.axisCone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axisDir);
    }

    // Grid / axes visibility
    sd.grid.visible = config.showGrid;
    sd.axes.visible = config.showGrid;

    // Animation toggle
    sd.animationOn = config.showAnimation;

    // Labels: prefer exit endpoint, fallback to internal path end
    const showL = config.showLabels && hit;
    const labelPos = (path: [number, number, number][], exit: IExitRay | null) => {
      if (exit) return exit.end;
      return path.length > 0 ? path[path.length - 1] : null;
    };
    const oPos = labelPos(oRayPath, oExitRay);
    const ePos = labelPos(eRayPath, eExitRay);
    sd.oLabelAnchor.visible = showL && oPos !== null && pol.oIntensity > 0.02;
    sd.eLabelAnchor.visible = showL && ePos !== null && pol.eIntensity > 0.02;
    if (oPos) sd.oLabelAnchor.position.set(oPos[0], oPos[1], oPos[2]);
    if (ePos) sd.eLabelAnchor.position.set(ePos[0], ePos[1], ePos[2]);

    // ── Polarization markers (dots = o 光 ⊥ 主平面；横杠 = e 光 ∥ 主平面) ──
    resetPool(sd.oDots);
    resetPool(sd.eDashes);
    resetPool(sd.incDots);
    resetPool(sd.incDashes);
    sd.circularMarkers = [];

    if (config.showPolarization && hit) {
      const placeDot = (pool: MarkerPool, pos: THREE.Vector3) => {
        const m = nextMesh(pool);
        if (m) m.position.copy(pos);
      };
      const placeDash = (
        pool: MarkerPool,
        pos: THREE.Vector3,
        dir: THREE.Vector3,
        extra?: { circular: boolean; axis: THREE.Vector3 },
      ) => {
        const m = nextMesh(pool);
        if (!m) return;
        m.position.copy(pos);
        m.quaternion.setFromUnitVectors(X_AXIS, dir.clone().normalize());
        if (extra?.circular) {
          m.userData = { circular: true, axis: extra.axis.clone().normalize(), baseQuat: m.quaternion.clone() };
          sd.circularMarkers.push(m);
        }
      };

      const parDir = pol.incidentParDir
        ? new THREE.Vector3(pol.incidentParDir[0], pol.incidentParDir[1], pol.incidentParDir[2])
        : new THREE.Vector3(0, 1, 0);
      const ePolDir = pol.ePolDir
        ? new THREE.Vector3(pol.ePolDir[0], pol.ePolDir[1], pol.ePolDir[2])
        : new THREE.Vector3(0, 1, 0);

      // Incident markers
      const incPath = buildPathData(incidentPath);
      if (incPath) {
        const positions = samplePath(incPath, SPACING);
        if (pol.type === 'natural') {
          positions.forEach((p, i) => {
            if (i % 2 === 0) placeDot(sd.incDots, p);
            else placeDash(sd.incDashes, p, parDir);
          });
        } else if (pol.type === 'linear' && pol.incidentPolDir) {
          const d = new THREE.Vector3(...pol.incidentPolDir);
          positions.forEach(p => placeDash(sd.incDashes, p, d));
        } else {
          // Circular: dashes rotate around the propagation direction
          const propDir = srcDir.clone().negate();
          positions.forEach(p => placeDash(sd.incDashes, p, parDir, { circular: true, axis: propDir }));
        }
      }

      // o ray markers (dots) along internal path + exit segment
      if (pol.oIntensity > 0.02) {
        const oPath = buildPathData(withExit(oRayPath, oExitRay));
        if (oPath) {
          for (const p of samplePath(oPath, SPACING)) placeDot(sd.oDots, p);
        }
      }
      // e ray markers (dashes) along internal path + exit segment
      if (pol.eIntensity > 0.02) {
        const ePath = buildPathData(withExit(eRayPath, eExitRay));
        if (ePath) {
          for (const p of samplePath(ePath, SPACING)) placeDash(sd.eDashes, p, ePolDir);
        }
      }
    }
  }, [config, polyhedron, result]);

  // ── Reset camera ──
  useEffect(() => {
    if (resetToken > 0) {
      sceneRef.current?.controls.reset();
    }
  }, [resetToken]);

  const legend: [string, string][] = [
    [result.wavelength?.color ?? '#fbbf24', `入射光 ${result.wavelength?.label?.split?.(' ')?.[0] ?? '589nm'}`],
    [COLORS.o, 'o 光（寻常光）· ● 偏振⊥主平面'],
    [COLORS.e, 'e 光（非常光）· — 偏振∥主平面'],
    [COLORS.axis, '光轴'],
  ];

  // 暗色光学台：光线与流光动画按深色背景调校，页面其余部分走 Clay 浅色
  return (
    <div className="relative h-full min-h-[60vh] w-full overflow-hidden rounded-[6px] bg-[#0c1117] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
      {webglError ? (
        <div className="flex h-full min-h-[60vh] w-full items-center justify-center p-8 text-center">
          <div className="max-w-sm space-y-2">
            <p className="text-base font-semibold text-white/90">当前环境不支持 WebGL</p>
            <p className="text-sm leading-relaxed text-white/55">3D 场景无法渲染，控制面板仍可调整参数并查看读数。</p>
          </div>
        </div>
      ) : (
        <>
          <div ref={containerRef} className="absolute inset-0" />
          <p className="pointer-events-none absolute left-4 top-3 z-10 text-[13px] text-white/55">
            拖 <span className="font-semibold" style={{ color: result.wavelength?.color ?? '#fbbf24' }}>●光源手柄</span> 调入射方向，
            拖 <span className="font-semibold" style={{ color: COLORS.axis }}>●青色手柄</span> 调光轴，拖空白处旋转视角
          </p>
          <ul className="pointer-events-none absolute bottom-3 left-4 z-10 space-y-1 text-[13px] text-white/70">
            {legend.map(([color, label]) => (
              <li key={label} className="flex items-center gap-2">
                <span className="inline-block h-[3px] w-6" style={{ background: color }} />
                {label}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
