import { describe, expect, it } from "vitest";
import { ensureApiSuccess, unwrapApiData } from "./api";

describe("unwrapApiData", () => {
  it("returns data when the response is successful and has a payload", () => {
    expect(unwrapApiData({ success: true, data: [1, 2, 3] }, "失败")).toEqual([1, 2, 3]);
  });

  it("throws the server error message when present", () => {
    expect(() =>
      unwrapApiData({ success: false, error: { code: "X", message: "服务器错误" } }, "默认失败")
    ).toThrow("服务器错误");
  });

  it("throws the fallback message when the response has no data", () => {
    expect(() => unwrapApiData({ success: true }, "默认失败")).toThrow("默认失败");
  });

  it("throws the fallback message when no error message is provided", () => {
    expect(() => unwrapApiData({ success: false }, "默认失败")).toThrow("默认失败");
  });
});

describe("ensureApiSuccess", () => {
  it("does nothing when the response is successful", () => {
    expect(() => ensureApiSuccess({ success: true }, "失败")).not.toThrow();
  });

  it("throws the server error message when present", () => {
    expect(() =>
      ensureApiSuccess({ success: false, error: { code: "X", message: "移除失败" } }, "默认失败")
    ).toThrow("移除失败");
  });

  it("throws the fallback message when no error message is provided", () => {
    expect(() => ensureApiSuccess({ success: false }, "默认失败")).toThrow("默认失败");
  });
});
