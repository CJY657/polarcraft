// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ExperimentCurriculumTree } from "./ExperimentCurriculumTree";
import type { ExperimentFile, HierarchyUnit } from "./experimentHierarchy";

const units: HierarchyUnit[] = [
  {
    id: "unit-1",
    title: { "zh-CN": "第一单元" },
    color: "#0ea5e9",
    experiments: [
      { id: "course-1", unitId: "unit-1", title: { "zh-CN": "冰洲石实验" } },
      { id: "course-2", unitId: "unit-1", title: { "zh-CN": "马吕斯定律" } },
    ],
  },
  {
    id: "unit-2",
    title: { "zh-CN": "第二单元" },
    color: "#f97316",
    experiments: [{ id: "course-3", unitId: "unit-2", title: { "zh-CN": "色偏振" } }],
  },
];

const presentationFiles: ExperimentFile[] = [
  { id: "ppt-1", title: { "zh-CN": "课件一" }, type: "pptx" },
  { id: "ppt-2", title: { "zh-CN": "课件二" }, type: "pptx" },
];

const experimentalDataFiles: ExperimentFile[] = [
  { id: "video-1", title: { "zh-CN": "实验视频" }, type: "video" },
  { id: "image-1", title: { "zh-CN": "实验图片" }, type: "image" },
  { id: "pdf-1", title: { "zh-CN": "补充资料" }, type: "pdf" },
];

type TreeProps = Parameters<typeof ExperimentCurriculumTree>[0];

function renderTree(
  overrides: Partial<Omit<TreeProps, "navigation">> & {
    navigation?: Partial<TreeProps["navigation"]>;
  } = {}
) {
  const { navigation: navigationOverrides, ...propOverrides } = overrides;
  const onSelectExperiment = vi.fn();
  const onSelectFile = vi.fn();
  const onRetry = vi.fn();

  const utils = render(
    <ExperimentCurriculumTree
      navigation={{
        units,
        activeExperimentId: "course-1",
        isLoading: false,
        error: null,
        onRetry,
        onSelectExperiment,
        ...navigationOverrides,
      }}
      presentationFiles={presentationFiles}
      experimentalDataFiles={experimentalDataFiles}
      activePresentationFileId="ppt-1"
      activeExperimentalDataFileId="video-1"
      onSelectFile={onSelectFile}
      theme="light"
      isZh
      {...propOverrides}
    />
  );

  return { ...utils, onSelectExperiment, onSelectFile, onRetry };
}

