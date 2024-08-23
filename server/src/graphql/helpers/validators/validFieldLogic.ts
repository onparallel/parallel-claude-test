import Ajv from "ajv";
import { core } from "nexus";
import { isNonNullish, isNullish } from "remeda";
import { assert } from "ts-essentials";
import { PetitionField } from "../../../db/__types";
import { selectOptionsValuesAndLabels } from "../../../db/helpers/fieldOptions";
import { PetitionVariable } from "../../../db/repositories/PetitionRepository";
import {
  PetitionFieldLogic,
  PetitionFieldLogicCondition,
  PetitionFieldMath,
  PetitionFieldMathOperation,
  PetitionFieldVisibility,
  mapFieldLogicCondition,
  mapFieldMathOperation,
} from "../../../util/fieldLogic";
import { isFileTypeField } from "../../../util/isFileTypeField";
import { ArgValidationError } from "../errors";
import { DynamicSelectOption } from "../parseDynamicSelectValues";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

const PETITION_FIELD_LOGIC_CONDITION_SCHEMA = {
  type: "object",
  allOf: [
    {
      type: "object",
      required: ["operator", "value"],
      properties: {
        operator: {
          enum: [
            "EQUAL",
            "NOT_EQUAL",
            "START_WITH",
            "END_WITH",
            "CONTAIN",
            "NOT_CONTAIN",
            "IS_ONE_OF",
            "NOT_IS_ONE_OF",
            "IS_IN_LIST",
            "NOT_IS_IN_LIST",
            "LESS_THAN",
            "LESS_THAN_OR_EQUAL",
            "GREATER_THAN",
            "GREATER_THAN_OR_EQUAL",
            "NUMBER_OF_SUBREPLIES",
          ],
        },
        value: {
          oneOf: [
            { type: ["string", "integer", "number", "null"] },
            { type: "array", items: { type: "string" } },
          ],
        },
      },
    },
    {
      type: "object",
      oneOf: [
        {
          type: "object",
          required: ["fieldId", "modifier"],
          properties: {
            fieldId: { type: "number" },
            column: { type: "number" },
            modifier: {
              enum: ["ANY", "ALL", "NONE", "NUMBER_OF_REPLIES"],
            },
          },
        },
        {
          type: "object",
          required: ["variableName"],
          properties: {
            variableName: { type: "string" },
          },
        },
      ],
    },
  ],
};

const PETITION_FIELD_VISIBILITY_SCHEMA = {
  type: ["object", "null"],
  additionalProperties: false,
  required: ["type", "operator", "conditions"],
  properties: {
    type: { enum: ["SHOW", "HIDE"] },
    operator: { enum: ["AND", "OR"] },
    conditions: {
      type: "array",
      minItems: 1,
      maxItems: 15,
      items: PETITION_FIELD_LOGIC_CONDITION_SCHEMA,
    },
  },
};

const PETITION_FIELD_MATH_OPERATION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["variable", "operand", "operator"],
  properties: {
    variable: { type: "string" },
    operand: {
      oneOf: [
        {
          type: "object",
          required: ["type", "value"],
          properties: {
            type: { enum: ["NUMBER"] },
            value: { type: "number" },
          },
        },
        {
          type: "object",
          required: ["type", "fieldId"],
          properties: {
            type: { enum: ["FIELD"] },
            fieldId: { type: "number" },
          },
        },
        {
          type: "object",
          required: ["type", "name"],
          properties: {
            type: { enum: ["VARIABLE"] },
            name: { type: "string" },
          },
        },
      ],
    },
    operator: { enum: ["ASSIGNATION", "ADDITION", "SUBSTRACTION", "MULTIPLICATION", "DIVISION"] },
  },
};

