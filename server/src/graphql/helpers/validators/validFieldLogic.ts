import Ajv from "ajv";
import { isNonNullish, isNullish } from "remeda";
import { assert } from "ts-essentials";
import {
  PetitionField,
  StandardListDefinition,
  StandardListDefinitionListType,
} from "../../../db/__types";
import { PetitionCustomList, PetitionVariable } from "../../../db/repositories/PetitionRepository";
import { PetitionFieldOptions } from "../../../services/PetitionFieldService";
import {
  PetitionFieldLogic,
  PetitionFieldLogicCondition,
  PetitionFieldMath,
  PetitionFieldMathOperation,
  PetitionFieldVisibility,
  mapFieldLogic,
} from "../../../util/fieldLogic";
import { fromGlobalId } from "../../../util/globalId";
import { isFileTypeField } from "../../../util/isFileTypeField";
import { Maybe } from "../../../util/types";
import { NexusGenInputs } from "../../__types";
import { Arg, ArgWithPath, getArg, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { DynamicSelectOption } from "../parseDynamicSelectValues";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

const PETITION_FIELD_LOGIC_CONDITION_SCHEMA = (fieldIdType: "string" | "number") => ({
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
            "ANY_IS_IN_LIST",
            "ALL_IS_IN_LIST",
            "NONE_IS_IN_LIST",
            "HAS_PROFILE_MATCH",
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
            fieldId: { type: fieldIdType },
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
});

const PETITION_FIELD_VISIBILITY_SCHEMA = (fieldIdType: "string" | "number") => ({
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
      items: PETITION_FIELD_LOGIC_CONDITION_SCHEMA(fieldIdType),
    },
  },
});

const PETITION_FIELD_MATH_OPERATION_SCHEMA = (fieldIdType: "string" | "number") => ({
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
            fieldId: { type: fieldIdType },
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
    operator: {
      enum: [
        "ASSIGNATION",
        "ASSIGNATION_IF_LOWER",
        "ASSIGNATION_IF_GREATER",
        "ADDITION",
        "SUBSTRACTION",
        "MULTIPLICATION",
        "DIVISION",
      ],
    },
  },
});

const PETITION_FIELD_MATH_SCHEMA = (fieldIdType: "string" | "number") => ({
  type: "object",
  additionalProperties: false,
  required: ["operator", "conditions", "operations"],
  properties: {
    operator: { enum: ["AND", "OR"] },
    conditions: {
      type: "array",
      minItems: 1,
      maxItems: 10,
      items: PETITION_FIELD_LOGIC_CONDITION_SCHEMA(fieldIdType),
    },
    operations: {
      type: "array",
      minItems: 1,
      maxItems: 10,
      items: PETITION_FIELD_MATH_OPERATION_SCHEMA(fieldIdType),
    },
  },
});

const PETITION_FIELD_LOGIC_SCHEMA = (fieldIdType: "string" | "number") => ({
  type: "object",
  additionalProperties: true,
  required: ["visibility", "math"],
  properties: {
    visibility: PETITION_FIELD_VISIBILITY_SCHEMA(fieldIdType),
    math: {
      type: ["array", "null"],
      minItems: 1,
      maxItems: 10,
      items: PETITION_FIELD_MATH_SCHEMA(fieldIdType),
    },
  },
});

function assertOneOf<T>(value: any, options: T[], errorMessage?: string): asserts value is T {
  assert(options.includes(value), errorMessage);
}

