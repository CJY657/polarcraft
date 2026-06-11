/**
 * Saccharimeter (量糖计) Demo - Unit 1
 * 演示糖溶液的旋光色散现象
 *
 * 物理模型（真实计算，非装饰性渐变）：
 * - 管内每个位置 x 处，波长 λ 的偏振面已旋转 φ_λ(x) = [α]_λ·c·x
 * - 从侧面观察时，瑞利散射强度 I_λ(x) ∝ cos²(θ₀ + φ_λ(x))
 *   （偶极子辐射：偏振方向指向观察者时散射为零）
 * - 对整个可见光谱求和 → 管内呈现随位置旋转的"理发店彩柱"色带，
 *   旋转起偏器时整条色带会平移 —— 与真实实验完全一致
 * - 出射端经过检偏器：每个波长按马吕斯定律 I_λ = cos²(θ_exit,λ − θ_a) 透过，
 *   合成出观察到的颜色 —— 这正是量糖计测浓度的原理
 */

import { useState, useMemo, useCallback } from "react";
import { BookOpen } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  SliderControl,
  ControlPanel,
  ValueDisplay,
  Formula,
  InfoCard,
  Toggle,
  ListItem,
} from "../DemoControls";
import { DemoStage, DemoSection } from "../components/DemoLayout";
import { useDemoCanvas } from "../hooks/useDemoCanvas";
import {
  calculateAllRotations,
  getSpecificRotation,
} from "@/lib/physics/Saccharimetry";

const DEG = Math.PI / 180;

/** 波长 → [r,g,b] (0..1)，含光谱边缘强度修正 */
function wavelengthToComponents(wl: number): [number, number, number] {
  let r = 0,
    g = 0,
    b = 0;
  if (wl >= 380 && wl < 440) {
    r = -(wl - 440) / 60;
    b = 1;
  } else if (wl >= 440 && wl < 490) {
    g = (wl - 440) / 50;
    b = 1;
  } else if (wl >= 490 && wl < 510) {
    g = 1;
    b = -(wl - 510) / 20;
  } else if (wl >= 510 && wl < 580) {
    r = (wl - 510) / 70;
    g = 1;
  } else if (wl >= 580 && wl < 645) {
    r = 1;
    g = -(wl - 645) / 65;
  } else if (wl >= 645 && wl <= 700) {
    r = 1;
  }
  let alpha = 1;
  if (wl >= 380 && wl < 420) alpha = 0.3 + (0.7 * (wl - 380)) / 40;
  else if (wl >= 645 && wl <= 700) alpha = 0.3 + (0.7 * (700 - wl)) / 55;
  return [r * alpha, g * alpha, b * alpha];
}

/** 管内颜色采样使用的光谱（足够密以获得平滑混色） */
const TUBE_SAMPLES: Array<{ wl: number; rgb: [number, number, number] }> = [];
for (let wl = 400; wl <= 700; wl += 15) {
  TUBE_SAMPLES.push({ wl, rgb: wavelengthToComponents(wl) });
}

/** 仪表盘/表格使用的代表波长 */
const DIAL_WAVELENGTHS = [700, 650, 600, 550, 500, 450, 400];

// ----------------------------------------------------------------------------
// 主画布
// ----------------------------------------------------------------------------

const SACC_W = 880;
const SACC_H = 470;

