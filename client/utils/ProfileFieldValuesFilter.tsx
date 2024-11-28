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
