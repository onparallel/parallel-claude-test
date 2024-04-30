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
    "formatjs/no-literal-string-in-jsx": [
      "error",
      {
        props: {
          include: [["*", "title"]],
        },
      },
    ],
    "react/forbid-component-props": [
      "error",
      {
        forbid: [
          ...["margin", "padding", "border"].flatMap((p) => [
            { propName: `${p}Left`, message: `Use ${p}Start instead for better rtl support` },
            { propName: `${p}Right`, message: `Use ${p}End instead for better rtl support` },
          ]),
          { propName: `left`, message: `Use insetStart instead for better rtl support` },
          { propName: `right`, message: `Use insetEnd instead for better rtl support` },
        ],
      },
    ],
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "@chakra-ui/react",
            importNames: ["CloseButton"],
            message: 'Please use CloseButton from "@parallel/common/CloseButton" instead.',
          },
          {
            name: "@chakra-ui/react",
            importNames: ["useMergeRefs"],
            message: 'Please use useMergedRef from "@react-hook/merged-ref" instead.',
          },
        ],
      },
    ],
  },
};
