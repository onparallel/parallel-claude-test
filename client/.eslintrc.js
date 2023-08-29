module.exports = {
  rules: {
    "no-console": ["error", { allow: ["warn", "error"] }],
    "formatjs/enforce-id": [
      "warn",
      {
        idWhitelist: [
          "^generic\\.[a-z0-9-]+[a-z0-9]$",
          "^(component|page|util)(\\.[a-z0-9-]+[a-z0-9]){2}$",
        ],
        idInterpolationPattern: "*",
      },
    ],
  },
};