const PETITION_FIELD_MATH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["operator", "conditions", "operations"],
  properties: {
    operator: { enum: ["AND", "OR"] },
    conditions: {
      type: "array",
      minItems: 1,
      maxItems: 10,
      items: PETITION_FIELD_LOGIC_CONDITION_SCHEMA,
    },
    operations: {
      type: "array",
      minItems: 1,
      maxItems: 10,
      items: PETITION_FIELD_MATH_OPERATION_SCHEMA,
    },
  },
};

const PETITION_FIELD_LOGIC_SCHEMA = {
  type: "object",
  additionalProperties: true,
  required: ["visibility", "math"],
  properties: {
    visibility: PETITION_FIELD_VISIBILITY_SCHEMA,
    math: {
      type: ["array", "null"],
      minItems: 1,
      maxItems: 10,
      items: PETITION_FIELD_MATH_SCHEMA,
    },
  },
};

function assertOneOf<T>(value: any, options: T[], errorMessage?: string): asserts value is T {
  assert(options.includes(value), errorMessage);
}

export function validateReferencingFieldsPositions<
  TField extends Pick<PetitionField, "id" | "position" | "parent_petition_field_id">,
>(field: TField, referencedField: TField, allFields: TField[]) {
  let fieldPosition = field.position;
  let referencedFieldPosition = referencedField.position;
  if (
    isNonNullish(field.parent_petition_field_id) &&
    isNullish(referencedField.parent_petition_field_id)
  ) {
    // child references a normal field, use parent position
    fieldPosition = allFields.find((f) => f.id === field.parent_petition_field_id)!.position;
  } else if (
    isNonNullish(field.parent_petition_field_id) &&
    isNonNullish(referencedField.parent_petition_field_id) &&
    field.parent_petition_field_id !== referencedField.parent_petition_field_id
  ) {
    // child references a child of another field group, use parent position for both
    fieldPosition = allFields.find((f) => f.id === field.parent_petition_field_id)!.position;
    referencedFieldPosition = allFields.find(
      (f) => f.id === referencedField.parent_petition_field_id,
    )!.position;
  } else if (
    isNullish(field.parent_petition_field_id) &&
    isNonNullish(referencedField.parent_petition_field_id)
  ) {
    // field references a child of a field group, use parent position for referenced child
    referencedFieldPosition = allFields.find(
      (f) => f.id === referencedField.parent_petition_field_id,
    )!.position;
  }

  assert(referencedFieldPosition <= fieldPosition, "Can't reference fields that come next");
}

export async function validateFieldLogic<
  TField extends Pick<
    PetitionField,
    | "id"
    | "type"
    | "position"
    | "options"
    | "visibility"
    | "math"
    | "petition_id"
    | "parent_petition_field_id"
  >,
