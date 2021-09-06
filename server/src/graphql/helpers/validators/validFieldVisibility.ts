import { core } from "@nexus/schema";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import Ajv from "ajv";
import { ArgValidationError } from "../errors";
import { fromGlobalId } from "../../../util/globalId";
import { ApiContext } from "../../../context";
import {
  PetitionFieldVisibilityCondition,
  PetitionFieldVisibility,
} from "../../../util/fieldVisibility";
import { PetitionField } from "../../../db/__types";

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
        required: ["fieldId", "modifier", "operator", "value"],
        properties: {
          fieldId: { type: "string" },
          modifier: {
            enum: ["ANY", "ALL", "NONE", "NUMBER_OF_REPLIES"],
          },
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
              "NUMBER_OF_SUBREPLIES",
            ],
          },
          value: { type: ["string", "integer", "null"] },
          column: { type: "number" },
        },
      },
    },
  },
};

async function loadField(fieldId: string, ctx: ApiContext) {
  const { id } = fromGlobalId(fieldId, "PetitionField");
  const field = await ctx.petitions.loadField(id);
  if (!field) {
    throw new Error(`Can't find field with id ${id}`);
  }

  return field;
}

function assert(predicate: boolean, errorMessage: string) {
  if (!predicate) {
    throw new Error(errorMessage);
  }
}

function assertOneOf<T>(value: T, options: T[], errorMessage: string) {
  assert(options.includes(value), errorMessage);
}

function validateCondition(ctx: ApiContext, petitionId: number, field: PetitionField) {
  assert(
    field.type !== "HEADING" || !field.options.hasPageBreak,
    `Can't add visibility conditions on a heading with page break`
  );

  return async (c: PetitionFieldVisibilityCondition) => {
    const referencedField = await loadField(c.fieldId as string, ctx);

    if (referencedField === null) {
      return;
    }

    assert(referencedField.position < field.position, "Can't reference fields that come next");

    assert(referencedField.type !== "HEADING", `Conditions can't reference HEADING fields`);
    assert(referencedField.id !== field.id, `Can't add a reference to field itself`);
    assert(
      referencedField.petition_id === petitionId,
      `Field with id ${referencedField.id} is not linked to petition with id ${petitionId}`
    );

    // check operator/modifier compatibility
    if (c.modifier === "NUMBER_OF_REPLIES") {
      assertOneOf(
        c.operator,
        [
          "EQUAL",
          "NOT_EQUAL",
          "LESS_THAN",
          "LESS_THAN_OR_EQUAL",
          "GREATER_THAN",
          "GREATER_THAN_OR_EQUAL",
        ],
        `Invalid operator ${c.operator} for modifier ${c.modifier}`
      );
      assert(
        c.value === null || typeof c.value === "number",
        `Invalid value type ${typeof c.value} for modifier ${c.modifier}`
      );
    } else {
      if (referencedField.type === "TEXT" || referencedField.type === "SHORT_TEXT") {
        assertOneOf(
          c.operator,
          ["EQUAL", "NOT_EQUAL", "START_WITH", "END_WITH", "CONTAIN", "NOT_CONTAIN"],
          `Invalid operator ${c.operator} for field of type ${referencedField.type}`
        );

        assert(
          c.value === null || typeof c.value === "string",
          `Invalid value type ${typeof c.value} for field of type ${referencedField.type}`
        );
      } else if (referencedField.type === "FILE_UPLOAD") {
        throw new Error(`Invalid modifier ${c.modifier} for field of type ${referencedField.type}`);
      } else if (referencedField.type === "SELECT") {
        assertOneOf(
          c.operator,
          ["EQUAL", "NOT_EQUAL"],
          `Invalid operator ${c.operator} for field of type ${referencedField.type}`
        );
        assert(
          c.value === null || referencedField.options.values.includes(c.value),
          `Invalid value ${c.value} for field of type ${
            referencedField.type
          }. Should be one of: ${referencedField.options.values.join(", ")}`
        );
      }
    }
  };
}

export async function validateFieldVisibilityConditions(
  json: any,
  petitionId: number,
  fieldId: number,
  ctx: ApiContext
) {
  const validator = new Ajv({
    allowUnionTypes: true,
  }).compile<PetitionFieldVisibility>(schema);

  if (!validator(json)) {
    throw new Error(JSON.stringify(validator.errors));
  }

  const field = (await ctx.petitions.loadField(fieldId))!;

  await Promise.all(json.conditions.map(validateCondition(ctx, petitionId, field)));
}

export function validFieldVisibilityJson<TypeName extends string, FieldName extends string>(
  petitionIdProp: (args: core.ArgsValue<TypeName, FieldName>) => number,
  fieldIdProp: (args: core.ArgsValue<TypeName, FieldName>) => number,
  prop: (args: core.ArgsValue<TypeName, FieldName>) => any,
  argName: string
) {
  return (async (root, args, ctx, info) => {
    try {
      const json = prop(args);
      const petitionId = petitionIdProp(args);
      const fieldId = fieldIdProp(args);
      await validateFieldVisibilityConditions(json, petitionId, fieldId, ctx);
    } catch (e: any) {
      throw new ArgValidationError(info, argName, e.message);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
