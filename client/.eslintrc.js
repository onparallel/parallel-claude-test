module.exports = {
  rules: {
    "no-console": ["error", { allow: ["warn", "error"] }],
    "formatjs/enforce-id": [
      "warn",
      {
        idWhitelist: ["^((component|page)\\.[a-z-]+\\.[a-z-]+|(generic)\\.[a-z-]+)$"],
        idInterpolationPattern: "*",
      },
    ],
  },
};
