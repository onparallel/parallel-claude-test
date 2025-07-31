import {
  ProfileFieldValuesFilterGroupLogicalOperator,
  ProfileFieldValuesFilterOperator,
} from "@parallel/graphql/__types";
import { isNonNullish } from "remeda";
import { object } from "./queryState";

export type ProfileFieldValuesFilter =
  | ProfileFieldValuesFilterGroup
  | ProfileFieldValuesFilterCondition;

export interface ProfileFieldValuesFilterGroup {
  logicalOperator: ProfileFieldValuesFilterGroupLogicalOperator;
  conditions: ProfileFieldValuesFilter[];
}
export interface ProfileFieldValuesFilterCondition {
  profileTypeFieldId: string;
  operator: ProfileFieldValuesFilterOperator;
  value?: string | number | string[] | null;
}

type FlattenedProfileFieldValuesFilter =
  | FlattenedProfileFieldValuesFilterGroup
  | FlattenedProfileFieldValuesFilterCondition;

type FlattenedProfileFieldValuesFilterGroup = [
  logicalOperator: ProfileFieldValuesFilterGroupLogicalOperator,
  ...conditions: (
    | FlattenedProfileFieldValuesFilterGroup
    | FlattenedProfileFieldValuesFilterCondition
  )[],
];

type FlattenedProfileFieldValuesFilterCondition = [
  profileTypeFieldId: string,
  operator: ProfileFieldValuesFilterOperator,
  value?: ProfileFieldValuesFilterCondition["value"],
];

/**
 * A simplified filter always consists of a parent AND filter group, and no redundant inner filter groups.
 * @param filter
 */
export function simplifyProfileFieldValuesFilter(
  filter: ProfileFieldValuesFilter,
): ProfileFieldValuesFilterGroup {
  function simplifyFilter(filter: ProfileFieldValuesFilter): ProfileFieldValuesFilter {
    if ("logicalOperator" in filter) {
      if (filter.conditions.length === 1) {
        return simplifyFilter(filter.conditions[0]);
      } else {
        return {
          logicalOperator: filter.logicalOperator,
          conditions: simplifyGroupConditions(filter.conditions, filter.logicalOperator),
        };
      }
    } else {
      return filter;
    }
  }
  function simplifyGroupConditions(
    conditions: ProfileFieldValuesFilter[],
    parentLogicalOperator: ProfileFieldValuesFilterGroupLogicalOperator,
  ): ProfileFieldValuesFilter[] {
    return conditions.flatMap((c) => {
      if ("logicalOperator" in c) {
        if (c.logicalOperator === parentLogicalOperator) {
          return simplifyGroupConditions(c.conditions, parentLogicalOperator);
        } else {
          return [simplifyFilter(c)];
        }
      } else {
        return [simplifyFilter(c)];
      }
    });
  }

  const simplified = simplifyFilter(filter) as ProfileFieldValuesFilterGroup;
  if ("logicalOperator" in simplified && simplified.logicalOperator === "AND") {
    return simplified;
  } else {
    return {
      logicalOperator: "AND",
      conditions: [simplified],
    };
  }
}

export function profileFieldValuesFilter() {
  return object<ProfileFieldValuesFilter>({
    flatten(filter: ProfileFieldValuesFilter): FlattenedProfileFieldValuesFilter {
      // make flattened object shorted by referencing seen profileTypeFieldId {[id]: reference}
      const references: Record<string, string> = {};
      let counter = 1;
      return (function flatten(
        filter: ProfileFieldValuesFilter,
      ): FlattenedProfileFieldValuesFilter {
        return "logicalOperator" in filter
          ? ([
              filter.logicalOperator,
              ...filter.conditions.map((c) => flatten(c)),
            ] as FlattenedProfileFieldValuesFilterGroup)
          : ([
              references[filter.profileTypeFieldId] ??
                ((references[filter.profileTypeFieldId] = `$${counter++}`),
                filter.profileTypeFieldId),
              filter.operator,
              filter.value,
            ].filter(isNonNullish) as FlattenedProfileFieldValuesFilterCondition);
      })(filter);
    },
    unflatten(data: FlattenedProfileFieldValuesFilter) {
      const references: Record<string, string> = {}; // {[reference]: id}
      let counter = 1;
      return (function unflatten(
        data: FlattenedProfileFieldValuesFilter,
      ): ProfileFieldValuesFilter {
        if (["OR", "AND"].includes(data[0])) {
          const [logicalOperator, ...conditions] = data as FlattenedProfileFieldValuesFilterGroup;
          return {
            logicalOperator,
            conditions: conditions.map((c) => unflatten(c)),
          } as ProfileFieldValuesFilterGroup;
        } else {
          const [profileTypeFieldId, operator, value] =
            data as FlattenedProfileFieldValuesFilterCondition;
          return {
            profileTypeFieldId:
              references[profileTypeFieldId] ?? (references[`$${counter++}`] = profileTypeFieldId),
            operator,
            value: value ?? null,
          } as ProfileFieldValuesFilterCondition;
        }
      })(data) as ProfileFieldValuesFilter;
    },
    isDefault(filter) {
      return (function isDefault(filter: ProfileFieldValuesFilter): boolean {
        return (
          "logicalOperator" in filter &&
          (filter.conditions.length === 0 || filter.conditions.every((c) => isDefault(c)))
        );
      })(filter);
    },
  });
}
