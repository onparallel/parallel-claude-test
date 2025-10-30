import { PetitionFieldType } from "@parallel/graphql/__types";
import { IntlShape } from "react-intl";

export function getPetitionFieldTypeDescription(intl: IntlShape, type: PetitionFieldType) {
  switch (type) {
    case "FILE_UPLOAD":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.file-upload-description",
        defaultMessage: "Set up a document or file upload field, with optional PDF annexing.",
      });
    case "SHORT_TEXT":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.short-text-description",
        defaultMessage:
          "Create a short-answer field, with optional format validation (e.g., email, IBAN).",
      });
    case "TEXT":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.text-description",
        defaultMessage:
          "Add a long-answer field for detailed input, such as descriptions, addresses, etc.",
      });
    case "NUMBER":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.number",
        defaultMessage: "Set up a numeric entry field for amounts, quantities, etc.",
      });
    case "PHONE":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.phone",
        defaultMessage: "Create a field for phone number entries.",
      });
    case "HEADING":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.heading-description",
        defaultMessage: "Insert headings, paragraphs and page breaks.",
      });
    case "SELECT":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.select-description",
        defaultMessage: "Enable selection from a dropdown list of options.",
      });
    case "DYNAMIC_SELECT":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.dynamic-select-description",
        defaultMessage:
          "Include cascading dropdowns where each selection dynamically updates the next options list.",
      });
    case "CHECKBOX":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.checkbox",
        defaultMessage: "Include a list of options to choose from.",
      });
    case "DATE":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.date",
        defaultMessage: "Create a date selection field.",
      });
    case "DATE_TIME":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.date-time",
        defaultMessage: "Set up a field for date and time entries.",
      });
    case "ES_TAX_DOCUMENTS":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.tax-documents-description",
        defaultMessage:
          "Simplify retrieval of official documents from Spanish authorities (e.g., AEAT, DGT, and Social Security).",
      });
    case "DOW_JONES_KYC":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.dow-jones-kyc-research-description",
        defaultMessage:
          "Easily search in Dow Jones to run a background check of an individual or legal entity.",
      });
    case "BACKGROUND_CHECK":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.background-check-description",
        defaultMessage: "Integrate an internal search field for sanctions lists and PEPs.",
      });
    case "FIELD_GROUP":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.field-group-description",
        defaultMessage:
          "Group fields to gather information from the same profile, or multiple profiles.",
      });
    case "ID_VERIFICATION":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.id-verification-description",
        defaultMessage: "Take an ID photo and a selfie for identity verification.",
      });
    case "PROFILE_SEARCH":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.profile-search-description",
        defaultMessage:
          "Search for matches in selected profile fields to detect potential conflicts or risks that require review.",
      });
    case "ADVERSE_MEDIA_SEARCH":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.adverse-media-search-description",
        defaultMessage: "Integrate an internal search field for adverse media.",
      });
    case "USER_ASSIGNMENT":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.user-assignment-description",
        defaultMessage: "Assign one user from your organization to this petition.",
      });
    default:
      throw new Error(`Missing description PetitionFieldType  "${type}"`);
  }
}
