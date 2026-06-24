import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalDescriptor = Object.getOwnPropertyDescriptor(Promise, "withResolvers");

const restoreWithResolvers = () => {
  if (originalDescriptor) {
    Object.defineProperty(Promise, "withResolvers", originalDescriptor);
    return;
  }

  Reflect.deleteProperty(Promise, "withResolvers");
};

describe("Promise.withResolvers polyfill", () => {
  beforeEach(() => {
    vi.resetModules();
    restoreWithResolvers();
  });

  afterEach(() => {
    restoreWithResolvers();
  });

  it("defines Promise.withResolvers when it is missing", async () => {
    Reflect.deleteProperty(Promise, "withResolvers");

    await import("./promise.with-resolvers.polyfill");

    expect(typeof Promise.withResolvers).toBe("function");
  });

  it("returns a promise with working resolve and reject callbacks", async () => {
    Reflect.deleteProperty(Promise, "withResolvers");

    await import("./promise.with-resolvers.polyfill");

    const resolved = Promise.withResolvers<string>();
    resolved.resolve("ready");
    await expect(resolved.promise).resolves.toBe("ready");

    const rejected = Promise.withResolvers<string>();
    const error = new Error("failed");
    rejected.reject(error);
    await expect(rejected.promise).rejects.toBe(error);
  });

  it("does not overwrite an existing native implementation", async () => {
    const nativeWithResolvers = vi.fn(() => ({
      promise: Promise.resolve("native"),
      resolve: vi.fn(),
      reject: vi.fn(),
    }));

    Object.defineProperty(Promise, "withResolvers", {
      configurable: true,
      value: nativeWithResolvers,
      writable: true,
    });

    await import("./promise.with-resolvers.polyfill");

    expect(Promise.withResolvers).toBe(nativeWithResolvers);
  });
});
