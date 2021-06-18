import { gql } from "@apollo/client";
import { validatePetitionFields_PetitionFieldFragment } from "@parallel/graphql/__types";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { countBy } from "remeda";

type PartialField = validatePetitionFields_PetitionFieldFragment;

type ValidationResult<T extends PartialField> = {
  error:
    | "NO_REPLIABLE_FIELDS"
    | "FIELD_WITHOUT_TITLE"
    | "SELECT_WITHOUT_OPTIONS"
    | "CHECKBOX_WITHOUT_OPTIONS"
    | null;
  field?: T;
  errorMessage?: ReactNode;
};

/**
 * validates if the petition fields contains every required information before sending to recipients.
 */
export function validatePetitionFields<T extends PartialField>(
  fields: T[]
): ValidationResult<T> {
  if (countBy(fields, (f) => f.type !== "HEADING") === 0) {
    return {
      error: "NO_REPLIABLE_FIELDS",
      errorMessage: (
        <FormattedMessage
          id="petition.no-fields-error"
          defaultMessage="Please add at least one field with information you want to ask."
        />
      ),
    };
  }
  const fieldWithoutTitle = fields.find((f) => !f.title);
  if (fieldWithoutTitle) {
    return {
      error: "FIELD_WITHOUT_TITLE",
      field: fieldWithoutTitle,
      errorMessage: (
        <FormattedMessage
          id="petition.no-fields-without-title-error"
          defaultMessage="Please add a title to every field."
        />
      ),
    };
  }

  const selectFieldWithoutOptions = fields.find(
    (f) =>
      f.type === "SELECT" &&
      (!f.options.values ||
        !Array.isArray(f.options.values) ||
        f.options.values.length < 2)
  );
  if (selectFieldWithoutOptions) {
    return {
      error: "SELECT_WITHOUT_OPTIONS",
      field: selectFieldWithoutOptions,
      errorMessage: (
        <FormattedMessage
          id="petition.no-select-fields-without-options-error"
          defaultMessage="Please add two or more options to all Dropdown fields."
        />
      ),
    };
  }

  const checkboxFieldWithoutOptions = fields.find(
    (f) =>
      f.type === "CHECKBOX" &&
      (!f.options.values ||
        !Array.isArray(f.options.values) ||
        f.options.values.length < 1)
  );
  if (checkboxFieldWithoutOptions) {
    return {
      error: "CHECKBOX_WITHOUT_OPTIONS",
      field: checkboxFieldWithoutOptions,
      errorMessage: (
        <FormattedMessage
          id="petition.no-checkbox-fields-without-options-error"
          defaultMessage="Please add one or more options to all Multiple options fields."
        />
      ),
    };
  }

  const dynamicSelectWithoutListings = fields.find(
    (f) => f.type === "DYNAMIC_SELECT" && !f.options.file
  );
  if (dynamicSelectWithoutListings) {
    return {
      error: "SELECT_WITHOUT_OPTIONS",
      field: dynamicSelectWithoutListings,
      errorMessage: (
        <FormattedMessage
          id="petition.dynamic-select-field-without-options-error"
          defaultMessage="Please configure the options for the conditional select fields."
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