>(field: TField, allFields: TField[], variables: PetitionVariable[]) {
  async function validateLogicCondition(
    c: PetitionFieldLogicCondition,
    index: number,
    opts?: { allowSelfReference: boolean },
  ) {
    if ("fieldId" in c) {
      const referencedField = allFields.find((f) => f.id === c.fieldId);

      assert(
        referencedField !== undefined,
        `Can't find PetitionField:${c.fieldId} referenced in PetitionField:${field.id}, condition ${index}`,
      );

      if (!opts?.allowSelfReference) {
        assert(field.id !== referencedField.id, "Can't add a reference to field itself");
      }

      validateReferencingFieldsPositions(field, referencedField, allFields);

      assert(referencedField.type !== "HEADING", `Conditions can't reference HEADING fields`);
      assert(
        referencedField.petition_id === field.petition_id,
        `Field with id ${referencedField.id} is not linked to petition with id ${field.petition_id}`,
      );

      assert(
        referencedField.type === "FIELD_GROUP" ? c.modifier === "NUMBER_OF_REPLIES" : true,
        "FIELD_GROUP can only be referenced with NUMBER_OF_REPLIES",
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
          ] as const,
          `Invalid operator ${c.operator} for modifier ${c.modifier}`,
        );
        assert(
          c.value === null || typeof c.value === "number",
          `Invalid value type ${typeof c.value} for modifier ${c.modifier}`,
        );
      } else {
        if (referencedField.type === "TEXT" || referencedField.type === "SHORT_TEXT") {
          assertOneOf(
            c.operator,
            ["EQUAL", "NOT_EQUAL", "START_WITH", "END_WITH", "CONTAIN", "NOT_CONTAIN"] as const,
            `Invalid operator ${c.operator} for field of type ${referencedField.type}`,
          );

          assert(
            c.value === null || typeof c.value === "string",
            `Invalid value type ${typeof c.value} for field of type ${referencedField.type}`,
          );
        } else if (isFileTypeField(referencedField.type)) {
          throw new Error(
            `Invalid modifier ${c.modifier} for field of type ${referencedField.type}`,
          );
        } else if (
          referencedField.type === "SELECT" ||
          (referencedField.type === "DYNAMIC_SELECT" && c.column !== undefined)
        ) {
          const options =
            referencedField.type === "SELECT"
              ? (await selectOptionsValuesAndLabels(referencedField.options)).values
              : getDynamicSelectValues(referencedField.options.values, c.column!);
          assertOneOf(
            c.operator,
            [
              "EQUAL",
              "NOT_EQUAL",
              "IS_ONE_OF",
              "NOT_IS_ONE_OF",
              "IS_IN_LIST",
              "NOT_IS_IN_LIST",
            ] as const,
            `Invalid operator ${c.operator} for field of type ${referencedField.type}`,
          );
          assert(
            c.value === null ||
              (["EQUAL", "NOT_EQUAL"].includes(c.operator) &&
                typeof c.value === "string" &&
                options.includes(c.value)) ||
              (["IS_ONE_OF", "NOT_IS_ONE_OF"].includes(c.operator) &&
                Array.isArray(c.value) &&
                c.value.every((v) => options.includes(v))) ||
              (["IS_IN_LIST", "NOT_IS_IN_LIST"].includes(c.operator) &&
                typeof c.value === "string"),
            `Invalid value ${c.value} for field of type ${
              referencedField.type
            }. Should be one of: ${options.join(", ")}`,
          );
        }
      }
    } else {
      assert(
        typeof c.value === "number",
        `Invalid value type ${typeof c.value} for variable condition ${index}`,
      );

      assertOneOf(
        c.operator,
        [
          "EQUAL",
          "NOT_EQUAL",
          "GREATER_THAN",
          "GREATER_THAN_OR_EQUAL",
          "LESS_THAN",
          "LESS_THAN_OR_EQUAL",
        ] as const,
        `Invalid operator ${c.operator} for variable condition ${index}`,
      );

      assert(
        !!variables.find((v) => v.name === c.variableName),
        `Can't find variable ${c.variableName} referenced in condition ${index}`,
      );
    }
  }

  function validateMathOperation(op: PetitionFieldMathOperation, index: number) {
    assert(
      !!variables.find((v) => v.name === op.variable),
      `Can't find variable ${op.variable} referenced in math operation ${index}`,
    );

    if (op.operand.type === "FIELD") {
      const fieldId = op.operand.fieldId;
      const field = allFields.find((f) => f.id === fieldId);
      assert(!!field, `Can't find field referenced in math operation ${index}`);
      assert(
        field.type === "NUMBER",
        `Can't reference field of type ${field.type} in math operation ${index}`,
      );
    }
    if (op.operand.type === "VARIABLE") {
      const variableName = op.operand.name;
      assert(
        !!variables.find((v) => v.name === variableName),
        `Can't find variable ${variableName} referenced in math operation ${index}`,
      );
    }
  }

  if (!field.visibility && !field.math) {
    return;
  }

  const validator = new Ajv({
    allowUnionTypes: true,
  }).compile<PetitionFieldLogic>(PETITION_FIELD_LOGIC_SCHEMA);

  if (!validator(field)) {
    throw new Error(JSON.stringify(validator.errors));
  }

  assert(
    !field.visibility || field.type !== "HEADING" || !field.options.hasPageBreak,
    `Can't add visibility conditions on a heading with page break`,
  );

  const visibility = field.visibility as PetitionFieldVisibility | null;
  const math = field.math as PetitionFieldMath[] | null;

  for (const c of visibility?.conditions ?? []) {
    const index = visibility!.conditions.indexOf(c);
    await validateLogicCondition(c, index);
  }

  for (const m of math ?? []) {
    for (const c of m.conditions) {
      await validateLogicCondition(c, m.conditions.indexOf(c), { allowSelfReference: true });
    }
    for (const op of m.operations) {
      validateMathOperation(op, m.operations.indexOf(op));
    }
  }
}

