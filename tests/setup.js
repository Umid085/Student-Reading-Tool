import { vi } from "vitest";

// Expose a shared vi.fn() globally so generate.test.js can control it
const mockCreate = vi.fn();
globalThis.__mockAnthropicCreate = mockCreate;

// ESM-compatible mock — replaces the old require.cache approach (CJS only)
vi.mock("@anthropic-ai/sdk", () => ({
  default: function Anthropic() {
    this.messages = { create: globalThis.__mockAnthropicCreate };
  },
}));
