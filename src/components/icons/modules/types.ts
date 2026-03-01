import { cn } from "@/utils/classNames";

export interface IconProps {
  className?: string;
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface AnimatedIconProps {
  className?: string;
  size?: number;
  isHovered?: boolean;
  theme?: "dark" | "light";
}

// Polarization colors matching PolarCraftLogo
export const POLAR_COLORS = {
  deg0: "#ff4444", // 0° - Red (horizontal)
  deg45: "#ffaa00", // 45° - Orange
  deg90: "#44ff44", // 90° - Green (vertical)
  deg135: "#4488ff", // 135° - Blue
};

export { cn };
