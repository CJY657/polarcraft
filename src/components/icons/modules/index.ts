/**
 * Module Icons - Individual icon exports
 * 模块图标 - 独立图标导出
 *
 * This file exports all module icons for easy importing
 */

// Export all icon components
export { CoursesIcon } from './CoursesIcon';
export { DemoGalleryIcon } from './DemoGalleryIcon';
export { GalleryIcon } from './GalleryIcon';
export { LabGroupIcon } from './LabGroupIcon';
export { ApplicationsIcon } from './ApplicationsIcon';
export { CourseIcon } from './CourseIcon';

// Export the shared types interface
export type { IconProps } from './types';

// Export the icon map for easy lookup
import { CoursesIcon } from './CoursesIcon';
import { DemoGalleryIcon } from './DemoGalleryIcon';
import { GalleryIcon } from './GalleryIcon';
import { LabGroupIcon } from './LabGroupIcon';
import { ApplicationsIcon } from './ApplicationsIcon';
import { CourseIcon } from './CourseIcon';

export const ModuleIconMap = {
  courses: CoursesIcon,
  demos: DemoGalleryIcon,
  labGroup: LabGroupIcon,
  applications: ApplicationsIcon,
  course: CourseIcon,
  gallery: GalleryIcon,
};

export type ModuleIconKey = keyof typeof ModuleIconMap;
