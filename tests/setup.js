import { vi } from "vitest";
import { createRequire } from "module";

const _require = createRequire(import.meta.url);

// Create a proper vi.fn() and expose it globally for the test file to access
const mockCreate = vi.fn();
globalThis.__mockAnthropicCreate = mockCreate;

// Find where Node resolves @anthropic-ai/sdk and inject our mock there
// so that generate.js's CJS require('@anthropic-ai/sdk') gets the mock.
const sdkPath = _require.resolve("@anthropic-ai/sdk");

function MockAnthropic() {
  return { messages: { create: mockCreate } };
}

_require.cache[sdkPath] = {
  id: sdkPath,
  filename: sdkPath,
  loaded: true,
  exports: MockAnthropic,
  parent: null,
  children: [],
  paths: [],
};
