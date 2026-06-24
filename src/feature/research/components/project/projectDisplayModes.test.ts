import { describe, expect, it } from "vitest";
import type { PublicProject } from "@/lib/profile.service";
import { sortPublicProjectsByDisplayMode } from "./projectDisplayModes";

function createProject(overrides: Partial<PublicProject>): PublicProject {
  return {
    id: overrides.id ?? "project-id",
    name_zh: overrides.name_zh ?? "默认课题",
    name_en: null,
    description_zh: null,
    description_en: null,
    thumbnail: null,
    status: "active",
    visibility: "public",
    require_approval: true,
    recruitment_requirements: null,
    is_recruiting: false,
    max_members: null,
    member_count: 1,
    is_member: false,
    has_pending_application: false,
    owner_username: "owner",
    owner_avatar_url: null,
    members: [],
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function names(projects: PublicProject[]) {
  return projects.map((project) => project.name_zh);
}

describe("sortPublicProjectsByDisplayMode", () => {
  it("puts recruiting projects first and then recently updated projects in recommended mode", () => {
    const projects = [
      createProject({
        id: "non-recruiting-new",
        name_zh: "非招募但更新",
        is_recruiting: false,
        updated_at: "2026-06-20T00:00:00.000Z",
      }),
      createProject({
        id: "recruiting-old",
        name_zh: "招募较早更新",
        is_recruiting: true,
        updated_at: "2026-06-10T00:00:00.000Z",
      }),
      createProject({
        id: "recruiting-new",
        name_zh: "招募最新更新",
        is_recruiting: true,
        updated_at: "2026-06-21T00:00:00.000Z",
      }),
    ];

    expect(names(sortPublicProjectsByDisplayMode(projects, "recommended"))).toEqual([
      "招募最新更新",
      "招募较早更新",
      "非招募但更新",
    ]);
  });

  it("sorts by member count before stable tie-breakers", () => {
    const projects = [
      createProject({
        id: "four-newer",
        name_zh: "四人较新",
        member_count: 4,
        updated_at: "2026-06-20T00:00:00.000Z",
      }),
      createProject({
        id: "six",
        name_zh: "六人课题",
        member_count: 6,
      }),
      createProject({
        id: "four-recruiting",
        name_zh: "四人招募",
        member_count: 4,
        is_recruiting: true,
        updated_at: "2026-06-01T00:00:00.000Z",
      }),
    ];

    expect(names(sortPublicProjectsByDisplayMode(projects, "member_count"))).toEqual([
      "六人课题",
      "四人招募",
      "四人较新",
    ]);
  });

  it("sorts newest created projects first", () => {
    const projects = [
      createProject({ id: "old", name_zh: "旧课题", created_at: "2026-01-01T00:00:00.000Z" }),
      createProject({ id: "new", name_zh: "新课题", created_at: "2026-06-01T00:00:00.000Z" }),
      createProject({ id: "middle", name_zh: "中间课题", created_at: "2026-03-01T00:00:00.000Z" }),
    ];

    expect(names(sortPublicProjectsByDisplayMode(projects, "created_desc"))).toEqual([
      "新课题",
      "中间课题",
      "旧课题",
    ]);
  });

  it("sorts oldest created projects first", () => {
    const projects = [
      createProject({ id: "old", name_zh: "旧课题", created_at: "2026-01-01T00:00:00.000Z" }),
      createProject({ id: "new", name_zh: "新课题", created_at: "2026-06-01T00:00:00.000Z" }),
      createProject({ id: "middle", name_zh: "中间课题", created_at: "2026-03-01T00:00:00.000Z" }),
    ];

    expect(names(sortPublicProjectsByDisplayMode(projects, "created_asc"))).toEqual([
      "旧课题",
      "中间课题",
      "新课题",
    ]);
  });

  it("keeps missing or invalid dates behind valid dates", () => {
    const projects = [
      createProject({ id: "invalid", name_zh: "A 日期无效", created_at: "not-a-date" }),
      createProject({ id: "empty", name_zh: "B 日期为空", created_at: "" }),
      createProject({ id: "valid-new", name_zh: "有效较新", created_at: "2026-06-01T00:00:00.000Z" }),
      createProject({ id: "valid-old", name_zh: "有效较早", created_at: "2026-01-01T00:00:00.000Z" }),
    ];

    expect(names(sortPublicProjectsByDisplayMode(projects, "created_desc"))).toEqual([
      "有效较新",
      "有效较早",
      "A 日期无效",
      "B 日期为空",
    ]);
    expect(names(sortPublicProjectsByDisplayMode(projects, "created_asc"))).toEqual([
      "有效较早",
      "有效较新",
      "A 日期无效",
      "B 日期为空",
    ]);
  });
});
