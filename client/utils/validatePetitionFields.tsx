import { gql } from "@apollo/client";
import { validatePetitionFields_PetitionFieldFragment } from "@parallel/graphql/__types";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { countBy, isDefined, zip } from "remeda";
import { getFieldIndices, PetitionFieldIndex } from "./fieldIndices";
import { FieldOptions } from "./petitionFields";

type PartialField = validatePetitionFields_PetitionFieldFragment;

type ValidationResult<T extends PartialField> = {
  error:
    | "NO_REPLIABLE_FIELDS"
    | "FIELD_WITHOUT_TITLE"
    | "SELECT_WITHOUT_OPTIONS"
    | "CHECKBOX_WITHOUT_OPTIONS"
    | "NUMBER_INVALID_LIMITS"
    | null;
  fieldsWithIndices?: { fieldIndex: PetitionFieldIndex; field: T }[];
  message?: ReactNode;
};

/**
 * validates if the petition fields contains every required information before sending to recipients.
 */
export function validatePetitionFields<T extends PartialField>(fields: T[]): ValidationResult<T> {
  const fieldsWithIndices = zip(fields, getFieldIndices(fields)).map(([field, fieldIndex]) => ({
    field,
    fieldIndex,
  }));
  if (countBy(fields, (f) => f.type !== "HEADING") === 0) {
    return {
      error: "NO_REPLIABLE_FIELDS",
      message: (
        <FormattedMessage
          id="validate-petition-fields.no-fields-error"
          defaultMessage="Please add at least one field with information you want to ask."
        />
      ),
    };
  }
  const fieldsWithoutTitle = fieldsWithIndices.filter(
    ({ field }) => field.type !== "HEADING" && !field.title
  );
  if (fieldsWithoutTitle.length > 0) {
    return {
      error: "FIELD_WITHOUT_TITLE",
      fieldsWithIndices: fieldsWithoutTitle,
      message: (
        <FormattedMessage
          id="validate-petition-fields.fields-without-title-error"
          defaultMessage="Please add a title to the following {count, plural, one{field} other{fields}}."
          values={{ count: fieldsWithoutTitle.length }}
        />
      ),
    };
  }

  const selectFieldsWithoutOptions = fieldsWithIndices.filter(({ field }) => {
    if (field.type === "SELECT") {
      const { values } = field.options as FieldOptions["SELECT"];
      return !values || !Array.isArray(values) || values.length < 2;
    }
    return false;
  });
  if (selectFieldsWithoutOptions.length > 0) {
    return {
      error: "SELECT_WITHOUT_OPTIONS",
      fieldsWithIndices: selectFieldsWithoutOptions,
      message: (
        <FormattedMessage
          id="validate-petition-fields.select-fields-without-options-error"
          defaultMessage="Please add two or more options to the following <em>dropdown</em> {count, plural, one{field} other{fields}}."
          values={{
            count: selectFieldsWithoutOptions.length,
            em: (chunks: any) => <em>{chunks}</em>,
          }}
        />
      ),
    };
  }

  const checkboxFieldsWithoutOptions = fieldsWithIndices.filter(({ field }) => {
    if (field.type === "CHECKBOX") {
      const { values } = field.options as FieldOptions["CHECKBOX"];
      return !values || !Array.isArray(values) || values.length < 1;
    }
    return false;
  });
  if (checkboxFieldsWithoutOptions.length > 0) {
    return {
      error: "CHECKBOX_WITHOUT_OPTIONS",
      fieldsWithIndices: checkboxFieldsWithoutOptions,
      message: (
        <FormattedMessage
          id="validate-petition-fields.checkbox-fields-without-options-error"
          defaultMessage="Please add one or more options to the following <em>multiple options</em> {count, plural, one{field} other{fields}}."
          values={{
            count: checkboxFieldsWithoutOptions.length,
            em: (chunks: any) => <em>{chunks}</em>,
          }}
        />
      ),
    };
  }

  const dynamicSelectFieldsWithoutOptions = fieldsWithIndices.filter(({ field }) => {
    if (field.type === "DYNAMIC_SELECT") {
      const { file } = field.options as FieldOptions["DYNAMIC_SELECT"];
      return !isDefined(file);
    }
    return false;
  });
  if (dynamicSelectFieldsWithoutOptions.length > 0) {
    return {
      error: "SELECT_WITHOUT_OPTIONS",
      fieldsWithIndices: dynamicSelectFieldsWithoutOptions,
      message: (
        <FormattedMessage
          id="validate-petition-fields.dynamic-select-field-without-options-error"
          defaultMessage="Please configure the options for the following <em>conditional select</em> {count, plural, one{field} other{fields}}."
          values={{
            count: dynamicSelectFieldsWithoutOptions.length,
            em: (chunks: any) => <em>{chunks}</em>,
          }}
        />
      ),
    };
  }

  const numberFieldsWithInvalidLimits = fieldsWithIndices.filter(({ field }) => {
    if (field.type === "NUMBER") {
      const { range } = field.options as FieldOptions["NUMBER"];
      return isDefined(range.min) && isDefined(range.max) && range.min > range.max;
    }
    return false;
  });
  if (numberFieldsWithInvalidLimits.length > 0) {
    return {
      error: "NUMBER_INVALID_LIMITS",
      fieldsWithIndices: numberFieldsWithInvalidLimits,
      message: (
        <FormattedMessage
          id="validate-petition-fields..number-field-with-invalid-limits-error"
          defaultMessage="Please fix the limit range for the following <em>number</em> {count, plural, one{field} other{fields}}. The maximum can not be lower than minimum."
          values={{
            count: numberFieldsWithInvalidLimits.length,
            em: (chunks: any) => <em>{chunks}</em>,
          }}
        />
      ),
    };
  }

  return { error: null };
}

validatePetitionFields.fragments = {
  PetitionField: gql`
    fragment validatePetitionFields_PetitionField on PetitionField {
      id
      title
      type
      options
    }
  `,
};
