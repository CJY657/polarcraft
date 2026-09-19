import { describe, expect, it } from "vitest";

import type { CourseData } from "@/data/courses";
import type { Unit, UnitCourse } from "@/lib/unit.service";

import {
  buildExperimentalDataFiles,
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
  it("keeps only PPT files in the existing order", () => {
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

describe("buildExperimentalDataFiles", () => {
  it("keeps videos, images, and supporting PDFs in the existing order", () => {
    const experimentalDataFiles = buildExperimentalDataFiles({
      media: [
        { id: "video-1", type: "video", url: "/v.mp4", title: { "zh-CN": "实验视频" } },
        { id: "ppt-1", type: "pptx", url: "/a.pptx", title: { "zh-CN": "课件一" } },
        { id: "image-1", type: "image", url: "/i.jpg", title: { "zh-CN": "实验图片" } },
        { id: "pdf-1", type: "pdf", url: "/p.pdf", title: { "zh-CN": "补充资料" } },
      ],
    });

    expect(experimentalDataFiles.map((file) => file.id)).toEqual([
      "video-1",
      "image-1",
      "pdf-1",
    ]);
  });

  it("returns nothing when the experiment has no experimental data", () => {
    expect(buildExperimentalDataFiles({ media: [] })).toEqual([]);
    expect(buildExperimentalDataFiles(null)).toEqual([]);
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

    expect(units.map((unit) => unit.id)).toEqual(["unit-1"]);
    expect(units[0].experiments.map((experiment) => experiment.id)).toEqual([
      "course-1",
      "course-3",
    ]);
    expect(units[0].experiments[0].unitId).toBe("unit-1");
    expect(countExperiments(units)).toBe(2);
  });

  it("keeps only optical-device applications when requested", () => {
    const units = toHierarchyUnits(
      [
        {
          unit: createUnit("unit-1", 0),
          courses: [
            createUnitCourse("course-1", "foundation"),
            createUnitCourse("device-1", "optical_device"),
          ],
        },
      ],
      "optical_device",
    );

    expect(units[0].experiments.map((experiment) => experiment.id)).toEqual(["device-1"]);
    expect(countExperiments(units)).toBe(1);
  });

  it("omits unrelated and empty units from each workspace without duplicating entries", () => {
    const entries = [
      { unit: createUnit("foundation", 0), courses: [createUnitCourse("experiment", "foundation")] },
      { unit: createUnit("applications", 1), courses: [createUnitCourse("device", "optical_device")] },
      { unit: createUnit("empty", 2), courses: [] },
      { unit: createUnit("students", 3), courses: [createUnitCourse("poster", "student_poster")] },
      {
        unit: createUnit("mixed", 4),
        courses: [
          createUnitCourse("mixed-experiment", "foundation"),
          createUnitCourse("mixed-device", "optical_device"),
        ],
      },
    ];
    const experiments = toHierarchyUnits(entries);
    const applications = toHierarchyUnits(entries, "optical_device");

    expect(experiments.map((unit) => unit.id)).toEqual(["foundation", "mixed"]);
    expect(applications.map((unit) => unit.id)).toEqual(["applications", "mixed"]);
    expect(experiments.flatMap((unit) => unit.experiments.map((course) => course.id)))
      .toEqual(["experiment", "mixed-experiment"]);
    expect(applications.flatMap((unit) => unit.experiments.map((course) => course.id)))
      .toEqual(["device", "mixed-device"]);
    expect(toHierarchyUnits(entries.slice(2, 4))).toEqual([]);
    expect(toHierarchyUnits(entries.slice(2, 4), "optical_device")).toEqual([]);
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

describe("toHierarchyUnits experiment categories", () => {
  const categorizedUnit: Unit = {
    ...createUnit("unit-1", 0),
    experimentCategories: [
      { id: "cat-basic", name: { "zh-CN": "基础实验" } },
      { id: "cat-empty", name: { "zh-CN": "拓展实验" } },
    ],
  };

  it("lists experiments directly under units in API order regardless of legacy categories", () => {
    const units = toHierarchyUnits([
      {
        unit: categorizedUnit,
        courses: [
          { ...createUnitCourse("course-1", "foundation"), experimentCategoryId: null },
          { ...createUnitCourse("course-2", "foundation"), experimentCategoryId: "cat-basic" },
          // 失效引用 → 未分类
          { ...createUnitCourse("course-3", "foundation"), experimentCategoryId: "cat-gone" },
          // 旧数据没有字段 → 未分类
          createUnitCourse("course-4", "foundation"),
          { ...createUnitCourse("app-1", "optical_device"), experimentCategoryId: "cat-basic" },
        ],
      },
    ]);

    expect(units[0].experiments.map((experiment) => experiment.id)).toEqual([
      "course-1",
      "course-2",
      "course-3",
      "course-4",
    ]);
    expect(countExperiments(units)).toBe(4);
    expect(findFirstExperimentId(units)).toBe("course-1");
    expect(findUnitIdForExperiment(units, "course-2")).toBe("unit-1");
  });

  it("hides empty units even when they retain legacy category metadata", () => {
    const units = toHierarchyUnits([
      { unit: categorizedUnit, courses: [] },
      { unit: createUnit("unit-2", 1), courses: [] },
      { unit: { ...createUnit("unit-3", 2), experimentCategories: [] }, courses: [] },
    ]);

    expect(units).toEqual([]);
    expect(countExperiments(units)).toBe(0);
    expect(findFirstExperimentId(units)).toBeNull();
  });

  it("ignores categories entirely for the applications module", () => {
    const units = toHierarchyUnits(
      [
        {
          unit: categorizedUnit,
          courses: [
            { ...createUnitCourse("app-1", "optical_device"), experimentCategoryId: "cat-basic" },
          ],
        },
      ],
      "optical_device",
    );

    expect(units[0].experiments.map((experiment) => experiment.id)).toEqual(["app-1"]);
  });
});

it('preserves category assignments on every resource type', () => {
  expect(buildPresentationFiles({ media: [], mainSlide: {
    id: 'main', url: '/main.pdf', title: {}, experimentCategoryId: 'cat-main',
  } })[0].experimentCategoryId).toBe('cat-main');
  const media = [
    { id: 'ppt', type: 'pptx' as const, url: '/slides.pptx', title: {}, experimentCategoryId: 'cat-ppt' },
    { id: 'img', type: 'image' as const, url: '/image.png', title: {}, experimentCategoryId: 'cat-img' },
  ];
  expect(buildPresentationFiles({ media })[0].experimentCategoryId).toBe('cat-ppt');
  expect(buildExperimentalDataFiles({ media })[0].experimentCategoryId).toBe('cat-img');
});
