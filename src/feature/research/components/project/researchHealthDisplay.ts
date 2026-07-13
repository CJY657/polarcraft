import { AlertTriangle, CheckCircle, RefreshCw, WifiOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";

export interface HealthDisplay {
  icon: LucideIcon;
  text: string;
  panelStyle: CSSProperties;
}

/**
 * Map a system health status to its badge icon, label, and panel styling.
 * Shared by the research project list surfaces.
 */
export function getHealthDisplay(healthStatus: string): HealthDisplay {
  switch (healthStatus) {
    case "healthy":
      return {
        icon: CheckCircle,
        text: "系统正常",
        panelStyle: {
          border: "1px solid color-mix(in srgb, var(--paper-accent) 22%, var(--glass-stroke))",
          background: "color-mix(in srgb, var(--paper-accent-soft) 88%, transparent)",
          color: "var(--paper-accent-strong)",
        },
      };
    case "unhealthy":
      return {
        icon: AlertTriangle,
        text: "系统异常",
        panelStyle: {
          border: "1px solid color-mix(in srgb, #d7994c 28%, var(--glass-stroke))",
          background: "color-mix(in srgb, #d7994c 10%, transparent)",
          color: "#a45a13",
        },
      };
    case "offline":
      return {
        icon: WifiOff,
        text: "服务器离线",
        panelStyle: {
          border: "1px solid color-mix(in srgb, #d95b5b 28%, var(--glass-stroke))",
          background: "color-mix(in srgb, #d95b5b 10%, transparent)",
          color: "#b33d3d",
        },
      };
    default:
      return {
        icon: RefreshCw,
        text: "检测中",
        panelStyle: {
          border: "1px solid var(--glass-stroke)",
          background: "color-mix(in srgb, var(--glass-panel-soft) 88%, transparent)",
          color: "var(--glass-text-muted)",
        },
      };
  }
}
