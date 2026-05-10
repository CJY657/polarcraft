/**
 * 双折射3D组件库 | Birefringence 3D Components Library
 *
 * 可复用的React Three Fiber 3D组件，用于展示双折射现象 | Reusable React Three Fiber 3D components for birefringence visualization
 * 包含晶体模型、光线追踪、偏振指示器等 | Includes crystal model, ray tracing, polarization indicators, etc.
 *
 * @module Birefringence3D
 */

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Line, Grid } from "@react-three/drei";
import * as THREE from "three";
import type { BirefringenceParams } from "@/lib/physics/GeometricOptics";
import {
  calculateBirefringenceRayPaths,
  calculateDoubleImageOffset,
} from "@/lib/physics/GeometricOptics";

// ============================================================================
// 晶体组件 | CRYSTAL COMPONENTS
// ============================================================================

/**
 * 方解石晶体 - 菱面体几何形状 | Calcite Crystal - Rhombohedron geometry
 * 方解石的自然晶形，具有约78°和102°的角度 | Calcite's natural crystal form with ~78° and 102° angles
 *
 * @param props.rotation - 晶体旋转角度 [x, y, z]（弧度）| Crystal rotation angles [x, y, z] in radians
 */
export function CalciteCrystal({
  rotation,
}: {
  rotation: [number, number, number];
}) {
  // 创建菱面体几何体 | Create rhombohedron geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();

    // 定义菱面体顶点 | Define rhombohedron vertices
    const size = 1.5;
    const height = 1.2;
    const skew = 0.4;

    const vertices = new Float32Array([
      // 底面 | Bottom face
      -size + skew, -height, -size * 0.6,
      size + skew, -height, -size * 0.6,
      size, -height, size * 0.6,
      -size, -height, size * 0.6,
      // 顶面（偏移和倾斜）| Top face (offset and skewed)
      -size + skew, height, -size * 0.6,
      size + skew, height, -size * 0.6,
      size, height, size * 0.6,
      -size, height, size * 0.6,
    ]);

    // 定义面索引 | Define face indices
    const indices = [
      // 底面 | Bottom
      0, 1, 2, 0, 2, 3,
      // 顶面 | Top
      4, 5, 6, 4, 6, 7,
      // 前 | Front
      0, 1, 5, 0, 5, 4,
      // 后 | Back
      2, 3, 7, 2, 7, 6,
      // 左 | Left
      0, 3, 7, 0, 7, 4,
      // 右 | Right
      1, 2, 6, 1, 6, 5,
    ];

    geo.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return geo;
  }, []);

  return (
    <mesh geometry={geometry} rotation={rotation}>
      <meshPhysicalMaterial
        color="#ffffff"
        transmission={0.85} // 玻璃状 | Glass-like
        opacity={0.4}
        metalness={0}
        roughness={0.05}
        ior={1.658} // 方解石折射率 | Calcite refractive index
        thickness={0.5}
        transparent={true}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/**
 * 石英晶体（预留） | Quartz Crystal
 * 石英的双折射率较小 | Quartz has lower birefringence
 *
 * @param props.rotation - 晶体旋转角度 [x, y, z]（弧度）| Crystal rotation angles [x, y, z] in radians
 */
export function QuartzCrystal({
  rotation,
}: {
  rotation: [number, number, number];
}) {
  // 石英通常呈六方柱状 | Quartz typically forms hexagonal prisms
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();

    const radius = 1.2;
    const height = 1.5;
    const segments = 6;

    const vertices: number[] = [];
    const indices: number[] = [];

    // 生成六方柱顶点 | Generate hexagonal prism vertices
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);

      // 底面顶点 | Bottom vertices
      vertices.push(x, -height, z);
      // 顶面顶点 | Top vertices
      vertices.push(x, height, z);
    }

    // 生成面 | Generate faces
    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments;
      const i0 = i * 2;
      const i1 = i * 2 + 1;
      const i2 = next * 2;
      const i3 = next * 2 + 1;

      // 侧面 | Side faces
      indices.push(i0, i2, i1);
      indices.push(i1, i2, i3);
    }

    // 顶面 | Top face
    for (let i = 1; i < segments - 1; i++) {
      indices.push(1, i * 2 + 1, (i + 1) * 2 + 1);
    }
    // 底面 | Bottom face
    for (let i = 1; i < segments - 1; i++) {
      indices.push(0, (i + 1) * 2, i * 2);
    }

    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return geo;
  }, []);

  return (
    <mesh geometry={geometry} rotation={rotation}>
      <meshPhysicalMaterial
        color="#ffffff"
        transmission={0.8}
        opacity={0.5}
        metalness={0}
        roughness={0.1}
        ior={1.544} // 石英折射率 | Quartz refractive index
        thickness={0.4}
        transparent={true}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ============================================================================
// 光线组件 | RAY COMPONENTS
// ============================================================================

function RayArrowHead({
  start,
  end,
  color,
  size = 0.12,
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
  size?: number;
}) {
  const { position, quaternion } = useMemo(() => {
    const direction = new THREE.Vector3().subVectors(end, start).normalize();
    const arrowPosition = new THREE.Vector3().lerpVectors(start, end, 0.96);
    const arrowQuaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction
    );

    return { position: arrowPosition, quaternion: arrowQuaternion };
  }, [end, start]);

  return (
    <mesh position={position} quaternion={quaternion}>
      <coneGeometry args={[size, size * 2.3, 24]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} />
    </mesh>
  );
}

