module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["./test/setupFile.ts"],
  setupFilesAfterEnv: ["./test/setupTests.ts"],
  globalSetup: "./test/setup.ts",
  globalTeardown: "./test/teardown.ts",
  testMatch: ["**/__tests__/**/*.test.ts?(x)"],
  testTimeout: 8000,
};
