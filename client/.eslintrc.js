module.exports = {
  rules: {
    "no-console": ["error", { allow: ["warn", "error"] }],
    "formatjs/enforce-id": [
      "warn",
      {
        idWhitelist: [
          "^((component|page)(\\.[a-z0-9-]+[a-z0-9]){2}|(generic)(\\.[a-z0-9-]+[a-z0-9]))$",
        ],
        idInterpolationPattern: "*",
      },
    ],
  },
};