function pointAtY(start: THREE.Vector3, end: THREE.Vector3, y: number) {
  const dy = end.y - start.y;
  if (Math.abs(dy) < 0.0001) return end.clone();

  const t = Math.max(0, Math.min(1, (y - start.y) / dy));
  return start.clone().lerp(end, t);
}

/**
 * 入射光组件 | Incident Ray Component
 *
 * @param params - 双折射参数 | Birefringence parameters
 * @param animate - 是否启用动画 | Whether to enable animation
 */
export function IncidentRay({
  params,
  animate,
}: {
  params: BirefringenceParams;
  animate: boolean;
}) {
  const lineRef = useRef<any>(null);
  const rayPaths = useMemo(
    () => calculateBirefringenceRayPaths(params, 3),
    [params]
  );
// 入射光脉冲动画 | Incident ray pulse animation
  useFrame((state) => {
    if (animate && lineRef.current) {
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 3);
      material.opacity = pulse;
    }
  });

  return (
    <>
      <Line
        ref={lineRef}
        points={[rayPaths.incidentStart, rayPaths.incidentEnd]}
        color="#ffdd00"
        lineWidth={3}
        opacity={1}
        transparent
      />
      <RayArrowHead
        start={rayPaths.incidentStart}
        end={rayPaths.incidentEnd}
        color="#ffdd00"
      />
    </>
  );
}

/**
 * 寻常光（o光）组件 | Ordinary Ray (o-ray) Component
 * 严格遵循斯涅尔定律 | Follows Snell's law exactly
 *
 * @param params - 双折射参数 | Birefringence parameters
 * @param animate - 是否启用动画 | Whether to enable animation
 */
export function OrdinaryRay({
  params,
  animate,
}: {
  params: BirefringenceParams;
  animate: boolean;
}) {
  const lineRef = useRef<any>(null);
  const rayPaths = useMemo(
    () => calculateBirefringenceRayPaths(params, 3),
    [params]
  );

  useFrame((state) => {
    if (animate && lineRef.current) {
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      const pulse = 0.6 + 0.4 * Math.sin(state.clock.elapsedTime * 3 + Math.PI);
      material.opacity = pulse;
    }
  });

  return (
    <>
      <Line
        ref={lineRef}
        points={[rayPaths.incidentEnd, rayPaths.oRayEnd]}
        color="#00ffff"
        lineWidth={2}
        opacity={0.8}
        transparent
        dashed
        dashScale={5}
        gapSize={1}
      />
      <RayArrowHead
        start={rayPaths.incidentEnd}
        end={rayPaths.oRayEnd}
        color="#00ffff"
        size={0.1}
      />
    </>
  );
}

