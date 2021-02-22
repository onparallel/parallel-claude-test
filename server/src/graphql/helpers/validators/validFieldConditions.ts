import { core } from "@nexus/schema";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import Ajv from "ajv";
import { ArgValidationError } from "../errors";
import { fromGlobalId } from "../../../util/globalId";
import { ApiContext } from "../../../context";

interface Condition {
  fieldId: string;
  modifier: "ANY" | "ALL" | "NONE" | "NUMBER_OF_REPLIES";
  operator:
    | "EQUAL"
    | "NOT_EQUAL"
    | "START_WITH"
    | "END_WITH"
    | "CONTAIN"
    | "NOT_CONTAIN"
    | "LESS_THAN"
    | "LESS_THAN_OR_EQUAL"
    | "GREATER_THAN"
    | "GREATER_THAN_OR_EQUAL";
  value: string | number;
}

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["type", "operator", "conditions"],
  properties: {
    type: { enum: ["SHOW", "HIDE"] },
    operator: { enum: ["AND", "OR"] },
    conditions: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "fieldId", "modifier", "operator", "value"],
        properties: {
          id: { type: "string" },
          fieldId: { type: "string" },
          modifier: { enum: ["ANY", "ALL", "NONE", "NUMBER_OF_REPLIES"] },
          operator: {
            enum: [
              "EQUAL",
              "NOT_EQUAL",
              "START_WITH",
              "END_WITH",
              "CONTAIN",
              "NOT_CONTAIN",
              "LESS_THAN",
              "LESS_THAN_OR_EQUAL",
              "GREATER_THAN",
              "GREATER_THAN_OR_EQUAL",
            ],
          },
          value: { type: ["string", "integer"] },
        },
      },
    },
  },
};

function validateCondition(ctx: ApiContext) {
  return async (c: Condition) => {
    let id: number;
    let type: string;
    try {
      const data = fromGlobalId(c.fieldId);
      id = data.id;
      type = data.type;
      if (type !== "PetitionField") {
        throw new Error(`Invalid GlobalID ${c.fieldId}`);
      }
    } catch {
      throw new Error(`Invalid GlobalID ${c.fieldId}`);
    }
    const field = await ctx.petitions.loadField(id);
    if (!field) {
      throw new Error(`Can't find field with id ${id}`);
    }

    if (field.type === "FILE_UPLOAD" && c.modifier !== "NUMBER_OF_REPLIES") {
      throw new Error(
        `Invalid modifier ${c.modifier} for field of type ${field.type}`
      );
    }

    if (
      field.type === "SELECT" &&
      ![
        "EQUAL",
        "NOT_EQUAL",
        "LESS_THAN",
        "LESS_THAN_OR_EQUAL",
        "GREATER_THAN",
        "GREATER_THAN_OR_EQUAL",
      ].includes(c.operator)
    ) {
      throw new Error(
        `Invalid operator ${c.operator} for field of type ${field.type}`
      );
    }

    if (
      (["NUMBER_OF_REPLIES"].includes(c.modifier) &&
        ![
          "EQUAL",
          "NOT_EQUAL",
          "LESS_THAN",
          "LESS_THAN_OR_EQUAL",
          "GREATER_THAN",
          "GREATER_THAN_OR_EQUAL",
        ].includes(c.operator)) ||
      (["ANY", "ALL", "NONE"].includes(c.modifier) &&
        ![
          "EQUAL",
          "NOT_EQUAL",
          "START_WITH",
          "END_WITH",
          "CONTAIN",
          "NOT_CONTAIN",
        ].includes(c.operator))
    ) {
      throw new Error(
        `Invalid operator ${c.operator} for modifier ${c.modifier}`
      );
    }

    if (
      (["NUMBER_OF_REPLIES"].includes(c.modifier) &&
        typeof c.value !== "number") ||
      (["ANY", "ALL", "NONE"].includes(c.modifier) &&
        typeof c.value !== "string")
    ) {
      throw new Error(
        `Invalid value type ${typeof c.value} for modifier ${c.modifier}`
      );
    }
    return field.petition_id;
  };
}

export async function validateFieldVisibilityConditions(
  json: any,
  ctx: ApiContext
) {
  const ajv = new Ajv({ allowUnionTypes: true });
  if (!ajv.validate(schema, json)) {
    throw new Error(ajv.errorsText());
  }

  const petitionIds = await Promise.all(
    (json.conditions as Condition[]).map(validateCondition(ctx))
  );

  if (new Set(petitionIds).size !== 1) {
    throw new Error(`All fields must be linked to the same Petition`);
  }
}

export function validFieldVisibilityJson<
  TypeName extends string,
  FieldName extends string
>(prop: (args: core.ArgsValue<TypeName, FieldName>) => any, argName: string) {
  return ((root, args, ctx, info) => {
    try {
      const json = prop(args);
      validateFieldVisibilityConditions(json, ctx);
    } catch (e) {
      throw new ArgValidationError(info, argName, e.message);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
