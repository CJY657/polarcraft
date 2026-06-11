/**
 * BrewsterAngleDemo.tsx
 *
 * 布鲁斯特角演示 —— 由真实菲涅耳方程驱动。
 *
 * 物理引擎：
 * - 反射/折射光的亮度与偏振分量全部来自 lib/physics/Fresnel 的 Rs/Rp/Ts/Tp
 * - 在布鲁斯特角处 P 分量自然消失（物理结果，而非硬编码）
 * - 支持玻璃→空气方向：超过临界角进入全反射区，并绘制倏逝波提示
 *
 * 交互：
 * - 直接在光路图上拖动可改变入射角
 * - 反射率曲线图上点击/拖动也可设置角度
 *
 * 约定（与教材一致）：
 * - 入射面即屏幕平面
 * - S 偏振 ⊥ 入射面（指向屏幕外）→ 用 ⊙ 圆点表示
 * - P 偏振 ∥ 入射面 → 用与光线垂直的双向箭头表示
 */

import { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Sparkles, FlaskConical, Lightbulb, BookOpen } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  SliderControl,
  ControlPanel,
  ValueDisplay,
  InfoCard,
  Formula,
  Toggle,
  PresetButtons,
  AnimatedValue,
} from "../DemoControls";
import { DemoStage, DemoSection } from "../components/DemoLayout";
import { useDemoCanvas, pointerToCanvas } from "../hooks/useDemoCanvas";
import {
  fresnelCoefficients,
  brewsterAngleDeg,
  criticalAngleDeg,
  unpolarizedReflectance,
  reflectedDegreeOfPolarization,
  sampleReflectanceCurve,
  type FresnelResult,
} from "@/lib/physics/Fresnel";

// 介质预设
const MATERIAL_PRESETS = [
  { label: { "zh-CN": "空气→玻璃" }, n1: 1.0, n2: 1.5 },
  { label: { "zh-CN": "空气→水" }, n1: 1.0, n2: 1.33 },
  { label: { "zh-CN": "空气→钻石" }, n1: 1.0, n2: 2.42 },
  { label: { "zh-CN": "玻璃→空气" }, n1: 1.5, n2: 1.0 },
];

const COLOR_S = "#4ade80"; // S 偏振（⊥入射面，⊙）
const COLOR_P = "#fbbf24"; // P 偏振（∥入射面，↕）
const COLOR_INCIDENT = "#fff7ce";
const COLOR_REFLECT = "#ffd166";
const COLOR_REFRACT = "#5eead4";

// ----------------------------------------------------------------------------
// 绘制辅助
// ----------------------------------------------------------------------------