/**
 * 非寻常光（e光）组件 | Extraordinary Ray (e-ray) Component
 * 根据晶体取向偏离斯涅尔定律 | Deviates from Snell's law based on crystal orientation
 *
 * @param params - 双折射参数 | Birefringence parameters
 * @param animate - 是否启用动画 | Whether to enable animation
 */
export function ExtraordinaryRay({
  params,
  animate,
}: {
  params: BirefringenceParams;
  animate: boolean;
}) {
  const lineRef = useRef<any>(null);
  const rayPaths = useMemo(
    () => calculateBirefringenceRayPaths(params, 3),
    [params]
  );

  useFrame((state) => {
    if (animate && lineRef.current) {
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      const pulse = 0.6 + 0.4 * Math.sin(state.clock.elapsedTime * 3 + Math.PI / 2);
      material.opacity = pulse;
    }
  });

  return (
    <>
      <Line
        ref={lineRef}
        points={[rayPaths.incidentEnd, rayPaths.eRayEnd]}
        color="#ff00ff"
        lineWidth={2}
        opacity={0.8}
        transparent
        dashed
        dashScale={5}
        gapSize={1}
      />
      <RayArrowHead
        start={rayPaths.incidentEnd}
        end={rayPaths.eRayEnd}
        color="#ff00ff"
        size={0.1}
      />
    </>
  );
}

/**
 * 晶体内部光路 | Crystal internal ray paths
 * 用高亮实线单独强调光线在晶体内部传播的那一段 | Highlights the beam segments inside the crystal
 */
export function CrystalInternalPaths({
  params,
  showORay = true,
  showERay = true,
}: {
  params: BirefringenceParams;
  showORay?: boolean;
  showERay?: boolean;
}) {
  const rayPaths = useMemo(
    () => calculateBirefringenceRayPaths(params, 3),
    [params]
  );
  const crystalBottomY = -1.2;
  const oExit = useMemo(
    () => pointAtY(rayPaths.incidentEnd, rayPaths.oRayEnd, crystalBottomY),
    [rayPaths]
  );
  const eExit = useMemo(
    () => pointAtY(rayPaths.incidentEnd, rayPaths.eRayEnd, crystalBottomY),
    [rayPaths]
  );

  return (
    <>
      {showORay && (
        <>
          <Line
            points={[rayPaths.incidentEnd, oExit]}
            color="#67e8f9"
            lineWidth={5}
            opacity={0.98}
            transparent
          />
          <mesh position={oExit}>
            <sphereGeometry args={[0.06, 20, 20]} />
            <meshBasicMaterial color="#67e8f9" />
          </mesh>
          <Text
            position={oExit.clone().add(new THREE.Vector3(0.12, 0.08, -0.08))}
            fontSize={0.08}
            color="#a5f3fc"
            anchorX="left"
          >
            o光出射
          </Text>
        </>
      )}
      {showERay && (
        <>
          <Line
            points={[rayPaths.incidentEnd, eExit]}
            color="#f472b6"
            lineWidth={5}
            opacity={0.98}
            transparent
          />
          <mesh position={eExit}>
            <sphereGeometry args={[0.06, 20, 20]} />
            <meshBasicMaterial color="#f472b6" />
          </mesh>
          <Text
            position={eExit.clone().add(new THREE.Vector3(0.12, -0.08, 0.08))}
            fontSize={0.08}
            color="#f9a8d4"
            anchorX="left"
          >
            e光出射
          </Text>
        </>
      )}
      {showORay && showERay && (
        <Line
          points={[oExit, eExit]}
          color="#fbbf24"
          lineWidth={1}
          opacity={0.7}
          transparent
        />
      )}
      <Text
        position={[0.26, 0.38, -0.5]}
        fontSize={0.1}
        color="#e0f2fe"
        anchorX="left"
      >
        晶体内光路
      </Text>
    </>
  );
}

// ============================================================================
// 指示器组件 | INDICATOR COMPONENTS
// ============================================================================

/**
 * 光轴指示器 | Optical Axis Indicator
 * 显示晶体的光轴方向 | Shows the optical axis direction of the crystal
 */
