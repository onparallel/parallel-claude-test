import { gql } from "@apollo/client";
import { SimpleOption } from "@parallel/components/common/SimpleSelect";
import {
  ProfileFieldValuesFilterOperator,
  useProfileFieldValueFilterOperators_ProfileTypeFieldFragment,
} from "@parallel/graphql/__types";
import { useMemo } from "react";
import { useIntl } from "react-intl";

export function useProfileFieldValueFilterOperators(
  field: useProfileFieldValueFilterOperators_ProfileTypeFieldFragment,
) {
  const intl = useIntl();
  return useMemo<SimpleOption<ProfileFieldValuesFilterOperator>[]>(() => {
    const operators: SimpleOption<ProfileFieldValuesFilterOperator>[] = [];
    operators.push(
      {
        label:
          field.type === "FILE"
            ? intl.formatMessage({
                id: "generic.profile-field-values-filter-operator-has-value-file",
                defaultMessage: "has files",
              })
            : field.type === "BACKGROUND_CHECK"
              ? intl.formatMessage({
                  id: "generic.profile-field-values-filter-operator-has-value-bg-check",
                  defaultMessage: "has performed search",
                })
              : intl.formatMessage({
                  id: "generic.profile-field-values-filter-operator-has-value",
                  defaultMessage: "has value",
                }),
        value: "HAS_VALUE",
      },
      {
        label:
          field.type === "FILE"
            ? intl.formatMessage({
                id: "generic.profile-field-values-filter-operator-not-has-value-file",
                defaultMessage: "does not have files",
              })
            : field.type === "BACKGROUND_CHECK"
              ? intl.formatMessage({
                  id: "generic.profile-field-values-filter-operator-not-has-value-bg-check",
                  defaultMessage: "has not performed search",
                })
              : intl.formatMessage({
                  id: "generic.profile-field-values-filter-operator-not-has-value",
                  defaultMessage: "does not have a value",
                }),
        value: "NOT_HAS_VALUE",
      },
    );
    if (field.type === "NUMBER") {
      operators.push(
        { label: "=", value: "EQUAL" },
        { label: "≠", value: "NOT_EQUAL" },
        { label: "<", value: "LESS_THAN" },
        { label: ">", value: "GREATER_THAN" },
        { label: "≤", value: "LESS_THAN_OR_EQUAL" },
        { label: "≥", value: "GREATER_THAN_OR_EQUAL" },
      );
    }
    if (["TEXT", "SHORT_TEXT", "DATE", "SELECT", "CHECKBOX", "PHONE"].includes(field.type)) {
      operators.push(
        {
          label: intl.formatMessage({
            id: "generic.profile-field-values-filter-operator-equals",
            defaultMessage: "is",
          }),
          value: "EQUAL",
        },
        {
          label: intl.formatMessage({
            id: "generic.profile-field-values-filter-operator-not-equals",
            defaultMessage: "is not",
          }),
          value: "NOT_EQUAL",
        },
      );
    }
    if (["TEXT", "SHORT_TEXT"].includes(field.type)) {
      operators.push(
        {
          label: intl.formatMessage({
            id: "generic.profile-field-values-filter-operator-starts-with",
            defaultMessage: "starts with",
          }),
          value: "START_WITH",
        },
        {
          label: intl.formatMessage({
            id: "generic.profile-field-values-filter-operator-ends-with",
            defaultMessage: "ends with",
          }),
          value: "END_WITH",
        },
      );
    }
    if (["TEXT", "SHORT_TEXT", "CHECKBOX"].includes(field.type)) {
      operators.push(
        {
          label: intl.formatMessage({
            id: "generic.profile-field-values-filter-operator-contains",
            defaultMessage: "contains",
          }),
          value: "CONTAIN",
        },
        {
          label: intl.formatMessage({
            id: "generic.profile-field-values-filter-operator-not-contains",
            defaultMessage: "does not contain",
          }),
          value: "NOT_CONTAIN",
        },
      );
    }
    if (["SHORT_TEXT", "SELECT"].includes(field.type)) {
      operators.push(
        {
          label: intl.formatMessage({
            id: "generic.profile-field-values-filter-operator-is-one-of",
            defaultMessage: "is one of",
          }),
          value: "IS_ONE_OF",
        },
        {
          label: intl.formatMessage({
            id: "generic.profile-field-values-filter-operator-not-is-one-of",
            defaultMessage: "is not one of",
          }),
          value: "NOT_IS_ONE_OF",
        },
      );
    }
    if (field.type === "DATE") {
      operators.push(
        {
          label: intl.formatMessage({
            id: "generic.profile-field-values-filter-operator-less-than-date",
            defaultMessage: "is before",
          }),
          value: "LESS_THAN",
        },
        {
          label: intl.formatMessage({
            id: "generic.profile-field-values-filter-operator-less-than-or-equal-date",
            defaultMessage: "is before or equal",
          }),
          value: "LESS_THAN_OR_EQUAL",
        },
        {
          label: intl.formatMessage({
            id: "generic.profile-field-values-filter-operator-greater-than-date",
            defaultMessage: "is after",
          }),
          value: "GREATER_THAN",
        },
        {
          label: intl.formatMessage({
            id: "generic.profile-field-values-filter-operator-greater-than-or-equal-date",
            defaultMessage: "is after or equal",
          }),
          value: "GREATER_THAN_OR_EQUAL",
        },
      );
    }
    if (field.type === "BACKGROUND_CHECK") {
      operators.push(
        {
          label: intl.formatMessage({
            id: "generic.profile-field-values-filter-operator-has-bg-check-results",
            defaultMessage: "has results available",
          }),
          value: "HAS_BG_CHECK_RESULTS",
        },
        {
          label: intl.formatMessage({
            id: "generic.profile-field-values-filter-operator-not-has-bg-check-results",
            defaultMessage: "does not have results available",
          }),
          value: "NOT_HAS_BG_CHECK_RESULTS",
        },
        {
          label: intl.formatMessage({
            id: "generic.profile-field-values-filter-operator-has-bg-check-match",
            defaultMessage: "has selected a profile",
          }),
          value: "HAS_BG_CHECK_MATCH",
        },
        {
          label: intl.formatMessage({
            id: "generic.profile-field-values-filter-operator-not-has-bg-check-match",
            defaultMessage: "has not selected a profile",
          }),
          value: "NOT_HAS_BG_CHECK_MATCH",
        },
        {
          label: intl.formatMessage({
            id: "generic.profile-field-values-filter-operator-has-bg-check-topics",
            defaultMessage: "has these topics",
          }),
          value: "HAS_BG_CHECK_TOPICS",
        },
        {
          label: intl.formatMessage({
            id: "generic.profile-field-values-filter-operator-not-has-bg-check-topics",
            defaultMessage: "does not have these topics",
          }),
          value: "NOT_HAS_BG_CHECK_TOPICS",
        },
        {
          label: intl.formatMessage({
            id: "generic.profile-field-values-filter-operator-has-any-bg-check-topics",
            defaultMessage: "has any topics",
          }),
          value: "HAS_ANY_BG_CHECK_TOPICS",
        },
        {
          label: intl.formatMessage({
            id: "generic.profile-field-values-filter-operator-not-has-any-bg-check-topics",
            defaultMessage: "does not have any topics",
          }),
          value: "NOT_HAS_ANY_BG_CHECK_TOPICS",
        },
      );
    }
    if (field.isExpirable) {
      operators.push(
        {
          label: intl.formatMessage({
            id: "generic.profile-field-values-filter-operator-is-expired",
            defaultMessage: "is expired",
          }),
          value: "IS_EXPIRED",
        },
        {
          label: intl.formatMessage({
            id: "generic.profile-field-values-filter-operator-expires-in",
            defaultMessage: "expires in",
          }),
          value: "EXPIRES_IN",
        },
        {
          label: intl.formatMessage({
            id: "generic.profile-field-values-filter-operator-not-has-expiry",
            defaultMessage: "has no expiry set",
          }),
          value: "NOT_HAS_EXPIRY",
        },
      );
    }
    return operators;
  }, [intl.locale, field.type]);
}

useProfileFieldValueFilterOperators.fragments = {
  ProfileTypeField: gql`
    fragment useProfileFieldValueFilterOperators_ProfileTypeField on ProfileTypeField {
      id
      type
      options
      isExpirable
    }
  `,
};
