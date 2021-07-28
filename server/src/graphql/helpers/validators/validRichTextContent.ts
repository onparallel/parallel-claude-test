import { jsonSchema } from "./jsonSchema";

export const validRichTextContent = jsonSchema({
  definitions: {
    "list-item": {
      type: "object",
      properties: {
        children: {
          type: "array",
          minItems: 1,
          items: {
            anyOf: [
              // the first child of a list-item used to be a pargraph, this is here for backwards compatibility
              { $ref: "#/definitions/paragraph" },
              { $ref: "#/definitions/list-item-child" },
              { $ref: "#/definitions/list" },
            ],
          },
        },
        type: { const: "list-item" },
      },
      required: ["type"],
    },
    list: {
      type: "object",
      properties: {
        type: { enum: ["bulleted-list", "numbered-list"] },
        children: {
          type: "array",
          minItems: 1,
          items: {
            $ref: "#/definitions/list-item",
          },
        },
      },
      required: ["type"],
    },
    "list-item-child": {
      type: "object",
      properties: {
        children: {
          type: "array",
          items: { $ref: "#/definitions/leaf" },
        },
        type: { const: "list-item-child" },
      },
    },
    paragraph: {
      type: "object",
      properties: {
        children: {
          type: "array",
          items: { $ref: "#/definitions/leaf" },
        },
        type: { const: "paragraph" },
      },
    },
    placeholder: {
      type: "object",
      properties: {
        type: { const: "placeholder" },
        placeholder: { type: "string" },
      },
      required: ["type", "placeholder"],
    },
    link: {
      type: "object",
      properties: {
        type: { const: "link" },
        url: { type: "string" },
        children: {
          type: "array",
          items: {
            type: "object",
            anyOf: [{ $ref: "#/definitions/text" }],
          },
        },
      },
    },
    text: {
      type: "object",
      properties: {
        text: { type: "string" },
        bold: { type: "boolean" },
        italic: { type: "boolean" },
        underline: { type: "boolean" },
      },
      required: ["text"],
    },
    leaf: {
      type: "object",
      anyOf: [
        { $ref: "#/definitions/placeholder" },
        { $ref: "#/definitions/text" },
        { $ref: "#/definitions/link" },
      ],
    },
    root: {
      type: "array",
      items: {
        anyOf: [
          { $ref: "#/definitions/paragraph" },
          { $ref: "#/definitions/list" },
        ],
      },
    },
  },
  $ref: "#/definitions/root",
});