function drawBeam(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number,
  alpha: number,
) {
  if (alpha <= 0.004) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.shadowColor = color;
  // 外层光晕
  ctx.shadowBlur = 18;
  ctx.lineWidth = width * 2.2;
  ctx.globalAlpha = alpha * 0.25;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  // 主光束
  ctx.shadowBlur = 8;
  ctx.lineWidth = width;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

/** 沿光束移动的光子脉冲（加色混合，制造"光在流动"的感觉） */
function drawPulses(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  alpha: number,
  time: number,
  phaseOffset: number,
) {
  if (alpha <= 0.01) return;
  const count = 4;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < count; i++) {
    const u = ((time * 0.55 + i / count + phaseOffset) % 1 + 1) % 1;
    const x = x1 + (x2 - x1) * u;
    const y = y1 + (y2 - y1) * u;
    const fade = Math.sin(u * Math.PI); // 两端淡入淡出
    const r = 3.2;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 3.2);
    grad.addColorStop(0, color);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = alpha * fade * 0.8;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r * 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * 光线上的偏振标记。
 * sAmp: S 分量振幅(0..1) → ⊙ 圆点；pAmp: P 分量振幅(0..1) → 垂直于光线的双向箭头。
 */
function drawPolarizationMarkers(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  sAmp: number,
  pAmp: number,
  time: number,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const perpX = -dy / len;
  const perpY = dx / len;

  for (let i = 1; i <= 3; i++) {
    const t = 0.22 + (i - 1) * 0.26;
    const x = x1 + dx * t;
    const y = y1 + dy * t;
    const breathe = 0.8 + 0.2 * Math.sin(time * 5 + i * 1.8);

    // S 偏振：⊙（指向屏幕外）
    if (sAmp > 0.045) {
      const r = 5.5 * Math.min(1, sAmp) * breathe;
      ctx.save();
      ctx.strokeStyle = COLOR_S;
      ctx.fillStyle = COLOR_S;
      ctx.shadowColor = COLOR_S;
      ctx.shadowBlur = 6;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1, r * 0.28), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // P 偏振：垂直于光线的双向箭头（在入射面内振动）
    if (pAmp > 0.045) {
      const half = 13 * Math.min(1, pAmp) * breathe;
      const hx = perpX * half;
      const hy = perpY * half;
      ctx.save();
      ctx.strokeStyle = COLOR_P;
      ctx.shadowColor = COLOR_P;
      ctx.shadowBlur = 6;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x - hx, y - hy);
      ctx.lineTo(x + hx, y + hy);
      ctx.stroke();
      // 两端箭头
      const head = 3.4;
      for (const sign of [1, -1]) {
        const tipX = x + hx * sign;
        const tipY = y + hy * sign;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX - sign * (perpX * head + (dx / len) * head), tipY - sign * (perpY * head + (dy / len) * head));
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX - sign * (perpX * head - (dx / len) * head), tipY - sign * (perpY * head - (dy / len) * head));
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}

function drawAngleWedge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  startAngle: number,
  endAngle: number,
  radius: number,
  color: string,
  label: string,
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.1;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, radius, startAngle, endAngle);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.75;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, endAngle);
  ctx.stroke();

  const mid = (startAngle + endAngle) / 2;
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = color;
  ctx.font = "11px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, cx + (radius + 17) * Math.cos(mid), cy + (radius + 17) * Math.sin(mid));
  ctx.restore();
}

// ----------------------------------------------------------------------------
// 主光路画布
// ----------------------------------------------------------------------------

const MAIN_W = 640;
const MAIN_H = 420;

