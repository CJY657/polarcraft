/**
 * Module Icons - Individual icon exports
 * 模块图标 - 独立图标导出
 *
 * This file exports all module icons for easy importing
 */

// Export all icon components
export { CoursesIcon } from './CoursesIcon';
export { DeviceLibraryIcon } from './DeviceLibraryIcon';
export { OpticalBenchIcon } from './OpticalBenchIcon';
export { DemoGalleryIcon } from './DemoGalleryIcon';
export { PolarQuestIcon } from './PolarQuestIcon';
export { GalleryIcon } from './GalleryIcon';
export { LabGroupIcon } from './LabGroupIcon';
export { ApplicationsIcon } from './ApplicationsIcon';
export { ExperimentsIcon } from './ExperimentsIcon';
export { OpticsLabIcon } from './OpticsLabIcon';
export { CreativeLabIcon } from './CreativeLabIcon';
export { SimulationLabIcon } from './SimulationLabIcon';
export { CourseIcon } from './CourseIcon';
export { OpenDataIcon } from './OpenDataIcon';
export { PSRTIcon } from './PSRTIcon';
export { ESRTIcon } from './ESRTIcon';
export { ORICIcon } from './ORICIcon';
export { SURFIcon } from './SURFIcon';

// Export the shared types interface
export type { IconProps } from './types';

// Export the icon map for easy lookup
import { CoursesIcon } from './CoursesIcon';
import { DeviceLibraryIcon } from './DeviceLibraryIcon';
import { OpticalBenchIcon } from './OpticalBenchIcon';
import { DemoGalleryIcon } from './DemoGalleryIcon';
import { PolarQuestIcon } from './PolarQuestIcon';
import { GalleryIcon } from './GalleryIcon';
import { LabGroupIcon } from './LabGroupIcon';
import { ApplicationsIcon } from './ApplicationsIcon';
import { ExperimentsIcon } from './ExperimentsIcon';
import { OpticsLabIcon } from './OpticsLabIcon';
import { CreativeLabIcon } from './CreativeLabIcon';
import { SimulationLabIcon } from './SimulationLabIcon';
import { CourseIcon } from './CourseIcon';
import { OpenDataIcon } from './OpenDataIcon';
import { PSRTIcon } from './PSRTIcon';
import { ESRTIcon } from './ESRTIcon';
import { ORICIcon } from './ORICIcon';
import { SURFIcon } from './SURFIcon';

export const ModuleIconMap = {
  // 9 main homepage modules
  courses: CoursesIcon,
  opticalDesignStudio: OpticsLabIcon, // Main mapping for Optical Design Studio
  opticsLab: OpticsLabIcon,
  demos: DemoGalleryIcon,
  polarquest: PolarQuestIcon,
  creativeLab: CreativeLabIcon,
  labGroup: LabGroupIcon,
  applications: ApplicationsIcon,
  simulationLab: SimulationLabIcon,
  openData: OpenDataIcon,
  // Course module
  course: CourseIcon,
  // Learning mode icons
  psrt: PSRTIcon,
  esrt: ESRTIcon,
  oric: ORICIcon,
  surf: SURFIcon,
  // Legacy/alternate names for backward compatibility
  deviceLibrary: DeviceLibraryIcon,
  opticalBench: OpticalBenchIcon,
  gallery: GalleryIcon,
  experiments: ExperimentsIcon,
};

export type ModuleIconKey = keyof typeof ModuleIconMap;
