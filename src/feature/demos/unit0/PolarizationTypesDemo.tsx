/**
 * 偏振态演示 - Unit 0
 * 展示光波合成与不同偏振态（线偏振、圆偏振、椭圆偏振）
 * 重构版本：使用清晰的伪3D Canvas替代R3F 3D视图
 */
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { SliderControl, ControlPanel, ValueDisplay, Formula, InfoCard } from "../DemoControls";
import MathText from "@/components/shared/MathText";

// 3D波动传播示意图 - 2D投影Canvas
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 500;
    const height = 300;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const axisY = height / 2;
    const k = 0.05; // 波数
    const speed = 0.1;
    const scale = 40;
    // 投影因子 - 产生伪3D效果
    const slantX = 0.5; // 深度移动X
    const slantY = -0.3; // 深度移动Y

    const draw = () => {
      // 清除画布
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, width, height);

      const t = timeRef.current * speed;
      const phaseRad = (phaseDiff * Math.PI) / 180;

      // 绘制传播方向轴（灰色）
      ctx.beginPath();
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1;
      ctx.moveTo(20, axisY);
      ctx.lineTo(width - 20, axisY);
      ctx.stroke();

      // Ex 分量 (红色) - 在伪3D空间中的"水平"方向
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 68, 68, 0.6)";
      ctx.lineWidth = 2;
      for (let i = 0; i < width - 40; i += 2) {
        const val = ampX * Math.cos(k * i - t);
        const sx = 20 + i + val * scale * slantX;
        const sy = axisY + val * scale * slantY;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      // Ey 分量 (绿色) - 垂直方向
      ctx.beginPath();
      ctx.strokeStyle = "rgba(68, 255, 68, 0.6)";
      ctx.lineWidth = 2;
      for (let i = 0; i < width - 40; i += 2) {
        const val = ampY * Math.cos(k * i - t + phaseRad);
        const sx = 20 + i;
        const sy = axisY - val * scale;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      // 合成矢量轨迹 (黄色) - 螺旋路径
      ctx.beginPath();
      ctx.strokeStyle = "#ffff00";
      ctx.lineWidth = 2.5;
      for (let i = 0; i < width - 40; i++) {
        const valX = ampX * Math.cos(k * i - t);
        const valY = ampY * Math.cos(k * i - t + phaseRad);
        const sx = 20 + i + valX * scale * slantX;
        const sy = axisY + valX * scale * slantY - valY * scale;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      // 绘制矢量箭头 - 帮助可视化
      for (let i = 0; i < width - 40; i += 60) {
        const valX = ampX * Math.cos(k * i - t);
        const valY = ampY * Math.cos(k * i - t + phaseRad);
        const sx = 20 + i + valX * scale * slantX;
        const sy = axisY + valX * scale * slantY - valY * scale;
        const originX = 20 + i;
        const originY = axisY;

        // 矢量线
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 255, 0, 0.4)";
        ctx.lineWidth = 1;
        ctx.moveTo(originX, originY);
        ctx.lineTo(sx, sy);
        ctx.stroke();

        // 矢量端点
        ctx.beginPath();
        ctx.fillStyle = "#ffff00";
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // 轴标签
      ctx.fillStyle = "#94a3b8";
      ctx.font = "12px sans-serif";
      ctx.fillText("传播方向 Z", width - 80, axisY + 20);

      // 图例
      ctx.fillStyle = "#ff4444";
      ctx.fillRect(20, 20, 12, 12);
      ctx.fillStyle = "#e0e0e0";
      ctx.fillText("Ex (水平)", 38, 30);

      ctx.fillStyle = "#44ff44";
      ctx.fillRect(20, 38, 12, 12);
      ctx.fillStyle = "#e0e0e0";
      ctx.fillText("Ey (垂直)", 38, 48);

      ctx.fillStyle = "#ffff00";
      ctx.fillRect(20, 56, 12, 12);
      ctx.fillStyle = "#e0e0e0";
      ctx.fillText("E (合成)", 38, 66);

      if (animate) {
        timeRef.current += 1;
      }
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [phaseDiff, ampX, ampY, animate]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg border border-cyan-400/20 w-full"
      style={{ maxWidth: 500, height: 300 }}
    />
  );
}

// 2D偏振态投影Canvas
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 300;
    const height = 300;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const cx = width / 2;
    const cy = height / 2;
    const radius = 100;
    const phaseRad = (phaseDiff * Math.PI) / 180;

    const draw = () => {
      // 清除画布
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, width, height);

      // 绘制坐标轴
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, 20);
      ctx.lineTo(cx, height - 20);
      ctx.moveTo(20, cy);
      ctx.lineTo(width - 20, cy);
      ctx.stroke();

      // 轴标签
      ctx.fillStyle = "#64748b";
      ctx.font = "12px sans-serif";
      ctx.fillText("Ex", width - 30, cy - 10);
      ctx.fillText("Ey", cx + 10, 30);

      // 绘制偏振椭圆轨迹
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 255, 0, 0.4)";
      ctx.lineWidth = 2;
      for (let a = 0; a <= Math.PI * 2; a += 0.05) {
        const px = ampX * Math.cos(a) * radius;
        const py = ampY * Math.cos(a + phaseRad) * radius;
        if (a === 0) ctx.moveTo(cx + px, cy - py);
        else ctx.lineTo(cx + px, cy - py);
      }
      ctx.closePath();
      ctx.stroke();

      // 当前矢量位置
      const phase = -timeRef.current * 0.05;
      const vecX = ampX * Math.cos(phase) * radius;
      const vecY = ampY * Math.cos(phase + phaseRad) * radius;

      // 绘制当前矢量
      ctx.beginPath();
      ctx.strokeStyle = "#ffff00";
      ctx.lineWidth = 3;
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + vecX, cy - vecY);
      ctx.stroke();

      ctx.setLineDash([5, 5]);

      ctx.beginPath();
      ctx.strokeStyle = "#aaa";
      ctx.lineWidth = 2;
      ctx.moveTo(cx + vecX, cy);
      ctx.lineTo(cx + vecX, cy - vecY);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = "#aaa";
      ctx.lineWidth = 2;
      ctx.moveTo(cx + vecX, cy - vecY);
      ctx.lineTo(cx, cy - vecY);
      ctx.stroke();

      ctx.setLineDash([]);

      // 矢量端点
      ctx.beginPath();
      ctx.fillStyle = "#ffff00";
      ctx.arc(cx + vecX, cy - vecY, 6, 0, Math.PI * 2);
      ctx.fill();

      // Ex分量指示
      ctx.beginPath();
      ctx.strokeStyle = "#ff4444";
      ctx.lineWidth = 2;
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + vecX, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.fillStyle = "#ff4444";
      ctx.arc(cx + vecX, cy, 6, 0, Math.PI * 2);
      ctx.fill();

      // Ey分量指示
      ctx.beginPath();
      ctx.strokeStyle = "#44ff44";
      ctx.lineWidth = 2;
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy - vecY);
      ctx.stroke();
      ctx.beginPath();
      ctx.fillStyle = "#44ff44";
      ctx.arc(cx, cy - vecY, 6, 0, Math.PI * 2);
      ctx.fill();

      // 图例
      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px sans-serif";
      ctx.fillText("Ex分量", cx + 50, cy + 135);
      ctx.fillText("Ey分量", 15, cy - 100);

      if (animate) {
        timeRef.current += 1;
      }
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [phaseDiff, ampX, ampY, animate]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg border border-cyan-400/20"
      style={{ width: 300, height: 300 }}
    />
  );
}

