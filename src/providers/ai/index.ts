import { env } from "@/lib/env";
import { MockAIProvider } from "./mock";
import type { AIProvider } from "./types";

let instance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!instance) {
    if (env.mockAI) {
      instance = new MockAIProvider();
    } else {
      // Lazy import so the SDK/key are never touched when mocked.
      const { AnthropicAIProvider } = require("./anthropic") as typeof import("./anthropic");
      instance = new AnthropicAIProvider();
    }
  }
  return instance;
}

export type * from "./types";
