import Ajv from "ajv";
import { core } from "nexus";
import { isNonNullish } from "remeda";
import { fromGlobalId, isGlobalId } from "../../../util/globalId";
import { SlateNode } from "../../../util/slate/render";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

const RICH_TEXT_CONTENT_SCHEMA = {
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
        type: { enum: ["paragraph", "heading", "subheading"] },
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
        anyOf: [{ $ref: "#/definitions/paragraph" }, { $ref: "#/definitions/list" }],
      },
    },
  },
  $ref: "#/definitions/root",
};

export function validateRichTextContent(json: any) {
  const ajv = new Ajv();
  const valid = ajv.validate(RICH_TEXT_CONTENT_SCHEMA, json);
  if (!valid) {
    throw new Error(ajv.errorsText());
  }
}

export function validRichTextContent<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => any,
  /**
   * if defined, this validator will check that any globalId placeholder in the RTE belongs to a PetitionField on this Petition (deleted PetitionFields are OK)
   * if not defined and the RTE contains globalId placeholders, an error will be thrown
   */
  petitionIdProp: ((args: core.ArgsValue<TypeName, FieldName>) => number) | undefined,
  argName: string,
) {
  return (async (_, args, ctx, info) => {
    async function validateGlobalIdReferences(nodes: SlateNode[], petitionId: number) {
      for (const node of nodes) {
        if (
          node.type === "placeholder" &&
          isNonNullish(node.placeholder) &&
          isGlobalId(node.placeholder)
        ) {
          if (!isGlobalId(node.placeholder, "PetitionField")) {
            throw new Error(`Expected ${node.placeholder} to be a PetitionField`);
          }

          const fieldId = fromGlobalId(node.placeholder).id;
          const field = await ctx.petitions.loadField(fieldId);

          if (isNonNullish(field) && field.petition_id !== petitionId) {
            throw new Error(
              `Expected PetitionField:${field.id} to belong to Petition:${petitionId}`,
            );
          }
        }

        if (isNonNullish(node.children)) {
          await validateGlobalIdReferences(node.children, petitionId);
        }
      }
    }

    try {
      const value = prop(args);
      if (!value) {
        return;
      }
      validateRichTextContent(value);

      if (isNonNullish(petitionIdProp)) {
        await validateGlobalIdReferences(value as SlateNode[], petitionIdProp(args));
      }
    } catch (e: any) {
      throw new ArgValidationError(info, argName, e.message);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
