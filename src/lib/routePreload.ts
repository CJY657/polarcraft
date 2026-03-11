export function loadCourseViewerModule() {
  return import("@/feature/course/CourseViewer");
}

export function preloadCourseViewerRoute() {
  return loadCourseViewerModule();
}
