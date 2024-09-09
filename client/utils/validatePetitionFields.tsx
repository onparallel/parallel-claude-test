import { gql } from "@apollo/client";
import {
  validatePetitionFields_PetitionBaseFragment,
  validatePetitionFields_PetitionFieldFragment,
} from "@parallel/graphql/__types";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { isNonNullish, isNullish } from "remeda";
import { PetitionFieldIndex } from "./fieldIndices";
import { FieldOptions } from "./petitionFields";

type PartialField = validatePetitionFields_PetitionFieldFragment;

interface ValidationResult<T extends PartialField> {
  error:
    | "NO_REPLIABLE_FIELDS"
    | "FIELD_WITHOUT_TITLE"
    | "SELECT_WITHOUT_OPTIONS"
    | "CHECKBOX_WITHOUT_OPTIONS"
    | "NUMBER_INVALID_LIMITS"
    | "FIELD_GROUP_WITHOUT_CHILDREN"
    | "PAID_FIELDS_BLOCKED"
    | null;
  fieldsWithIndices?: [field: T, fieldIndex: PetitionFieldIndex][];
  message?: ReactNode;
  footer?: ReactNode;
}

/**
 * validates if the petition fields contains every required information before sending to recipients.
 */
export function validatePetitionFields<T extends PartialField>(
  fieldsWithIndices: [T, PetitionFieldIndex][],
  petition: validatePetitionFields_PetitionBaseFragment,
): ValidationResult<T> {
  if (fieldsWithIndices.every(([field]) => field.isReadOnly)) {
    return {
      error: "NO_REPLIABLE_FIELDS",
      message: (
        <FormattedMessage
          id="util.validate-petition-fields.no-fields-error"
          defaultMessage="Please add at least one field with information you want to ask."
        />
      ),
    };
  }
  const fieldGroupsWithoutChildren = fieldsWithIndices.filter(
    ([field]) => field.type === "FIELD_GROUP" && (field.children ?? []).length === 0,
  );

  if (fieldGroupsWithoutChildren.length > 0) {
    return {
      error: "FIELD_GROUP_WITHOUT_CHILDREN",
      fieldsWithIndices: fieldGroupsWithoutChildren,
      message: (
        <FormattedMessage
          id="util.validate-petition-fields.field-group-without-children-error"
          defaultMessage="Please add at least one field to the following <em>group</em> {count, plural, one{field} other{fields}}."
          values={{
            count: fieldGroupsWithoutChildren.length,
            em: (chunks: any) => <em>{chunks}</em>,
          }}
        />
      ),
    };
  }
  const fieldsWithoutTitle = fieldsWithIndices.filter(
    ([field]) => field.type !== "HEADING" && !field.title,
  );
  if (fieldsWithoutTitle.length > 0) {
    return {
      error: "FIELD_WITHOUT_TITLE",
      fieldsWithIndices: fieldsWithoutTitle,
      message: (
        <FormattedMessage
          id="util.validate-petition-fields.fields-without-title-error"
          defaultMessage="Please add a title to the following {count, plural, one{field} other{fields}}."
          values={{ count: fieldsWithoutTitle.length }}
        />
      ),
    };
  }

  const selectFieldsWithoutOptions = fieldsWithIndices.filter(([field]) => {
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
          id="util.validate-petition-fields.select-fields-without-options-error"
          defaultMessage="Please add two or more options to the following <em>dropdown</em> {count, plural, one{field} other{fields}}."
          values={{
            count: selectFieldsWithoutOptions.length,
            em: (chunks: any) => <em>{chunks}</em>,
          }}
        />
      ),
    };
  }

  const checkboxFieldsWithoutOptions = fieldsWithIndices.filter(([field]) => {
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
          id="util.validate-petition-fields.checkbox-fields-without-options-error"
          defaultMessage="Please add one or more options to the following <em>multiple options</em> {count, plural, one{field} other{fields}}."
          values={{
            count: checkboxFieldsWithoutOptions.length,
            em: (chunks: any) => <em>{chunks}</em>,
          }}
        />
      ),
    };
  }

  const dynamicSelectFieldsWithoutOptions = fieldsWithIndices.filter(([field]) => {
    if (field.type === "DYNAMIC_SELECT") {
      const { file } = field.options as FieldOptions["DYNAMIC_SELECT"];
      return isNullish(file);
    }
    return false;
  });
  if (dynamicSelectFieldsWithoutOptions.length > 0) {
    return {
      error: "SELECT_WITHOUT_OPTIONS",
      fieldsWithIndices: dynamicSelectFieldsWithoutOptions,
      message: (
        <FormattedMessage
          id="util.validate-petition-fields.dynamic-select-field-without-options-error"
          defaultMessage="Please configure the options for the following <em>conditional select</em> {count, plural, one{field} other{fields}}."
          values={{
            count: dynamicSelectFieldsWithoutOptions.length,
            em: (chunks: any) => <em>{chunks}</em>,
          }}
        />
      ),
    };
  }

  const numberFieldsWithInvalidLimits = fieldsWithIndices.filter(([field]) => {
    if (field.type === "NUMBER") {
      const { range } = field.options as FieldOptions["NUMBER"];
      return isNonNullish(range.min) && isNonNullish(range.max) && range.min > range.max;
    }
    return false;
  });
  if (numberFieldsWithInvalidLimits.length > 0) {
    return {
      error: "NUMBER_INVALID_LIMITS",
      fieldsWithIndices: numberFieldsWithInvalidLimits,
      message: (
        <FormattedMessage
          id="util.validate-petition-fields.number-field-with-invalid-limits-error"
          defaultMessage="Please fix the limit range for the following <em>number</em> {count, plural, one{field} other{fields}}. The maximum can not be lower than minimum."
          values={{
            count: numberFieldsWithInvalidLimits.length,
            em: (chunks: any) => <em>{chunks}</em>,
          }}
        />
      ),
    };
  }

  const features = petition.organization?.features ?? [];

  const blockedPaidFields = fieldsWithIndices.filter(([field]) => {
    return (
      features.some((feature) => feature.name === field.type && !feature.value) ||
      (field.type === "ID_VERIFICATION" && !petition.organization.hasIdVerification)
    );
  });

  if (blockedPaidFields.length > 0) {
    return {
      error: "PAID_FIELDS_BLOCKED",
      fieldsWithIndices: blockedPaidFields,
      message: (
        <FormattedMessage
          id="util.validate-petition-fields.paid-fields-message"
          defaultMessage="The following fields are not included in your current plan."
        />
      ),
      footer: (
        <FormattedMessage
          id="util.validate-petition-fields.paid-fields-footer"
          defaultMessage="Contact us for more information or click continue to proceed with the shipment."
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
      isReadOnly
      options
      children {
        id
      }
    }
  `,
  PetitionBase: gql`
    fragment validatePetitionFields_PetitionBase on PetitionBase {
      id
      organization {
        features {
          name
          value
        }
        hasIdVerification: hasIntegration(integration: ID_VERIFICATION)
      }
    }
  `,
};