export function OpticalAxisIndicator() {
  return (
    <Line
      points={[
        new THREE.Vector3(0, -2, 0),
        new THREE.Vector3(0, 2, 0),
      ]}
      color="#ff8800"
      lineWidth={1}
      opacity={0.5}
      transparent
      dashed
      dashScale={3}
    />
  );
}

/**
 * 偏振指示器 - 显示振动方向 | Polarization Indicators - Show vibration directions
 * o光和e光的偏振方向互相垂直 | o-ray and e-ray have perpendicular polarization directions
 *
 * @param params - 双折射参数 | Birefringence parameters
 */
export function PolarizationIndicators({ params }: { params: BirefringenceParams }) {
  const groupRef = useRef<THREE.Group>(null);
  const rayPaths = useMemo(
    () => calculateBirefringenceRayPaths(params, 3),
    [params]
  );

  useFrame((state) => {
    if (groupRef.current) {
      // 偏振指示器振荡动画 | Animate polarization indicators oscillating
      const oscillation = Math.sin(state.clock.elapsedTime * 8) * 0.1;
      groupRef.current.children.forEach((child, i) => {
        child.scale.y = 1 + oscillation * (i % 2 === 0 ? 1 : -1);
      });
    }
  });

  // 在o光和e光路径上放置指示器 | Position indicators along o-ray and e-ray paths
  const oRayMid = new THREE.Vector3().lerpVectors(
    rayPaths.incidentEnd,
    rayPaths.oRayEnd,
    0.5
  );
  const eRayMid = new THREE.Vector3().lerpVectors(
    rayPaths.incidentEnd,
    rayPaths.eRayEnd,
    0.5
  );

  return (
    <group ref={groupRef}>
      {/* o光偏振指示器（垂直于传播方向）| O-ray polarization indicator (perpendicular to propagation) */}
      <Line
        points={[
          new THREE.Vector3(oRayMid.x, oRayMid.y - 0.2, oRayMid.z),
          new THREE.Vector3(oRayMid.x, oRayMid.y + 0.2, oRayMid.z),
        ]}
        color="#00ffff"
        lineWidth={3}
      />
      {/* e光偏振指示器（平行分量）| E-ray polarization indicator (parallel component) */}
      <Line
        points={[
          new THREE.Vector3(eRayMid.x - 0.2, eRayMid.y, eRayMid.z),
          new THREE.Vector3(eRayMid.x + 0.2, eRayMid.y, eRayMid.z),
        ]}
        color="#ff00ff"
        lineWidth={3}
      />
    </group>
  );
}

/**
 * 分裂点标记 | Split point marker
 * 明确显示一束入射光变成两束光的位置 | Highlights where one incident beam becomes two beams
 */
export function SplitPointMarker({ params }: { params: BirefringenceParams }) {
  const rayPaths = useMemo(
    () => calculateBirefringenceRayPaths(params, 3),
    [params]
  );

  return (
    <group position={rayPaths.incidentEnd}>
      <mesh>
        <sphereGeometry args={[0.08, 24, 24]} />
        <meshBasicMaterial color="#facc15" />
      </mesh>
      <mesh>
        <ringGeometry args={[0.13, 0.18, 32]} />
        <meshBasicMaterial
          color="#facc15"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Text
        position={[0.16, 0.24, 0]}
        fontSize={0.12}
        color="#fde68a"
        anchorX="left"
        anchorY="middle"
      >
        分裂点
      </Text>
    </group>
  );
}

/**
 * 出射端标记 | Exit ray markers
 * 把两条光线的终点和两幅像对应起来 | Connects ray endpoints to the two resulting images
 */
