import Ajv from "ajv";
import { core } from "nexus";
import { PetitionField } from "../../../db/__types";
import { PetitionFieldVisibility, PetitionFieldLogicCondition } from "../../../util/fieldLogic";
import { fromGlobalId } from "../../../util/globalId";
import { isFileTypeField } from "../../../util/isFileTypeField";
import { ArgValidationError } from "../errors";
import { DynamicSelectOption } from "../parseDynamicSelectValues";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { isDefined } from "remeda";

const PETITION_FIELD_LOGIC_CONDITION_SCHEMA = {
  type: "object",
  required: ["modifier", "operator", "value"],
  properties: {
    fieldId: { type: "number" },
    column: { type: "number" },
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
        "IS_ONE_OF",
        "NOT_IS_ONE_OF",
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
};

const PETITION_FIELD_VISIBILITY_SCHEMA = {
  type: "object",
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

function assert(predicate: boolean, errorMessage: string) {
  if (!predicate) {
    throw new Error(errorMessage);
  }
}

function assertOneOf<T>(value: T, options: T[], errorMessage: string) {
  assert(options.includes(value), errorMessage);
}

export function validateReferencingFieldsPositions<
  TField extends Pick<PetitionField, "id" | "position" | "parent_petition_field_id">,
>(field: TField, referencedField: TField, allFields: TField[]) {
  let fieldPosition = field.position;
  let referencedFieldPosition = referencedField.position;
  if (
    isDefined(field.parent_petition_field_id) &&
    !isDefined(referencedField.parent_petition_field_id)
  ) {
    // child references a normal field, use parent position
    fieldPosition = allFields.find((f) => f.id === field.parent_petition_field_id)!.position;
  } else if (
    isDefined(field.parent_petition_field_id) &&
    isDefined(referencedField.parent_petition_field_id) &&
    field.parent_petition_field_id !== referencedField.parent_petition_field_id
  ) {
    // child references a child of another field group, use parent position for both
    fieldPosition = allFields.find((f) => f.id === field.parent_petition_field_id)!.position;
    referencedFieldPosition = allFields.find(
      (f) => f.id === referencedField.parent_petition_field_id,
    )!.position;
  } else if (
    !isDefined(field.parent_petition_field_id) &&
    isDefined(referencedField.parent_petition_field_id)
  ) {
    // field references a child of a field group, use parent position for referenced child
    referencedFieldPosition = allFields.find(
      (f) => f.id === referencedField.parent_petition_field_id,
    )!.position;
  }

  assert(referencedFieldPosition <= fieldPosition, "Can't reference fields that come next");
}

function validateLogicCondition<
  TField extends Pick<
    PetitionField,
    | "id"
    | "type"
    | "position"
    | "options"
    | "visibility"
    | "petition_id"
    | "parent_petition_field_id"
  >,
>(field: TField, allFields: TField[]) {
  return (c: PetitionFieldLogicCondition, index: number) => {
    assert(
      field.type !== "HEADING" || !field.options.hasPageBreak,
      `Can't add visibility conditions on a heading with page break`,
    );
    const referencedField = allFields.find((f) => f.id === c.fieldId);

    assert(
      referencedField !== undefined,
      `Can't find PetitionField:${c.fieldId} referenced in PetitionField:${field.id}, condition ${index}`,
    );
    if (!referencedField) {
      return;
    }

    assert(field.id !== referencedField.id, "Can't add a reference to field itself");

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
        ],
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
          ["EQUAL", "NOT_EQUAL", "START_WITH", "END_WITH", "CONTAIN", "NOT_CONTAIN"],
          `Invalid operator ${c.operator} for field of type ${referencedField.type}`,
        );

        assert(
          c.value === null || typeof c.value === "string",
          `Invalid value type ${typeof c.value} for field of type ${referencedField.type}`,
        );
      } else if (isFileTypeField(referencedField.type)) {
        throw new Error(`Invalid modifier ${c.modifier} for field of type ${referencedField.type}`);
      } else if (
        referencedField.type === "SELECT" ||
        (referencedField.type === "DYNAMIC_SELECT" && c.column !== undefined)
      ) {
        const options =
          referencedField.type === "SELECT"
            ? referencedField.options.values
            : getDynamicSelectValues(referencedField.options.values, c.column!);
        assertOneOf(
          c.operator,
          ["EQUAL", "NOT_EQUAL", "IS_ONE_OF", "NOT_IS_ONE_OF"],
          `Invalid operator ${c.operator} for field of type ${referencedField.type}`,
        );
        assert(
          c.value === null ||
            (["EQUAL", "NOT_EQUAL"].includes(c.operator) &&
              typeof c.value === "string" &&
              options.includes(c.value)) ||
            (["IS_ONE_OF", "NOT_IS_ONE_OF"].includes(c.operator) &&
              Array.isArray(c.value) &&
              c.value.every((v) => options.includes(v))),
          `Invalid value ${c.value} for field of type ${
            referencedField.type
          }. Should be one of: ${options.join(", ")}`,
        );
      }
    }
  };
}

export function validateFieldVisibility<
  TField extends Pick<
    PetitionField,
    | "id"
    | "type"
    | "position"
    | "options"
    | "visibility"
    | "petition_id"
    | "parent_petition_field_id"
  >,
>(field: TField, allFields: TField[]) {
  if (!field.visibility) {
    return;
  }

  const validator = new Ajv({
    allowUnionTypes: true,
  }).compile<PetitionFieldVisibility>(PETITION_FIELD_VISIBILITY_SCHEMA);

  if (!validator(field.visibility)) {
    throw new Error(JSON.stringify(validator.errors));
  }

  field.visibility.conditions.forEach(validateLogicCondition(field, allFields));
}

export function validFieldVisibility<TypeName extends string, FieldName extends string>(
  petitionIdProp: (args: core.ArgsValue<TypeName, FieldName>) => number,
  fieldIdProp: (args: core.ArgsValue<TypeName, FieldName>) => number,
  prop: (args: core.ArgsValue<TypeName, FieldName>) => any,
  argName: string,
) {
  return (async (_, args, ctx, info) => {
    try {
      const json = prop(args);
      const petitionId = petitionIdProp(args);
      const fieldId = fieldIdProp(args);
      const field = await ctx.petitions.loadField(fieldId);
      const allFields = await ctx.petitions.loadAllFieldsByPetitionId(petitionId);

      // replace GIDs with numeric for ajv validation
      const visibility = {
        ...json,
        conditions: json.conditions.map((c: any) => ({
          ...c,
          fieldId: fromGlobalId(c.fieldId, "PetitionField").id,
        })),
      };

      validateFieldVisibility({ ...field!, visibility }, allFields);
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
