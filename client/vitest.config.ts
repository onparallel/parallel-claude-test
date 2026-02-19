import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test/setupTests.ts"],
    include: ["**/__tests__/**/*.test.ts?(x)"],
    alias: {
      "@parallel": path.resolve(__dirname),
    },
    coverage: {
      include: ["utils/**/*.{ts,tsx}"],
      exclude: ["utils/**/*.d.ts", "utils/**/__tests__/**"],
    },
    testTimeout: 10000,
  },
});
