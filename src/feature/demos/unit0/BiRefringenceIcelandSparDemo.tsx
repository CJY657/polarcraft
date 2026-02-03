/**
 * 双折射冰洲石演示 | BiRefringence Iceland Spar Demo
 *
 * 使用React Three Fiber实现3D可视化，展示双折射（双重折射）现象 | 3D Demo using React Three Fiber to visualize birefringence (double refraction)
 * 在冰洲石（方解石）晶体中，光线分裂为寻常光（o光）和非寻常光（e光）| in Iceland Spar (calcite crystal), showing how light splits into ordinary (o-ray) and extraordinary (e-ray) rays
 *
 * 本项目首个使用React Three Fiber 3D的演示 | This is the FIRST demo in the project to use React Three Fiber 3D
 * 其他演示继续使用2D Canvas | Other demos continue to use 2D Canvas
 *
 * 3D组件来自: @/feature/demos/components/Birefringence3D | 3D components from: @/feature/demos/components/Birefringence3D
 * 物理计算来自: @/lib/physics/GeoOptics | Physics calculations from: @/lib/physics/GeoOptics
 * 
 * 优化方向：Add Jones calculus (lib/math) for polarization state visualization (future feature)
 */

import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Sparkles, FlaskConical, RotateCcw } from "lucide-react";
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
import {
  calculateWalkOffAngle,
  BIREFRINGENT_MATERIALS,
  type BirefringenceParams,
} from "@/lib/physics/GeoOptics";
// 3D组件库 | 3D Components Library
import {
  CalciteCrystal,
  IncidentRay,
  OrdinaryRay,
  ExtraordinaryRay,
  OpticalAxisIndicator,
  PolarizationIndicators,
  AngleArc,
  // DoubleTextSample, // Disabled: hides the light
  SceneGrid,
  SceneLabels,
} from "../components/Birefringence3D";
import MathText from "@/components/shared/MathText";

// ============================================================================
// 主3D画布组件 | MAIN 3D CANVAS COMPONENT
// ============================================================================

interface BiRefringenceCanvasProps {
  incidentAngle: number;
  crystalRotation: number;
  showORay: boolean;
  showERay: boolean;
  // showText: boolean; // Disabled: hides the light
  animate: boolean;
  onResetCamera: () => void;
}

function BiRefringenceCanvas({
  incidentAngle,
  crystalRotation,
  showORay,
  showERay,
  // showText, // Disabled: hides the light
  animate,
  onResetCamera,
}: BiRefringenceCanvasProps) {
  const cameraControlRef = useRef<any>(null);

  // 双折射参数 | Birefringence parameters
  const params: BirefringenceParams = useMemo(
    () => ({
      incidentAngle,
      crystalRotation,
    }),
    [incidentAngle, crystalRotation]
  );

  const handleResetCamera = () => {
    if (cameraControlRef.current) {
      cameraControlRef.current.reset();
    }
    onResetCamera();
  };

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 2, 8], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        className="bg-slate-950"
      >
        {/* 光照 | Lighting */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-10, -5, -10]} intensity={0.3} color="#4488ff" />

        {/* 轨道控制器 | OrbitControls for draggable/rotatable view */}
        <OrbitControls
          ref={cameraControlRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={15}
          maxPolarAngle={Math.PI}
          minPolarAngle={0}
        />

        {/* 场景网格 | Scene grid */}
        <SceneGrid />

        {/* 晶体 | Crystal */}
        <CalciteCrystal rotation={[0, (crystalRotation * Math.PI) / 180, 0]} />

        {/* 双像文字样本 | Double text sample - Disabled: hides the light */}
        {/* <DoubleTextSample show={false} params={params} /> */}

        {/* 光线 | Light rays */}
        <IncidentRay params={params} animate={animate} />
        {showORay && <OrdinaryRay params={params} animate={animate} />}
        {showERay && <ExtraordinaryRay params={params} animate={animate} />}

        {/* 光轴指示器 | Optical axis indicator */}
        <OpticalAxisIndicator />

        {/* 偏振指示器 | Polarization indicators */}
        <PolarizationIndicators params={params} />

        {/* 角度指示器 | Angle indicator */}
        <AngleArc angle={incidentAngle} />

        {/* 场景标签 | Scene labels */}
        <SceneLabels params={params} showORay={showORay} showERay={showERay} />

        {/* 预留：反射光（未来功能）| Reserved: Reflected ray (future feature) */}
        {/* <ReflectedRay params={params} animate={animate} /> */}
        {/* 预留：波前可视化（未来功能）| Reserved: Wavefront visualization (future feature) */}
        {/* <WavefrontVisualization params={params} time={0} /> */}
      </Canvas>

      {/* 重置视角按钮 | Reset camera button overlay */}
      <button
        onClick={handleResetCamera}
        className="absolute top-2 right-2 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-cyan-400 rounded-lg border border-cyan-400/30 flex items-center gap-2 text-sm transition-colors"
        type="button"
      >
        <RotateCcw className="w-4 h-4" />
        重置视角
      </button>
    </div>
  );
}

// ============================================================================
// 主演示组件 | MAIN DEMO COMPONENT
// ============================================================================

export function BiRefringenceIcelandSparDemo() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  // 状态 | State
  const [incidentAngle, setIncidentAngle] = useState(30);
  const [crystalRotation, setCrystalRotation] = useState(0);
  const [showORay, setShowORay] = useState(true);
  const [showERay, setShowERay] = useState(true);
  // Double text permanently disabled since the toggle was removed (hides the light)
  // const showText = false;
  const [animate, setAnimate] = useState(true);

  // 预留状态（未来功能）| Reserved state (future features)
  // const [showReflectedRay, setShowReflectedRay] = useState(false);
  // const [showWavefront, setShowWavefront] = useState(false);
  // const [showJonesMatrix, setShowJonesMatrix] = useState(false);
  // const [materialPreset, setMaterialPreset] = useState("calcite");

  // 双折射参数 | Birefringence parameters
  const params: BirefringenceParams = useMemo(
    () => ({
      incidentAngle,
      crystalRotation,
    }),
    [incidentAngle, crystalRotation]
  );

  // 计算值 | Calculated values
  const walkOffAngle = useMemo(
    () => calculateWalkOffAngle(params),
    [params]
  );

  const calcite = BIREFRINGENT_MATERIALS.calcite;

  // 显著走离角阈值 | Significant walk-off angle threshold
  const isSignificantWalkOff = walkOffAngle > 2;

  // 重置相机处理器 | Reset camera handler
  const handleResetCamera = () => {
    // 相机重置在BiRefringenceCanvas组件内部处理 | Camera reset is handled internally
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* 标题部分 | Title Section */}
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
          {t("basics.demos.birefringenceIcelandSpar.title") || "双折射效应"}
        </h2>
        <p className={theme === "dark" ? "text-gray-400 mt-1" : "text-gray-600 mt-1"}>
          {t("basics.demos.birefringenceIcelandSpar.description") || "方解石等晶体将一束光分裂为o光和e光的现象"}
        </p>
      </div>

      {/* 主要可视化区域 | Main visualization area */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 画布 | Canvas */}
        <div className="flex-1 bg-slate-900/50 rounded-xl border border-cyan-400/20 overflow-hidden">
          <div className="px-4 py-3 border-b border-cyan-400/10 flex items-center justify-between">
            <h3 className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>3D晶体演示</h3>
            <div className={`flex items-center gap-2 text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />
              入射光
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 ml-2" />
              o光
              <span className="inline-block w-2 h-2 rounded-full bg-purple-400 ml-2" />
              e光
            </div>
          </div>
          <div className="p-4" style={{ height: 500 }}>
            <BiRefringenceCanvas
              incidentAngle={incidentAngle}
              crystalRotation={crystalRotation}
              showORay={showORay}
              showERay={showERay}
              // showText={showText} // Disabled: hides the light
              animate={animate}
              onResetCamera={handleResetCamera}
            />
          </div>
        </div>

        {/* 信息面板 | Info Panel */}
        <div className="lg:w-[320px] bg-slate-900/50 rounded-xl border border-cyan-400/20 overflow-hidden">
          <div className="px-4 py-3 border-b border-cyan-400/10">
            <h3 className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>参数信息</h3>
          </div>
          <div className="p-4 space-y-4">
            {/* 当前状态 | Current status */}
            <div
              className={`p-3 rounded-lg border ${
                isSignificantWalkOff
                  ? "bg-orange-500/20 border-orange-500/30"
                  : "bg-slate-800/50 border-slate-700/50"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {isSignificantWalkOff ? (
                  <Sparkles className="w-4 h-4 text-orange-400" />
                ) : (
                  <FlaskConical className="w-4 h-4 text-cyan-400" />
                )}
                <span
                  className={`text-sm font-semibold ${
                    isSignificantWalkOff ? "text-orange-400" : "text-cyan-400"
                  }`}
                >
                  {isSignificantWalkOff ? "明显的双折射" : "当前状态"}
                </span>
              </div>
              <p className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                {isSignificantWalkOff
                  ? `走离角达到 ${walkOffAngle.toFixed(2)}°，o光和e光显著分离`
                  : "调节入射角和晶体旋转观察双折射现象"}
              </p>
            </div>

            {/* 数值 | Values */}
            <ValueDisplay
              label="入射角"
              value={`${incidentAngle.toFixed(1)}°`}
            />
            <ValueDisplay label="o光折射率 n₀" value={calcite.n_o.toFixed(3)} color="cyan" />
            <ValueDisplay label="e光折射率 nₑ" value={calcite.n_e.toFixed(3)} color="purple" />
            <ValueDisplay
              label="双折射率 Δn"
              value={calcite.deltaN.toFixed(3)}
              color="orange"
            />
            <ValueDisplay
              label="走离角"
              value={`${walkOffAngle.toFixed(2)}°`}
              color={isSignificantWalkOff ? "orange" : "cyan"}
            />

            {/* 公式 | Formula */}
            <Formula highlight>
              {`$\\Delta n = n_o - n_e = ${calcite.deltaN.toFixed(3)}$`}
            </Formula>

            {/* 预留：更多物理参数显示（未来功能）| Reserved: More physics parameter display (future feature) */}
            {/* <ValueDisplay label="相位延迟" value={`${phaseRetardation.toFixed(2)} rad`} color="green" /> */}
            {/* <ValueDisplay label="e光有效折射率" value={effectiveNe.toFixed(3)} color="purple" /> */}
          </div>
        </div>
      </div>

      {/* 走离角警告 | Walk-off angle alert */}
      <AnimatePresence>
        {isSignificantWalkOff && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-orange-400 mb-1">
                  明显的双折射现象
                </h4>
                <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  走离角达到{" "}
                  <span className="text-orange-400 font-semibold">
                    {walkOffAngle.toFixed(2)}°
                  </span>
                  ，o光和e光在晶体中沿不同路径传播。
                  方解石的双折射率Δn ={" "}
                  <span className="text-cyan-400 font-semibold">
                    {calcite.deltaN.toFixed(3)}
                  </span>
                  ，是自然界中最高的之一。
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 控制器 | Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 入射角控制 | Incident angle control */}
        <ControlPanel title="入射角控制">
          <SliderControl
            label="入射角"
            value={incidentAngle}
            min={0}
            max={89}
            step={1}
            unit="°"
            onChange={setIncidentAngle}
            color={isSignificantWalkOff ? "orange" : "cyan"}
            formatValue={(v) => `${v.toFixed(1)}°`}
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setIncidentAngle(0)}
              className={`flex-1 px-3 py-2 text-xs rounded-lg ${theme === "dark" ? "bg-slate-700/50 text-gray-400 border-slate-600/50" : "bg-gray-100/50 text-gray-600 border-gray-300/50"} border hover:border-cyan-400/30 transition-colors`}
              type="button"
            >
              0°
            </button>
            <button
              onClick={() => setIncidentAngle(30)}
              className={`flex-1 px-3 py-2 text-xs rounded-lg ${theme === "dark" ? "bg-slate-700/50 text-gray-400 border-slate-600/50" : "bg-gray-100/50 text-gray-600 border-gray-300/50"} border hover:border-cyan-400/30 transition-colors`}
              type="button"
            >
              30°
            </button>
            <button
              onClick={() => setIncidentAngle(60)}
              className={`flex-1 px-3 py-2 text-xs rounded-lg ${theme === "dark" ? "bg-slate-700/50 text-gray-400 border-slate-600/50" : "bg-gray-100/50 text-gray-600 border-gray-300/50"} border hover:border-cyan-400/30 transition-colors`}
              type="button"
            >
              60°
            </button>
          </div>
        </ControlPanel>

        {/* 晶体旋转控制 | Crystal rotation control */}
        <ControlPanel title="晶体控制">
          <SliderControl
            label="晶体旋转"
            value={crystalRotation}
            min={0}
            max={360}
            step={5}
            unit="°"
            onChange={setCrystalRotation}
            color="purple"
            formatValue={(v) => `${v.toFixed(0)}°`}
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setCrystalRotation(0)}
              className={`flex-1 px-3 py-2 text-xs rounded-lg ${theme === "dark" ? "bg-slate-700/50 text-gray-400 border-slate-600/50" : "bg-gray-100/50 text-gray-600 border-gray-300/50"} border hover:border-purple-400/30 transition-colors`}
              type="button"
            >
              0°
            </button>
            <button
              onClick={() => setCrystalRotation(45)}
              className={`flex-1 px-3 py-2 text-xs rounded-lg ${theme === "dark" ? "bg-slate-700/50 text-gray-400 border-slate-600/50" : "bg-gray-100/50 text-gray-600 border-gray-300/50"} border hover:border-purple-400/30 transition-colors`}
              type="button"
            >
              45°
            </button>
            <button
              onClick={() => setCrystalRotation(90)}
              className={`flex-1 px-3 py-2 text-xs rounded-lg ${theme === "dark" ? "bg-slate-700/50 text-gray-400 border-slate-600/50" : "bg-gray-100/50 text-gray-600 border-gray-300/50"} border hover:border-purple-400/30 transition-colors`}
              type="button"
            >
              90°
            </button>
          </div>

          {/* 预留：材料选择器（未来功能）| Reserved: Material selector (future feature) */}
          {/* <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-xs text-gray-500 mb-2">材料选择</p>
            <select
              value={materialPreset}
              onChange={(e) => setMaterialPreset(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-gray-300"
            >
              <option value="calcite">方解石</option>
              <option value="quartz">石英</option>
              <option value="ice">冰</option>
            </select>
          </div> */}
        </ControlPanel>

        {/* 显示选项 | Display options */}
        <ControlPanel title="显示选项">
          <Toggle label="显示o光" checked={showORay} onChange={setShowORay} />
          <Toggle label="显示e光" checked={showERay} onChange={setShowERay} />
          <Toggle label="动画" checked={animate} onChange={setAnimate} />
          <div className={`mt-4 text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"} space-y-1`}>
            <p>
              • <span className="text-yellow-400">黄色</span>: 入射光
            </p>
            <p>
              • <span className="text-cyan-400">青色</span>: o光 (寻常光)
            </p>
            <p>
              • <span className="text-purple-400">紫色</span>: e光 (非寻常光)
            </p>
            <p>
              • <span className="text-orange-400">橙色</span>: 光轴
            </p>
          </div>

          {/* 预留：更多显示选项（未来功能）| Reserved: More display options (future feature) */}
          {/* <Toggle label="显示反射光" checked={showReflectedRay} onChange={setShowReflectedRay} />
          <Toggle label="显示波前" checked={showWavefront} onChange={setShowWavefront} />
          <Toggle label="显示琼斯矩阵" checked={showJonesMatrix} onChange={setShowJonesMatrix} /> */}
        </ControlPanel>
      </div>

      {/* 信息卡片 | Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard title="维京人的秘密导航晶体" color="cyan">
          <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
            {t("basics.demos.birefringenceIcelandSpar.lifeScene.hook") ||
              "维京人如何在阴天的大洋上导航？传说中的「太阳石」——科学家认为就是方解石晶体！这种晶体即使在多云天气也能通过分析天空偏振找到太阳位置。"}
          </p>
        </InfoCard>

        <InfoCard title="双折射原理" color="purple">
          <ul className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"} space-y-1.5`}>
            <ListItem>{(t("basics.demos.birefringenceIcelandSpar.physics.details", { returnObjects: true }) as string[])[0] || "o光和e光的偏振方向互相垂直"}</ListItem>
            <ListItem>{(t("basics.demos.birefringenceIcelandSpar.physics.details", { returnObjects: true }) as string[])[1] || "两光传播速度不同造成相位差"}</ListItem>
            <ListItem>{(t("basics.demos.birefringenceIcelandSpar.physics.details", { returnObjects: true }) as string[])[2] || "方解石是典型的双折射材料"}</ListItem>
            <ListItem>
              <MathText text={`双折射率 $\\Delta n = n_o - n_e = ${calcite.deltaN.toFixed(3)}$`} />
            </ListItem>
          </ul>
        </InfoCard>

        <InfoCard title="应用场景" color="green">
          <ul className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"} space-y-1.5`}>
            <ListItem>{(t("basics.demos.birefringenceIcelandSpar.frontier.details", { returnObjects: true }) as string[])[0] || "偏振光学元件（渥拉斯顿棱镜）"}</ListItem>
            <ListItem>{(t("basics.demos.birefringenceIcelandSpar.frontier.details", { returnObjects: true }) as string[])[1] || "光通信中的偏振复用技术"}</ListItem>
            <ListItem>{(t("basics.demos.birefringenceIcelandSpar.frontier.details", { returnObjects: true }) as string[])[2] || "应力分析（光弹效应）"}</ListItem>
            <ListItem>偏振干涉测量仪器</ListItem>
          </ul>
        </InfoCard>
      </div>

      {/* 思考题 | Thinking Questions */}
      <div className={`${theme === "dark" ? "bg-slate-900/50 border-cyan-400/20" : "bg-gray-100/50 border-cyan-600/20"} rounded-xl border p-4`}>
        <h3 className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"} mb-3 flex items-center gap-2`}>
          <FlaskConical className="w-4 h-4 text-cyan-400" />
          思考题
        </h3>
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
          <div className={`p-3 ${theme === "dark" ? "bg-slate-800/50" : "bg-gray-200/50"} rounded-lg`}>
            <span className="text-cyan-400 font-semibold">Q1:</span> {(t("basics.demos.birefringenceIcelandSpar.questions.guided", { returnObjects: true }) as string[])[0] || "为什么透过方解石观看文字会产生双像？"}
          </div>
          <div className={`p-3 ${theme === "dark" ? "bg-slate-800/50" : "bg-gray-200/50"} rounded-lg`}>
            <span className="text-cyan-400 font-semibold">Q2:</span> {(t("basics.demos.birefringenceIcelandSpar.questions.guided", { returnObjects: true }) as string[])[1] || "o光和e光之间有什么偏振关系？"}
          </div>
          <div className={`p-3 ${theme === "dark" ? "bg-slate-800/50" : "bg-gray-200/50"} rounded-lg`}>
            <span className="text-cyan-400 font-semibold">Q3:</span> {(t("basics.demos.birefringenceIcelandSpar.questions.openEnded", { returnObjects: true }) as string[])[0] || "双折射如何用于测量透明材料中的应力？"}
          </div>
          <div className={`p-3 ${theme === "dark" ? "bg-slate-800/50" : "bg-gray-200/50"} rounded-lg`}>
            <span className="text-cyan-400 font-semibold">Q4:</span> {(t("basics.demos.birefringenceIcelandSpar.questions.guided_research", { returnObjects: true }) as string[])[0] || "旋转方解石晶体时，两个像会怎么变化？"}
          </div>
        </div>
      </div>

      {/* 预留：DIY实验部分（未来功能）| Reserved: DIY experiment section (future feature) */}
      {/* <div className="bg-slate-900/50 rounded-xl border border-cyan-400/20 p-4">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-cyan-400" />
          DIY实验：塑料中的应力花纹
        </h3>
        <div className="text-xs text-gray-300 space-y-2">
          <p>材料：透明塑料尺、两片偏振片、手机闪光灯</p>
          <p>步骤：将一片偏振片放在光源上，放上透明塑料，上方放第二片偏振片观察</p>
          <p className="text-orange-400">观察：彩虹色的应力花纹显示了塑料受力的位置</p>
        </div>
      </div> */}
    </div>
  );
}

export default BiRefringenceIcelandSparDemo;
