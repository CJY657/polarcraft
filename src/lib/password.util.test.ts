import { describe, expect, it } from "vitest";

import { generateSalt, hashPasswordClient } from "./password.util";

describe("password.util", () => {
  it("generates 32-byte hex salts", () => {
    expect(generateSalt()).toMatch(/^[0-9a-f]{64}$/);
  });

  it("hashes password and salt with SHA-256", async () => {
    await expect(hashPasswordClient("password", "salt")).resolves.toBe(
      "7a37b85c8918eac19a9089c0fa5a2ab4dce3f90528dcdeec108b23ddf3607b99",
    );
  });
});
