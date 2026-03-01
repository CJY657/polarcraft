/**
 * Animated Module Icons for Homepage
 * 首页模块动画图标
 *
 * Design inspired by PolarCraftLogo with:
 * - Light beam animations
 * - Polarization colors (0°=red, 45°=orange, 90°=green, 135°=blue)
 * - Glow effects and pulse animations
 * - Interactive hover states
 */

export { CoursesModuleIcon } from "./CoursesModuleIcon";
export { DevicesModuleIcon } from "./DevicesModuleIcon";
export { DemosModuleIcon } from "./DemosModuleIcon";
export { GamesModuleIcon } from "./GamesModuleIcon";
export { GalleryModuleIcon } from "./GalleryModuleIcon";
export { LabModuleIcon } from "./LabModuleIcon";

// Export map for easy lookup
import { CoursesModuleIcon } from "./CoursesModuleIcon";
import { DevicesModuleIcon } from "./DevicesModuleIcon";
import { DemosModuleIcon } from "./DemosModuleIcon";
import { GamesModuleIcon } from "./GamesModuleIcon";
import { GalleryModuleIcon } from "./GalleryModuleIcon";
import { LabModuleIcon } from "./LabModuleIcon";

export const HomeModuleIconMap = {
  courses: CoursesModuleIcon,
  devices: DevicesModuleIcon,
  demos: DemosModuleIcon,
  games: GamesModuleIcon,
  gallery: GalleryModuleIcon,
  lab: LabModuleIcon,
};

export type HomeModuleIconKey = keyof typeof HomeModuleIconMap;
