import { Suspense, lazy } from "react"; // React 组件懒加载和 Suspense
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom"; // React Router 组件，删去navigate重定向模块，后续可能使用
import { ErrorBoundary } from "@/components/ui/ErrorBoundary"; // 错误边界组件
import { AuthProvider } from "@/contexts/AuthContext"; // 认证上下文
// Shared Components - 共享组件
import { Footer } from "@/components/shared/Footer"; // 页脚组件

// Lazy load all pages for code splitting
// 懒加载所有页面组件以实现代码分割

const HomePage = lazy(() => import("@/pages/HomePage"));

// 6 Core Modules - 六大核心模块（一级页面）
// 每个模块都是独立的一级页面，不再是简单的导航枢纽

// ============================================================
// Module 1: 课程历史
// 科学原理 × 历史故事
const CoursesPage = lazy(() => import("@/pages/CoursesPage"));

// Module 2: 光学器件
// 偏振器件 × 光路设计
const DevicesPage = lazy(() => import("@/pages/DevicesPage"));

// Module 3: 理论模拟
// 基础理论 × 计算模拟
const DemosPage = lazy(() => import("@/pages/DemosPage"));

// Module 4: 游戏挑战
// 解谜逃脱 × 我的世界
const GamesPage = lazy(() => import("@/pages/GamesPage"));
const EscapePage = lazy(() => import("@/feature/games/EscapePage"));
const MinecraftPage = lazy(() => import("@/feature/games/MinecraftPage"));

// Module 5: 成果展示
// 课程成果 × 文创作品
const GalleryPage = lazy(() => import("@/pages/GalleryPage"));
const WorkDetailPage = lazy(() => import("@/feature/gallery/detail").then(m => ({ default: m.WorkDetailPage })));

// Module 6: 虚拟课题
// 开放研究 × 课题实践
// Note: /lab route now uses ResearchProjectList directly

// Research System Routes / 虚拟课题组系统路由
const ResearchProjectList = lazy(() => import("@/feature/research/components/project/ProjectList").then(m => ({ default: m.ProjectList })));
const ResearchProjectPage = lazy(() => import("@/feature/research/pages/ResearchProjectPage").then(m => ({ default: m.ResearchProjectPage })));
const ResearchCanvas = lazy(() => import("@/feature/research/components/canvas/ResearchCanvas").then(m => ({ default: m.ResearchCanvas })));

// Wrapper component for ResearchCanvas to extract route params
// ResearchCanvas 包装组件用于提取路由参数
function ResearchCanvasWrapper() {
  const { projectId, canvasId } = useParams();
  if (!projectId || !canvasId) {
    return <div>Invalid URL: missing projectId or canvasId</div>;
  }
  return <ResearchCanvas projectId={projectId} canvasId={canvasId} />;
}
// ============================================================

// About Page - 关于页面
const AboutPage = lazy(() => import("@/pages/AboutPage"));

// Auth Pages - 认证页面
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));

function PageLoader() {
  return (
    <>
      {/* Fullscreen centered loader 全屏居中加载器 */}
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        {/* Animated spinner with text 带文字的动画旋转器 */}
        <div className="animate-pulse flex flex-col items-center gap-4">
          {/* Spinner 旋转器 */}
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-cyan-400 text-sm">Loading...</span>
        </div>
      </div>
    </>
  );
} // 页面加载器组件

// ============================================================
// Main App Component
// 主应用组件

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Home - 首页 */}
              <Route
                path="/"
                element={<HomePage />}
              />

              {/* 6 Core Modules - 六大核心模块（一级页面）首页六个模块直接链接到这些页面 */}

              {/* Module 1: 课程历史 */}
              <Route
                path="/courses"
                element={<CoursesPage />}
              />

              {/* Module 2: 光学器件 */}
              <Route
                path="/devices"
                element={<DevicesPage />}
              />

              {/* Module 3: 理论模拟 */}
              <Route
                path="/demos"
                element={<DemosPage />}
              />
              <Route
                path="/demos/:demoId"
                element={<DemosPage />}
              />

              {/* Module 4: 游戏挑战 */}
              <Route
                path="/games"
                element={<GamesPage />}
              />
              <Route
                path="/games/escape"
                element={<EscapePage />}
              />
              <Route
                path="/games/minecraft"
                element={<MinecraftPage />}
              />

              {/* Module 5: 成果展示 */}
              <Route
                path="/gallery"
                element={<GalleryPage />}
              />
              <Route
                path="/gallery/:tabId"
                element={<GalleryPage />}
              />
              <Route
                path="/gallery/work/:workId"
                element={<WorkDetailPage />}
              />

              {/* Module 6: 虚拟课题 */}
              {/* Research System / 虚拟课题组系统 */}
              <Route
                path="/lab"
                element={<ResearchProjectList />}
              />
              <Route
                path="/lab/projects"
                element={<ResearchProjectList />}
              />
              <Route
                path="/lab/projects/:projectId"
                element={<ResearchProjectPage />}
              />
              <Route
                path="/lab/projects/:projectId/canvases/:canvasId"
                element={<ResearchCanvasWrapper />}
              />

              <Route
                path="/about"
                element={<AboutPage />}
              />

              {/* Auth Pages - 认证页面 */}
              <Route
                path="/login"
                element={<LoginPage />}
              />
              <Route
                path="/register"
                element={<RegisterPage />}
              />
              {/* Default route for 404 pages */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center bg-slate-900">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-4">404</h1>
                    <p className="text-gray-400 mb-6">Page not found</p>
                    <button
                      onClick={() => (window.location.href = "/")}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Go Home
                    </button>
                  </div>
                </div>
              }
            />
          </Routes>
          </Suspense>
          <Footer />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
