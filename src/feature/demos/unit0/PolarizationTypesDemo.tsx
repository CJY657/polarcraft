/**
 * 偏振态演示 - Unit 0
 * 展示光波合成与不同偏振态（线偏振、圆偏振、椭圆偏振）
 *
 * 可视化：
 * - 3D 传播视图：斜二测投影下的电场螺旋线，带深度透明度、分量曲线、
 *   矢量箭头与接收端椭圆，与右侧 2D 投影视图相位同步
 * - 2D 投影视图：相位轨迹 + 旋转方向箭头 + 分量投影
 *
 * 物理量：
 * - 椭圆方位角 ψ 与椭圆率角 χ 由 (Ex, Ey, δ) 实时计算
 */
import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { SliderControl, ControlPanel, ValueDisplay, Formula, InfoCard } from "../DemoControls";
import { DemoStage, DemoSection } from "../components/DemoLayout";
import { useDemoCanvas } from "../hooks/useDemoCanvas";
import MathText from "@/components/shared/MathText";

const COLOR_EX = "#fb7185"; // Ex 分量（玫红）
const COLOR_EY = "#4ade80"; // Ey 分量（绿）
const COLOR_E = "#fde047"; // 合成矢量（亮黄）

/** 两个视图共用的角频率（rad/s），保证相位同步 */
const OMEGA = 2.0;

// ----------------------------------------------------------------------------
// 3D 传播视图（斜二测投影）
// ----------------------------------------------------------------------------

const WAVE_W = 560;
const WAVE_H = 330;

