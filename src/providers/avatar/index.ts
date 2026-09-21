import { env } from "@/lib/env";
import { MockAvatarProvider } from "./mock";
import type { AvatarProvider } from "./types";

let instance: AvatarProvider | null = null;

export function getAvatarProvider(): AvatarProvider {
  if (!instance) {
    if (env.mockAvatar || !env.avatarProviderBaseUrl) {
      instance = new MockAvatarProvider();
    } else {
      const { GenericAvatarProvider } = require("./generic") as typeof import("./generic");
      instance = new GenericAvatarProvider();
    }
  }
  return instance;
}

export type { AvatarProvider, AvatarValidationInput, AvatarValidationResult } from "./types";
