import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Course } from "@/lib/course.service";

import { useCourseDetailStore } from "./courseStore";

const { mockCourseApi } = vi.hoisted(() => ({
  mockCourseApi: {
    getPublicCourse: vi.fn(),
  },
}));

vi.mock("@/lib/course.service", () => ({
  courseApi: mockCourseApi,
  normalizeKnowledgeTag: (tag?: string | null) =>
    tag === "optical_device" ? "optical_device" : "foundation",
}));

describe("useCourseDetailStore", () => {
  beforeEach(() => {
    useCourseDetailStore.getState().reset();
    mockCourseApi.getPublicCourse.mockReset();
  });

  it("loads experiment detail from the single public course payload", async () => {
    const course: Course = {
      id: "course1",
      unitId: "unit1",
      title: { "zh-CN": "冰洲石实验" },
      description: { "zh-CN": "观察双折射" },
      color: "#0ea5e9",
      createdAt: "2026-03-14T00:00:00.000Z",
      updatedAt: "2026-03-15T00:00:00.000Z",
      mainSlide: {
        id: "slide1",
        url: "/slides/course1.pdf",
        title: { "zh-CN": "主课件" },
      },
      media: [
        {
          id: "video1",
          type: "video",
          url: "/media/video.mp4",
          title: { "zh-CN": "实验视频" },
          duration: 24,
          sortOrder: 0,
        },
      ],
      hyperlinks: [
        {
          id: "link1",
          sourceMediaId: "deck1",
          page: 1,
          x: 0.5,
          y: 0.5,
          width: 0.2,
          height: 0.2,
          targetMediaId: "video1",
        },
      ],
    };

    mockCourseApi.getPublicCourse.mockResolvedValue(course);

    await useCourseDetailStore.getState().fetchCourse("course1");

    const state = useCourseDetailStore.getState();
    expect(mockCourseApi.getPublicCourse).toHaveBeenCalledTimes(1);
    expect(mockCourseApi.getPublicCourse).toHaveBeenCalledWith("course1");
    expect(state.course).toEqual({
      ...course,
      knowledgeTag: "foundation",
      mainSlide: { ...course.mainSlide, knowledgeTag: "foundation" },
      media: course.media?.map((item) => ({ ...item, knowledgeTag: "foundation" })),
    });
    expect(state.mainSlide).toEqual({ ...course.mainSlide, knowledgeTag: "foundation" });
    expect(state.media).toEqual(
      course.media?.map((item) => ({ ...item, knowledgeTag: "foundation" }))
    );
    expect(state.hyperlinks).toEqual(course.hyperlinks);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });
});