function WavePropagation3DCanvas({
  phaseDiff,
  ampX,
  ampY,
  animate,
}: {
  phaseDiff: number;
  ampX: number;
  ampY: number;
  animate: boolean;
}) {
  const canvasRef = useDemoCanvas({
    width: WAVE_W,
    height: WAVE_H,
    paused: !animate,
    draw: ({ ctx, width, height, time }) => {
      const phaseRad = (phaseDiff * Math.PI) / 180;
      const ox = 56;
      const oy = height / 2;
      const zLen = width - 150; // 传播方向像素长度
      const k = (Math.PI * 4) / zLen; // 容纳两个波长
      const scale = 62;

      // 斜二测投影基向量：z 向右，y 向上，x 斜向右下（屏幕深度）
      const EXX = 0.46, EXY = 0.34; // e_x 在屏幕上的方向
      const proj = (ex: number, ey: number, z: number): [number, number] => [
        ox + z + ex * scale * EXX,
        oy + ex * scale * EXY - ey * scale,
      ];

      const field = (z: number) => {
        const tau = k * z - OMEGA * time;
        return {
          ex: ampX * Math.cos(tau),
          ey: ampY * Math.cos(tau + phaseRad),
        };
      };

      // 背景
      ctx.fillStyle = "#070d1a";
      ctx.fillRect(0, 0, width, height);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // 接收平面提供稳定的空间参照，与右侧投影同步。
      ctx.fillStyle = "rgba(148, 163, 184, 0.035)";
      ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const [ex, ey] of [[-1.25, -1.25], [-1.25, 1.25], [1.25, 1.25], [1.25, -1.25]]) {
        const [x, y] = proj(ex, ey, zLen);
        if (ex === -1.25 && ey === -1.25) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      for (const [ex, ey] of [[1.25, 0], [0, 1.25]]) {
        const [x0, y0] = proj(-ex, -ey, zLen);
        const [x1, y1] = proj(ex, ey, zLen);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }

      // 坐标轴
      ctx.strokeStyle = "rgba(148, 163, 184, 0.55)";
      ctx.lineWidth = 1.2;
      // z（传播）
      ctx.beginPath();
      ctx.moveTo(ox - 20, oy);
      ctx.lineTo(ox + zLen + 36, oy);
      ctx.stroke();
      ctx.fillStyle = "#94a3b8";
      ctx.beginPath();
      ctx.moveTo(ox + zLen + 44, oy);
      ctx.lineTo(ox + zLen + 34, oy - 4);
      ctx.lineTo(ox + zLen + 34, oy + 4);
      ctx.closePath();
      ctx.fill();
      // y（Ey 方向）
      ctx.strokeStyle = "rgba(74, 222, 128, 0.4)";
      ctx.beginPath();
      ctx.moveTo(ox, oy + 84);
      ctx.lineTo(ox, oy - 84);
      ctx.stroke();
      // x（Ex 方向，斜向）
      ctx.strokeStyle = "rgba(251, 113, 133, 0.4)";
      ctx.beginPath();
      ctx.moveTo(ox - 70 * EXX, oy - 70 * EXY);
      ctx.lineTo(ox + 70 * EXX, oy + 70 * EXY);
      ctx.stroke();

      // 轴标签
      ctx.font = "11px sans-serif";
      ctx.textAlign = "left";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("传播方向 z", ox + zLen - 28, oy + 18);
      ctx.fillStyle = COLOR_EY;
      ctx.fillText("y (Ey)", ox + 6, oy - 74);
      ctx.fillStyle = COLOR_EX;
      ctx.fillText("x (Ex)", ox + 70 * EXX + 6, oy + 70 * EXY + 4);

      const STEP = 4;

      // Ex 分量绸带（水平面内振动 → 投影为斜向）
      ctx.save();
      ctx.beginPath();
      for (let z = 0; z <= zLen; z += STEP) {
        const { ex } = field(z);
        const [sx, sy] = proj(ex, 0, z);
        if (z === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      for (let z = zLen; z >= 0; z -= STEP) {
        const [sx, sy] = proj(0, 0, z);
        ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(251, 113, 133, 0.055)";
      ctx.fill();
      ctx.strokeStyle = "rgba(251, 113, 133, 0.55)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let z = 0; z <= zLen; z += STEP) {
        const { ex } = field(z);
        const [sx, sy] = proj(ex, 0, z);
        if (z === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      ctx.restore();

      // Ey 分量绸带（竖直面内振动）
      ctx.save();
      ctx.beginPath();
      for (let z = 0; z <= zLen; z += STEP) {
        const { ey } = field(z);
        const [sx, sy] = proj(0, ey, z);
        if (z === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      for (let z = zLen; z >= 0; z -= STEP) {
        const [sx, sy] = proj(0, 0, z);
        ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(74, 222, 128, 0.055)";
      ctx.fill();
      ctx.strokeStyle = "rgba(74, 222, 128, 0.55)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let z = 0; z <= zLen; z += STEP) {
        const { ey } = field(z);
        const [sx, sy] = proj(0, ey, z);
        if (z === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      ctx.restore();

      // 合成矢量箭头（从轴指向螺旋线）
      ctx.save();
      ctx.lineWidth = 1.4;
      for (let i = 0; i <= 20; i++) {
        const z = (i / 20) * zLen;
        const { ex, ey } = field(z);
        const depth = ampX > 0.01 ? ex / ampX : 0; // -1..1 深度系数
        const alpha = i === 20 ? 0.95 : 0.26 + 0.3 * (depth + 1) * 0.5;
        const [x0, y0] = proj(0, 0, z);
        const [x1, y1] = proj(ex, ey, z);
        const length = Math.hypot(x1 - x0, y1 - y0);
        if (length < 1) continue;
        ctx.strokeStyle = `rgba(253, 224, 71, ${alpha})`;
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        const head = Math.min(5, length * 0.25);
        ctx.save();
        ctx.translate(x1, y1);
        ctx.rotate(Math.atan2(y1 - y0, x1 - x0));
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-head, -head * 0.45);
        ctx.lineTo(-head, head * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      // 合成场螺旋线：逐段绘制，深度→透明度/线宽（近粗远细）
      ctx.save();
      ctx.lineCap = "round";
      let prev: [number, number] | null = null;
      let prevDepth = 0;
      for (let z = 0; z <= zLen; z += 3) {
        const { ex, ey } = field(z);
        const depth = ampX > 0.01 ? ex / ampX : 0;
        const p = proj(ex, ey, z);
        if (prev) {
          const d = (depth + prevDepth) / 2;
          ctx.strokeStyle = COLOR_E;
          ctx.globalAlpha = 0.5 + 0.45 * (d + 1) * 0.5;
          ctx.lineWidth = 1.5 + (d + 1) * 0.5;
          ctx.beginPath();
          ctx.moveTo(prev[0], prev[1]);
          ctx.lineTo(p[0], p[1]);
          ctx.stroke();
        }
        prev = p;
        prevDepth = depth;
      }
      ctx.restore();

      // 接收端：横截面椭圆（与右图对应）
      const zEnd = zLen;
      ctx.save();
      ctx.strokeStyle = "rgba(253, 224, 71, 0.5)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.08) {
        const ex = ampX * Math.cos(a);
        const ey = ampY * Math.cos(a + phaseRad);
        const [sx, sy] = proj(ex, ey, zEnd);
        if (a === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 接收端当前矢量端点。
      const endField = field(zEnd);
      const [tipX, tipY] = proj(endField.ex, endField.ey, zEnd);
      ctx.save();
      ctx.fillStyle = "#f8fafc";
      ctx.strokeStyle = COLOR_E;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(tipX, tipY, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = "rgba(253, 224, 71, 0.75)";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("接收端截面", ox + zEnd, oy + 92);

      // 图例
      const legend: Array<[string, string]> = [
        [COLOR_EX, "Ex 分量"],
        [COLOR_EY, "Ey 分量"],
        [COLOR_E, "合成电场 E"],
      ];
      legend.forEach(([color, label], i) => {
        ctx.fillStyle = color;
        ctx.fillRect(16, 16 + i * 18, 12, 3.5);
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "11px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(label, 34, 21 + i * 18);
      });
    },
  });

  return <canvas ref={canvasRef} className="mx-auto block max-w-full rounded-lg" />;
}

// ----------------------------------------------------------------------------
// 2D 偏振态投影（接收端看到的轨迹）
// ----------------------------------------------------------------------------

const PROJ_W = 320;
const PROJ_H = 320;

function PolarizationStateCanvas({
  phaseDiff,
  ampX,
  ampY,
  animate,
}: {
  phaseDiff: number;
  ampX: number;
  ampY: number;
  animate: boolean;
}) {
  const canvasRef = useDemoCanvas({
    width: PROJ_W,
    height: PROJ_H,
    paused: !animate,
    draw: ({ ctx, width, height, time }) => {
      const cx = width / 2;
      const cy = height / 2;
      const radius = 102;
      const phaseRad = (phaseDiff * Math.PI) / 180;
      const pos = (tau: number): [number, number] => [
        cx + ampX * Math.cos(tau) * radius,
        cy - ampY * Math.cos(tau + phaseRad) * radius,
      ];

      ctx.fillStyle = "#070d1a";
      ctx.fillRect(0, 0, width, height);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // 参考圆环
      ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
      ctx.lineWidth = 1;
      for (const r of [radius * 0.5, radius]) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 坐标轴
      ctx.strokeStyle = "rgba(71, 85, 105, 0.8)";
      ctx.beginPath();
      ctx.moveTo(cx, 18);
      ctx.lineTo(cx, height - 18);
      ctx.moveTo(18, cy);
      ctx.lineTo(width - 18, cy);
      ctx.stroke();
      ctx.font = "11px sans-serif";
      ctx.fillStyle = COLOR_EX;
      ctx.textAlign = "left";
      ctx.fillText("Ex", width - 34, cy - 8);
      ctx.fillStyle = COLOR_EY;
      ctx.fillText("Ey", cx + 8, 28);

      // 完整轨迹（淡）
      ctx.strokeStyle = "rgba(253, 224, 71, 0.3)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.05) {
        const [px, py] = pos(a);
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      const tauNow = -OMEGA * time;

      // 相位随时间递减；历史位置位于当前相位之前的较大相位。
      ctx.save();
      ctx.lineCap = "round";
      const TAIL = Math.PI * 0.65;
      const SEG = 46;
      for (let i = 0; i < SEG; i++) {
        const f0 = i / SEG;
        const f1 = (i + 1) / SEG;
        const [x0, y0] = pos(tauNow + TAIL * (1 - f0));
        const [x1, y1] = pos(tauNow + TAIL * (1 - f1));
        ctx.strokeStyle = COLOR_E;
        ctx.globalAlpha = 0.65 * f1;
        ctx.lineWidth = 1 + 1.3 * f1;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
      ctx.restore();

      const [vx, vy] = pos(tauNow);

      // 分量投影辅助线
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(vx, cy);
      ctx.lineTo(vx, vy);
      ctx.moveTo(vx, vy);
      ctx.lineTo(cx, vy);
      ctx.stroke();
      ctx.restore();

      // 分量指示
      ctx.strokeStyle = COLOR_EX;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(vx, cy);
      ctx.stroke();
      ctx.fillStyle = COLOR_EX;
      ctx.beginPath();
      ctx.arc(vx, cy, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = COLOR_EY;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, vy);
      ctx.stroke();
      ctx.fillStyle = COLOR_EY;
      ctx.beginPath();
      ctx.arc(cx, vy, 3, 0, Math.PI * 2);
      ctx.fill();

      // 合成矢量
      ctx.save();
      ctx.strokeStyle = COLOR_E;
      ctx.fillStyle = COLOR_E;
      ctx.lineWidth = 2.3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(vx, vy);
      ctx.stroke();
      const length = Math.hypot(vx - cx, vy - cy);
      if (length > 1) {
        const head = Math.min(8, length * 0.25);
        ctx.translate(vx, vy);
        ctx.rotate(Math.atan2(vy - cy, vx - cx));
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-head, -head * 0.45);
        ctx.lineTo(-head, head * 0.45);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // 清晰端点标记，与 3D 接收平面的端点一致。
      ctx.save();
      ctx.fillStyle = "#f8fafc";
      ctx.strokeStyle = COLOR_E;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(vx, vy, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // 旋转方向箭头（轨迹切线方向，仅当轨迹非退化直线时）
      const isLine =
        ampX < 0.05 ||
        ampY < 0.05 ||
        Math.abs(Math.sin(phaseRad)) < 0.08;
      if (!isLine) {
        const [ax0, ay0] = pos(tauNow + 0.01);
        const [ax1, ay1] = pos(tauNow - 0.01);
        const dirX = ax1 - ax0;
        const dirY = ay1 - ay0;
        const dl = Math.hypot(dirX, dirY) || 1;
        const tipAheadX = vx + (dirX / dl) * 26;
        const tipAheadY = vy + (dirY / dl) * 26;
        ctx.save();
        ctx.strokeStyle = "rgba(165, 243, 252, 0.85)";
        ctx.fillStyle = "rgba(165, 243, 252, 0.85)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(vx + (dirX / dl) * 12, vy + (dirY / dl) * 12);
        ctx.lineTo(tipAheadX, tipAheadY);
        ctx.stroke();
        const angle = Math.atan2(dirY, dirX);
        ctx.translate(tipAheadX, tipAheadY);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-7, -3.5);
        ctx.lineTo(-7, 3.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      ctx.fillStyle = "#64748b";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("迎着光传播方向观察（接收端视角）", cx, height - 6);
    },
  });

  return <canvas ref={canvasRef} className="mx-auto block max-w-full rounded-lg" />;
}

// ----------------------------------------------------------------------------
// 偏振态类型判断
// ----------------------------------------------------------------------------

function getPolarizationState(
  phaseDiff: number,
  ampX: number,
  ampY: number,
): { type: LabelI18n; color: string; description: LabelI18n } {
  const normalizedPhase = ((phaseDiff % 360) + 360) % 360;

  if (ampX < 0.05 || ampY < 0.05) {
    return {
      type: { "zh-CN": "线偏振 (单轴)" },
      color: COLOR_EX,
      description: { "zh-CN": "只有一个分量振动，光沿单一方向振动" },
    };
  }

  if (
    Math.abs(ampX - ampY) < 0.1 &&
    (Math.abs(normalizedPhase - 90) < 5 || Math.abs(normalizedPhase - 270) < 5)
  ) {
    const direction = Math.abs(normalizedPhase - 90) < 5 ? "右旋" : "左旋";
    return {
      type: { "zh-CN": `${direction}圆偏振` },
      color: COLOR_EY,
      description: { "zh-CN": "电场矢量沿圆轨迹旋转，产生螺旋传播" },
    };
  }

  if (
    normalizedPhase < 5 ||
    Math.abs(normalizedPhase - 180) < 5 ||
    Math.abs(normalizedPhase - 360) < 5
  ) {
    return {
      type: { "zh-CN": "线偏振" },
      color: "#ffaa00",
      description: { "zh-CN": "两分量同相或反相，矢量沿直线振动" },
    };
  }

  return {
    type: { "zh-CN": "椭圆偏振" },
    color: "#a78bfa",
    description: { "zh-CN": "最一般的偏振态，电场矢量沿椭圆轨迹旋转" },
  };
}

// 预设按钮
function PresetButton({
  label,
  isActive,
  onClick,
  color,
}: {
  label: LabelI18n;
  isActive: boolean;
  onClick: () => void;
  color: string;
}) {
  const { i18n } = useTranslation();
  const { theme } = useTheme();
  return (
    <button
      className={`min-w-0 px-2 py-2.5 rounded-lg text-sm font-medium border transition-colors duration-150 ${
        isActive
          ? ""
          : theme === "dark"
            ? "bg-slate-700/50 text-gray-400 border-slate-600/50 hover:border-slate-500"
            : "bg-gray-100/50 text-gray-600 border-gray-300/50 hover:border-gray-400"
      }`}
      style={{
        backgroundColor: isActive ? `${color}20` : undefined,
        borderColor: isActive ? `${color}80` : undefined,
        color: isActive ? color : undefined,
      }}
      aria-pressed={isActive}
      onClick={onClick}
    >
      {label[i18n.language]}
    </button>
  );
}

// ----------------------------------------------------------------------------
// 主演示组件
// ----------------------------------------------------------------------------

export function PolarizationTypesDemo() {
  const { i18n } = useTranslation();
  const { theme } = useTheme();
  const [phaseDiff, setPhaseDiff] = useState(0);
  const [ampX, setAmpX] = useState(1);
  const [ampY, setAmpY] = useState(1);
  const [animate, setAnimate] = useState(true);

  const polarizationState = useMemo(
    () => getPolarizationState(phaseDiff, ampX, ampY),
    [phaseDiff, ampX, ampY],
  );

  // 偏振椭圆参数：方位角 ψ 与椭圆率角 χ
  const ellipseParams = useMemo(() => {
    const delta = (phaseDiff * Math.PI) / 180;
    const denom = ampX * ampX + ampY * ampY;
    if (denom < 1e-9) return { psi: 0, chi: 0 };
    const psi = 0.5 * Math.atan2(2 * ampX * ampY * Math.cos(delta), ampX * ampX - ampY * ampY);
    const chi = 0.5 * Math.asin(Math.max(-1, Math.min(1, (2 * ampX * ampY * Math.sin(delta)) / denom)));
    return { psi: (psi * 180) / Math.PI, chi: (chi * 180) / Math.PI };
  }, [phaseDiff, ampX, ampY]);

  const presets = [
    { label: { "zh-CN": "水平线偏振" }, params: { phase: 0, ax: 1, ay: 0 }, color: COLOR_EX },
    { label: { "zh-CN": "45°线偏振" }, params: { phase: 0, ax: 1, ay: 1 }, color: "#ffaa00" },
    { label: { "zh-CN": "右旋圆偏振" }, params: { phase: 90, ax: 1, ay: 1 }, color: COLOR_EY },
    { label: { "zh-CN": "左旋圆偏振" }, params: { phase: 270, ax: 1, ay: 1 }, color: "#22d3ee" },
    { label: { "zh-CN": "椭圆偏振" }, params: { phase: 45, ax: 1, ay: 0.6 }, color: "#a78bfa" },
  ];

  const handlePresetClick = useCallback((params: { phase: number; ax: number; ay: number }) => {
    setPhaseDiff(params.phase);
    setAmpX(params.ax);
    setAmpY(params.ay);
  }, []);

  const currentPresetIndex = useMemo(() => {
    return presets.findIndex(
      (p) =>
        Math.abs(p.params.phase - phaseDiff) < 5 &&
        Math.abs(p.params.ax - ampX) < 0.1 &&
        Math.abs(p.params.ay - ampY) < 0.1,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseDiff, ampX, ampY]);

  return (
    <div className="@container/demo flex min-w-0 flex-col gap-5">
      {/* 上方：两个可视化面板 */}
      <div className="grid min-w-0 items-stretch gap-4 @min-[960px]/demo:grid-cols-[minmax(0,1fr)_19rem]">
        <DemoStage
          title="3D 空间传播视图"
          subtitle="斜二测投影 · 近粗远细"
          legend={[
            { color: COLOR_EX, label: "Ex", shape: "line" },
            { color: COLOR_EY, label: "Ey", shape: "line" },
            { color: COLOR_E, label: "合成 E", shape: "line" },
          ]}
          bodyClassName="flex items-center justify-center p-3 @min-[640px]/demo:p-4"
        >
          <WavePropagation3DCanvas
            phaseDiff={phaseDiff}
            ampX={ampX}
            ampY={ampY}
            animate={animate}
          />
        </DemoStage>

        <DemoStage
          title="偏振态投影"
          subtitle="接收端视角"
          bodyClassName="flex items-center justify-center p-3"
        >
          <div className="flex w-full min-w-0 flex-col items-center gap-3">
            <PolarizationStateCanvas
              phaseDiff={phaseDiff}
              ampX={ampX}
              ampY={ampY}
              animate={animate}
            />
            <div className="w-full max-w-sm px-2 pb-1 text-center">
              <span className="text-gray-400 text-sm">当前状态: </span>
              <span className="font-semibold" style={{ color: polarizationState.color }}>
                {polarizationState.type[i18n.language]}
              </span>
              <p className="mt-1 text-xs leading-relaxed text-gray-400">
                {polarizationState.description[i18n.language]}
              </p>
            </div>
          </div>
        </DemoStage>
      </div>

      {/* 快速预设 + 播放控制 */}
      <div
        className={`rounded-xl border p-3 ${
          theme === "dark" ? "bg-slate-900/50 border-slate-700" : "bg-white border-slate-200"
        }`}
      >
        <div className="grid grid-cols-2 gap-2 @min-[520px]/demo:grid-cols-3 @min-[960px]/demo:grid-cols-6">
          {presets.map((preset, index) => (
            <PresetButton
              key={index}
              label={preset.label}
              isActive={currentPresetIndex === index}
              onClick={() => handlePresetClick(preset.params)}
              color={preset.color}
            />
          ))}
          <button
            onClick={() => setAnimate(!animate)}
            className={`min-w-0 px-2 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
              animate
                ? "bg-cyan-400/20 text-cyan-400 border border-cyan-400/50"
                : theme === "dark"
                  ? "bg-slate-700/50 text-gray-400 border border-slate-600"
                  : "bg-gray-100/50 text-gray-600 border border-gray-300"
            }`}
            aria-pressed={animate}
          >
            {animate ? "⏸ 暂停" : "▶ 播放"}
          </button>
        </div>
      </div>

      {/* 控制面板 */}
      <div className="grid min-w-0 grid-cols-1 gap-4 @min-[700px]/demo:grid-cols-2">
        <ControlPanel title="参数调节">
          <SliderControl
            label={<MathText text="相位差 $\delta$" />}
            value={phaseDiff}
            min={0}
            max={360}
            step={5}
            unit="°"
            onChange={setPhaseDiff}
            color="purple"
          />
          <SliderControl
            label="Ex 振幅"
            value={ampX}
            min={0}
            max={1}
            step={0.1}
            onChange={setAmpX}
            formatValue={(v) => v.toFixed(1)}
            color="red"
          />
          <SliderControl
            label="Ey 振幅"
            value={ampY}
            min={0}
            max={1}
            step={0.1}
            onChange={setAmpY}
            formatValue={(v) => v.toFixed(1)}
            color="green"
          />
        </ControlPanel>

        <ControlPanel title="偏振参数">
          <ValueDisplay label={<MathText text="相位差 $\delta$" />} value={`${phaseDiff}°`} />
          <ValueDisplay
            label={<MathText text="$E_y/E_x$" />}
            value={ampX > 0 ? (ampY / ampX).toFixed(2) : "∞"}
          />
          <ValueDisplay
            label={<MathText text="椭圆方位角 $\psi$" />}
            value={`${ellipseParams.psi.toFixed(1)}°`}
            color="purple"
          />
          <ValueDisplay
            label={<MathText text="椭圆率角 $\chi$" />}
            value={`${ellipseParams.chi.toFixed(1)}°`}
            color="orange"
          />
        </ControlPanel>
      </div>

      <ControlPanel title="物理原理">
        <Formula>
          $E = E_x \cos(\omega t) \mathbf e_x + E_y \cos(\omega t + \delta) \mathbf e_y$
        </Formula>
        <div className={`grid gap-3 text-xs leading-relaxed @min-[640px]/demo:grid-cols-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
          <p>
            <strong className="text-cyan-400">偏振态</strong>
            由两个互相垂直的电场分量 (<MathText text="$E_x, E_y$" />) 的振幅比和相位差(
            <MathText text="$\delta$" />)决定。
          </p>
          <p>
            当{" "}
            <span className="text-purple-400">
              <MathText text="$\delta = 90^\circ$" />
            </span>{" "}
            且{" "}
            <span className="text-cyan-400">
              <MathText text="$E_x = E_y$" />
            </span>{" "}
            时，合成矢量画出圆（圆偏振）。
          </p>
          <p>
            当{" "}
            <span className="text-orange-400">
              <MathText text="$\delta = 0^\circ \text{ 或 } 180^\circ$" />
            </span>{" "}
            时，合成矢量画出直线（线偏振）。
          </p>
          <p>
            椭圆率角 <MathText text="$\chi$" /> 的符号给出旋转方向：观察右图中沿轨迹移动的
            <span className="text-cyan-300">青色箭头</span>。
          </p>
        </div>
      </ControlPanel>

      {/* 现实应用场景 */}
      <DemoSection title="现实应用" icon={<BookOpen className="w-3.5 h-3.5" />}>
        <div className="grid grid-cols-1 gap-4 @min-[600px]/demo:grid-cols-2 @min-[960px]/demo:grid-cols-3">
          <InfoCard title="🎬 3D电影技术" color="cyan">
            <p className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
              3D电影利用圆偏振光：左右眼分别接收左旋和右旋圆偏振图像，通过偏振眼镜分离产生立体效果。
            </p>
          </InfoCard>
          <InfoCard title="📡 卫星通信" color="purple">
            <p className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
              卫星使用圆偏振天线：避免发射和接收天线方向对准问题，提高通信稳定性。
            </p>
          </InfoCard>
          <InfoCard title="🔬 生物检测" color="orange">
            <p className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
              椭圆偏振光谱用于检测蛋白质分子结构：不同分子会产生特定的偏振变化，用于医学诊断。
            </p>
          </InfoCard>
        </div>
      </DemoSection>
    </div>
  );
}

export default PolarizationTypesDemo;