export function ExitRayMarkers({
  params,
  showORay = true,
  showERay = true,
}: {
  params: BirefringenceParams;
  showORay?: boolean;
  showERay?: boolean;
}) {
  const rayPaths = useMemo(
    () => calculateBirefringenceRayPaths(params, 3),
    [params]
  );

  return (
    <>
      {showORay && (
        <group position={rayPaths.oRayEnd}>
          <mesh>
            <sphereGeometry args={[0.07, 20, 20]} />
            <meshBasicMaterial color="#00ffff" />
          </mesh>
          <Text
            position={[0.12, 0.12, 0]}
            fontSize={0.1}
            color="#67e8f9"
            anchorX="left"
          >
            o像
          </Text>
        </group>
      )}
      {showERay && (
        <group position={rayPaths.eRayEnd}>
          <mesh>
            <sphereGeometry args={[0.07, 20, 20]} />
            <meshBasicMaterial color="#ff00ff" />
          </mesh>
          <Text
            position={[0.12, -0.12, 0]}
            fontSize={0.1}
            color="#f0abfc"
            anchorX="left"
          >
            e像
          </Text>
        </group>
      )}
    </>
  );
}

/**
 * 观察屏 | Observation screen
 * 在场景中给出最终观察结果，而不遮挡晶体光路 | Shows the final two-image result without covering the ray path
 */
export function ObservationScreen({
  params,
  showORay = true,
  showERay = true,
}: {
  params: BirefringenceParams;
  showORay?: boolean;
  showERay?: boolean;
}) {
  const rayPaths = useMemo(
    () => calculateBirefringenceRayPaths(params, 3),
    [params]
  );
  const exitSeparation = rayPaths.oRayEnd.distanceTo(rayPaths.eRayEnd);
  const screenSeparation = Math.max(0.22, Math.min(0.86, exitSeparation * 2.8));
  const oImageX = -screenSeparation / 2;
  const eImageX = screenSeparation / 2;

  return (
    <group position={[2.35, -0.75, 0.7]} rotation={[0, -0.35, 0]}>
      <mesh>
        <planeGeometry args={[1.85, 1.22]} />
        <meshBasicMaterial
          color="#0f172a"
          transparent
          opacity={0.78}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Line
        points={[
          new THREE.Vector3(-0.92, -0.61, 0.02),
          new THREE.Vector3(0.92, -0.61, 0.02),
          new THREE.Vector3(0.92, 0.61, 0.02),
          new THREE.Vector3(-0.92, 0.61, 0.02),
          new THREE.Vector3(-0.92, -0.61, 0.02),
        ]}
        color="#38bdf8"
        lineWidth={1}
        opacity={0.45}
        transparent
      />
      <Text
        position={[0, 0.44, 0.04]}
        fontSize={0.12}
        color="#e0f2fe"
        anchorX="center"
      >
        观察屏
      </Text>
      <Text
        position={[0, 0.28, 0.04]}
        fontSize={0.075}
        color="#cbd5e1"
        anchorX="center"
      >
        一个物点变成两个像
      </Text>

      {showORay && (
        <>
          <mesh position={[oImageX, 0.02, 0.05]}>
            <circleGeometry args={[0.085, 32]} />
            <meshBasicMaterial color="#00ffff" />
          </mesh>
          <Text
            position={[oImageX, -0.17, 0.05]}
            fontSize={0.08}
            color="#67e8f9"
            anchorX="center"
          >
            o像
          </Text>
        </>
      )}
      {showERay && (
        <>
          <mesh position={[eImageX, 0.02, 0.05]}>
            <circleGeometry args={[0.085, 32]} />
            <meshBasicMaterial color="#ff00ff" />
          </mesh>
          <Text
            position={[eImageX, -0.17, 0.05]}
            fontSize={0.08}
            color="#f0abfc"
            anchorX="center"
          >
            e像
          </Text>
        </>
      )}
      {showORay && showERay && (
        <Line
          points={[
            new THREE.Vector3(oImageX, 0.02, 0.06),
            new THREE.Vector3(eImageX, 0.02, 0.06),
          ]}
          color="#fbbf24"
          lineWidth={1}
          opacity={0.75}
          transparent
        />
      )}
      <Text
        position={[0, -0.43, 0.04]}
        fontSize={0.075}
        color="#fbbf24"
        anchorX="center"
      >
        分离 {exitSeparation.toFixed(2)}
      </Text>
    </group>
  );
}

