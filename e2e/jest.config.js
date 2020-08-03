module.exports = {
  testEnvironment: "node",
  globals: {
    baseURL: "http://localhost:3000",
  },
  testMatch: ["**/specs/*.ts"],
  testPathIgnorePatterns: ["/node_modules/"],
  verbose: true,
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  setupFilesAfterEnv: ["./jest.setup.js"],
};