function BrewsterMainCanvas({
  incidentAngle,
  n1,
  n2,
  fresnel,
  isAtBrewsterAngle,
  animate,
  onAngleChange,
}: {
  incidentAngle: number;
  n1: number;
  n2: number;
  fresnel: FresnelResult;
  isAtBrewsterAngle: boolean;
  animate: boolean;
  onAngleChange: (deg: number) => void;
}) {
  const draggingRef = useRef(false);

  const canvasRef = useDemoCanvas({
    width: MAIN_W,
    height: MAIN_H,
    paused: !animate,
    draw: ({ ctx, width, height, time }) => {
      const cx = width / 2;
      const cy = height / 2 + 10;
      const rayLen = 175;
      const thetaI = (incidentAngle * Math.PI) / 180;
      const { Rs, Rp, Ts, Tp, refractionAngleDeg, totalInternalReflection } = fresnel;
      const R = (Rs + Rp) / 2;
      const T = (Ts + Tp) / 2;

      // 背景
      ctx.fillStyle = "#070d1a";
      ctx.fillRect(0, 0, width, height);

      // 上方介质（n1）
      const airGrad = ctx.createLinearGradient(0, 0, 0, cy);
      airGrad.addColorStop(0, `rgba(59, 130, 246, ${0.02 + (n1 - 1) * 0.06})`);
      airGrad.addColorStop(1, `rgba(59, 130, 246, ${0.05 + (n1 - 1) * 0.08})`);
      ctx.fillStyle = airGrad;
      ctx.fillRect(0, 0, width, cy);

      // 下方介质（n2）：折射率越大越"稠密"
      const mediumGrad = ctx.createLinearGradient(0, cy, 0, height);
      mediumGrad.addColorStop(0, `rgba(94, 234, 212, ${0.1 + (n2 - 1) * 0.07})`);
      mediumGrad.addColorStop(1, `rgba(13, 148, 136, ${0.03 + (n2 - 1) * 0.03})`);
      ctx.fillStyle = mediumGrad;
      ctx.fillRect(0, cy, width, height - cy);

      // 界面高光扫动（缓慢移动的镜面反光）
      const sweepX = ((time * 40) % (width + 240)) - 120;
      const sweep = ctx.createLinearGradient(sweepX - 90, 0, sweepX + 90, 0);
      sweep.addColorStop(0, "rgba(255,255,255,0)");
      sweep.addColorStop(0.5, "rgba(255,255,255,0.18)");
      sweep.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sweep;
      ctx.fillRect(0, cy - 1.5, width, 3);

      // 界面线
      ctx.strokeStyle = "rgba(148, 163, 184, 0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(width, cy);
      ctx.stroke();

      // 介质标签
      ctx.fillStyle = "#7dd3fc";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(`n₁ = ${n1.toFixed(2)}`, 16, cy - 12);
      ctx.fillStyle = "#5eead4";
      ctx.fillText(`n₂ = ${n2.toFixed(2)}`, 16, cy + 22);

      // 法线
      ctx.save();
      ctx.strokeStyle = "rgba(100, 116, 139, 0.7)";
      ctx.lineWidth = 1;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.moveTo(cx, 24);
      ctx.lineTo(cx, height - 18);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = "#64748b";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("法线", cx + 6, 32);

      // 光线端点
      const ix = cx - rayLen * Math.sin(thetaI);
      const iy = cy - rayLen * Math.cos(thetaI);
      const rx = cx + rayLen * Math.sin(thetaI);
      const ry = cy - rayLen * Math.cos(thetaI);

      // 角度弧
      drawAngleWedge(ctx, cx, cy, -Math.PI / 2 - thetaI, -Math.PI / 2, 38, "#94a3b8", `θᵢ ${incidentAngle.toFixed(1)}°`);
      drawAngleWedge(ctx, cx, cy, -Math.PI / 2, -Math.PI / 2 + thetaI, 52, isAtBrewsterAngle ? "#fbbf24" : "#94a3b8", `θᵣ`);

      // 入射光（非偏振：S 与 P 等量）
      drawBeam(ctx, ix, iy, cx, cy, COLOR_INCIDENT, 3.4, 0.95);
      if (animate) drawPulses(ctx, ix, iy, cx, cy, COLOR_INCIDENT, 0.9, time, 0);
      drawPolarizationMarkers(ctx, ix, iy, cx, cy, 0.62, 0.62, time);

      // 反射光：亮度与分量来自菲涅耳方程
      const reflAlpha = 0.12 + 0.88 * Math.min(1, R * 1.6);
      drawBeam(ctx, cx, cy, rx, ry, isAtBrewsterAngle ? COLOR_S : COLOR_REFLECT, 2 + 2.6 * R, reflAlpha);
      if (animate) drawPulses(ctx, cx, cy, rx, ry, COLOR_REFLECT, reflAlpha * 0.9, time, 0.33);
      drawPolarizationMarkers(ctx, cx, cy, rx, ry, 0.62 * Math.sqrt(Rs), 0.62 * Math.sqrt(Rp), time);

      // 反射率标注
      ctx.fillStyle = isAtBrewsterAngle ? COLOR_S : COLOR_REFLECT;
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`R = ${(R * 100).toFixed(1)}%`, rx + 4, ry - 14);

      // 折射光 / 全反射
      if (!totalInternalReflection && Number.isFinite(refractionAngleDeg)) {
        const thetaT = (refractionAngleDeg * Math.PI) / 180;
        const tx = cx + rayLen * Math.sin(thetaT);
        const ty = cy + rayLen * Math.cos(thetaT);
        const refrAlpha = 0.15 + 0.85 * T;
        drawBeam(ctx, cx, cy, tx, ty, COLOR_REFRACT, 1.6 + 2 * T, refrAlpha);
        if (animate) drawPulses(ctx, cx, cy, tx, ty, COLOR_REFRACT, refrAlpha * 0.8, time, 0.33);
        drawPolarizationMarkers(ctx, cx, cy, tx, ty, 0.62 * Math.sqrt(Math.min(1, Ts)), 0.62 * Math.sqrt(Math.min(1, Tp)), time);

        drawAngleWedge(ctx, cx, cy, Math.PI / 2 - thetaT, Math.PI / 2, 44, "#5eead4", `θₜ ${refractionAngleDeg.toFixed(1)}°`);

        ctx.fillStyle = COLOR_REFRACT;
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`T = ${(T * 100).toFixed(1)}%`, tx - 4, ty + 18);

        // 布鲁斯特角时：反射↔折射成 90°
        const between = thetaI + thetaT;
        if (Math.abs(between - Math.PI / 2) < 0.04 && isAtBrewsterAngle) {
          ctx.save();
          ctx.strokeStyle = "#fde047";
          ctx.lineWidth = 1.6;
          ctx.shadowColor = "#fde047";
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(cx, cy, 72, -Math.PI / 2 + thetaI, Math.PI / 2 - thetaT);
          ctx.stroke();
          // 直角符号
          const midA = (-Math.PI / 2 + thetaI + Math.PI / 2 - thetaT) / 2;
          ctx.fillStyle = "#fde047";
          ctx.font = "bold 12px sans-serif";
          ctx.fillText("90°", cx + 88 * Math.cos(midA), cy + 88 * Math.sin(midA));
          ctx.restore();
        }
      } else {
        // 全反射：绘制沿界面的倏逝波（指数衰减的波动）
        ctx.save();
        ctx.strokeStyle = "rgba(94, 234, 212, 0.75)";
        ctx.lineWidth = 1.6;
        ctx.shadowColor = "#5eead4";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        for (let s = 0; s <= 150; s += 2) {
          const decay = Math.exp(-s / 55);
          const y = cy + 9 + 8 * decay * Math.sin(s * 0.18 - time * 5);
          if (s === 0) ctx.moveTo(cx + s, y);
          else ctx.lineTo(cx + s, y);
        }
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = "#5eead4";
        ctx.font = "11px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("倏逝波（全反射）", cx + 26, cy + 38);
      }

      // 入射点闪光
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const flash = ctx.createRadialGradient(cx, cy, 0, cx, cy, 16);
      flash.addColorStop(0, "rgba(255,255,255,0.5)");
      flash.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = flash;
      ctx.beginPath();
      ctx.arc(cx, cy, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 标签
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = COLOR_INCIDENT;
      ctx.fillText("入射光", ix, iy - 10);
      ctx.fillStyle = COLOR_REFLECT;
      ctx.fillText("反射光", rx, ry - 28);

      // 拖动提示
      ctx.fillStyle = "rgba(148, 163, 184, 0.55)";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("⟲ 拖动光线可改变入射角", width - 14, height - 12);
    },
  });

  const updateFromPointer = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { x, y } = pointerToCanvas(canvas, e, MAIN_W);
      const cx = MAIN_W / 2;
      const cy = MAIN_H / 2 + 10;
      const deg = (Math.atan2(Math.abs(x - cx), Math.max(6, cy - y)) * 180) / Math.PI;
      onAngleChange(Math.round(Math.max(0, Math.min(89, deg)) * 2) / 2);
    },
    [canvasRef, onAngleChange],
  );

  return (
    <canvas
      ref={canvasRef}
      className="mx-auto block rounded-lg cursor-grab active:cursor-grabbing select-none"
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        draggingRef.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        updateFromPointer(e);
      }}
      onPointerMove={(e) => {
        if (draggingRef.current) updateFromPointer(e);
      }}
      onPointerUp={() => {
        draggingRef.current = false;
      }}
    />
  );
}

