module.exports = {
  testEnvironment: "node",
  testMatch: ["**/specs/*.ts"],
  testPathIgnorePatterns: ["/node_modules/"],
  testTimeout: 100000,
  verbose: true,
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  setupFiles: ["./setup.js"],
};
