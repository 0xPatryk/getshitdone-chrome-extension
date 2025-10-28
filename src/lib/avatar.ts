import { lorelei } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";

/**
 * Generate an AI assistant avatar using a consistent seed
 * @returns Data URI of the avatar image
 */
export function generateAiAvatar(): string {
  const avatar = createAvatar(lorelei, {
    seed: "focus-ai-assistant",
    size: 64,
    backgroundColor: ["b6e3f4", "c0aede", "d1d4f9"],
  });

  return avatar.toDataUri();
}

/**
 * Generate a user avatar using a consistent seed
 * @returns Data URI of the avatar image
 */
export function generateUserAvatar(): string {
  const avatar = createAvatar(lorelei, {
    seed: "focus-user",
    size: 64,
    backgroundColor: ["ffd5dc", "ffdfbf", "d1d4f9"],
  });

  return avatar.toDataUri();
}

/**
 * Generate a custom avatar with specific seed
 * @param seed - The seed to use for avatar generation
 * @returns Data URI of the avatar image
 */
export function generateCustomAvatar(seed: string): string {
  const avatar = createAvatar(lorelei, {
    seed,
    size: 64,
    backgroundColor: ["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf"],
  });

  return avatar.toDataUri();
}

/**
 * Avatar type definitions
 */
export type AvatarDataUri = string;
