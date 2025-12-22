module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["./test/setupFile.ts"],
  setupFilesAfterEnv: ["./test/setupTests.ts"],
  globalSetup: "./test/globalSetup.ts",
  testMatch: ["**/__tests__/**/*.test.ts?(x)"],
  testTimeout: 12000,
  coveragePathIgnorePatterns: ["/node_modules/", "/src/emails/", "src/pdf/"],
};
