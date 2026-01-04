import { describe, expect, it, mock } from "bun:test";
import { lorelei } from "@dicebear/collection";

// Mock @dicebear/core
const mockToDataUri = mock(() => "data:image/mock");
const mockCreateAvatar = mock(() => ({
  toDataUri: mockToDataUri,
}));

mock.module("@dicebear/core", () => ({
  createAvatar: mockCreateAvatar,
}));

import {
  generateAiAvatar,
  generateCustomAvatar,
  generateUserAvatar,
} from "./avatar";

describe("Avatar Utilities", () => {
  it("generateAiAvatar should use correct configuration", () => {
    const result = generateAiAvatar();
    expect(result).toBe("data:image/mock");
    expect(mockCreateAvatar).toHaveBeenCalledWith(lorelei, {
      seed: "focus-ai-assistant",
      size: 64,
      backgroundColor: ["b6e3f4", "c0aede", "d1d4f9"],
    });
  });

  it("generateUserAvatar should use correct configuration", () => {
    const result = generateUserAvatar();
    expect(result).toBe("data:image/mock");
    expect(mockCreateAvatar).toHaveBeenCalledWith(lorelei, {
      seed: "focus-user",
      size: 64,
      backgroundColor: ["ffd5dc", "ffdfbf", "d1d4f9"],
    });
  });

  it("generateCustomAvatar should use provided seed", () => {
    const seed = "custom-seed-123";
    const result = generateCustomAvatar(seed);
    expect(result).toBe("data:image/mock");
    expect(mockCreateAvatar).toHaveBeenCalledWith(lorelei, {
      seed,
      size: 64,
      backgroundColor: ["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf"],
    });
  });
});
