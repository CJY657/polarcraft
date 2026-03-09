export function loadCourseViewerPageModule() {
  return import("@/pages/CourseViewerPage");
}

export function loadCourseViewerModule() {
  return import("@/feature/course/CourseViewer");
}

export function preloadCourseViewerRoute() {
  return Promise.all([loadCourseViewerPageModule(), loadCourseViewerModule()]);
}
