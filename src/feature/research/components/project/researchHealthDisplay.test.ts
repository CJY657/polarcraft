import { describe, expect, it } from "vitest";
import { AlertTriangle, CheckCircle, RefreshCw, WifiOff } from "lucide-react";
import { getHealthDisplay } from "./researchHealthDisplay";

describe("getHealthDisplay", () => {
  it("maps healthy status to the accent panel", () => {
    const result = getHealthDisplay("healthy");
    expect(result.icon).toBe(CheckCircle);
    expect(result.text).toBe("系统正常");
    expect(result.panelStyle.color).toBe("var(--paper-accent-strong)");
  });

  it("maps unhealthy status to the amber panel", () => {
    const result = getHealthDisplay("unhealthy");
    expect(result.icon).toBe(AlertTriangle);
    expect(result.text).toBe("系统异常");
    expect(result.panelStyle.color).toBe("#a45a13");
  });

  it("maps offline status to the red panel", () => {
    const result = getHealthDisplay("offline");
    expect(result.icon).toBe(WifiOff);
    expect(result.text).toBe("服务器离线");
    expect(result.panelStyle.color).toBe("#b33d3d");
  });

  it("falls back to the detecting panel for unknown status", () => {
    const result = getHealthDisplay("something-else");
    expect(result.icon).toBe(RefreshCw);
    expect(result.text).toBe("检测中");
    expect(result.panelStyle.color).toBe("var(--glass-text-muted)");
  });
});
