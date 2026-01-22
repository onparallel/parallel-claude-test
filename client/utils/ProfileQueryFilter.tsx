import {
  ProfileQueryFilterGroupLogicalOperator,
  ProfileQueryFilterOperator,
  ProfileQueryFilterProperty,
} from "@parallel/graphql/__types";
import { isNonNullish } from "remeda";
import { never } from "./never";
import { object } from "./queryState";

export type ProfileQueryFilterCondition =
  | ProfileQueryFilterFieldValueCondition
  | ProfileQueryFilterPropertyCondition;

export type ProfileQueryFilter = ProfileQueryFilterGroup | ProfileQueryFilterCondition;

export interface ProfileQueryFilterGroup {
  logicalOperator: ProfileQueryFilterGroupLogicalOperator;
  conditions: ProfileQueryFilter[];
}
export interface ProfileQueryFilterFieldValueCondition {
  profileTypeFieldId: string;
  operator: ProfileQueryFilterOperator;
  value?: string | number | string[] | null;
}

export interface ProfileQueryFilterPropertyCondition {
  property: ProfileQueryFilterProperty;
  operator: ProfileQueryFilterOperator;
  value?: string | number | string[] | null;
}

type FlattenedProfileQueryFilter =
  | FlattenedProfileQueryFilterGroup
  | FlattenedProfileQueryFilterFieldValueCondition
  | FlattenedProfileQueryFilterPropertyCondition;

type FlattenedProfileQueryFilterGroup = [
  logicalOperator: ProfileQueryFilterGroupLogicalOperator,
  ...conditions: FlattenedProfileQueryFilter[],
];

type FlattenedProfileQueryFilterFieldValueCondition = [
  type: "FIELD",
  profileTypeFieldId: string,
  operator: ProfileQueryFilterOperator,
  value?: ProfileQueryFilterFieldValueCondition["value"],
];

type FlattenedProfileQueryFilterPropertyCondition = [
  type: "PROP",
  property: ProfileQueryFilterProperty,
  operator: ProfileQueryFilterOperator,
  value?: ProfileQueryFilterPropertyCondition["value"],
];

/**
 * A simplified filter always consists of a parent AND filter group, and no redundant inner filter groups.
 * @param filter
 */
export function simplifyProfileQueryFilter(filter: ProfileQueryFilter): ProfileQueryFilterGroup {
  function simplifyFilter(filter: ProfileQueryFilter): ProfileQueryFilter {
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
    conditions: ProfileQueryFilter[],
    parentLogicalOperator: ProfileQueryFilterGroupLogicalOperator,
  ): ProfileQueryFilter[] {
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

  const simplified = simplifyFilter(filter) as ProfileQueryFilterGroup;
  if ("logicalOperator" in simplified && simplified.logicalOperator === "AND") {
    return simplified;
  } else {
    return {
      logicalOperator: "AND",
      conditions: [simplified],
    };
  }
}

export function profileQueryFilter() {
  return object<ProfileQueryFilter>({
    flatten(filter: ProfileQueryFilter): FlattenedProfileQueryFilter {
      // make flattened object shorted by referencing seen profileTypeFieldId {[id]: reference}
      const references: Record<string, string> = {};
      let counter = 1;
      return (function flatten(filter: ProfileQueryFilter): FlattenedProfileQueryFilter {
        return "logicalOperator" in filter
          ? ([
              filter.logicalOperator,
              ...filter.conditions.map((c) => flatten(c)),
            ] as FlattenedProfileQueryFilterGroup)
          : "profileTypeFieldId" in filter
            ? ([
                "FIELD",
                references[filter.profileTypeFieldId] ??
                  ((references[filter.profileTypeFieldId] = `$${counter++}`),
                  filter.profileTypeFieldId),
                filter.operator,
                filter.value,
              ].filter(isNonNullish) as FlattenedProfileQueryFilterFieldValueCondition)
            : "property" in filter
              ? ([
                  "PROP",
                  references[filter.property] ??
                    ((references[filter.property] = `$${counter++}`), filter.property),
                  filter.operator,
                  filter.value,
                ].filter(isNonNullish) as FlattenedProfileQueryFilterPropertyCondition)
              : never("Unknown filter type");
      })(filter);
    },
    unflatten(data: FlattenedProfileQueryFilter) {
      const references: Record<string, string> = {}; // {[reference]: id}
      let counter = 1;
      return (function unflatten(data: FlattenedProfileQueryFilter): ProfileQueryFilter {
        if (["OR", "AND"].includes(data[0])) {
          const [logicalOperator, ...conditions] = data as FlattenedProfileQueryFilterGroup;
          return {
            logicalOperator,
            conditions: conditions.map((c) => unflatten(c)),
          } as ProfileQueryFilterGroup;
        } else if (data[0] === "FIELD") {
          const [_, profileTypeFieldId, operator, value] =
            data as FlattenedProfileQueryFilterFieldValueCondition;
          return {
            profileTypeFieldId:
              references[profileTypeFieldId] ?? (references[`$${counter++}`] = profileTypeFieldId),
            operator,
            value: value ?? null,
          } as ProfileQueryFilterFieldValueCondition;
        } else if (data[0] === "PROP") {
          const [_, property, operator, value] =
            data as FlattenedProfileQueryFilterPropertyCondition;
          return {
            property: references[property] ?? (references[`$${counter++}`] = property),
            operator,
            value: value ?? null,
          } as ProfileQueryFilterPropertyCondition;
        } else {
          // fallback for old data
          const [profileTypeFieldId, operator, value] = data as unknown as [
            string,
            ProfileQueryFilterOperator,
            ProfileQueryFilterFieldValueCondition["value"],
          ];

          return {
            profileTypeFieldId,
            operator,
            value: value ?? null,
          } as ProfileQueryFilterFieldValueCondition;
        }
      })(data) as ProfileQueryFilter;
    },
    isDefault(filter) {
      return (function isDefault(filter: ProfileQueryFilter): boolean {
        return (
          "logicalOperator" in filter &&
          (filter.conditions.length === 0 || filter.conditions.every((c) => isDefault(c)))
        );
      })(filter);
    },
  });
}