// ----------------------------------------------------------------------------
// 菲涅耳反射率曲线
// ----------------------------------------------------------------------------

const CHART_W = 400;
const CHART_H = 250;

function FresnelChartCanvas({
  n1,
  n2,
  incidentAngle,
  brewsterAngle,
  criticalAngle,
  onAngleChange,
}: {
  n1: number;
  n2: number;
  incidentAngle: number;
  brewsterAngle: number;
  criticalAngle: number | null;
  onAngleChange: (deg: number) => void;
}) {
  const draggingRef = useRef(false);
  const curve = useMemo(() => sampleReflectanceCurve(n1, n2, 181), [n1, n2]);

  const canvasRef = useDemoCanvas({
    width: CHART_W,
    height: CHART_H,
    draw: ({ ctx, width, height }) => {
      const m = { l: 42, r: 14, t: 16, b: 30 };
      const plotW = width - m.l - m.r;
      const plotH = height - m.t - m.b;
      const xOf = (deg: number) => m.l + (deg / 90) * plotW;
      const yOf = (v: number) => m.t + (1 - v) * plotH;

      ctx.fillStyle = "#070d1a";
      ctx.fillRect(0, 0, width, height);

      // 网格
      ctx.strokeStyle = "rgba(100, 150, 255, 0.09)";
      ctx.lineWidth = 1;
      ctx.font = "10px sans-serif";
      ctx.textBaseline = "middle";
      for (let v = 0; v <= 1; v += 0.25) {
        ctx.beginPath();
        ctx.moveTo(m.l, yOf(v));
        ctx.lineTo(width - m.r, yOf(v));
        ctx.stroke();
        ctx.fillStyle = "#64748b";
        ctx.textAlign = "right";
        ctx.fillText(`${Math.round(v * 100)}%`, m.l - 6, yOf(v));
      }
      for (let deg = 0; deg <= 90; deg += 15) {
        ctx.beginPath();
        ctx.moveTo(xOf(deg), m.t);
        ctx.lineTo(xOf(deg), height - m.b);
        ctx.stroke();
        ctx.fillStyle = "#64748b";
        ctx.textAlign = "center";
        ctx.fillText(`${deg}°`, xOf(deg), height - m.b + 12);
      }

      // 全反射区
      if (criticalAngle !== null) {
        ctx.fillStyle = "rgba(248, 113, 113, 0.08)";
        ctx.fillRect(xOf(criticalAngle), m.t, xOf(90) - xOf(criticalAngle), plotH);
        ctx.strokeStyle = "rgba(248, 113, 113, 0.5)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(xOf(criticalAngle), m.t);
        ctx.lineTo(xOf(criticalAngle), height - m.b);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#f87171";
        ctx.textAlign = "left";
        ctx.fillText(`全反射 θc=${criticalAngle.toFixed(1)}°`, xOf(criticalAngle) + 4, m.t + 8);
      }

      // 曲线绘制函数
      const plotCurve = (key: "Rs" | "Rp", color: string) => {
        ctx.save();
        // 填充
        ctx.beginPath();
        ctx.moveTo(xOf(curve[0].angleDeg), yOf(curve[0][key]));
        for (const p of curve) ctx.lineTo(xOf(p.angleDeg), yOf(p[key]));
        ctx.lineTo(xOf(curve[curve.length - 1].angleDeg), yOf(0));
        ctx.lineTo(xOf(curve[0].angleDeg), yOf(0));
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.08;
        ctx.fill();
        // 描线
        ctx.globalAlpha = 1;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.shadowColor = color;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.moveTo(xOf(curve[0].angleDeg), yOf(curve[0][key]));
        for (const p of curve) ctx.lineTo(xOf(p.angleDeg), yOf(p[key]));
        ctx.stroke();
        ctx.restore();
      };
      plotCurve("Rs", COLOR_S);
      plotCurve("Rp", COLOR_P);

      // 布鲁斯特角竖线
      ctx.save();
      ctx.strokeStyle = "#fde047";
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(xOf(brewsterAngle), m.t);
      ctx.lineTo(xOf(brewsterAngle), height - m.b);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = "#fde047";
      ctx.textAlign = "center";
      ctx.fillText(`θB=${brewsterAngle.toFixed(1)}°`, xOf(brewsterAngle), height - 6);

      // 当前角度标记
      const f = fresnelCoefficients(n1, n2, incidentAngle);
      const cxNow = xOf(incidentAngle);
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cxNow, m.t);
      ctx.lineTo(cxNow, height - m.b);
      ctx.stroke();
      for (const [val, color] of [
        [f.Rs, COLOR_S],
        [f.Rp, COLOR_P],
      ] as const) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(cxNow, yOf(val), 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 图例
      ctx.textAlign = "left";
      ctx.font = "11px sans-serif";
      ctx.fillStyle = COLOR_S;
      ctx.fillText(`Rs ${(f.Rs * 100).toFixed(1)}%`, m.l + 8, m.t + 10);
      ctx.fillStyle = COLOR_P;
      ctx.fillText(`Rp ${(f.Rp * 100).toFixed(1)}%`, m.l + 8, m.t + 24);
    },
  });

  const updateFromPointer = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { x } = pointerToCanvas(canvas, e, CHART_W);
      const deg = ((x - 42) / (CHART_W - 42 - 14)) * 90;
      onAngleChange(Math.round(Math.max(0, Math.min(89, deg)) * 2) / 2);
    },
    [canvasRef, onAngleChange],
  );

  return (
    <canvas
      ref={canvasRef}
      className="mx-auto block rounded-lg cursor-crosshair select-none"
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        draggingRef.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        updateFromPointer(e);
      }}
      onPointerMove={(e) => {
        if (draggingRef.current) updateFromPointer(e);
      }}
      onPointerUp={() => {
        draggingRef.current = false;
      }}
    />
  );
}

