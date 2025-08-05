import { gql } from "@apollo/client";
import {
  DashboardModuleProfileFieldValuesFilter,
  fullDashboardModulePetitionFilterFragment,
  fullDashboardModuleProfileFilterFragment,
} from "@parallel/graphql/__types";
import { removeTypenames, WithoutTypenames } from "@parallel/utils/apollo/removeTypenames";
import { ProfileFieldValuesFilter } from "@parallel/utils/ProfileFieldValuesFilter";
import { isNonNullish } from "remeda";

function cleanDashboardModuleProfileFieldValuesFilter(
  values: WithoutTypenames<DashboardModuleProfileFieldValuesFilter>,
): ProfileFieldValuesFilter {
  if (isNonNullish(values.logicalOperator)) {
    return {
      logicalOperator: values.logicalOperator!,
      conditions: values.conditions!.map((c) => cleanDashboardModuleProfileFieldValuesFilter(c)),
    };
  } else {
    return {
      profileTypeFieldId: values.profileTypeFieldId!,
      operator: values.operator!,
      value: values.value!,
    };
  }
}

export function cleanDashboardModuleProfileFilter(
  filter: WithoutTypenames<fullDashboardModuleProfileFilterFragment>,
) {
  return {
    values: isNonNullish(filter.values)
      ? cleanDashboardModuleProfileFieldValuesFilter(filter.values)
      : undefined,
    status: filter.status ?? undefined,
  };
}

export function defaultDashboardModulePetitionFilter(
  filter?: WithoutTypenames<fullDashboardModulePetitionFilterFragment>,
) {
  return {
    fromTemplateId: filter?.fromTemplateId ?? [],
    signature: filter?.signature ?? [],
    status: filter?.status ?? [],
    approvals: filter?.approvals
      ? removeTypenames(filter.approvals)
      : { operator: "AND", filters: [] },
    tags: filter?.tags ? removeTypenames(filter.tags) : { operator: "AND", filters: [] },
    sharedWith: filter?.sharedWith
      ? removeTypenames(filter.sharedWith)
      : { operator: "AND", filters: [] },
  };
}

export function defaultDashboardModuleProfileFilter(
  filter?: WithoutTypenames<fullDashboardModuleProfileFilterFragment>,
) {
  const cleaned = isNonNullish(filter) ? cleanDashboardModuleProfileFilter(filter) : undefined;
  return {
    status: cleaned?.status ?? ["OPEN"],
    values: cleaned?.values ?? { logicalOperator: "AND", conditions: [] },
  };
}

export const fullDashboardModulePetitionFilter = gql`
  fragment fullDashboardModulePetitionFilter on DashboardModulePetitionFilter {
    fromTemplateId
    status
    signature
    approvals {
      filters {
        value
        operator
      }
      operator
    }
    sharedWith {
      filters {
        value
        operator
      }
      operator
    }
    tags {
      operator
      filters {
        value
        operator
      }
    }
  }
`;

export const fullDashboardModuleProfileFilter = gql`
  fragment fullDashboardModuleProfileFilter on DashboardModuleProfileFilter {
    status
    values {
      logicalOperator
      operator
      profileTypeFieldId
      value
      conditions {
        logicalOperator
        operator
        profileTypeFieldId
        value
        conditions {
          logicalOperator
          operator
          profileTypeFieldId
          value
          conditions {
            logicalOperator
            operator
            profileTypeFieldId
            value
          }
        }
      }
    }
  }
`;
