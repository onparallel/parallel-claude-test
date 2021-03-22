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
              { $ref: "#/definitions/paragraph" },
              { $ref: "#/definitions/list" },
            ],
          },
        },
        type: { enum: ["list-item"] },
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
    paragraph: {
      type: "object",
      properties: {
        children: {
          type: "array",
          items: {
            anyOf: [
              { $ref: "#/definitions/leaf" },
              { $ref: "#/definitions/placeholder" },
            ],
          },
        },
        type: { enum: ["paragraph"] },
      },
    },
    placeholder: {
      type: "object",
      properties: {
        type: { enum: ["placeholder"] },
        placeholder: { type: "string" },
        children: {
          type: "array",
          items: {
            $ref: "#/definitions/leaf",
          },
        },
      },
      required: ["type", "placeholder"],
    },
    leaf: {
      type: "object",
      properties: {
        text: { type: "string" },
        bold: { type: "boolean" },
        italic: { type: "boolean" },
        underline: { type: "boolean" },
      },
      required: ["text"],
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