/**
 * 角度弧指示器 | Angle Arc Indicator
 * 显示入射角 | Shows the incident angle
 *
 * @param angle - 角度值（度）| Angle value in degrees
 * @param radius - 弧半径 | Arc radius
 * @param color - 弧颜色 | Arc color
 */
export function AngleArc({
  angle,
  radius = 0.8,
  color = "#94a3b8",
  position = [0, 0, 0],
}: {
  angle: number;
  radius?: number;
  color?: string;
  position?: [number, number, number];
}) {
  const points = useMemo(() => {
    const segments = 32;
    const pts: THREE.Vector3[] = [];
    const startAngle = Math.PI / 2 + (angle * Math.PI) / 180;
    const endAngle = Math.PI / 2;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const theta = startAngle + t * (endAngle - startAngle);
      pts.push(
        new THREE.Vector3(
          radius * Math.cos(theta),
          radius * Math.sin(theta),
          0
        )
      );
    }
    return pts;
  }, [angle, radius]);

  return <Line points={points} color={color} lineWidth={1} opacity={0.6} position={position} />;
}

// ============================================================================
// 双像组件 | DOUBLE IMAGE COMPONENTS
// ============================================================================

/**
 * 双像文字样本 - 展示双像效应 | Double Text Sample - Shows the double image effect
 * 通过方解石观看文字时会产生两个偏移的像 | Viewing text through calcite creates two offset images
 *
 * @param show - 是否显示 | Whether to show
 * @param params - 双折射参数 | Birefringence parameters
 */
export function DoubleTextSample({
  show,
  params,
}: {
  show: boolean;
  params: BirefringenceParams;
}) {
  if (!show) return null;

  // 计算偏移量 | Calculate offsets
  const { oRayOffset, eRayOffset } = calculateDoubleImageOffset(params);

  return (
    <group position={[0, -1.5, 0]}>
      {/* 原始文字参考位置 | Original text reference position */}
      <Text
        position={[0, 0, 0]}
        fontSize={0.25}
        color="#444444"
        anchorX="center"
        anchorY="middle"
      >
        原始文字
      </Text>

      {/* o光像（偏移一个方向）| O-ray image (offset one way) */}
      <Text
        position={[oRayOffset, 0, 0]}
        fontSize={0.3}
        color="#00ffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#006666"
      >
        双折射 (o光)
      </Text>

      {/* e光像（偏移另一个方向）| E-ray image (offset other way) */}
      <Text
        position={[eRayOffset, 0, 0]}
        fontSize={0.3}
        color="#ff00ff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#660066"
      >
        双折射 (e光)
      </Text>

      {/* 标签 | Labels */}
      <Text
        position={[oRayOffset, -0.5, 0]}
        fontSize={0.12}
        color="#00ffff"
        anchorX="center"
        anchorY="middle"
      >
        o光像
      </Text>
      <Text
        position={[eRayOffset, -0.5, 0]}
        fontSize={0.12}
        color="#ff00ff"
        anchorX="center"
        anchorY="middle"
      >
        e光像
      </Text>
    </group>
  );
}

// ============================================================================
// 环境组件 | ENVIRONMENT COMPONENTS
// ============================================================================

/**
 * 场景网格 - 地面参考平面 | Scene Grid - Ground reference plane
 *
 * @param show - 是否显示 | Whether to show
 */
export function SceneGrid({ show = true }: { show?: boolean }) {
  if (!show) return null;

  return (
    <Grid
      args={[20, 20]}
      cellSize={1}
      cellThickness={0.5}
      cellColor="#1e3a5f"
      sectionSize={5}
      sectionThickness={1}
      sectionColor="#2d5a87"
      fadeDistance={15}
      fadeStrength={1}
      followCamera={false}
      infiniteGrid
    />
  );
}

/**
 * 场景标签 - 3D场景中的文字标注 | Scene Labels - Text labels in 3D scene
 *
 * @param params - 双折射参数 | Birefringence parameters
 * @param showORay - 是否显示o光标签 | Whether to show o-ray label
 * @param showERay - 是否显示e光标签 | Whether to show e-ray label
 */
