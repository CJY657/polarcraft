// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUnitApi } = vi.hoisted(() => ({
  mockUnitApi: {
    createExperimentCategory: vi.fn(),
    updateExperimentCategory: vi.fn(),
    deleteExperimentCategory: vi.fn(),
    reorderExperimentCategories: vi.fn(),
  },
}));

vi.mock("@/lib/unit.service", () => ({ unitApi: mockUnitApi }));

import { ExperimentCategoryManager } from "./ExperimentCategoryManager";

const categories = [
  { id: "cat-1", name: { "zh-CN": "基础实验" } },
  { id: "cat-2", name: { "zh-CN": "拓展实验", "en-US": "Extended" } },
];

describe("ExperimentCategoryManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a category and keeps the draft when the request fails", async () => {
    mockUnitApi.createExperimentCategory.mockRejectedValueOnce(new Error("网络错误"));
    mockUnitApi.createExperimentCategory.mockResolvedValueOnce({ id: "cat-3", name: { "zh-CN": "应用" } });
    const onChanged = vi.fn();
    render(<ExperimentCategoryManager unitId="unit-1" categories={[]} theme="light" onChanged={onChanged} />);

    fireEvent.click(screen.getByRole("button", { name: /新建分类/ }));
    const createButton = screen.getByRole("button", { name: /创建/ });
    expect((createButton as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("分类名称（中文）"), { target: { value: "应用" } });
    fireEvent.click(createButton);

    expect((await screen.findByRole("alert")).textContent).toContain("网络错误");
    expect((screen.getByLabelText("分类名称（中文）") as HTMLInputElement).value).toBe("应用");
    expect(onChanged).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /创建/ }));
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
    expect(mockUnitApi.createExperimentCategory).toHaveBeenLastCalledWith("unit-1", {
      name_zh: "应用",
      name_en: undefined,
    });
  });

  it("reorders with up/down and deletes after confirmation", async () => {
    mockUnitApi.reorderExperimentCategories.mockResolvedValue(undefined);
    mockUnitApi.deleteExperimentCategory.mockResolvedValue(undefined);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const onChanged = vi.fn();
    render(<ExperimentCategoryManager unitId="unit-1" categories={categories} theme="dark" onChanged={onChanged} />);

    const [moveUpFirst] = screen.getAllByRole("button", { name: "上移分类" });
    expect((moveUpFirst as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getAllByRole("button", { name: "下移分类" })[0]);
    await waitFor(() =>
      expect(mockUnitApi.reorderExperimentCategories).toHaveBeenCalledWith("unit-1", ["cat-2", "cat-1"])
    );

    fireEvent.click(screen.getAllByRole("button", { name: "删除分类" })[1]);
    expect(confirmSpy.mock.calls[0][0]).toContain("拓展实验");
    expect(confirmSpy.mock.calls[0][0]).toContain("实验会保留");
    await waitFor(() => expect(mockUnitApi.deleteExperimentCategory).toHaveBeenCalledWith("unit-1", "cat-2"));
    expect(onChanged).toHaveBeenCalledTimes(2);
    confirmSpy.mockRestore();
  });

  it("renames inline with Enter", async () => {
    mockUnitApi.updateExperimentCategory.mockResolvedValue(categories[0]);
    render(<ExperimentCategoryManager unitId="unit-1" categories={categories} theme="light" onChanged={vi.fn()} />);

    fireEvent.click(screen.getAllByRole("button", { name: "重命名分类" })[0]);
    const input = screen.getByLabelText("分类名称（中文）") as HTMLInputElement;
    expect(input.value).toBe("基础实验");
    fireEvent.change(input, { target: { value: "入门实验" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() =>
      expect(mockUnitApi.updateExperimentCategory).toHaveBeenCalledWith("unit-1", "cat-1", {
        name_zh: "入门实验",
        name_en: undefined,
      })
    );
  });
});
