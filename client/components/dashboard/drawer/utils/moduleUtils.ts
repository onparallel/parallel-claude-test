import { gql } from "@apollo/client";
import {
  fullDashboardModulePetitionFilterFragment,
  fullDashboardModuleProfileFilterFragment,
} from "@parallel/graphql/__types";
import { removeTypenames, WithoutTypenames } from "@parallel/utils/apollo/removeTypenames";
import { never } from "@parallel/utils/never";
import { ProfileQueryFilter } from "@parallel/utils/ProfileQueryFilter";
import { isNonNullish } from "remeda";

function cleanDashboardModuleProfileQueryFilter(
  values: NonNullable<WithoutTypenames<fullDashboardModuleProfileFilterFragment["values"]>>,
): ProfileQueryFilter {
  if (isNonNullish(values.logicalOperator)) {
    return {
      logicalOperator: values.logicalOperator!,
      conditions: values.conditions!.map((c) => cleanDashboardModuleProfileQueryFilter(c)),
    };
  } else if (isNonNullish(values.profileTypeFieldId)) {
    return {
      profileTypeFieldId: values.profileTypeFieldId!,
      operator: values.operator!,
      value: values.value!,
    };
  } else if (isNonNullish(values.property)) {
    return {
      property: values.property!,
      operator: values.operator!,
      value: values.value!,
    };
  } else {
    never("Unknown filter type");
  }
}

export function cleanDashboardModuleProfileFilter(
  filter: WithoutTypenames<fullDashboardModuleProfileFilterFragment>,
) {
  return {
    values: isNonNullish(filter.values)
      ? cleanDashboardModuleProfileQueryFilter(filter.values)
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
  filter?: WithoutTypenames<fullDashboardModuleProfileFilterFragment> | null,
) {
  const cleaned = isNonNullish(filter) ? cleanDashboardModuleProfileFilter(filter) : undefined;
  return {
    status: cleaned?.status ?? ["OPEN"],
    values: cleaned?.values ?? { logicalOperator: "AND", conditions: [] },
  };
}

const _fragmentsFullDashboardModulePetitionFilter = gql`
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

const _fragmentsFullDashboardModuleProfileFilter = gql`
  fragment fullDashboardModuleProfileFilter on DashboardModuleProfileFilter {
    status
    values {
      logicalOperator
      operator
      profileTypeFieldId
      property
      value
      conditions {
        logicalOperator
        operator
        profileTypeFieldId
        property
        value
        conditions {
          logicalOperator
          operator
          profileTypeFieldId
          property
          value
          conditions {
            logicalOperator
            operator
            profileTypeFieldId
            property
            value
          }
        }
      }
    }
  }
`;
