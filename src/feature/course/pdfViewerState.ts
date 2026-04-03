export function getPreservedPageAfterResize(currentPage: number, numPages: number) {
  if (numPages <= 0) {
    return 1;
  }

  return Math.min(Math.max(currentPage, 1), numPages);
}