// ----------------------------------------------------------------------------
// 主组件
// ----------------------------------------------------------------------------

export function BrewsterAngleDemo() {
  const { theme } = useTheme();
  const [incidentAngle, setIncidentAngle] = useState(30);
  const [n1, setN1] = useState(1.0);
  const [n2, setN2] = useState(1.5);
  const [animate, setAnimate] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<number>(0);

  const brewsterAngle = useMemo(() => brewsterAngleDeg(n1, n2), [n1, n2]);
  const criticalAngle = useMemo(() => criticalAngleDeg(n1, n2), [n1, n2]);
  const fresnel = useMemo(() => fresnelCoefficients(n1, n2, incidentAngle), [n1, n2, incidentAngle]);
  const dop = useMemo(() => reflectedDegreeOfPolarization(fresnel), [fresnel]);
  const reflectance = useMemo(() => unpolarizedReflectance(fresnel), [fresnel]);

  const isAtBrewsterAngle = Math.abs(incidentAngle - brewsterAngle) < 1.5;

  const handlePresetChange = useCallback((value: string | number) => {
    const preset = MATERIAL_PRESETS[Number(value)];
    if (!preset) return;
    setN1(preset.n1);
    setN2(preset.n2);
    setSelectedPreset(Number(value));
    setIncidentAngle(Math.round(brewsterAngleDeg(preset.n1, preset.n2)));
  }, []);

  const handleSetToBrewsterAngle = useCallback(() => {
    setIncidentAngle(Math.round(brewsterAngle * 2) / 2);
  }, [brewsterAngle]);

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* 主可视化区：光路 + 反射率曲线 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
        <DemoStage
          className="xl:col-span-2"
          title="光路演示"
          legend={[
            { color: COLOR_INCIDENT, label: "入射光", shape: "line" },
            { color: COLOR_REFLECT, label: "反射光", shape: "line" },
            { color: COLOR_REFRACT, label: "折射光", shape: "line" },
            { color: COLOR_S, label: "S偏振 ⊙" },
            { color: COLOR_P, label: "P偏振 ↕" },
          ]}
          actions={
            <button
              onClick={handleSetToBrewsterAngle}
              className="px-3 py-1 text-xs rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors whitespace-nowrap"
            >
              <Target className="w-3 h-3 inline mr-1" />
              设为布鲁斯特角
            </button>
          }
        >
          <BrewsterMainCanvas
            incidentAngle={incidentAngle}
            n1={n1}
            n2={n2}
            fresnel={fresnel}
            isAtBrewsterAngle={isAtBrewsterAngle}
            animate={animate}
            onAngleChange={setIncidentAngle}
          />
        </DemoStage>

        <div className="flex flex-col gap-4">
          <DemoStage title="菲涅耳反射率曲线" subtitle="点击曲线设置角度">
            <FresnelChartCanvas
              n1={n1}
              n2={n2}
              incidentAngle={incidentAngle}
              brewsterAngle={brewsterAngle}
              criticalAngle={criticalAngle}
              onAngleChange={setIncidentAngle}
            />
          </DemoStage>

          <ControlPanel title="实时物理量">
            <div
              className={`p-3 rounded-lg border ${
                isAtBrewsterAngle
                  ? "bg-amber-500/20 border-amber-500/30"
                  : theme === "dark"
                    ? "bg-slate-800/50 border-slate-700/50"
                    : "bg-gray-100 border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {isAtBrewsterAngle ? (
                  <Sparkles className="w-4 h-4 text-amber-400" />
                ) : (
                  <Lightbulb className="w-4 h-4 text-cyan-400" />
                )}
                <span
                  className={`text-sm font-semibold ${isAtBrewsterAngle ? "text-amber-400" : "text-cyan-400"}`}
                >
                  {isAtBrewsterAngle
                    ? "布鲁斯特角：反射光为纯S偏振"
                    : fresnel.totalInternalReflection
                      ? "全反射：光无法进入介质2"
                      : "部分偏振反射"}
                </span>
              </div>
            </div>
            <AnimatedValue label="反射率 R" value={reflectance * 100} unit="%" decimals={1} color="orange" showBar min={0} max={100} />
            <AnimatedValue label="反射光偏振度" value={dop * 100} unit="%" decimals={1} color={isAtBrewsterAngle ? "green" : "cyan"} showBar min={0} max={100} />
            <ValueDisplay label="Rs（S分量反射率）" value={`${(fresnel.Rs * 100).toFixed(1)}%`} color="green" />
            <ValueDisplay label="Rp（P分量反射率）" value={`${(fresnel.Rp * 100).toFixed(1)}%`} color="yellow" />
            <ValueDisplay
              label="布鲁斯特角 θB"
              value={`${brewsterAngle.toFixed(1)}°`}
              color={isAtBrewsterAngle ? "orange" : "cyan"}
            />
            {criticalAngle !== null && (
              <ValueDisplay label="临界角 θc" value={`${criticalAngle.toFixed(1)}°`} color="red" />
            )}
          </ControlPanel>
        </div>
      </div>

      {/* 布鲁斯特角提示横幅 */}
      <AnimatePresence>
        {isAtBrewsterAngle && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-amber-400 mb-1">布鲁斯特角特性</h4>
                <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  反射光与折射光互相垂直（90°），此时菲涅耳方程给出 Rp = {(fresnel.Rp * 100).toFixed(2)}% ——
                  <span className="text-yellow-400 font-semibold">P偏振分量完全消失</span>，
                  反射光成为<span className="text-green-400 font-semibold">完全线偏振光（只剩S分量 ⊙）</span>。
                  注意观察上图反射光线上的振动标记。
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 控制区 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ControlPanel title="入射角控制">
          <SliderControl
            label="入射角 θᵢ"
            value={incidentAngle}
            min={0}
            max={89}
            step={0.5}
            unit="°"
            onChange={setIncidentAngle}
            color={isAtBrewsterAngle ? "orange" : "cyan"}
            formatValue={(v) => `${v.toFixed(1)}°`}
          />
          <div className="flex gap-2 mt-3">
            {[20, 45, 70].map((deg) => (
              <button
                key={deg}
                onClick={() => setIncidentAngle(deg)}
                className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-colors ${
                  theme === "dark"
                    ? "bg-slate-700/50 text-gray-400 border-slate-600/50 hover:border-cyan-400/30"
                    : "bg-gray-100/50 text-gray-600 border-gray-300/50 hover:border-cyan-400/50"
                }`}
              >
                {deg}°
              </button>
            ))}
            <button
              onClick={handleSetToBrewsterAngle}
              className="flex-1 px-3 py-2 text-xs rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
            >
              θB
            </button>
          </div>
        </ControlPanel>

        <ControlPanel title="介质组合">
          <PresetButtons
            options={MATERIAL_PRESETS.map((p, i) => ({ value: i, label: p.label }))}
            value={selectedPreset}
            onChange={handlePresetChange}
            columns={2}
          />
          <div className="mt-3 space-y-1">
            <ValueDisplay label="入射介质 n₁" value={n1.toFixed(2)} />
            <ValueDisplay label="折射介质 n₂" value={n2.toFixed(2)} />
          </div>
        </ControlPanel>

        <ControlPanel title="显示与公式">
          <Toggle label="光束流动动画" checked={animate} onChange={setAnimate} />
          <Formula highlight>
            {`$\\tan\\theta_B = \\frac{n_2}{n_1} = \\frac{${n2.toFixed(2)}}{${n1.toFixed(2)}}$`}
          </Formula>
          <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"} space-y-1`}>
            <p>
              • <span className="text-green-400">⊙ 绿色圆点</span>: S偏振（垂直入射面，指向屏幕外）
            </p>
            <p>
              • <span className="text-yellow-400">↕ 黄色箭头</span>: P偏振（在入射面内振动）
            </p>
          </div>
        </ControlPanel>
      </div>

      {/* 原理与应用 */}
      <DemoSection title="原理与应用" icon={<BookOpen className="w-3.5 h-3.5" />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoCard title="📷 摄影偏振镜" color="cyan">
            <p className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
              摄影师利用布鲁斯特角原理，通过偏振镜消除水面、玻璃等表面的反射光，
              使照片更加清晰。拍摄天空时也能增强蓝天白云的对比度。
            </p>
          </InfoCard>
          <InfoCard title="🔬 激光器设计" color="purple">
            <p className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
              许多激光器使用"布鲁斯特窗"——以布鲁斯特角切割的窗口片。
              P偏振光几乎无损耗地通过（Rp≈0），而S偏振光部分被反射，从而产生线偏振激光输出。
            </p>
          </InfoCard>
          <InfoCard title="👓 偏光太阳镜" color="orange">
            <p className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
              水面、路面等水平表面的反射光主要是水平偏振的（S分量占优）。
              偏光太阳镜只允许垂直偏振光通过，有效减少眩光，特别适合驾驶和户外活动。
            </p>
          </InfoCard>
        </div>
      </DemoSection>

      {/* 思考题 */}
      <DemoSection title="思考题" icon={<FlaskConical className="w-3.5 h-3.5" />}>
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
          <div className={`p-3 ${theme === "dark" ? "bg-slate-800/50" : "bg-gray-100"} rounded-lg`}>
            <span className="text-cyan-400 font-semibold">Q1:</span> 切换到"玻璃→空气"预设，
            布鲁斯特角变大还是变小？为什么还会出现全反射区？
          </div>
          <div className={`p-3 ${theme === "dark" ? "bg-slate-800/50" : "bg-gray-100"} rounded-lg`}>
            <span className="text-cyan-400 font-semibold">Q2:</span> 布鲁斯特角时，
            折射光是完全偏振的吗？观察折射光上的两种振动标记。
          </div>
          <div className={`p-3 ${theme === "dark" ? "bg-slate-800/50" : "bg-gray-100"} rounded-lg`}>
            <span className="text-cyan-400 font-semibold">Q3:</span> 从反射率曲线看，
            为什么黄昏时水面的反光比正午更刺眼？
          </div>
        </div>
      </DemoSection>
    </div>
  );
}

export default BrewsterAngleDemo;