function SaccharimeterCanvas({
  polarizerAngle,
  analyzerAngle,
  concentration,
  pathLength,
  showCharts,
  animate,
}: {
  polarizerAngle: number;
  analyzerAngle: number;
  concentration: number;
  pathLength: number;
  showCharts: boolean;
  animate: boolean;
}) {
  const canvasRef = useDemoCanvas({
    width: SACC_W,
    height: SACC_H,
    paused: !animate,
    draw: ({ ctx, width, height, time }) => {
      const cy = height / 2 + 26;
      const layout = {
        sourceX: 58,
        polarizerX: 148,
        tubeStart: 218,
        tubeEnd: 560,
        tubeR: 50,
        analyzerX: 660,
        screenX: 790,
      };

      // 各波长旋转速率（度/管全长）
      const rotationOf = (wl: number, frac: number) =>
        getSpecificRotation(wl) * concentration * pathLength * frac;

      // ---- 背景 ----
      ctx.fillStyle = "#070d1a";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(100, 150, 255, 0.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // ---- 1. 白光源 ----
      const glow = 0.55 + 0.25 * Math.sin(time * 3);
      const lightGrad = ctx.createRadialGradient(layout.sourceX, cy, 0, layout.sourceX, cy, 52);
      lightGrad.addColorStop(0, `rgba(255, 255, 224, ${glow})`);
      lightGrad.addColorStop(0.4, "rgba(255, 250, 160, 0.28)");
      lightGrad.addColorStop(1, "rgba(255, 245, 120, 0)");
      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.arc(layout.sourceX, cy, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.arc(layout.sourceX, cy, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#92710a";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("☀", layout.sourceX, cy + 1);
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "12px sans-serif";
      ctx.fillText("白光源", layout.sourceX, cy + 84);

      // ---- 2. 非偏振光段（多方向振动刻线随时间流动）----
      ctx.strokeStyle = "rgba(255, 252, 224, 0.6)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(layout.sourceX + 18, cy);
      ctx.lineTo(layout.polarizerX - 12, cy);
      ctx.stroke();
      const seg1 = layout.polarizerX - 12 - (layout.sourceX + 18);
      for (let i = 0; i < 5; i++) {
        const u = (((time * 0.5 + i / 5) % 1) + 1) % 1;
        const x = layout.sourceX + 18 + u * seg1;
        const fade = Math.sin(u * Math.PI);
        for (let a = 0; a < Math.PI; a += Math.PI / 4) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.22 * fade})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(x - 8 * Math.sin(a), cy - 8 * Math.cos(a));
          ctx.lineTo(x + 8 * Math.sin(a), cy + 8 * Math.cos(a));
          ctx.stroke();
        }
      }

      // ---- 偏振片绘制函数（倾斜圆盘 + 透振轴）----
      const drawPolarizerDisc = (
        x: number,
        angleDeg: number,
        color: string,
        label: string,
        sub: string,
      ) => {
        const ry = 56;
        const rx = 13;
        ctx.save();
        // 圆盘
        const discGrad = ctx.createLinearGradient(x - rx, cy - ry, x + rx, cy + ry);
        discGrad.addColorStop(0, `${color}30`);
        discGrad.addColorStop(0.5, `${color}18`);
        discGrad.addColorStop(1, `${color}30`);
        ctx.fillStyle = discGrad;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(x, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // 透振轴（在迎面视角下的方向投影）
        const rad = angleDeg * DEG;
        const ax = Math.sin(rad) * rx * 0.9;
        const ay = -Math.cos(rad) * ry * 0.9;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.6;
        ctx.shadowColor = color;
        ctx.shadowBlur = 7;
        ctx.beginPath();
        ctx.moveTo(x - ax, cy - ay);
        ctx.lineTo(x + ax, cy + ay);
        ctx.stroke();
        ctx.shadowBlur = 0;
        for (const s of [-1, 1]) {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x + ax * s, cy + ay * s, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        ctx.fillStyle = color;
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(label, x, cy + 84);
        ctx.font = "11px monospace";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText(sub, x, cy + 100);
      };

      drawPolarizerDisc(layout.polarizerX, polarizerAngle, "#22d3ee", "起偏器", `θ₀ = ${polarizerAngle}°`);

      // ---- 3. 线偏振光段 ----
      ctx.strokeStyle = "rgba(34, 211, 238, 0.8)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(layout.polarizerX + 13, cy);
      ctx.lineTo(layout.tubeStart - 4, cy);
      ctx.stroke();
      const rad0 = polarizerAngle * DEG;
      const seg2 = layout.tubeStart - 4 - (layout.polarizerX + 13);
      for (let i = 0; i < 3; i++) {
        const u = (((time * 0.5 + i / 3) % 1) + 1) % 1;
        const x = layout.polarizerX + 13 + u * seg2;
        const fade = Math.sin(u * Math.PI);
        const len = 11 * fade;
        ctx.strokeStyle = `rgba(34, 211, 238, ${0.55 * fade})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x - len * Math.sin(rad0), cy + len * Math.cos(rad0) * -1);
        ctx.lineTo(x + len * Math.sin(rad0), cy - len * Math.cos(rad0) * -1);
        ctx.stroke();
      }

      // ---- 4. 量糖计管：物理计算的侧视散射颜色（理发店彩柱）----
      const tubeW = layout.tubeEnd - layout.tubeStart;
      const colStep = 2;
      for (let px = 0; px < tubeW; px += colStep) {
        const frac = px / tubeW;
        let r = 0,
          g = 0,
          b = 0;
        for (const s of TUBE_SAMPLES) {
          // 该位置该波长的偏振面角度（相对竖直方向）
          const theta = (polarizerAngle + rotationOf(s.wl, frac)) * DEG;
          // 侧视瑞利散射：I ∝ cos²θ
          const intensity = Math.cos(theta) ** 2;
          r += s.rgb[0] * intensity;
          g += s.rgb[1] * intensity;
          b += s.rgb[2] * intensity;
        }
        const norm = 255 / (TUBE_SAMPLES.length * 0.55);
        // 轻微流动的明暗涟漪，提示光在传播
        const ripple = animate ? 0.93 + 0.07 * Math.sin(frac * 26 - time * 3.4) : 1;
        const R = Math.min(255, r * norm * ripple);
        const G = Math.min(255, g * norm * ripple);
        const B = Math.min(255, b * norm * ripple);
        // 圆柱明暗（上下边缘暗，中心亮）
        const grad = ctx.createLinearGradient(0, cy - layout.tubeR, 0, cy + layout.tubeR);
        grad.addColorStop(0, `rgba(${R * 0.45}, ${G * 0.45}, ${B * 0.45}, 0.95)`);
        grad.addColorStop(0.28, `rgba(${R}, ${G}, ${B}, 0.95)`);
        grad.addColorStop(0.62, `rgba(${R}, ${G}, ${B}, 0.95)`);
        grad.addColorStop(1, `rgba(${R * 0.4}, ${G * 0.4}, ${B * 0.4}, 0.95)`);
        ctx.fillStyle = grad;
        ctx.fillRect(layout.tubeStart + px, cy - layout.tubeR, colStep + 0.5, layout.tubeR * 2);
      }

      // 玻璃高光与轮廓
      const gloss = ctx.createLinearGradient(0, cy - layout.tubeR, 0, cy + layout.tubeR);
      gloss.addColorStop(0, "rgba(255,255,255,0.22)");
      gloss.addColorStop(0.18, "rgba(255,255,255,0.06)");
      gloss.addColorStop(0.5, "rgba(255,255,255,0)");
      gloss.addColorStop(0.85, "rgba(255,255,255,0.04)");
      gloss.addColorStop(1, "rgba(255,255,255,0.14)");
      ctx.fillStyle = gloss;
      ctx.fillRect(layout.tubeStart, cy - layout.tubeR, tubeW, layout.tubeR * 2);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(layout.tubeStart, cy - layout.tubeR);
      ctx.lineTo(layout.tubeEnd, cy - layout.tubeR);
      ctx.moveTo(layout.tubeStart, cy + layout.tubeR);
      ctx.lineTo(layout.tubeEnd, cy + layout.tubeR);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(layout.tubeStart, cy, 9, layout.tubeR, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(layout.tubeEnd, cy, 9, layout.tubeR, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 管标签
      const tubeCx = (layout.tubeStart + layout.tubeEnd) / 2;
      ctx.fillStyle = "#fbbf24";
      ctx.font = "13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("糖溶液管（侧面观察到的散射光）", tubeCx, cy + layout.tubeR + 26);
      ctx.font = "11px monospace";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(
        `L = ${pathLength} dm   c = ${concentration.toFixed(2)} g/mL`,
        tubeCx,
        cy + layout.tubeR + 43,
      );

      // ---- 5. 出射偏振方向仪表盘 ----
      const exitAngles = DIAL_WAVELENGTHS.map((wl) => ({
        wl,
        rgb: wavelengthToComponents(wl),
        angle: polarizerAngle + rotationOf(wl, 1),
      }));

      if (showCharts) {
        const dialX = layout.tubeEnd + 2;
        const dialY = 78;
        const dialR = 44;
        ctx.save();
        ctx.fillStyle = "rgba(7, 13, 26, 0.85)";
        ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(dialX, dialY, dialR + 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // 刻度
        for (let a = 0; a < 180; a += 30) {
          const r1 = dialR + 2;
          const r2 = dialR + 6;
          const sx = Math.sin(a * DEG);
          const sy = -Math.cos(a * DEG);
          ctx.strokeStyle = "rgba(148, 163, 184, 0.45)";
          ctx.beginPath();
          ctx.moveTo(dialX + sx * r1, dialY + sy * r1);
          ctx.lineTo(dialX + sx * r2, dialY + sy * r2);
          ctx.moveTo(dialX - sx * r1, dialY - sy * r1);
          ctx.lineTo(dialX - sx * r2, dialY - sy * r2);
          ctx.stroke();
        }
        // 各波长的出射偏振方向指针
        for (const e of exitAngles) {
          const sx = Math.sin(e.angle * DEG);
          const sy = -Math.cos(e.angle * DEG);
          const color = `rgb(${Math.round(e.rgb[0] * 255)}, ${Math.round(e.rgb[1] * 255)}, ${Math.round(e.rgb[2] * 255)})`;
          ctx.strokeStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 4;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(dialX - sx * dialR, dialY - sy * dialR);
          ctx.lineTo(dialX + sx * dialR, dialY + sy * dialR);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("出射偏振方向", dialX, dialY + dialR + 22);
        ctx.fillText("（旋光色散：每个波长转角不同）", dialX, dialY + dialR + 35);
        ctx.restore();
      }

      // ---- 6. 出射段光束 + 检偏器 ----
      ctx.strokeStyle = "rgba(226, 232, 240, 0.55)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(layout.tubeEnd + 9, cy);
      ctx.lineTo(layout.analyzerX - 14, cy);
      ctx.stroke();

      drawPolarizerDisc(layout.analyzerX, analyzerAngle, "#c084fc", "检偏器", `θₐ = ${analyzerAngle}°`);

      // ---- 7. 马吕斯定律：每个波长的透过率 → 观察颜色 ----
      let outR = 0,
        outG = 0,
        outB = 0,
        outSum = 0;
      for (const s of TUBE_SAMPLES) {
        const exitAngle = polarizerAngle + rotationOf(s.wl, 1);
        const trans = Math.cos((exitAngle - analyzerAngle) * DEG) ** 2;
        outR += s.rgb[0] * trans;
        outG += s.rgb[1] * trans;
        outB += s.rgb[2] * trans;
        outSum += trans;
      }
      const brightness = outSum / TUBE_SAMPLES.length; // 0..1
      const outNorm = 255 / (TUBE_SAMPLES.length * 0.5);
      const oR = Math.min(255, outR * outNorm);
      const oG = Math.min(255, outG * outNorm);
      const oB = Math.min(255, outB * outNorm);
      const outColor = `rgb(${Math.round(oR)}, ${Math.round(oG)}, ${Math.round(oB)})`;

      // 透射光束
      const beamAlpha = 0.15 + 0.8 * brightness;
      ctx.save();
      ctx.strokeStyle = outColor;
      ctx.globalAlpha = beamAlpha;
      ctx.lineWidth = 4 + 4 * brightness;
      ctx.shadowColor = outColor;
      ctx.shadowBlur = 14;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(layout.analyzerX + 14, cy);
      ctx.lineTo(layout.screenX - 36, cy);
      ctx.stroke();
      ctx.restore();

      // 观察屏（最终颜色色斑）
      ctx.save();
      const spotR = 30;
      ctx.strokeStyle = "rgba(148, 163, 184, 0.5)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(layout.screenX, cy, spotR + 7, 0, Math.PI * 2);
      ctx.stroke();
      const spotGrad = ctx.createRadialGradient(layout.screenX, cy, 0, layout.screenX, cy, spotR);
      spotGrad.addColorStop(0, outColor);
      spotGrad.addColorStop(
        1,
        `rgba(${Math.round(oR * 0.4)}, ${Math.round(oG * 0.4)}, ${Math.round(oB * 0.4)}, ${Math.max(0.12, brightness)})`,
      );
      ctx.globalAlpha = Math.max(0.14, brightness);
      ctx.shadowColor = outColor;
      ctx.shadowBlur = 22 * brightness;
      ctx.fillStyle = spotGrad;
      ctx.beginPath();
      ctx.arc(layout.screenX, cy, spotR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("观察到的颜色", layout.screenX, cy + 84);
      ctx.font = "11px monospace";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(`亮度 ${(brightness * 100).toFixed(0)}%`, layout.screenX, cy + 100);

      // ---- 8. 各波长透过率条形图 ----
      if (showCharts) {
        const chartX = layout.analyzerX + 36;
        const chartY = 36;
        const barW = 14;
        const barGap = 7;
        const chartH = 72;
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("各波长透过率（马吕斯定律）", chartX - 4, chartY - 10);
        DIAL_WAVELENGTHS.forEach((wl, i) => {
          const rgb = wavelengthToComponents(wl);
          const exitAngle = polarizerAngle + rotationOf(wl, 1);
          const trans = Math.cos((exitAngle - analyzerAngle) * DEG) ** 2;
          const color = `rgb(${Math.round(rgb[0] * 255)}, ${Math.round(rgb[1] * 255)}, ${Math.round(rgb[2] * 255)})`;
          const x = chartX + i * (barW + barGap);
          // 底槽
          ctx.fillStyle = "rgba(148, 163, 184, 0.14)";
          ctx.fillRect(x, chartY, barW, chartH);
          // 数值条
          ctx.save();
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 5;
          ctx.fillRect(x, chartY + chartH * (1 - trans), barW, chartH * trans);
          ctx.restore();
          ctx.fillStyle = "#94a3b8";
          ctx.font = "8.5px monospace";
          ctx.textAlign = "center";
          ctx.fillText(`${wl}`, x + barW / 2, chartY + chartH + 11);
        });
      }

      // ---- 9. 底部说明 ----
      ctx.fillStyle = "#64748b";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        "侧视亮度 ∝ cos²θ（偏振面指向观察者时散射为零）｜光的传播方向始终不变，旋转的是偏振面",
        width / 2,
        height - 12,
      );
    },
  });

  return <canvas ref={canvasRef} className="mx-auto block rounded-lg" />;
}

/**
 * 旋转角度表格组件
 */
function RotationTable({
  concentration,
  pathLength,
}: {
  concentration: number;
  pathLength: number;
}) {
  const { theme } = useTheme();
  const rotations = useMemo(
    () => calculateAllRotations(concentration, pathLength),
    [concentration, pathLength],
  );

  return (
    <div className="space-y-1">
      <div
        className={`grid grid-cols-3 gap-2 text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-600"} pb-1 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-300"}`}
      >
        <span className="text-center">波长</span>
        <span className="text-center">颜色</span>
        <span className="text-center">旋转角</span>
      </div>
      {rotations.map((data) => (
        <div key={data.wavelength} className="grid grid-cols-3 gap-2 text-sm items-center py-1">
          <span
            className={`text-center font-mono ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
          >
            {data.wavelength} nm
          </span>
          <span className="flex items-center justify-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
            <span className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
              {data.colorName}
            </span>
          </span>
          <span className="text-center font-mono font-bold" style={{ color: data.color }}>
            {data.rotationAngle.toFixed(1)}°
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * 主演示组件
 */
export function ColorStateDemo() {
  const { theme } = useTheme();

  const [polarizerAngle, setPolarizerAngle] = useState(0);
  const [analyzerAngle, setAnalyzerAngle] = useState(90);
  const [concentration, setConcentration] = useState(0.6);
  const [pathLength, setPathLength] = useState(5);
  const [showCharts, setShowCharts] = useState(true);
  const [animate, setAnimate] = useState(true);

  // 计算总旋转角度范围
  const rotationRange = useMemo(() => {
    const rotations = calculateAllRotations(concentration, pathLength);
    const maxRotation = Math.max(...rotations.map((r) => r.rotationAngle));
    const minRotation = Math.min(...rotations.map((r) => r.rotationAngle));
    return { max: maxRotation, min: minRotation, spread: maxRotation - minRotation };
  }, [concentration, pathLength]);

  // 钠D线（589nm）的旋转角 —— 量糖计标准测量值
  const sodiumRotation = useMemo(
    () => getSpecificRotation(589) * concentration * pathLength,
    [concentration, pathLength],
  );

  const setAnalyzerRelative = useCallback(
    (offset: number) => {
      // 与钠D线出射偏振方向 平行/正交
      const target = (((polarizerAngle + sodiumRotation + offset) % 180) + 180) % 180;
      setAnalyzerAngle(Math.round(target));
    },
    [polarizerAngle, sodiumRotation],
  );

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* 主可视化 + 控制面板 */}
      <div className="flex gap-4 flex-col xl:flex-row items-start">
        <DemoStage
          className="flex-1 min-w-0"
          title="量糖计光路"
          subtitle="白光 → 起偏器 → 糖溶液 → 检偏器"
          legend={[
            { color: "#22d3ee", label: "起偏器", shape: "line" },
            { color: "#c084fc", label: "检偏器", shape: "line" },
          ]}
        >
          <SaccharimeterCanvas
            polarizerAngle={polarizerAngle}
            analyzerAngle={analyzerAngle}
            concentration={concentration}
            pathLength={pathLength}
            showCharts={showCharts}
            animate={animate}
          />
        </DemoStage>

        <ControlPanel title="控制面板" className="w-full xl:w-80 flex-shrink-0">
          <SliderControl
            label="起偏器角度 θ₀"
            value={polarizerAngle}
            min={0}
            max={180}
            step={5}
            unit="°"
            onChange={setPolarizerAngle}
            color="cyan"
          />
          <SliderControl
            label="检偏器角度 θₐ"
            value={analyzerAngle}
            min={0}
            max={180}
            step={1}
            unit="°"
            onChange={setAnalyzerAngle}
            color="purple"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setAnalyzerRelative(0)}
              className="px-2 py-1.5 rounded text-xs bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-all"
            >
              对准钠D线（最亮）
            </button>
            <button
              onClick={() => setAnalyzerRelative(90)}
              className="px-2 py-1.5 rounded text-xs bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-all"
            >
              正交消光（变色）
            </button>
          </div>

          <SliderControl
            label="糖浓度"
            value={concentration}
            min={0}
            max={1}
            step={0.01}
            unit=" g/mL"
            onChange={setConcentration}
            color="orange"
            formatValue={(v) => `${v.toFixed(2)} g/mL`}
          />
          <SliderControl
            label="管长"
            value={pathLength}
            min={1}
            max={10}
            step={0.5}
            unit=" dm"
            onChange={setPathLength}
            color="green"
          />

          <div className="flex gap-3">
            <Toggle label="分析图表" checked={showCharts} onChange={setShowCharts} />
            <Toggle label="动画" checked={animate} onChange={setAnimate} />
          </div>

          {/* 实时数据 */}
          <div className={`pt-3 border-t ${theme === "dark" ? "border-slate-700" : "border-gray-300"} space-y-2`}>
            <ValueDisplay
              label="钠D线旋转角 (589nm)"
              value={sodiumRotation.toFixed(1)}
              unit="°"
              color="yellow"
            />
            <ValueDisplay label="最大旋转角 (400nm)" value={rotationRange.max.toFixed(1)} unit="°" color="purple" />
            <ValueDisplay label="色散范围" value={rotationRange.spread.toFixed(1)} unit="°" color="orange" />
          </div>

          {/* 快速预设 */}
          <div className={`pt-3 border-t ${theme === "dark" ? "border-slate-700" : "border-gray-300"}`}>
            <p className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-600"} mb-2`}>浓度预设</p>
            <div className="grid grid-cols-3 gap-2">
              {[0.2, 0.5, 0.8].map((c) => (
                <button
                  key={c}
                  onClick={() => setConcentration(c)}
                  className={`px-2 py-1.5 rounded text-xs transition-all ${
                    concentration === c
                      ? "bg-orange-500/30 text-orange-400 border border-orange-500/50"
                      : theme === "dark"
                        ? "bg-slate-700/50 text-gray-400 border border-slate-600 hover:border-orange-400/30"
                        : "bg-gray-100/50 text-gray-600 border border-gray-300 hover:border-orange-400/30"
                  }`}
                >
                  {c} g/mL
                </button>
              ))}
            </div>
          </div>
        </ControlPanel>
      </div>

      {/* 公式和数值表格 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <Formula highlight>$\Phi = [\alpha]_\lambda \cdot c \cdot L$</Formula>
          <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"} mt-2 space-y-1`}>
            <p>
              • <span className="text-cyan-400">Φ</span> : 偏振面旋转角 (度)
            </p>
            <p>
              • <span className="text-orange-400">[α]_λ</span> : 比旋光度 (与波长有关，紫光最大)
            </p>
            <p>
              • <span className="text-yellow-400">c</span> : 溶液浓度 (g/mL)
            </p>
            <p>
              • <span className="text-green-400">L</span> : 管长 (dm)
            </p>
            <p className="pt-1">
              • 检偏器透过率（马吕斯定律）：
              <span className="text-purple-400"> I = I₀·cos²(θ_exit − θₐ)</span>
            </p>
          </div>
          <div
            className={`mt-3 p-3 rounded-lg ${theme === "dark" ? "bg-slate-800/50 border-slate-700/50" : "bg-gray-100/50 border-gray-300/50"} border`}
          >
            <p className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-600"} mb-1`}>
              蔗糖比旋光度参考 (20°C):
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <span className="text-purple-400">400nm (紫): ~115°</span>
              <span className="text-blue-400">450nm (蓝): ~96°</span>
              <span className="text-green-400">550nm (绿): ~71°</span>
              <span className="text-yellow-400">589nm (钠D): +66.5°</span>
              <span className="text-orange-400">600nm (橙): ~61°</span>
              <span className="text-red-400">700nm (红): ~45°</span>
            </div>
          </div>
        </div>

        <ControlPanel title="各波长旋转角" className="h-full">
          <RotationTable concentration={concentration} pathLength={pathLength} />
        </ControlPanel>
      </div>

      {/* 信息卡片 */}
      <DemoSection title="原理与应用" icon={<BookOpen className="w-3.5 h-3.5" />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoCard title="旋光性原理" color="cyan">
            <ul className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"} space-y-1.5`}>
              <ListItem>• 糖分子具有手性结构，存在对映异构体</ListItem>
              <ListItem>• 线偏振光通过时，偏振面发生旋转</ListItem>
              <ListItem>• 旋转角与浓度、管长成正比 —— 测角即可测浓度</ListItem>
              <ListItem>• 蔗糖为右旋物质，旋转角为正</ListItem>
            </ul>
          </InfoCard>

          <InfoCard title="管内彩色条纹（侧视）" color="purple">
            <ul className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"} space-y-1.5`}>
              <ListItem>• 散射光的亮度 ∝ cos²θ：偏振面正对观察者时变暗</ListItem>
              <ListItem>• 紫光旋转最快、红光最慢 → 不同位置"亮着"的颜色不同</ListItem>
              <ListItem>• 形成沿管旋转的"理发店彩柱"色带</ListItem>
              <ListItem>• 试试旋转起偏器：整条色带会跟着平移！</ListItem>
            </ul>
          </InfoCard>

          <InfoCard title="量糖计的使用" color="green">
            <ul className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"} space-y-1.5`}>
              <ListItem>• 旋转检偏器找到最亮/最暗位置，读出旋转角</ListItem>
              <ListItem>• 食品工业：测定糖含量</ListItem>
              <ListItem>• 制药工业：药品纯度与手性检测</ListItem>
              <ListItem>• 医学诊断：尿糖检测</ListItem>
            </ul>
          </InfoCard>
        </div>
      </DemoSection>
    </div>
  );
}

export default ColorStateDemo;
