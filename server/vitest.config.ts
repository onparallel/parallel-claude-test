import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Force graphql to always resolve to the CJS entry point. The graphql
    // package exposes both "main" (CJS) and "module" (ESM) fields. Vite
    // prefers the ESM entry while Node.js require() uses CJS, which causes
    // two separate module evaluations and duplicate GraphQL class instances.
    // This breaks nexus's instanceof checks with "Cannot use GraphQLScalarType
    // from another module" errors.
    alias: {
      graphql: path.resolve(__dirname, "../node_modules/graphql/index.js"),
    },
  },
  test: {
    globals: true,
    isolate: false,
    environment: "node",
    setupFiles: ["./test/setupFile.ts", "./test/setupTests.ts"],
    globalSetup: ["./test/globalSetup.ts"],
    include: ["**/__tests__/**/*.test.ts?(x)"],
    testTimeout: 12000,
    coverage: {
      exclude: ["**/node_modules/**", "src/emails/**", "src/pdf/**"],
    },
  },
});
