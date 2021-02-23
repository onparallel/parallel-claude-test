import { core } from "@nexus/schema";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import Ajv from "ajv";
import { ArgValidationError } from "../errors";
import { fromGlobalId } from "../../../util/globalId";
import { ApiContext } from "../../../context";

interface Condition {
  fieldId: string | null;
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
  value: string | number | null;
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
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "fieldId", "modifier", "operator", "value"],
        properties: {
          id: { type: "string" },
          fieldId: { type: ["string", "null"] },
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
          value: { type: ["string", "integer", "null"] },
        },
      },
    },
  },
};

async function loadField(fieldId: string, ctx: ApiContext) {
  let id: number;

  try {
    const data = fromGlobalId(fieldId);
    id = data.id;
    if (data.type !== "PetitionField") {
      throw new Error(`Invalid GlobalID ${fieldId}`);
    }
  } catch {
    throw new Error(`Invalid GlobalID ${fieldId}`);
  }
  const field = await ctx.petitions.loadField(id);
  if (!field) {
    throw new Error(`Can't find field with id ${id}`);
  }

  return field;
}

function validateCondition(ctx: ApiContext, petitionId: number) {
  return async (c: Condition) => {
    const field = c.fieldId ? await loadField(c.fieldId, ctx) : null;

    if (field && field.petition_id !== petitionId) {
      throw new Error(
        `Field with id ${field.id} is not linked to petition with id ${petitionId}`
      );
    }

    if (
      field?.type === "SELECT" &&
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

    if (c.modifier === "NUMBER_OF_REPLIES") {
      if (
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
          `Invalid operator ${c.operator} for modifier ${c.modifier}`
        );
      }

      if (c.value !== null && typeof c.value !== "number") {
        throw new Error(
          `Invalid value type ${typeof c.value} for modifier ${c.modifier}`
        );
      }
    } else {
      if (field?.type === "FILE_UPLOAD") {
        throw new Error(
          `Invalid modifier ${c.modifier} for field of type ${field.type}`
        );
      }

      if (
        ![
          "EQUAL",
          "NOT_EQUAL",
          "START_WITH",
          "END_WITH",
          "CONTAIN",
          "NOT_CONTAIN",
        ].includes(c.operator)
      ) {
        throw new Error(
          `Invalid operator ${c.operator} for modifier ${c.modifier}`
        );
      }

      if (c.value !== null && typeof c.value !== "string") {
        throw new Error(
          `Invalid value type ${typeof c.value} for modifier ${c.modifier}`
        );
      }
    }
  };
}

export async function validateFieldVisibilityConditions(
  json: any,
  petitionId: number,
  ctx: ApiContext
) {
  const ajv = new Ajv({ allowUnionTypes: true });
  if (!ajv.validate(schema, json)) {
    throw new Error(ajv.errorsText());
  }

  await Promise.all(
    (json.conditions as Condition[]).map(validateCondition(ctx, petitionId))
  );
}

export function validFieldVisibilityJson<
  TypeName extends string,
  FieldName extends string
>(
  petitionIdProp: (args: core.ArgsValue<TypeName, FieldName>) => number,
  prop: (args: core.ArgsValue<TypeName, FieldName>) => any,
  argName: string
) {
  return ((root, args, ctx, info) => {
    try {
      const json = prop(args);
      const petitionId = petitionIdProp(args);
      validateFieldVisibilityConditions(json, petitionId, ctx);
    } catch (e) {
      throw new ArgValidationError(info, argName, e.message);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
