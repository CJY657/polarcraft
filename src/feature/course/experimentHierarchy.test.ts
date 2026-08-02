import { describe, expect, it } from "vitest";

import type { CourseData } from "@/data/courses";
import type { Unit, UnitCourse } from "@/lib/unit.service";

import {
  buildPresentationFiles,
  countExperiments,
  findFirstExperimentId,
  findUnitIdForExperiment,
  toHierarchyUnits,
} from "./experimentHierarchy";

const baseCourse: CourseData = {
  id: "course-1",
  unitId: "unit-1",
  title: { "zh-CN": "冰洲石实验" },
  description: { "zh-CN": "观察双折射" },
  color: "#0ea5e9",
  media: [],
  hyperlinks: [],
};

function createUnit(id: string, sortOrder: number): Unit {
  return {
    id,
    title: { "zh-CN": `单元 ${id}` },
    description: { "zh-CN": "" },
    color: "#0ea5e9",
    sortOrder,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function createUnitCourse(id: string, knowledgeTag: UnitCourse["knowledgeTag"]): UnitCourse {
  return {
    id,
    title: { "zh-CN": `实验 ${id}` },
    description: { "zh-CN": "" },
    color: "#0ea5e9",
    knowledgeTag,
  };
}

describe("buildPresentationFiles", () => {
  it("keeps only PPT files in the existing order and leaves media out of the tree", () => {
    const presentationFiles = buildPresentationFiles({
      ...baseCourse,
      mainSlide: { id: "main-1", url: "/main.pdf", title: { "zh-CN": "主课件" } },
      media: [
        { id: "video-1", type: "video", url: "/v.mp4", title: { "zh-CN": "实验视频" }, duration: 42 },
        { id: "ppt-1", type: "pptx", url: "/a.pptx", title: { "zh-CN": "课件一" } },
        { id: "image-1", type: "image", url: "/i.jpg", title: { "zh-CN": "实验图片" } },
        { id: "ppt-2", type: "pptx", url: "/b.pptx", title: { "zh-CN": "课件二" } },
        { id: "pdf-1", type: "pdf", url: "/p.pdf", title: { "zh-CN": "补充资料" } },
      ],
    });

    expect(presentationFiles.map((file) => file.id)).toEqual(["ppt-1", "ppt-2"]);
  });

  it("falls back to the main slide when the experiment has no PPT", () => {
    const presentationFiles = buildPresentationFiles({
      ...baseCourse,
      mainSlide: { id: "main-1", url: "/main.pdf", title: { "zh-CN": "主课件" } },
      media: [{ id: "video-1", type: "video", url: "/v.mp4", title: { "zh-CN": "实验视频" } }],
    });

    expect(presentationFiles).toEqual([
      { id: "main-1", title: { "zh-CN": "主课件" }, type: "pdf", isMainSlide: true },
    ]);
  });

  it("returns nothing when the experiment has no presentation resources", () => {
    expect(buildPresentationFiles(baseCourse)).toEqual([]);
    expect(buildPresentationFiles(null)).toEqual([]);
  });
});

describe("toHierarchyUnits", () => {
  it("keeps only foundation experiments and preserves the API ordering", () => {
    const units = toHierarchyUnits([
      {
        unit: createUnit("unit-1", 0),
        courses: [
          createUnitCourse("course-1", "foundation"),
          createUnitCourse("course-2", "optical_device"),
          createUnitCourse("course-3", "foundation"),
        ],
      },
      {
        unit: createUnit("unit-2", 1),
        courses: [createUnitCourse("course-4", "student_ppt")],
      },
    ]);

    expect(units.map((unit) => unit.id)).toEqual(["unit-1", "unit-2"]);
    expect(units[0].experiments.map((experiment) => experiment.id)).toEqual([
      "course-1",
      "course-3",
    ]);
    expect(units[0].experiments[0].unitId).toBe("unit-1");
    expect(units[1].experiments).toEqual([]);
    expect(countExperiments(units)).toBe(2);
  });
});

describe("hierarchy lookups", () => {
  const units = toHierarchyUnits([
    { unit: createUnit("unit-1", 0), courses: [createUnitCourse("course-2", "optical_device")] },
    { unit: createUnit("unit-2", 1), courses: [createUnitCourse("course-3", "foundation")] },
  ]);

  it("skips units without foundation experiments when picking the first experiment", () => {
    expect(findFirstExperimentId(units)).toBe("course-3");
    expect(findFirstExperimentId([])).toBeNull();
  });

  it("resolves the unit that owns an experiment", () => {
    expect(findUnitIdForExperiment(units, "course-3")).toBe("unit-2");
    expect(findUnitIdForExperiment(units, "missing")).toBeNull();
    expect(findUnitIdForExperiment(units, null)).toBeNull();
  });
});
