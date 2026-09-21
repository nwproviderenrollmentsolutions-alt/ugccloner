import { env } from "@/lib/env";
import { MockVideoGenerationProvider } from "./mock";
import type { VideoGenerationProvider } from "./types";

let instance: VideoGenerationProvider | null = null;

export function getVideoGenerationProvider(): VideoGenerationProvider {
  if (!instance) {
    if (env.mockVideo || !env.videoProviderBaseUrl) {
      instance = new MockVideoGenerationProvider();
    } else {
      const { GenericVideoGenerationProvider } = require("./generic") as typeof import("./generic");
      instance = new GenericVideoGenerationProvider();
    }
  }
  return instance;
}

export type { VideoGenerationProvider, ShotGenerationRequest, GenerationJobHandle, GenerationStatusResult } from "./types";