export function SceneLabels({
  params,
  showORay = true,
  showERay = true,
}: {
  params: BirefringenceParams;
  showORay?: boolean;
  showERay?: boolean;
}) {
  const rayPaths = useMemo(
    () => calculateBirefringenceRayPaths(params, 3),
    [params]
  );
  const incidentLabel = new THREE.Vector3()
    .lerpVectors(rayPaths.incidentStart, rayPaths.incidentEnd, 0.45)
    .add(new THREE.Vector3(-0.15, 0.2, 0));
  const oRayLabel = rayPaths.oRayEnd.clone().add(new THREE.Vector3(0.12, 0.18, 0));
  const eRayLabel = rayPaths.eRayEnd.clone().add(new THREE.Vector3(0.12, -0.18, 0.08));

  return (
    <>
      {/* 入射光标签 | Incident ray label */}
      <Text
        position={incidentLabel}
        fontSize={0.13}
        color="#ffdd00"
        anchorX="left"
      >
        入射光
      </Text>

      {/* o光标签 | O-ray label */}
      {showORay && (
        <Text
          position={oRayLabel}
          fontSize={0.13}
          color="#00ffff"
          anchorX="left"
        >
          o光 (寻常光)
        </Text>
      )}

      {/* e光标签 | E-ray label */}
      {showERay && (
        <Text
          position={eRayLabel}
          fontSize={0.13}
          color="#ff00ff"
          anchorX="left"
        >
          e光 (非寻常光)
        </Text>
      )}

      {/* 光轴标签 | Optical axis label */}
      <Text
        position={[0.5, 2.2, 0]}
        fontSize={0.12}
        color="#ff8800"
        anchorX="center"
      >
        光轴
      </Text>

      {/* 入射角标签 | Incident angle label */}
      <Text
        position={[-1.2, 0.8, 0]}
        fontSize={0.1}
        color="#94a3b8"
        anchorX="right"
      >
        {params.incidentAngle.toFixed(1)}°
      </Text>
    </>
  );
}

// ============================================================================
// 预留扩展组件 - 未来可添加的功能 | RESERVED EXTENSION COMPONENTS
// ============================================================================

// /**
//  * 反射光组件 | Reflected Ray Component
//  * 用于演示晶体表面的反射 | For demonstrating reflection at crystal surface
//  *
//  * TODO: 实现反射光计算和可视化 | Implement reflected ray calculation and visualization
//  */
// export function ReflectedRay({ params, animate }: { params: BirefringenceParams; animate: boolean }) {
//   return null;
// }

// /**
//  * 波前组件 | Wavefront Component
//  * 可视化o光和e光的波前差异 | Visualize wavefront differences between o-ray and e-ray
//  *
//  * TODO: 实现波前动画 | Implement wavefront animation
//  */
// export function WavefrontVisualization({ params, time }: { params: BirefringenceParams; time: number }) {
//   return null;
// }

// /**
//  * 相位延迟组件 | Phase Retardation Component
//  * 显示o光和e光之间的相位差 | Display phase difference between o-ray and e-ray
//  *
//  * TODO: 实现相位延迟计算 | Implement phase retardation calculation
//  */
// export function PhaseRetardationIndicator({ params }: { params: BirefringenceParams }) {
//   return null;
// }

// /**
//  * 折射率椭球组件 | Refractive Index Ellipsoid Component
//  * 3D可视化折射率椭球 | 3D visualization of refractive index ellipsoid
//  *
//  * TODO: 实现3D椭球可视化 | Implement 3D ellipsoid visualization
//  */
// export function IndexEllipsoid({ params }: { params: BirefringenceParams }) {
//   return null;
// }

// /**
//  * 偏振椭圆可视化 | Polarization Ellipse Visualization
//  * 显示光的偏振态椭圆 | Show polarization ellipse of light
//  *
//  * TODO: 实现偏振椭圆可视化 | Implement polarization ellipse visualization
//  */
// export function PolarizationEllipse({ params }: { params: BirefringenceParams }) {
//   return null;
// }
