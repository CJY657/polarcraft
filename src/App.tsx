import { Suspense, lazy, useEffect } from "react"; // React 组件懒加载和 Suspense
import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
  useNavigate,
  useLocation,
  useNavigationType,
} from "react-router-dom"; // React Router 组件
import { ErrorBoundary } from "@/components/ui/ErrorBoundary"; // 错误边界组件
import { AuthProvider } from "@/contexts/AuthContext"; // 认证上下文
import { SystemProvider } from "@/contexts/SystemContext"; // 系统上下文
import { AuthDialog } from "@/components/ui/AuthDialog"; // 认证对话框组件
import { useAuthDialogStore } from "@/stores/authDialogStore"; // 认证对话框状态
// Shared Components - 共享组件
import { Footer } from "@/components/shared/Footer"; // 页脚组件
import CourseViewerPage from "@/pages/CourseViewerPage";
import UnitsPage from "@/pages/UnitsPage";

// Lazy load all pages for code splitting
// 懒加载所有页面组件以实现代码分割

const HomePage = lazy(() => import("@/pages/HomePage"));

// 6 Core Modules - 六大核心模块（一级页面）
// 每个模块都是独立的一级页面，不再是简单的导航枢纽

// ============================================================
// Module 1: 课程历史
// 科学原理 × 历史故事
const CoursesPage = lazy(() => import("@/pages/CoursesPage"));

// Module 1b: 实验课单元
// 单元 × 课程
const UnitViewerPage = lazy(() => import("@/pages/UnitViewerPage"));

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
const MinecraftPage = lazy(() => import("@/feature/games/Minecraft/MinecraftPage"));

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
const PublicProjectExplorePage = lazy(() => import("@/feature/research/pages/PublicProjectExplorePage").then(m => ({ default: m.PublicProjectExplorePage })));
const MyProjectsPage = lazy(() => import("@/feature/research/pages/MyProjectsPage").then(m => ({ default: m.MyProjectsPage })));

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

// Admin Pages - 管理员页面
const AdminCoursesPage = lazy(() => import("@/pages/admin/AdminCoursesPage"));
const CourseEditorPage = lazy(() => import("@/pages/admin/CourseEditorPage"));
const AdminUnitsPage = lazy(() => import("@/pages/admin/AdminUnitsPage"));
const UnitEditorPage = lazy(() => import("@/pages/admin/UnitEditorPage"));
const AdminRoute = lazy(() => import("@/components/admin/AdminRoute").then(m => ({ default: m.AdminRoute })));

// Profile Page - 个人中心页面
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));

// Inbox Page - 收件箱页面
const InboxPage = lazy(() => import("@/pages/InboxPage"));

// Auth Redirect Handler - 认证重定向处理组件
function AuthRedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const openDialog = useAuthDialogStore((state) => state.openDialog);

  useEffect(() => {
    const path = location.pathname;
    if (path === '/login') {
      openDialog('login');
    } else if (path === '/register') {
      openDialog('register');
    }
    navigate('/', { replace: true });
  }, [location.pathname, openDialog, navigate]);

  return null;
}

function PageLoader() {
  return (
    <div className="glass-page flex min-h-screen items-center justify-center px-6">
      <div className="glass-panel-strong flex min-w-[240px] flex-col items-center gap-4 rounded-[2rem] px-8 py-8 text-center">
        <div className="glass-chip flex h-14 w-14 items-center justify-center rounded-[1.4rem] border">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[var(--paper-accent)] border-t-transparent" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--paper-foreground)]">学习空间载入中</p>
          <p className="mt-1 text-xs text-[var(--glass-text-muted)]">Preparing the next lesson...</p>
        </div>
      </div>
    </div>
  );
} // 页面加载器组件

function ScrollToTopOnRouteChange() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === "POP") {
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, navigationType]);

  return null;
}

function AppRouterContent() {
  const location = useLocation();

  return (
    <>
      <ScrollToTopOnRouteChange />
      <Suspense
        key={`${location.pathname}${location.search}`}
        fallback={<PageLoader />}
      >
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
          <Route
            path="/courses/:courseId"
            element={<CourseViewerPage />}
          />

          {/* Module 1b: 实验课单元 */}
          <Route
            path="/units"
            element={<UnitsPage />}
          />
          <Route
            path="/units/:unitId/courses/:courseId"
            element={<CourseViewerPage />}
          />
          <Route
            path="/units/:unitId"
            element={<UnitViewerPage />}
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
            element={<MyProjectsPage />}
          />
          <Route
            path="/lab/explore"
            element={<PublicProjectExplorePage />}
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

          {/* Profile - 个人中心 */}
          <Route
            path="/profile"
            element={<ProfilePage />}
          />

          {/* Inbox - 收件箱 */}
          <Route
            path="/inbox"
            element={<InboxPage />}
          />

          {/* Admin - 管理后台 */}
          <Route
            path="/admin/units"
            element={
              <AdminRoute>
                <AdminUnitsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/units/:unitId"
            element={
              <AdminRoute>
                <UnitEditorPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <AdminRoute>
                <AdminCoursesPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/courses/:courseId"
            element={
              <AdminRoute>
                <CourseEditorPage />
              </AdminRoute>
            }
          />

          {/* Auth Pages - 认证页面（重定向到首页并打开对话框） */}
          <Route
            path="/login"
            element={<AuthRedirectHandler />}
          />
          <Route
            path="/register"
            element={<AuthRedirectHandler />}
          />
          {/* Default route for 404 pages */}
          <Route
            path="*"
            element={
              <div className="glass-page flex min-h-screen items-center justify-center px-6">
                <div className="glass-panel-strong max-w-md rounded-[2.25rem] px-8 py-10 text-center">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--glass-text-muted)]">
                    PolarCraft
                  </p>
                  <h1 className="mb-3 text-4xl font-bold text-[var(--paper-foreground)]">404</h1>
                  <p className="mb-6 text-sm leading-7 text-[var(--glass-text-muted)]">
                    这个页面没有找到。回到首页继续浏览课程和学习入口。
                  </p>
                  <button
                    onClick={() => (window.location.href = "/")}
                    className="glass-button glass-button-primary rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    返回首页
                  </button>
                </div>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
}

// ============================================================
// Main App Component
// 主应用组件

export function App() {
  return (
    <ErrorBoundary>
      <SystemProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRouterContent />
            <AuthDialog />
            <Footer />
          </BrowserRouter>
      </AuthProvider>
    </SystemProvider>
  </ErrorBoundary>
  );
}