describe("ExperimentCurriculumTree", () => {
  it("expands only the active unit and experiment", () => {
    renderTree();

    const activeUnitToggle = screen.getByRole("button", { name: /第一单元/ });
    const otherUnitToggle = screen.getByRole("button", { name: /第二单元/ });
    expect(activeUnitToggle.getAttribute("aria-expanded")).toBe("true");
    expect(otherUnitToggle.getAttribute("aria-expanded")).toBe("false");

    const activeExperiment = screen.getByRole("button", { name: /冰洲石实验/ });
    const siblingExperiment = screen.getByRole("button", { name: /马吕斯定律/ });
    expect(activeExperiment.getAttribute("aria-expanded")).toBe("true");
    expect(activeExperiment.getAttribute("aria-current")).toBe("true");
    expect(siblingExperiment.getAttribute("aria-expanded")).toBe("false");
    expect(siblingExperiment.getAttribute("aria-current")).toBeNull();

    // 折叠的单元面板仍然存在于 DOM 中，供 aria-controls 引用
    const otherUnitPanel = document.getElementById(
      otherUnitToggle.getAttribute("aria-controls") || ""
    );
    expect(otherUnitPanel).toBeTruthy();
    expect((otherUnitPanel as HTMLElement).hidden).toBe(true);
  });

  it("lists every file of the active experiment directly under it, without group folders", () => {
    renderTree();

    // 课件材料 / 实验数据 两个分组不再出现
    expect(screen.queryByRole("button", { name: /课件材料/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /实验数据/ })).toBeNull();

    const panelId =
      screen.getByRole("button", { name: /冰洲石实验/ }).getAttribute("aria-controls") || "";
    const fileNames = Array.from(
      document.getElementById(panelId)?.querySelectorAll("button") ?? []
    ).map((button) => button.textContent);
    expect(fileNames).toEqual(["课件一", "课件二", "实验视频", "实验图片", "补充资料"]);
  });

  it("marks the active presentation and the active data file as current", () => {
    renderTree();

    expect(screen.getByRole("button", { name: /课件一/ }).getAttribute("aria-current")).toBe("true");
    expect(screen.getByRole("button", { name: /课件二/ }).getAttribute("aria-current")).toBeNull();
    expect(screen.getByRole("button", { name: /实验视频/ }).getAttribute("aria-current")).toBe(
      "true"
    );
    expect(screen.getByRole("button", { name: /实验图片/ }).getAttribute("aria-current")).toBeNull();
  });

  it("colors the first two levels differently and leaves files uncolored", () => {
    renderTree();

    const unit = screen.getByRole("button", { name: /第一单元/ });
    const experiment = screen.getByRole("button", { name: /冰洲石实验/ });
    const file = screen.getByRole("button", { name: /课件一/ });

    // 第一层靛蓝、第二层青，两级配色必须不同
    expect(unit.className).toMatch(/indigo/);
    expect(experiment.className).toMatch(/cyan-(?!300|600)/);
    expect(experiment.className).not.toMatch(/indigo/);

    // 第三层（文件）不使用任何彩色，也不压成灰色
    const fileColorClasses = file.className
      .split(/\s+/)
      .filter((token) => !token.startsWith("focus-visible:"))
      .join(" ");
    expect(fileColorClasses).not.toMatch(/indigo|cyan|amber|rose|emerald/);
    expect(fileColorClasses).not.toMatch(/text-slate-[1-7]00\b/);
    expect(fileColorClasses).not.toMatch(/bg-slate-/);
  });

  it("uses application terminology without changing the hierarchy", () => {
    renderTree({ navigation: { contentKind: "application" } });

    expect(screen.getByRole("navigation", { name: "应用目录" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /第一单元/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /冰洲石实验/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /课件一/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /实验视频/ })).toBeTruthy();
  });

  it("collapses the active experiment through its disclosure button", () => {
    renderTree();

    const activeExperiment = screen.getByRole("button", { name: /冰洲石实验/ });
    expect(screen.getByRole("button", { name: /课件一/ })).toBeTruthy();

    fireEvent.click(activeExperiment);

    expect(activeExperiment.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("button", { name: /课件一/ })).toBeNull();
  });

  it("discloses another unit without changing the active experiment", () => {
    const { onSelectExperiment } = renderTree();

    fireEvent.click(screen.getByRole("button", { name: /第二单元/ }));

    expect(screen.getByRole("button", { name: /第二单元/ }).getAttribute("aria-expanded")).toBe(
      "true"
    );
    expect(screen.getByRole("button", { name: /第一单元/ }).getAttribute("aria-expanded")).toBe(
      "false"
    );
    expect(onSelectExperiment).not.toHaveBeenCalled();
  });

  it("selects another experiment and forwards file selections", () => {
    const { onSelectExperiment, onSelectFile } = renderTree();

    fireEvent.click(screen.getByRole("button", { name: /马吕斯定律/ }));
    expect(onSelectExperiment).toHaveBeenCalledWith("course-2");

    fireEvent.click(screen.getByRole("button", { name: /课件二/ }));
    expect(onSelectFile).toHaveBeenCalledWith(
      expect.objectContaining({ id: "ppt-2", type: "pptx" })
    );

    fireEvent.click(screen.getByRole("button", { name: /实验图片/ }));
    expect(onSelectFile).toHaveBeenCalledWith(
      expect.objectContaining({ id: "image-1", type: "image" })
    );
  });

  it("uses the same flat layout when the second unit is active", () => {
    renderTree({
      navigation: { activeExperimentId: "course-3" },
      activePresentationFileId: "ppt-2",
      activeExperimentalDataFileId: "image-1",
    });

    expect(screen.getByRole("button", { name: /第二单元/ }).getAttribute("aria-expanded")).toBe(
      "true"
    );
    expect(screen.getByRole("button", { name: /色偏振/ }).getAttribute("aria-expanded")).toBe(
      "true"
    );
    expect(screen.queryByRole("button", { name: /课件材料/ })).toBeNull();
    expect(screen.getByRole("button", { name: /课件二/ }).getAttribute("aria-current")).toBe("true");
    expect(screen.getByRole("button", { name: /实验图片/ }).getAttribute("aria-current")).toBe(
      "true"
    );
  });

  it("closes the mobile drawer after a selection through onAfterSelect", () => {
    const onAfterSelect = vi.fn();
    renderTree({ onAfterSelect });

    fireEvent.click(screen.getByRole("button", { name: /课件二/ }));
    expect(onAfterSelect).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /马吕斯定律/ }));
    expect(onAfterSelect).toHaveBeenCalledTimes(2);
  });

  it("shows a skeleton while the hierarchy loads", () => {
    renderTree({ navigation: { isLoading: true } });

    expect(screen.getByTestId("curriculum-skeleton")).toBeTruthy();
    expect(screen.queryByTestId("curriculum-tree")).toBeNull();
  });

  it("shows an inline retry action when the hierarchy fails", () => {
    const { onRetry } = renderTree({ navigation: { error: "实验目录加载失败" } });

    expect(screen.getByRole("alert").textContent).toContain("实验目录加载失败");
    fireEvent.click(screen.getByRole("button", { name: /重新加载/ }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows an empty state when no foundation experiments exist", () => {
    renderTree({
      navigation: {
        units: [{ id: "unit-1", title: { "zh-CN": "第一单元" }, color: "#0ea5e9", experiments: [] }],
      },
    });

    expect(screen.getByTestId("curriculum-empty").textContent).toContain("暂无实验内容");
  });

  it("shows an application-specific empty state", () => {
    renderTree({
      navigation: {
        contentKind: "application",
        units: [{ id: "unit-1", title: { "zh-CN": "第一单元" }, color: "#0ea5e9", experiments: [] }],
      },
    });

    expect(screen.getByTestId("curriculum-empty").textContent).toContain("暂无前沿应用");
    expect(screen.getByTestId("curriculum-empty").textContent).toContain("光学设备应用");
  });

  it("shows a single empty hint when the active experiment has no files at all", () => {
    renderTree({ presentationFiles: [], experimentalDataFiles: [] });

    expect(screen.getByText("暂无资源")).toBeTruthy();
  });
});