export function validFieldVisibility<TypeName extends string, FieldName extends string>(
  petitionIdProp: (args: core.ArgsValue<TypeName, FieldName>) => number,
  fieldIdProp: (args: core.ArgsValue<TypeName, FieldName>) => number,
  prop: (
    args: core.ArgsValue<TypeName, FieldName>,
  ) => PetitionFieldVisibility<string> | null | undefined,
  argName: string,
) {
  return (async (_, args, ctx, info) => {
    try {
      const fieldVisibility = prop(args);
      if (isNullish(fieldVisibility)) {
        return;
      }

      const petitionId = petitionIdProp(args);
      const fieldId = fieldIdProp(args);

      const [field, allFields, petition] = await Promise.all([
        ctx.petitions.loadField(fieldId),
        ctx.petitions.loadAllFieldsByPetitionId(petitionId),
        ctx.petitions.loadPetition(petitionId),
      ]);

      // replace GIDs with numeric for ajv validation
      const visibility = fieldVisibility
        ? {
            ...fieldVisibility,
            conditions: fieldVisibility.conditions.map((c) => mapFieldLogicCondition(c)),
          }
        : null;

      await validateFieldLogic({ ...field!, visibility }, allFields, petition!.variables ?? []);
    } catch (e: any) {
      throw new ArgValidationError(info, argName, e.message);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

export function validFieldMath<TypeName extends string, FieldName extends string>(
  petitionIdProp: (args: core.ArgsValue<TypeName, FieldName>) => number,
  fieldIdProp: (args: core.ArgsValue<TypeName, FieldName>) => number,
  prop: (
    args: core.ArgsValue<TypeName, FieldName>,
  ) => PetitionFieldMath<string>[] | null | undefined,
  argName: string,
) {
  return (async (_, args, ctx, info) => {
    try {
      const fieldMath = prop(args);
      if (isNullish(fieldMath)) {
        return;
      }

      const petitionId = petitionIdProp(args);
      const fieldId = fieldIdProp(args);

      const [field, allFields, petition] = await Promise.all([
        ctx.petitions.loadField(fieldId),
        ctx.petitions.loadAllFieldsByPetitionId(petitionId),
        ctx.petitions.loadPetition(petitionId),
      ]);

      // replace GIDs with numeric for ajv validation
      const math = fieldMath
        ? fieldMath.map((m) => ({
            ...m,
            conditions: m.conditions.map((c) => mapFieldLogicCondition(c)),
            operations: m.operations.map((op) => mapFieldMathOperation(op)),
          }))
        : null;

      await validateFieldLogic({ ...field!, math }, allFields, petition!.variables ?? []);
    } catch (e: any) {
      throw new ArgValidationError(info, argName, e.message);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

function getDynamicSelectValues(values: (string | DynamicSelectOption)[], level: number): string[] {
  if (level === 0) {
    return Array.isArray(values[0])
      ? (values as DynamicSelectOption[]).map(([value]) => value)
      : (values as string[]);
  } else {
    if (values.length && !Array.isArray(values[0])) {
      throw new Error("Invalid level");
    }
    return (values as DynamicSelectOption[]).flatMap(([, children]) =>
      getDynamicSelectValues(children, level - 1),
    );
  }
}