export function validateFieldLogicSchema(
  logic: any,
  fieldIdType: "string" | "number",
): asserts logic is PetitionFieldLogic {
  // validate input JSON schema before anything
  const logicSchemaValidator = new Ajv({
    allowUnionTypes: true,
  }).compile<PetitionFieldLogic>(PETITION_FIELD_LOGIC_SCHEMA(fieldIdType));
  const fieldLogic = {
    visibility: logic.visibility ?? null,
    math: logic.math ?? null,
  };
  if (!logicSchemaValidator(fieldLogic)) {
    throw new Error(JSON.stringify(logicSchemaValidator.errors));
  }
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
>(
  field: Partial<TField>,
  allFields: TField[],
  props: {
    variables: PetitionVariable[];
    standardListDefinitions: Pick<StandardListDefinition, "list_name" | "list_type">[];
    customLists: Pick<PetitionCustomList, "name">[];
    loadSelectOptionsValuesAndLabels: (
      options: PetitionFieldOptions["SELECT"],
    ) => Promise<{ values: string[]; labels?: Maybe<string[]> }>;
  },
  skipJsonSchemaValidation?: boolean,
) {
  async function validateLogicCondition(
    c: PetitionFieldLogicCondition,
    index: number,
    opts?: { allowSelfReference: boolean },
  ) {
    if ("fieldId" in c) {
      const referencedField = allFields.find((f) => f.id === c.fieldId);

      assert(
        referencedField !== undefined,
        `Can't find PetitionField:${c.fieldId} referenced in condition ${index}`,
      );

      if (!opts?.allowSelfReference) {
        assert(field.id !== referencedField.id, "Can't add a reference to field itself");
      }
      if (
        isNonNullish(field.id) &&
        isNonNullish(field.position) &&
        field.parent_petition_field_id !== undefined
      ) {
        validateReferencingFieldsPositions(field as any, referencedField, allFields);
      }

      assert(referencedField.type !== "HEADING", `Conditions can't reference HEADING fields`);
      assert(
        referencedField.petition_id === field.petition_id,
        `Field with id ${referencedField.id} is not linked to petition with id ${field.petition_id}`,
      );

      const isOnlyHasReplies =
        isFileTypeField(referencedField.type) ||
        (referencedField.type === "DYNAMIC_SELECT" && c.column === undefined) ||
        referencedField.type === "FIELD_GROUP" ||
        referencedField.type === "BACKGROUND_CHECK" ||
        referencedField.type === "ADVERSE_MEDIA_SEARCH";

      if (isOnlyHasReplies) {
        assert(
          c.modifier === "NUMBER_OF_REPLIES",
          `${referencedField.type} can only be referenced with NUMBER_OF_REPLIES modifier`,
        );
      }

      // check operator/modifier compatibility
      if (c.modifier === "NUMBER_OF_REPLIES") {
        assert(
          referencedField.type !== "PROFILE_SEARCH",
          "Can't reference PROFILE_SEARCH field with NUMBER_OF_REPLIES modifier",
        );
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
              ? (await props.loadSelectOptionsValuesAndLabels(referencedField.options)).values
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
        } else if (referencedField.type === "PROFILE_SEARCH") {
          assert(
            c.operator === "HAS_PROFILE_MATCH",
            `Invalid operator ${c.operator} for field of type ${referencedField.type}`,
          );
          assert(
            c.value === null,
            `Invalid value ${c.value} for field of type ${referencedField.type}`,
          );
          assertOneOf(
            c.modifier,
            ["ANY", "NONE"] as const,
            `Invalid modifier ${c.modifier} for operator ${c.operator}`,
          );
        }
      }

      if (
        [
          "IS_IN_LIST",
          "NOT_IS_IN_LIST",
          "ANY_IS_IN_LIST",
          "ALL_IS_IN_LIST",
          "NONE_IS_IN_LIST",
        ].includes(c.operator)
      ) {
        const customList = props.customLists.find((l) => l.name === c.value);
        const standardList = props.standardListDefinitions.find((d) => d.list_name === c.value);

        assert(
          customList || standardList,
          `Can't find list ${c.value} referenced in condition ${index}`,
        );

        if (isNonNullish(standardList)) {
          const typesMap: Record<string, StandardListDefinitionListType | null> = {
            COUNTRIES: "COUNTRIES",
            EU_COUNTRIES: "COUNTRIES",
            NON_EU_COUNTRIES: "COUNTRIES",
            CURRENCIES: null,
            NACE: null,
            CNAE: null,
            CNAE_2009: null,
            CNAE_2025: null,
          };
          assert(
            isNonNullish(referencedField.options.standardList) &&
              standardList.list_type === typesMap[referencedField.options.standardList],
            `Can't reference standard list of type ${standardList.list_type} in condition ${index}`,
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
        !!props.variables.find((v) => v.name === c.variableName),
        `Can't find variable ${c.variableName} referenced in condition ${index}`,
      );
    }
  }

  function validateMathOperation(op: PetitionFieldMathOperation, index: number) {
    assert(
      !!props.variables.find((v) => v.name === op.variable),
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
        !!props.variables.find((v) => v.name === variableName),
        `Can't find variable ${variableName} referenced in math operation ${index}`,
      );
    }
  }

  if (!field.visibility && !field.math) {
    return;
  }

  if (!skipJsonSchemaValidation) {
    validateFieldLogicSchema(field, "number");
  }

  assert(
    !field.visibility || field.type !== "HEADING" || !field.options?.hasPageBreak,
    `Can't add visibility conditions on a heading with page break`,
  );

  // JSON schema is already validated here, so its safe to assign types
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

export function validateFieldLogicInput<
  TypeName extends string,
  FieldName extends string,
  TPetitionIdArg extends Arg<TypeName, FieldName, number>,
  TFieldIdArg extends Arg<TypeName, FieldName, number>,
  TFieldDataArg extends ArgWithPath<
    TypeName,
    FieldName,
    NexusGenInputs["UpdatePetitionFieldInput"]
  >,
>(petitionIdProp: TPetitionIdArg, fieldIdProp: TFieldIdArg, dataProp: TFieldDataArg) {
  return (async (_, args, ctx, info) => {
    const [_fieldLogic, argName] = getArgWithPath(args, dataProp);
    try {
      if (isNullish(_fieldLogic.visibility) && isNullish(_fieldLogic.math)) {
        return;
      }

      const fieldLogic = {
        visibility: _fieldLogic.visibility ?? null,
        math: _fieldLogic.math ?? null,
      };
      // validate input JSON schema before anything
      validateFieldLogicSchema(fieldLogic, "string");

      const petitionId = getArg(args, petitionIdProp);
      const fieldId = getArg(args, fieldIdProp);

      const [field, allFields, petition] = await Promise.all([
        ctx.petitions.loadField(fieldId),
        ctx.petitions.loadAllFieldsByPetitionId(petitionId),
        ctx.petitions.loadPetition(petitionId),
      ]);

      // replace GIDs with numeric for validating with entries in DB
      await validateFieldLogic(
        {
          ...field!,
          ...mapFieldLogic<string>(fieldLogic, (fieldId) => {
            assert(typeof fieldId === "string", "Expected fieldId to be a string");
            return fromGlobalId(fieldId, "PetitionField").id;
          }).field,
        },
        allFields,
        {
          variables: petition!.variables ?? [],
          standardListDefinitions:
            await ctx.petitions.loadResolvedStandardListDefinitionsByPetitionId(petitionId),
          customLists: petition!.custom_lists ?? [],
          loadSelectOptionsValuesAndLabels: (options) =>
            ctx.petitionFields.loadSelectOptionsValuesAndLabels(options),
        },
        true, // JSON SCHEMA is already validated, no need to do it again
      );
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
