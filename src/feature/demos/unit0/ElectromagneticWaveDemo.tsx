/**
 * ElectromagneticWaveDemo
 *
 * 电磁波演示：
 * - 波动视图：Canvas 斜二测投影下的真实电磁波结构 ——
 *   E 场（竖直面，颜色随波长）与 B 场（水平面，蓝色）相互垂直、同相位，
 *   绸带填充 + 矢量箭头 + 波峰追踪点，基于时间的平滑动画
 * - 波谱视图：完整电磁波谱、大气穿透性与尺度对比
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Waves, BarChart3 } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  SliderControl,
  ControlPanel,
  ValueDisplay,
  Toggle,
  InfoCard,
  Formula,
} from "../DemoControls";
import { DemoStage } from "../components/DemoLayout";
import { useDemoCanvas } from "../hooks/useDemoCanvas";
import MathText from "@/components/shared/MathText";

type ViewMode = "wave" | "spectrum";

// Electromagnetic spectrum region definitions
interface SpectrumRegion {
  id: string;
  name: LabelI18n;
  wavelengthRange: [number, number];
  frequencyRange: [number, number];
  color: string;
  gradientStart: string;
  gradientEnd: string;
  sizeComparison: LabelI18n;
  sizeIcon: string;
  applications: LabelI18n;
  canPenetrate: boolean;
  penetrateInfo: LabelI18n;
}

const SPECTRUM_REGIONS: SpectrumRegion[] = [
  {
    id: "radio",
    name: { "zh-CN": "无线电波" },
    wavelengthRange: [1e3, 1e-1],
    frequencyRange: [3e5, 3e9],
    color: "#ff6b6b",
    gradientStart: "#ff6b6b",
    gradientEnd: "#ffa500",
    sizeComparison: { "zh-CN": "建筑物" },
    sizeIcon: "🏢",
    applications: { "zh-CN": "调幅/调频广播、电视、手机通信" },
    canPenetrate: true,
    penetrateInfo: { "zh-CN": "可穿透大气层" },
  },
  {
    id: "microwave",
    name: { "zh-CN": "微波" },
    wavelengthRange: [1e-1, 1e-3],
    frequencyRange: [3e9, 3e11],
    color: "#ffa500",
    gradientStart: "#ffa500",
    gradientEnd: "#ffdd00",
    sizeComparison: { "zh-CN": "人体" },
    sizeIcon: "🧍",
    applications: { "zh-CN": "微波炉、雷达、WiFi/蓝牙" },
    canPenetrate: false,
    penetrateInfo: { "zh-CN": "部分被大气层吸收" },
  },
  {
    id: "infrared",
    name: { "zh-CN": "红外线" },
    // 红外线: 1mm (1e-3) 到 780nm (7.8e-7)，与可见光红端相接
    wavelengthRange: [1e-3, 7.8e-7],
    frequencyRange: [3e11, 3.85e14],
    color: "#ff4444",
    gradientStart: "#ffdd00",
    gradientEnd: "#ff0000",
    sizeComparison: { "zh-CN": "蝴蝶" },
    sizeIcon: "🦋",
    applications: { "zh-CN": "热成像、遥控器、夜视仪" },
    canPenetrate: false,
    penetrateInfo: { "zh-CN": "被水蒸气和CO₂吸收" },
  },
  {
    id: "visible",
    name: { "zh-CN": "可见光" },
    // 可见光: 780nm (7.8e-7) 到 380nm (3.8e-7)，标准人眼可见范围
    wavelengthRange: [7.8e-7, 3.8e-7],
    frequencyRange: [3.85e14, 7.89e14],
    color: "#00ff00",
    gradientStart: "#ff0000",
    gradientEnd: "#8b00ff",
    sizeComparison: { "zh-CN": "针尖" },
    sizeIcon: "📍",
    applications: { "zh-CN": "人眼视觉、摄影、光纤通信" },
    canPenetrate: true,
    penetrateInfo: { "zh-CN": "可穿透大气层（大气窗口）" },
  },
  {
    id: "ultraviolet",
    name: { "zh-CN": "紫外线" },
    // 紫外线: 380nm (3.8e-7) 到 10nm (1e-8)，与可见光紫端相接
    wavelengthRange: [3.8e-7, 1e-8],
    frequencyRange: [7.89e14, 3e16],
    color: "#8b00ff",
    gradientStart: "#8b00ff",
    gradientEnd: "#4400ff",
    sizeComparison: { "zh-CN": "分子" },
    sizeIcon: "⚛️",
    applications: { "zh-CN": "杀菌消毒、荧光检测、维生素D合成" },
    canPenetrate: false,
    penetrateInfo: { "zh-CN": "大部分被臭氧层阻挡" },
  },
  {
    id: "xray",
    name: { "zh-CN": "X射线" },
    wavelengthRange: [1e-8, 1e-11],
    frequencyRange: [3e16, 3e19],
    color: "#0088ff",
    gradientStart: "#4400ff",
    gradientEnd: "#00aaff",
    sizeComparison: { "zh-CN": "原子" },
    sizeIcon: "⚫",
    applications: { "zh-CN": "医学成像、安检、晶体学" },
    canPenetrate: false,
    penetrateInfo: { "zh-CN": "被大气层阻挡" },
  },
  {
    id: "gamma",
    name: { "zh-CN": "伽马射线" },
    wavelengthRange: [1e-11, 1e-14],
    frequencyRange: [3e19, 3e22],
    color: "#00ffff",
    gradientStart: "#00aaff",
    gradientEnd: "#00ffff",
    sizeComparison: { "zh-CN": "原子核" },
    sizeIcon: "💫",
    applications: { "zh-CN": "癌症治疗、核物理、天文观测" },
    canPenetrate: false,
    penetrateInfo: { "zh-CN": "被大气层阻挡" },
  },
];

// Format scientific notation
function formatScientific(num: number): string {
  if (num === 0) return "0";
  const exp = Math.floor(Math.log10(Math.abs(num)));
  const mantissa = num / Math.pow(10, exp);
  if (exp === 0) return num.toFixed(0);
  if (Math.abs(exp) <= 2) return num.toFixed(exp < 0 ? -exp : 0);
  return `${mantissa.toFixed(1)}×10^${exp}`;
}

// Format wavelength with appropriate units
function formatWavelength(meters: number): string {
  if (meters >= 1) return `${meters.toFixed(0)} m`;
  if (meters >= 1e-2) return `${(meters * 100).toFixed(0)} cm`;
  if (meters >= 1e-3) return `${(meters * 1000).toFixed(0)} mm`;
  if (meters >= 1e-6) return `${(meters * 1e6).toFixed(0)} μm`;
  if (meters >= 1e-9) return `${(meters * 1e9).toFixed(0)} nm`;
  if (meters >= 1e-12) return `${(meters * 1e12).toFixed(1)} pm`;
  return `${(meters * 1e15).toFixed(1)} fm`;
}

// Convert wavelength to RGB color
function wavelengthToRGB(wl: number): string {
  let r = 0,
    g = 0,
    b = 0;
  if (wl >= 380 && wl < 440) {
    r = -(wl - 440) / (440 - 380);
    b = 1;
  } else if (wl >= 440 && wl < 490) {
    g = (wl - 440) / (490 - 440);
    b = 1;
  } else if (wl >= 490 && wl < 510) {
    g = 1;
    b = -(wl - 510) / (510 - 490);
  } else if (wl >= 510 && wl < 580) {
    r = (wl - 510) / (580 - 510);
    g = 1;
  } else if (wl >= 580 && wl < 645) {
    r = 1;
    g = -(wl - 645) / (645 - 580);
  } else if (wl >= 645 && wl <= 700) {
    r = 1;
  }
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

// ----------------------------------------------------------------------------
// 电磁波 3D 投影画布
// ----------------------------------------------------------------------------

const EMW_W = 680;
const EMW_H = 360;
const COLOR_B = "#60a5fa";

function EMWaveCanvas({
  wavelength,
  amplitude,
  speed,
  showBField,
  isPlaying,
  waveColor,
}: {
  wavelength: number;
  amplitude: number;
  speed: number;
  showBField: boolean;
  isPlaying: boolean;
  waveColor: string;
}) {
  const canvasRef = useDemoCanvas({
    width: EMW_W,
    height: EMW_H,
    paused: !isPlaying || speed <= 0,
    timeScale: Math.max(speed, 0.0001),
    draw: ({ ctx, width, height, time }) => {
      const ox = 76;
      const oy = height / 2;
      const zLen = width - 140;
      // 波长 380-700nm → 屏幕上 76-148px 周期
      const pxPerWl = 76 + ((wavelength - 380) / 320) * 72;
      const k = (Math.PI * 2) / pxPerWl;
      const omega = 2.6; // 基准角频率（time 已按速度缩放）
      const phase = (z: number) => k * z - omega * time;
      const ampB = amplitude * 0.55;

      // 斜二测投影：z 向右，y 向上（E 场），x 斜向（B 场）
      const EXX = 0.45,
        EXY = 0.33;
      const proj = (bx: number, ey: number, z: number): [number, number] => [
        ox + z + bx * EXX,
        oy + bx * EXY - ey,
      ];

      // 背景
      ctx.fillStyle = "#070d1a";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(100, 150, 255, 0.05)";
      ctx.lineWidth = 1;
      for (let gx = 0; gx < width; gx += 40) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }

      // 坐标轴
      ctx.strokeStyle = "rgba(148, 163, 184, 0.6)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(ox - 26, oy);
      ctx.lineTo(ox + zLen + 30, oy);
      ctx.stroke();
      ctx.fillStyle = "#94a3b8";
      ctx.beginPath();
      ctx.moveTo(ox + zLen + 40, oy);
      ctx.lineTo(ox + zLen + 30, oy - 4);
      ctx.lineTo(ox + zLen + 30, oy + 4);
      ctx.closePath();
      ctx.fill();
      // E 轴（竖直）
      ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
      ctx.beginPath();
      ctx.moveTo(ox, oy + amplitude + 18);
      ctx.lineTo(ox, oy - amplitude - 18);
      ctx.stroke();
      // B 轴（斜向）
      if (showBField) {
        ctx.strokeStyle = "rgba(96, 165, 250, 0.35)";
        ctx.beginPath();
        ctx.moveTo(ox - (ampB + 16) * EXX, oy - (ampB + 16) * EXY);
        ctx.lineTo(ox + (ampB + 16) * EXX, oy + (ampB + 16) * EXY);
        ctx.stroke();
      }

      ctx.font = "12px sans-serif";
      ctx.textAlign = "left";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("传播方向", ox + zLen - 28, oy + 20);
      ctx.fillStyle = waveColor;
      ctx.fillText("E", ox + 8, oy - amplitude - 8);
      if (showBField) {
        ctx.fillStyle = COLOR_B;
        ctx.fillText("B", ox + (ampB + 16) * EXX + 6, oy + (ampB + 16) * EXY + 8);
      }

      const STEP = 3;

      // B 场绸带 + 曲线（水平面内振动 → 投影为斜向）
      if (showBField) {
        ctx.save();
        ctx.beginPath();
        for (let z = 0; z <= zLen; z += STEP) {
          const b = ampB * Math.sin(phase(z));
          const [sx, sy] = proj(b, 0, z);
          if (z === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        for (let z = zLen; z >= 0; z -= STEP) {
          const [sx, sy] = proj(0, 0, z);
          ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.fillStyle = "rgba(96, 165, 250, 0.09)";
        ctx.fill();

        ctx.strokeStyle = COLOR_B;
        ctx.globalAlpha = 0.85;
        ctx.lineWidth = 2;
        ctx.shadowColor = COLOR_B;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        for (let z = 0; z <= zLen; z += STEP) {
          const b = ampB * Math.sin(phase(z));
          const [sx, sy] = proj(b, 0, z);
          if (z === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
        ctx.restore();

        // B 矢量箭头
        ctx.save();
        ctx.strokeStyle = "rgba(96, 165, 250, 0.7)";
        ctx.fillStyle = "rgba(96, 165, 250, 0.7)";
        ctx.lineWidth = 1.4;
        for (let z = pxPerWl / 4; z <= zLen; z += pxPerWl / 2) {
          const b = ampB * Math.sin(phase(z));
          if (Math.abs(b) < 3) continue;
          const [x0, y0] = proj(0, 0, z);
          const [x1, y1] = proj(b, 0, z);
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
          const ang = Math.atan2(y1 - y0, x1 - x0);
          ctx.save();
          ctx.translate(x1, y1);
          ctx.rotate(ang);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-5, -2.6);
          ctx.lineTo(-5, 2.6);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();
      }

      // E 场绸带 + 曲线（竖直面）
      ctx.save();
      ctx.beginPath();
      for (let z = 0; z <= zLen; z += STEP) {
        const e = amplitude * Math.sin(phase(z));
        const [sx, sy] = proj(0, e, z);
        if (z === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      for (let z = zLen; z >= 0; z -= STEP) {
        const [sx, sy] = proj(0, 0, z);
        ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      const ribbonColor = waveColor.replace("rgb", "rgba").replace(")", ", 0.12)");
      ctx.fillStyle = ribbonColor;
      ctx.fill();

      ctx.strokeStyle = waveColor;
      ctx.lineWidth = 2.8;
      ctx.shadowColor = waveColor;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      for (let z = 0; z <= zLen; z += STEP) {
        const e = amplitude * Math.sin(phase(z));
        const [sx, sy] = proj(0, e, z);
        if (z === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      ctx.restore();

      // E 矢量箭头
      ctx.save();
      ctx.strokeStyle = waveColor;
      ctx.fillStyle = waveColor;
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = 1.4;
      for (let z = 0; z <= zLen; z += pxPerWl / 2) {
        const e = amplitude * Math.sin(phase(z));
        if (Math.abs(e) < 3) continue;
        const [x0, y0] = proj(0, 0, z);
        const [x1, y1] = proj(0, e, z);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        const dir = e > 0 ? -1 : 1;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 - 2.8, y1 + dir * 5);
        ctx.lineTo(x1 + 2.8, y1 + dir * 5);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // 波峰追踪点（随波以相速度前进，体现"波在跑"）
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const crestPhase = Math.PI / 2 + omega * time; // E 最大处 kz = π/2 + ωt
      let zCrest = ((crestPhase / k) % pxPerWl + pxPerWl) % pxPerWl;
      for (; zCrest <= zLen; zCrest += pxPerWl) {
        const [sx, sy] = proj(0, amplitude, zCrest);
        const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 9);
        glow.addColorStop(0, "rgba(255,255,255,0.9)");
        glow.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sx, sy, 9, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 波长标尺（静态参考）
      const ruleY = oy + amplitude + 28;
      const ruleX = ox + 30;
      ctx.strokeStyle = "#64748b";
      ctx.fillStyle = "#94a3b8";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ruleX, ruleY - 5);
      ctx.lineTo(ruleX, ruleY + 5);
      ctx.moveTo(ruleX, ruleY);
      ctx.lineTo(ruleX + pxPerWl, ruleY);
      ctx.moveTo(ruleX + pxPerWl, ruleY - 5);
      ctx.lineTo(ruleX + pxPerWl, ruleY + 5);
      ctx.stroke();
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`λ = ${wavelength} nm`, ruleX + pxPerWl / 2, ruleY + 16);

      // 角落提示
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(148,163,184,0.6)";
      ctx.fillText("E ⊥ B ⊥ 传播方向，且 E、B 同相位", width - 14, 22);
    },
  });

  return <canvas ref={canvasRef} className="mx-auto block rounded-lg" />;
}

export function ElectromagneticWaveDemo() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>("wave");

  // Wave view states
  const [wavelength, setWavelength] = useState(550);
  const [amplitude, setAmplitude] = useState(50);
  const [speed, setSpeed] = useState(0.5);
  const [showBField, setShowBField] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  // Spectrum view states
  const [selectedRegion, setSelectedRegion] = useState<string | null>("visible");
  const [showAtmosphere, setShowAtmosphere] = useState(true);
  const [showSizeComparison, setShowSizeComparison] = useState(true);

  const waveColor = wavelengthToRGB(wavelength);

  // Selected spectrum region info
  const selectedInfo = useMemo(() => {
    return SPECTRUM_REGIONS.find((r) => r.id === selectedRegion);
  }, [selectedRegion]);

  return (
    <div className="space-y-6">
      {/* View Mode Tabs */}
      <div className={`flex gap-2 p-1 rounded-lg w-fit ${theme === "dark" ? "bg-slate-800/50" : "bg-gray-100"}`}>
        <button
          onClick={() => setViewMode("wave")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            viewMode === "wave"
              ? "bg-cyan-500/20 text-cyan-400 shadow-sm"
              : theme === "dark"
                ? "text-gray-400 hover:text-gray-300 hover:bg-slate-700/50"
                : "text-gray-600 hover:text-gray-700 hover:bg-gray-200/50"
          }`}
        >
          <Waves className="w-4 h-4" />
          <span>波动可视化</span>
        </button>
        <button
          onClick={() => setViewMode("spectrum")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            viewMode === "spectrum"
              ? "bg-purple-500/20 text-purple-400 shadow-sm"
              : theme === "dark"
                ? "text-gray-400 hover:text-gray-300 hover:bg-slate-700/50"
                : "text-gray-600 hover:text-gray-700 hover:bg-gray-200/50"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>电磁波谱</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "wave" ? (
          <motion.div
            key="wave"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Wave View Content */}
            <div className="flex gap-5 flex-col lg:flex-row">
              <div className="flex-1 min-w-0 space-y-4">
                <DemoStage
                  title="电磁波传播结构"
                  subtitle="斜二测投影"
                  legend={[
                    { color: waveColor, label: "电场 E", shape: "line" },
                    ...(showBField
                      ? [{ color: COLOR_B, label: "磁场 B", shape: "line" as const }]
                      : []),
                  ]}
                >
                  <EMWaveCanvas
                    wavelength={wavelength}
                    amplitude={amplitude}
                    speed={speed}
                    showBField={showBField}
                    isPlaying={isPlaying}
                    waveColor={waveColor}
                  />
                </DemoStage>

                {/* Visible Spectrum Bar */}
                <div
                  className={`p-4 rounded-xl ${theme === "dark" ? "bg-slate-800/50 border-slate-700/50" : "bg-gray-100/50 border-gray-300/50"} border`}
                >
                  <h4
                    className={`text-sm font-semibold ${theme === "dark" ? "text-gray-300" : "text-gray-700"} mb-2`}
                  >
                    {t("demoUi.common.visibleSpectrum")}（点击选择波长）
                  </h4>
                  <div
                    className="h-8 rounded cursor-pointer relative"
                    style={{
                      background:
                        "linear-gradient(to right, violet, blue, cyan, green, yellow, orange, red)",
                    }}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const percent = x / rect.width;
                      const newWavelength = Math.round(380 + percent * 320);
                      setWavelength(Math.max(380, Math.min(700, newWavelength)));
                    }}
                  >
                    <motion.div
                      className="absolute top-0 w-1.5 h-full bg-white rounded shadow-[0_0_8px_rgba(255,255,255,0.9)]"
                      style={{ left: `${((wavelength - 380) / 320) * 100}%` }}
                      layoutId="wavelength-indicator"
                    />
                  </div>
                  <div
                    className={`flex justify-between text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"} mt-1`}
                  >
                    <span>380 nm ({t("demoUi.common.violet")})</span>
                    <span>550 nm ({t("demoUi.common.green")})</span>
                    <span>700 nm ({t("demoUi.common.red")})</span>
                  </div>
                </div>
              </div>

              <ControlPanel
                title={t("demoUi.lightWave.waveParameters")}
                className="w-full lg:w-72 flex-shrink-0"
              >
                <SliderControl
                  label={t("demoUi.common.wavelength")}
                  value={wavelength}
                  min={380}
                  max={700}
                  step={5}
                  unit=" nm"
                  onChange={setWavelength}
                  color="cyan"
                />
                <SliderControl
                  label={t("demoUi.common.amplitude")}
                  value={amplitude}
                  min={20}
                  max={80}
                  step={5}
                  onChange={setAmplitude}
                  color="green"
                />
                <SliderControl
                  label={t("demoUi.common.animationSpeed")}
                  value={speed}
                  min={0}
                  max={2}
                  step={0.1}
                  onChange={setSpeed}
                  color="orange"
                />

                <Toggle
                  label={t("demoUi.common.showBField")}
                  checked={showBField}
                  onChange={setShowBField}
                />

                <motion.button
                  className={`w-full py-2.5 rounded-lg font-medium transition-all ${
                    isPlaying
                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                      : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? t("demoUi.common.pause") : t("demoUi.common.play")}
                </motion.button>

                <div className="pt-2 border-t border-slate-700">
                  <div className="flex justify-between items-center py-1">
                    <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      {t("demoUi.common.color")}
                    </span>
                    <span
                      className="inline-block w-10 h-4 rounded"
                      style={{ backgroundColor: waveColor, boxShadow: `0 0 8px ${waveColor}` }}
                    />
                  </div>
                  {/* 使用精确光速值 c = 2.998×10^8 m/s 计算频率 f = c/λ */}
                  <ValueDisplay
                    label={t("demoUi.common.frequency")}
                    value={MathText({
                      text: `$ ${(2.998e8 / (wavelength * 1e-9) / 1e14).toFixed(2)} \\times 10^{14} \\text{ Hz} $`,
                    })}
                  />
                </div>

                {/* Quick switch to spectrum */}
                <motion.button
                  className="w-full py-2 rounded-lg text-sm text-purple-400 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all mt-2"
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setViewMode("spectrum")}
                >
                  查看完整电磁波谱 →
                </motion.button>
              </ControlPanel>
            </div>

            {/* Formula */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard
                title="电磁波特性"
                color="cyan"
              >
                <ul
                  className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"} space-y-1.5`}
                >
                  <li>• E场和B场相互垂直、同相位（同时达到最大）</li>
                  <li>• 横波：振动方向垂直于传播方向</li>
                  <li>
                    {" "}
                    {MathText({ text: "• 真空中速度恒定：$c = 3 \\times 10^8 \\text{ m/s}$，且 $|B| = |E|/c$" })}
                  </li>
                </ul>
                <Formula className="mt-2">$c = \lambda f$</Formula>
              </InfoCard>
              <InfoCard
                title="与偏振的联系"
                color="purple"
              >
                <ul
                  className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"} space-y-1.5`}
                >
                  <li>• 偏振描述电场E的振动方向（图中竖直面）</li>
                  <li>• 自然光包含所有偏振方向</li>
                  <li>• 只有横波才能偏振</li>
                </ul>
              </InfoCard>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="spectrum"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Spectrum View Content */}
            <div className="flex gap-5 flex-col lg:flex-row">
              <div className="flex-1 min-w-0">
                <DemoStage title="电磁波谱全景" subtitle="点击波段查看详情">
                  <svg
                    viewBox="0 0 800 260"
                    className="w-full h-auto"
                    style={{ minHeight: "230px" }}
                  >
                    <defs>
                      <pattern
                        id="spectrum-grid"
                        width="40"
                        height="40"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M 40 0 L 0 0 0 40"
                          fill="none"
                          stroke="rgba(100,150,255,0.05)"
                          strokeWidth="1"
                        />
                      </pattern>
                      <linearGradient
                        id="visible-gradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop
                          offset="0%"
                          stopColor="#ff0000"
                        />
                        <stop
                          offset="17%"
                          stopColor="#ff7700"
                        />
                        <stop
                          offset="33%"
                          stopColor="#ffff00"
                        />
                        <stop
                          offset="50%"
                          stopColor="#00ff00"
                        />
                        <stop
                          offset="67%"
                          stopColor="#00ffff"
                        />
                        <stop
                          offset="83%"
                          stopColor="#0077ff"
                        />
                        <stop
                          offset="100%"
                          stopColor="#8b00ff"
                        />
                      </linearGradient>
                      <filter id="spectrum-glow">
                        <feGaussianBlur
                          stdDeviation="2"
                          result="coloredBlur"
                        />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    <rect
                      width="800"
                      height="260"
                      fill="url(#spectrum-grid)"
                    />

                    {/* Atmosphere penetration */}
                    {showAtmosphere && (
                      <g transform="translate(50, 20)">
                        <text
                          x="0"
                          y="0"
                          fill="#9ca3af"
                          fontSize="10"
                        >
                          大气穿透性
                        </text>
                        <g transform="translate(0, 8)">
                          {SPECTRUM_REGIONS.map((region, index) => {
                            const x = index * 100;
                            const width = 98;
                            return (
                              <g key={`atm-${region.id}`}>
                                <rect
                                  x={x}
                                  y="0"
                                  width={width}
                                  height="15"
                                  fill={region.canPenetrate ? "#22c55e" : "#ef4444"}
                                  opacity="0.3"
                                  rx="2"
                                />
                                <text
                                  x={x + width / 2}
                                  y="11"
                                  textAnchor="middle"
                                  fill="#fff"
                                  fontSize="8"
                                >
                                  {region.canPenetrate ? "是" : "否"}
                                </text>
                              </g>
                            );
                          })}
                        </g>
                      </g>
                    )}

                    {/* Spectrum bands */}
                    <g transform="translate(50, 75)">
                      {SPECTRUM_REGIONS.map((region, index) => {
                        const x = index * 100;
                        const width = 98;
                        const isSelected = selectedRegion === region.id;
                        const isVisible = region.id === "visible";

                        return (
                          <g key={region.id}>
                            <text
                              x={x + 50}
                              y="-8"
                              textAnchor="middle"
                              fill={isSelected ? region.color : "#9ca3af"}
                              fontSize="11"
                              fontWeight={isSelected ? "bold" : "normal"}
                            >
                              {region.name[i18n.language]}
                            </text>
                            <motion.rect
                              x={x}
                              y="0"
                              width={width}
                              height="60"
                              fill={isVisible ? "url(#visible-gradient)" : region.gradientStart}
                              rx="4"
                              opacity={isSelected ? 1 : 0.6}
                              stroke={isSelected ? "#fff" : "transparent"}
                              strokeWidth={isSelected ? 2 : 0}
                              style={{ cursor: "pointer" }}
                              whileHover={{ opacity: 1, scale: 1.02 }}
                              onClick={() => setSelectedRegion(region.id)}
                              filter={isSelected ? "url(#spectrum-glow)" : undefined}
                            />
                          </g>
                        );
                      })}

                      {/* Wavelength scale */}
                      <g transform="translate(0, 70)">
                        <text
                          x="0"
                          y="0"
                          fill="#6b7280"
                          fontSize="9"
                        >
                          波长
                        </text>
                        {SPECTRUM_REGIONS.map((region, index) => {
                          const x = index * 100 + 50;
                          return (
                            <text
                              key={`wl-${region.id}`}
                              x={x}
                              y="15"
                              textAnchor="middle"
                              fill="#9ca3af"
                              fontSize="9"
                            >
                              {formatScientific(region.wavelengthRange[0])}
                            </text>
                          );
                        })}
                      </g>
                    </g>

                    {/* Size comparison */}
                    {showSizeComparison && (
                      <g transform="translate(50, 180)">
                        <text
                          x="0"
                          y="0"
                          fill="#9ca3af"
                          fontSize="10"
                        >
                          波长尺度
                        </text>
                        {SPECTRUM_REGIONS.map((region, index) => {
                          const x = index * 100 + 50;
                          return (
                            <g key={`size-${region.id}`}>
                              <text
                                x={x}
                                y="30"
                                textAnchor="middle"
                                fontSize="24"
                              >
                                {region.sizeIcon}
                              </text>
                              <text
                                x={x}
                                y="55"
                                textAnchor="middle"
                                fill="#9ca3af"
                                fontSize="9"
                              >
                                {region.sizeComparison[i18n.language]}
                              </text>
                            </g>
                          );
                        })}
                      </g>
                    )}
                  </svg>
                </DemoStage>

                {/* Selected region info */}
                <AnimatePresence>
                  {selectedInfo && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className={`mt-4 p-4 rounded-xl border ${theme === "dark" ? "bg-slate-800/80 border-slate-700/50" : "bg-gray-100 border-gray-300"} shadow-sm`}
                      style={{ borderLeftWidth: "4px", borderLeftColor: selectedInfo.color }}
                    >
                      <h4
                        className="text-lg font-bold mb-3"
                        style={{ color: selectedInfo.color }}
                      >
                        {selectedInfo.name[i18n.language]}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
                        <div
                          className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                        >
                          波长：
                          <span className={theme === "dark" ? "text-gray-200" : "text-gray-800"}>
                            {formatWavelength(selectedInfo.wavelengthRange[0])} ~{" "}
                            {formatWavelength(selectedInfo.wavelengthRange[1])}
                          </span>
                        </div>
                        <div
                          className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                        >
                          频率：
                          <span className={theme === "dark" ? "text-gray-200" : "text-gray-800"}>
                            {formatScientific(selectedInfo.frequencyRange[0])} ~{" "}
                            {formatScientific(selectedInfo.frequencyRange[1])} Hz
                          </span>
                        </div>
                        <div
                          className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                        >
                          应用：
                          <span className={theme === "dark" ? "text-gray-200" : "text-gray-800"}>
                            {selectedInfo.applications[i18n.language]}
                          </span>
                        </div>
                        <div
                          className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                        >
                          大气：
                          <span
                            className={
                              selectedInfo.canPenetrate
                                ? theme === "dark"
                                  ? "text-green-400"
                                  : "text-green-600"
                                : theme === "dark"
                                  ? "text-red-400"
                                  : "text-red-600"
                            }
                          >
                            {selectedInfo.penetrateInfo[i18n.language]}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <ControlPanel
                title="显示选项"
                className="w-full lg:w-72 flex-shrink-0"
              >
                <Toggle
                  label="显示大气穿透性"
                  checked={showAtmosphere}
                  onChange={setShowAtmosphere}
                />
                <Toggle
                  label="显示尺寸比较"
                  checked={showSizeComparison}
                  onChange={setShowSizeComparison}
                />

                <div className="border-t border-slate-700 pt-4 mt-4">
                  <h4 className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"} mb-2`}>选择波段</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {SPECTRUM_REGIONS.map((region) => (
                      <button
                        key={region.id}
                        onClick={() => setSelectedRegion(region.id)}
                        className={`px-2 py-1.5 rounded text-xs transition-all ${
                          selectedRegion === region.id
                            ? "bg-opacity-30 border"
                            : theme === "dark"
                              ? "bg-slate-800/50 border border-transparent hover:border-slate-600"
                              : "bg-gray-100 border border-transparent hover:border-gray-300"
                        }`}
                        style={{
                          backgroundColor:
                            selectedRegion === region.id ? `${region.color}30` : undefined,
                          borderColor: selectedRegion === region.id ? region.color : undefined,
                          color: selectedRegion === region.id ? region.color : "#9ca3af",
                        }}
                      >
                        {region.name[i18n.language]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick switch to wave view */}
                <motion.button
                  className="w-full py-2 rounded-lg text-sm text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all mt-4"
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setViewMode("wave")}
                >
                  查看波动动画 →
                </motion.button>
              </ControlPanel>
            </div>

            {/* Knowledge cards */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoCard
                title="光的本质"
                color="cyan"
              >
                <ul
                  className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"} space-y-1.5`}
                >
                  <li>• 光是电磁波，不需要介质</li>
                  <li>• 波长与频率成反比</li>
                  <li>
                    {MathText({
                      text: "$c = \\lambda f = 3 \\times 10^8 \\text{ m/s}$",
                      className: "font-mono text-cyan-400",
                    })}
                  </li>
                </ul>
              </InfoCard>

              <InfoCard
                title="能量与波长"
                color="purple"
              >
                <ul
                  className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"} space-y-1.5`}
                >
                  <li>• 波长越短，能量越高</li>
                  <li>• 伽马射线能量最高</li>
                  <li>
                    {MathText({
                      text: "$E = hf = hc/\\lambda$",
                      className: "font-mono text-purple-400",
                    })}
                  </li>
                </ul>
              </InfoCard>

              <InfoCard
                title="人眼视觉"
                color="green"
              >
                <ul
                  className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"} space-y-1.5`}
                >
                  <li>• 人眼仅见380-700nm</li>
                  <li>• 对绿光最敏感(~555nm)</li>
                  <li>• 可见光只占极小部分</li>
                </ul>
              </InfoCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ElectromagneticWaveDemo;
