import ModuleUnavailablePage from "./ModuleUnavailablePage";

export default function DevicesPage() {
  return (
    <ModuleUnavailablePage
      accent="#14bf96"
      moduleName="光路与器件"
      moduleEyebrow="Optical Workspace"
      title="光路与器件正在优化中"
      description="器件库、实验库和自由光路搭建的整体体验还在打磨，现阶段暂不向学生开放。"
      note="为了避免学生进入未完成页面后直接看到运行错误，当前入口统一改为“暂不开放”。后续稳定后再恢复访问。"
    />
  );
}