// 偏振态类型判断
function getPolarizationState(
  phaseDiff: number,
  ampX: number,
  ampY: number,
): { type: LabelI18n; color: string; description: LabelI18n } {
  const normalizedPhase = ((phaseDiff % 360) + 360) % 360;

  if (ampX < 0.05 || ampY < 0.05) {
    return {
      type: { "zh-CN": "线偏振 (单轴)" },
      color: "#ff4444",
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
      color: "#44ff44",
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

// 预设按钮组件
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
    <motion.button
      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
        isActive
          ? `bg-opacity-20 border-opacity-50`
          : theme === "dark" ? "bg-slate-700/50 text-gray-400 border-slate-600/50 hover:border-slate-500" : "bg-gray-100/50 text-gray-600 border-gray-300/50 hover:border-gray-400"
      }`}
      style={{
        backgroundColor: isActive ? `${color}20` : undefined,
        borderColor: isActive ? `${color}80` : undefined,
        color: isActive ? color : undefined,
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      {label[i18n.language]}
    </motion.button>
  );
}

// 主演示组件
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

  // 预设选项
  const presets = [
    { label: { "zh-CN": "水平线偏振" }, params: { phase: 0, ax: 1, ay: 0 }, color: "#ff4444" },
    { label: { "zh-CN": "45°线偏振" }, params: { phase: 0, ax: 1, ay: 1 }, color: "#ffaa00" },
    { label: { "zh-CN": "右旋圆偏振" }, params: { phase: 90, ax: 1, ay: 1 }, color: "#44ff44" },
    { label: { "zh-CN": "左旋圆偏振" }, params: { phase: 270, ax: 1, ay: 1 }, color: "#22d3ee" },
    { label: { "zh-CN": "椭圆偏振" }, params: { phase: 45, ax: 1, ay: 0.6 }, color: "#a78bfa" },
  ];

  const handlePresetClick = useCallback((params: { phase: number; ax: number; ay: number }) => {
    setPhaseDiff(params.phase);
    setAmpX(params.ax);
    setAmpY(params.ay);
  }, []);

  // 当前选中的预设
  const currentPresetIndex = useMemo(() => {
    return presets.findIndex(
      (p) =>
        Math.abs(p.params.phase - phaseDiff) < 5 &&
        Math.abs(p.params.ax - ampX) < 0.1 &&
        Math.abs(p.params.ay - ampY) < 0.1,
    );
  }, [phaseDiff, ampX, ampY]);

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* 标题 */}
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
          偏振态与波合成
        </h2>
        <p className={theme === "dark" ? "text-gray-400 mt-1" : "text-gray-600 mt-1"}>探索光的偏振状态：由两个垂直分量的振幅比和相位差决定</p>
      </div>

      {/* 上方：两个可视化面板 */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 3D 波动传播视图 */}
        <div className="flex-1 bg-slate-900/50 rounded-xl border border-cyan-400/20 overflow-hidden">
          <div className="px-4 py-3 border-b border-cyan-400/10 flex items-center justify-between">
            <h3 className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>3D 空间传播视图</h3>
            <div className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-600"}`}>伪等轴测投影</div>
          </div>
          <div className="p-4 flex justify-center">
            <WavePropagation3DCanvas
              phaseDiff={phaseDiff}
              ampX={ampX}
              ampY={ampY}
              animate={animate}
            />
          </div>
        </div>

        {/* 2D 偏振态投影 */}
        <div className="lg:w-[360px] bg-slate-900/50 rounded-xl border border-cyan-400/20 overflow-hidden">
          <div className="px-4 py-3 border-b border-cyan-400/10">
            <h3 className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>偏振态投影</h3>
          </div>
          <div className="p-4 flex flex-col items-center gap-3">
            <PolarizationStateCanvas
              phaseDiff={phaseDiff}
              ampX={ampX}
              ampY={ampY}
              animate={animate}
            />
            <div className="text-center space-y-1">
              <div>
                <span className={theme === "dark" ? "text-gray-400 text-sm" : "text-gray-600 text-sm"}>当前状态: </span>
                <span
                  className="font-semibold"
                  style={{ color: polarizationState.color }}
                >
                  {polarizationState.type[i18n.language]}
                </span>
              </div>
              <p className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-700"}`}>
                {polarizationState.description[i18n.language]}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 快速预设 */}
      <div className="bg-slate-900/50 rounded-xl border border-cyan-400/20 p-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {presets.map((preset, index) => (
            <PresetButton
              key={index}
              label={preset.label}
              isActive={currentPresetIndex === index}
              onClick={() => handlePresetClick(preset.params)}
              color={preset.color}
            />
          ))}
          <motion.button
            onClick={() => setAnimate(!animate)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              animate
                ? "bg-cyan-400/20 text-cyan-400 border border-cyan-400/50"
                : theme === "dark" ? "bg-slate-700/50 text-gray-400 border border-slate-600" : "bg-gray-100/50 text-gray-600 border border-gray-300"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {animate ? "⏸ 暂停" : "▶ 播放"}
          </motion.button>
        </div>
      </div>

      {/* 下方：控制面板 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 参数控制 */}
        <ControlPanel title="参数调节">
          <SliderControl
            label={MathText({ text: "$\\delta$" })}
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

        {/* 计算结果 */}
        <ControlPanel title="偏振参数">
          <ValueDisplay
            label={MathText({ text: "$\\delta$" })}
            value={`${phaseDiff}°`}
          />
          <ValueDisplay
            label={MathText({ text: "$E_y/E_x$" })}
            value={ampX > 0 ? (ampY / ampX).toFixed(2) : "∞"}
          />
          <ValueDisplay
            label="偏振态"
            value={polarizationState.type[i18n.language]}
            color={
              polarizationState.type[i18n.language].includes("圆")
                ? "green"
                : polarizationState.type[i18n.language].includes("线")
                  ? "orange"
                  : "purple"
            }
          />
          <Formula>
            $E = E_x \cos(\omega t) \mathbf e_x + E_y \cos(\omega t + \delta) \mathbf e_y$
          </Formula>
        </ControlPanel>

        {/* 物理原理 */}
        <ControlPanel title="物理原理">
          <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"} space-y-2`}>
            <p>
              <strong className="text-cyan-400">偏振态</strong>
              由两个互相垂直的电场分量 ({MathText({ text: "$E_x, E_y$" })}) 的振幅比和相位差(
              {MathText({ text: "$\\delta$" })})决定。
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
          </div>
        </ControlPanel>
      </div>

      {/* 现实应用场景 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard
          title="🎬 3D电影技术"
          color="cyan"
        >
          <p className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
            3D电影利用圆偏振光：左右眼分别接收左旋和右旋圆偏振图像，通过偏振眼镜分离产生立体效果。
          </p>
        </InfoCard>
        <InfoCard
          title="📡 卫星通信"
          color="purple"
        >
          <p className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
            卫星使用圆偏振天线：避免发射和接收天线方向对准问题，提高通信稳定性。
          </p>
        </InfoCard>
        <InfoCard
          title="🔬 生物检测"
          color="orange"
        >
          <p className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
            椭圆偏振光谱用于检测蛋白质分子结构：不同分子会产生特定的偏振变化，用于医学诊断。
          </p>
        </InfoCard>
      </div>
    </div>
  );
}

export default PolarizationTypesDemo;
