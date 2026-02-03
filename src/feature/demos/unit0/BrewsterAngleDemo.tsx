/**
 * BrewsterAngleDemo.tsx
 *
 * Demonstration of Brewster's Angle phenomenon.
 * When unpolarized light hits a surface at Brewster's angle,
 * the reflected light is perfectly polarized perpendicular to the plane of incidence.
 */

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Target, Sparkles, FlaskConical, Lightbulb } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  SliderControl,
  ControlPanel,
  ValueDisplay,
  InfoCard,
  Formula,
  Toggle,
  PresetButtons,
} from "../DemoControls";

// Material presets
const MATERIAL_PRESETS = [
  {
    label: { "zh-CN": "空气→玻璃" },
    n1: 1.0,
    n2: 1.5,
    color: "#60a5fa",
  },
  {
    label: { "zh-CN": "空气→水" },
    n1: 1.0,
    n2: 1.33,
    color: "#22d3ee",
  },
  {
    label: { "zh-CN": "空气→钻石" },
    n1: 1.0,
    n2: 2.42,
    color: "#a78bfa",
  },
];

// Canvas component for Brewster Angle visualization
function BrewsterAngleCanvas({
  incidentAngle,
  n1,
  n2,
  brewsterAngle,
  isAtBrewsterAngle,
  animate,
}: {
  incidentAngle: number;
  n1: number;
  n2: number;
  brewsterAngle: number;
  isAtBrewsterAngle: boolean;
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

    const width = 600;
    const height = 400;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const cx = width / 2;
    const cy = height / 2;
    const rayLength = 180;

    const draw = () => {
      // Clear canvas
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, width, height);

      // Draw media backgrounds
      // Upper medium (n1) - air
      ctx.fillStyle = "rgba(100, 200, 255, 0.08)";
      ctx.fillRect(0, 0, width, cy);

      // Lower medium (n2) - glass/water/diamond
      const mediumOpacity = 0.08 + (n2 - 1) * 0.05;
      ctx.fillStyle = `rgba(150, 255, 200, ${mediumOpacity})`;
      ctx.fillRect(0, cy, width, height - cy);

      // Draw medium labels
      ctx.fillStyle = "#64748b";
      ctx.font = "13px sans-serif";
      ctx.fillText(`n₁ = ${n1.toFixed(2)}`, 20, cy - 15);
      ctx.fillText(`n₂ = ${n2.toFixed(2)}`, 20, cy + 25);

      // Draw boundary line (thick)
      ctx.beginPath();
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 3;
      ctx.moveTo(0, cy);
      ctx.lineTo(width, cy);
      ctx.stroke();

      // Draw normal line (dashed)
      ctx.beginPath();
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 1;
      ctx.setLineDash([8, 4]);
      ctx.moveTo(cx, 20);
      ctx.lineTo(cx, height - 20);
      ctx.stroke();
      ctx.setLineDash([]);

      // Calculate angles
      const angleRad = (incidentAngle * Math.PI) / 180;

      // Calculate refracted angle using Snell's law: n1*sin(θ1) = n2*sin(θ2)
      const sinRefracted = (n1 * Math.sin(angleRad)) / n2;
      const refractedAngleRad = Math.asin(Math.min(1, Math.max(-1, sinRefracted)));

      // Wave animation offset
      const waveOffset = animate ? timeRef.current * 2 : 0;

      // Draw incident ray (from upper left)
      const incidentStartX = cx - rayLength * Math.sin(angleRad);
      const incidentStartY = cy - rayLength * Math.cos(angleRad);

      // Incident ray base
      ctx.beginPath();
      ctx.strokeStyle = "#ff6b35";
      ctx.lineWidth = 3;
      ctx.moveTo(incidentStartX, incidentStartY);
      ctx.lineTo(cx, cy);
      ctx.stroke();

      // Draw wave pattern on incident ray
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 107, 53, 0.5)";
      ctx.lineWidth = 2;
      for (let i = 0; i < rayLength; i += 4) {
        const t = i / rayLength;
        const x = incidentStartX + t * (cx - incidentStartX);
        const y = incidentStartY + t * (cy - incidentStartY);
        const wavePhase = (i - waveOffset) * 0.1;
        const perpX = Math.cos(angleRad);
        const perpY = -Math.sin(angleRad);
        const waveOffsetDist = 5 * Math.sin(wavePhase);

        if (i === 0) {
          ctx.moveTo(x + perpX * waveOffsetDist, y + perpY * waveOffsetDist);
        } else {
          ctx.lineTo(x + perpX * waveOffsetDist, y + perpY * waveOffsetDist);
        }
      }
      ctx.stroke();

      // Draw polarization indicators on incident ray (both P and S)
      drawPolarizationIndicatorsOnRay(
        ctx,
        incidentStartX,
        incidentStartY,
        cx,
        cy,
        0.3,
        0.7,
        waveOffset,
      );

      // Draw reflected ray (to upper right)
      const reflectedEndX = cx + rayLength * Math.sin(angleRad);
      const reflectedEndY = cy - rayLength * Math.cos(angleRad);

      // Reflected ray base
      ctx.beginPath();
      const reflectedColor = isAtBrewsterAngle ? "#ffd700" : "#ff6b35";
      ctx.strokeStyle = reflectedColor;
      ctx.lineWidth = isAtBrewsterAngle ? 4 : 3;
      ctx.moveTo(cx, cy);
      ctx.lineTo(reflectedEndX, reflectedEndY);
      ctx.stroke();

      // Glow effect at Brewster angle
      if (isAtBrewsterAngle) {
        ctx.shadowColor = "#ffd700";
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 215, 0, 0.5)";
        ctx.lineWidth = 8;
        ctx.moveTo(cx, cy);
        ctx.lineTo(reflectedEndX, reflectedEndY);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Draw wave pattern on reflected ray
      ctx.beginPath();
      ctx.strokeStyle = `rgba(255, 107, 53, ${isAtBrewsterAngle ? 0.3 : 0.5})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < rayLength; i += 4) {
        const t = i / rayLength;
        const x = cx + t * (reflectedEndX - cx);
        const y = cy + t * (reflectedEndY - cy);
        const wavePhase = (i + waveOffset) * 0.1;
        const perpX = -Math.cos(angleRad);
        const perpY = -Math.sin(angleRad);
        const waveOffsetDist = 5 * Math.sin(wavePhase);

        if (i === 0) {
          ctx.moveTo(x + perpX * waveOffsetDist, y + perpY * waveOffsetDist);
        } else {
          ctx.lineTo(x + perpX * waveOffsetDist, y + perpY * waveOffsetDist);
        }
      }
      ctx.stroke();

      // Draw polarization indicators on reflected ray
      // At Brewster angle, P-component (parallel) is zero!
      const pAmplitude = isAtBrewsterAngle ? 0 : 0.3;
      drawPolarizationIndicatorsOnRay(
        ctx,
        cx,
        cy,
        reflectedEndX,
        reflectedEndY,
        pAmplitude,
        0.7,
        waveOffset,
      );

      // Draw refracted ray (into lower medium)
      const refractedEndX = cx + rayLength * Math.sin(refractedAngleRad);
      const refractedEndY = cy + rayLength * Math.cos(refractedAngleRad);

      // Refracted ray base
      ctx.beginPath();
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.moveTo(cx, cy);
      ctx.lineTo(refractedEndX, refractedEndY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw angle arcs
      // Incident angle arc
      drawAngleArc(ctx, cx, cy, -Math.PI / 2 - angleRad, -Math.PI / 2, `θᵢ = ${incidentAngle.toFixed(1)}°`, 40);

      // Reflected angle arc
      drawAngleArc(ctx, cx, cy, -Math.PI / 2, -Math.PI / 2 + angleRad, `θᵣ = ${incidentAngle.toFixed(1)}°`, 40);

      // Refracted angle arc
      drawAngleArc(
        ctx,
        cx,
        cy,
        Math.PI / 2 - refractedAngleRad,
        Math.PI / 2,
        `θₜ = ${(refractedAngleRad * 180 / Math.PI).toFixed(1)}°`,
        55,
      );

      // Draw angle between reflected and refracted (should be 90° at Brewster)
      const angleBetween = angleRad + refractedAngleRad;
      if (angleBetween > 0.1) {
        const isRightAngle = Math.abs(angleBetween - Math.PI / 2) < 0.05;
        ctx.beginPath();
        ctx.strokeStyle = isRightAngle && isAtBrewsterAngle ? "#ffd700" : "#64748b";
        ctx.lineWidth = isRightAngle ? 2 : 1;
        ctx.arc(cx, cy, 70, -Math.PI / 2 + angleRad, Math.PI / 2 - refractedAngleRad);
        ctx.stroke();

        if (isRightAngle && isAtBrewsterAngle) {
          // Draw right angle symbol
          ctx.fillStyle = "#ffd700";
          ctx.font = "bold 12px sans-serif";
          ctx.fillText("90°", cx + 75, cy - 5);
        }
      }

      // Draw polarization legend
      drawPolarizationLegend(ctx, width, height, isAtBrewsterAngle);

      // Draw Brewster angle badge
      if (isAtBrewsterAngle) {
        ctx.fillStyle = "rgba(255, 215, 0, 0.2)";
        ctx.fillRect(width / 2 - 80, 15, 160, 35);
        ctx.strokeStyle = "#ffd700";
        ctx.lineWidth = 2;
        ctx.strokeRect(width / 2 - 80, 15, 160, 35);

        ctx.fillStyle = "#ffd700";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🎯 布鲁斯特角!", width / 2, 38);
        ctx.textAlign = "left";
      }

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
  }, [incidentAngle, n1, n2, brewsterAngle, isAtBrewsterAngle, animate]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg border border-cyan-400/20 w-full"
      style={{ maxWidth: 600, height: 400 }}
    />
  );
}

// Helper function to draw polarization indicators on a ray
function drawPolarizationIndicatorsOnRay(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  pAmplitude: number,
  sAmplitude: number,
  waveOffset: number,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const numIndicators = 5;

  for (let i = 1; i < numIndicators; i++) {
    const t = i / numIndicators;
    const x = x1 + t * dx;
    const y = y1 + t * dy;

    // P-polarization (dots along the ray - parallel to plane of incidence)
    if (pAmplitude > 0.05) {
      ctx.beginPath();
      ctx.fillStyle = "#fbbf24";
      const dotSize = 4 + 2 * Math.sin((i * 10 - waveOffset) * 0.1);
      ctx.arc(x, y, dotSize * pAmplitude, 0, Math.PI * 2);
      ctx.fill();
    }

    // S-polarization (perpendicular arrows)
    if (sAmplitude > 0.05) {
      const perpX = -dy / length;
      const perpY = dx / length;
      const arrowLength = 12 * sAmplitude * (0.8 + 0.2 * Math.sin((i * 10 - waveOffset) * 0.1));

      ctx.beginPath();
      ctx.strokeStyle = "#44ff44";
      ctx.lineWidth = 2;
      ctx.moveTo(x - perpX * arrowLength / 2, y - perpY * arrowLength / 2);
      ctx.lineTo(x + perpX * arrowLength / 2, y + perpY * arrowLength / 2);
      ctx.stroke();

      // Arrow heads
      const headSize = 3;
      ctx.beginPath();
      ctx.moveTo(x + perpX * arrowLength / 2, y + perpY * arrowLength / 2);
      ctx.lineTo(
        x + perpX * arrowLength / 2 - perpX * headSize + perpY * headSize,
        y + perpY * arrowLength / 2 - perpY * headSize - perpX * headSize
      );
      ctx.moveTo(x + perpX * arrowLength / 2, y + perpY * arrowLength / 2);
      ctx.lineTo(
        x + perpX * arrowLength / 2 - perpX * headSize - perpY * headSize,
        y + perpY * arrowLength / 2 - perpY * headSize + perpX * headSize
      );
      ctx.stroke();
    }
  }
}

// Helper function to draw angle arc
function drawAngleArc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  startAngle: number,
  endAngle: number,
  label: string,
  radius: number,
) {
  ctx.beginPath();
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 1;
  ctx.arc(cx, cy, radius, startAngle, endAngle);
  ctx.stroke();

  // Label
  const midAngle = (startAngle + endAngle) / 2;
  const labelX = cx + (radius + 15) * Math.cos(midAngle);
  const labelY = cy + (radius + 15) * Math.sin(midAngle);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, labelX, labelY);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

// Helper function to draw polarization legend
function drawPolarizationLegend(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  isAtBrewsterAngle: boolean,
) {
  const legendX = width - 100;
  const legendY = height - 60;

  // Background
  ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
  ctx.fillRect(legendX - 10, legendY - 10, 95, 55);
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1;
  ctx.strokeRect(legendX - 10, legendY - 10, 95, 55);

  // P-polarization legend
  ctx.beginPath();
  ctx.fillStyle = "#fbbf24";
  ctx.arc(legendX + 8, legendY + 5, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e0e0e0";
  ctx.font = "11px sans-serif";
  ctx.fillText("P偏振", legendX + 18, legendY + 9);

  // S-polarization legend
  ctx.beginPath();
  ctx.strokeStyle = "#44ff44";
  ctx.lineWidth = 2;
  ctx.moveTo(legendX, legendY + 28);
  ctx.lineTo(legendX + 16, legendY + 28);
  ctx.stroke();
  ctx.fillStyle = "#e0e0e0";
  ctx.fillText("S偏振", legendX + 18, legendY + 32);

  // Note about Brewster angle
  if (isAtBrewsterAngle) {
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 10px sans-serif";
    ctx.fillText("反射P分量为0", legendX - 8, legendY + 45);
  }
}

// Main demo component
export function BrewsterAngleDemo() {
  useTranslation();
  const { theme } = useTheme();
  const [incidentAngle, setIncidentAngle] = useState(30);
  const [n1, setN1] = useState(1.0);
  const [n2, setN2] = useState(1.5);
  const [animate, setAnimate] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState(0);

  // Calculate Brewster angle
  const brewsterAngle = useMemo(() => {
    return Math.atan(n2 / n1) * (180 / Math.PI);
  }, [n1, n2]);

  // Check if at Brewster angle
  const isAtBrewsterAngle = useMemo(() => {
    return Math.abs(incidentAngle - brewsterAngle) < 2;
  }, [incidentAngle, brewsterAngle]);

  // Calculate refracted angle using Snell's law
  const refractedAngle = useMemo(() => {
    const sinRefracted = (n1 * Math.sin((incidentAngle * Math.PI) / 180)) / n2;
    return Math.asin(Math.min(1, Math.max(-1, sinRefracted))) * (180 / Math.PI);
  }, [incidentAngle, n1, n2]);

  // Check if reflected and refracted are perpendicular
  const arePerpendicular = useMemo(() => {
    const angleBetween = incidentAngle + refractedAngle;
    return Math.abs(angleBetween - 90) < 2;
  }, [incidentAngle, refractedAngle]);

  // Handle material preset change
  const handlePresetChange = useCallback((value: string | number) => {
    const index = Number(value);
    const preset = MATERIAL_PRESETS[index];
    if (preset) {
      setN1(preset.n1);
      setN2(preset.n2);
      setSelectedPreset(index);
      // Set angle close to new Brewster angle
      const newBrewsterAngle = Math.atan(preset.n2 / preset.n1) * (180 / Math.PI);
      setIncidentAngle(Math.round(newBrewsterAngle));
    }
  }, []);

  // Handle set to Brewster angle
  const handleSetToBrewsterAngle = useCallback(() => {
    setIncidentAngle(Math.round(brewsterAngle));
  }, [brewsterAngle]);

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
          布鲁斯特角演示
        </h2>
        <p className={theme === "dark" ? "text-gray-400 mt-1" : "text-gray-600 mt-1"}>
          当反射光与折射光垂直时，反射光为完全偏振光（只有S分量）
        </p>
      </div>

      {/* Main visualization area */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Canvas */}
        <div className="flex-1 bg-slate-900/50 rounded-xl border border-cyan-400/20 overflow-hidden">
          <div className="px-4 py-3 border-b border-cyan-400/10 flex items-center justify-between">
            <h3 className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>光路演示</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSetToBrewsterAngle}
                className="px-3 py-1 text-xs rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
              >
                <Target className="w-3 h-3 inline mr-1" />
                设为布鲁斯特角
              </button>
            </div>
          </div>
          <div className="p-4 flex justify-center">
            <BrewsterAngleCanvas
              incidentAngle={incidentAngle}
              n1={n1}
              n2={n2}
              brewsterAngle={brewsterAngle}
              isAtBrewsterAngle={isAtBrewsterAngle}
              animate={animate}
            />
          </div>
        </div>

        {/* Info panel */}
        <div className="lg:w-[320px] bg-slate-900/50 rounded-xl border border-cyan-400/20 overflow-hidden">
          <div className="px-4 py-3 border-b border-cyan-400/10">
            <h3 className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>参数信息</h3>
          </div>
          <div className="p-4 space-y-4">
            {/* Current status */}
            <div className={`p-3 rounded-lg border ${
              isAtBrewsterAngle
                ? 'bg-amber-500/20 border-amber-500/30'
                : 'bg-slate-800/50 border-slate-700/50'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {isAtBrewsterAngle ? (
                  <Sparkles className="w-4 h-4 text-amber-400" />
                ) : (
                  <Lightbulb className="w-4 h-4 text-cyan-400" />
                )}
                <span className={`text-sm font-semibold ${
                  isAtBrewsterAngle ? 'text-amber-400' : 'text-cyan-400'
                }`}>
                  {isAtBrewsterAngle ? '达到布鲁斯特角!' : '当前状态'}
                </span>
              </div>
              <p className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                {isAtBrewsterAngle
                  ? '反射光与折射光垂直，反射光为完全线偏振光（只有S偏振分量）'
                  : arePerpendicular
                    ? '反射光与折射光垂直'
                    : '调节入射角观察偏振变化'}
              </p>
            </div>

            {/* Angle values */}
            <ValueDisplay label="入射角 θᵢ" value={`${incidentAngle.toFixed(1)}°`} />
            <ValueDisplay label="反射角 θᵣ" value={`${incidentAngle.toFixed(1)}°`} />
            <ValueDisplay label="折射角 θₜ" value={`${refractedAngle.toFixed(1)}°`} />
            <ValueDisplay
              label="布鲁斯特角 θ_B"
              value={`${brewsterAngle.toFixed(1)}°`}
              color={isAtBrewsterAngle ? 'orange' : 'cyan'}
            />

            {/* Brewster angle formula */}
            <Formula>
              {`$\\tan(\\theta_B) = \\frac{n_2}{n_1} = \\frac{${n2.toFixed(2)}}{${n1.toFixed(2)}}$`}
            </Formula>
          </div>
        </div>
      </div>

      {/* Brewster angle alert banner */}
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
                  在布鲁斯特角时，反射光与折射光互相垂直（夹角90°）。
                  此时反射光中的<span className="text-yellow-400 font-semibold">P偏振分量（平行分量）完全消失</span>，
                  反射光成为<span className="text-green-400 font-semibold">完全线偏振光</span>，
                  只包含S偏振分量（垂直分量）。
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Angle control */}
        <ControlPanel title="入射角控制">
          <SliderControl
            label="入射角 θᵢ"
            value={incidentAngle}
            min={0}
            max={89}
            step={0.5}
            unit="°"
            onChange={setIncidentAngle}
            color={isAtBrewsterAngle ? 'orange' : 'cyan'}
            formatValue={(v) => `${v.toFixed(1)}°`}
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setIncidentAngle(30)}
              className={`flex-1 px-3 py-2 text-xs rounded-lg ${theme === "dark" ? "bg-slate-700/50 text-gray-400 border-slate-600/50" : "bg-gray-100/50 text-gray-600 border-gray-300/50"} border hover:border-cyan-400/30 transition-colors`}
            >
              30°
            </button>
            <button
              onClick={handleSetToBrewsterAngle}
              className="flex-1 px-3 py-2 text-xs rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
            >
              布鲁斯特角
            </button>
            <button
              onClick={() => setIncidentAngle(60)}
              className={`flex-1 px-3 py-2 text-xs rounded-lg ${theme === "dark" ? "bg-slate-700/50 text-gray-400 border-slate-600/50" : "bg-gray-100/50 text-gray-600 border-gray-300/50"} border hover:border-cyan-400/30 transition-colors`}
            >
              60°
            </button>
          </div>
        </ControlPanel>

        {/* Material selection */}
        <ControlPanel title="介质选择">
          <PresetButtons
            options={MATERIAL_PRESETS.map((p, i) => ({
              value: i,
              label: p.label,
            }))}
            value={selectedPreset}
            onChange={handlePresetChange}
            columns={3}
          />
          <div className="mt-4 space-y-2">
            <ValueDisplay label="入射介质 n₁" value={n1.toFixed(2)} />
            <ValueDisplay label="折射介质 n₂" value={n2.toFixed(2)} />
          </div>
        </ControlPanel>

        {/* Display options */}
        <ControlPanel title="显示选项">
          <Toggle label="动画效果" checked={animate} onChange={setAnimate} />
          <div className={`mt-4 text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"} space-y-1`}>
            <p>• <span className="text-yellow-400">黄色圆点</span>: P偏振（平行分量）</p>
            <p>• <span className="text-green-400">绿色箭头</span>: S偏振（垂直分量）</p>
          </div>
        </ControlPanel>
      </div>

      {/* Real-world applications */}
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
            这样P偏振光几乎无损耗地通过，而S偏振光被反射，从而产生线偏振激光输出。
          </p>
        </InfoCard>
        <InfoCard title="👓 偏光太阳镜" color="orange">
          <p className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
            水面、路面等水平反射光主要是水平偏振的。
            偏光太阳镜只允许垂直偏振光通过，有效减少眩光，
            让视野更清晰，特别适合驾驶和户外活动。
          </p>
        </InfoCard>
      </div>

      {/* Thinking questions */}
      <div className={`${theme === "dark" ? "bg-slate-900/50 border-cyan-400/20" : "bg-gray-100/50 border-cyan-600/20"} rounded-xl border p-4`}>
        <h3 className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"} mb-3 flex items-center gap-2`}>
          <FlaskConical className="w-4 h-4 text-cyan-400" />
          思考题
        </h3>
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
          <div className={`p-3 ${theme === "dark" ? "bg-slate-800/50" : "bg-gray-200/50"} rounded-lg`}>
            <span className="text-cyan-400 font-semibold">Q1:</span> 如果光从玻璃射向空气，
            布鲁斯特角会变大还是变小？
          </div>
          <div className={`p-3 ${theme === "dark" ? "bg-slate-800/50" : "bg-gray-200/50"} rounded-lg`}>
            <span className="text-cyan-400 font-semibold">Q2:</span> 布鲁斯特角时，
            折射光是什么偏振态？
          </div>
          <div className={`p-3 ${theme === "dark" ? "bg-slate-800/50" : "bg-gray-200/50"} rounded-lg`}>
            <span className="text-cyan-400 font-semibold">Q3:</span> 为什么日落时的
            阳光更容易产生偏振？
          </div>
        </div>
      </div>
    </div>
  );
}

export default BrewsterAngleDemo;
