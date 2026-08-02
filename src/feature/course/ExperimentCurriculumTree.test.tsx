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
      activePresentationFileId="ppt-1"
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

  it("renders the presentation-materials folder with counts and file rows", () => {
    renderTree();

    const presentationFolder = screen.getByRole("button", { name: /课件材料/ });
    expect(presentationFolder.getAttribute("aria-expanded")).toBe("true");
    expect(presentationFolder.textContent).toContain("2");

    expect(screen.getByRole("button", { name: /课件一/ }).getAttribute("aria-current")).toBe("true");
    expect(screen.getByRole("button", { name: /课件二/ }).getAttribute("aria-current")).toBeNull();
  });

  it("does not render an experimental-data folder", () => {
    renderTree();

    expect(screen.queryByRole("button", { name: /实验数据/ })).toBeNull();
    expect(screen.getAllByRole("button", { name: /材料|数据/ })).toHaveLength(1);
  });

  it("collapses the folder through its disclosure button", () => {
    renderTree();

    const presentationFolder = screen.getByRole("button", { name: /课件材料/ });
    const panelId = presentationFolder.getAttribute("aria-controls") || "";
    expect((document.getElementById(panelId) as HTMLElement).hidden).toBe(false);

    fireEvent.click(presentationFolder);

    expect(presentationFolder.getAttribute("aria-expanded")).toBe("false");
    expect((document.getElementById(panelId) as HTMLElement).hidden).toBe(true);
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

  it("renders an empty folder when the active experiment has no presentation files", () => {
    renderTree({ presentationFiles: [] });

    expect(screen.getByText("暂无文件")).toBeTruthy();
    expect(screen.getByRole("button", { name: /课件材料/ }).textContent).toContain("0");
  });
});
