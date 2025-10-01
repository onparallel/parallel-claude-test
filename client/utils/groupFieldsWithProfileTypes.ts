import { gql } from "@apollo/client";
import { groupFieldsWithProfileTypes_PetitionFieldFragment } from "@parallel/graphql/__types";
import { isNonNullish } from "remeda";

// Use the GraphQL fragment as the base type for better type safety and maintenance
type GroupableField = groupFieldsWithProfileTypes_PetitionFieldFragment;

/**
 * Groups fields that meet specific conditions:
 * 1. Field type must be "FIELD_GROUP"
 * 2. No multiple responses (!field.multiple)
 * 3. Same profile type (field.profileType.id)
 * 4. Same group name (field.options.groupName)
 *
 * @returns Array of arrays where each sub-array represents a group.
 *          If a sub-array has more than 1 element, they should be merged into a single row.
 *          If it has 1 element, it's displayed as an individual row.
 */
export function groupFieldsWithProfileTypes<T extends GroupableField = GroupableField>(
  fieldGroupsWithProfileTypes: T[],
): T[][] {
  // Group fields that meet specific conditions
  const groupedFieldsMap: Record<string, T[]> = {};

  const validFields = fieldGroupsWithProfileTypes.filter(
    (field) => field.type === "FIELD_GROUP" && isNonNullish(field.profileType?.id),
  );

  for (const field of validFields) {
    // Conditions for grouping:
    // 1. Field type must be "FIELD_GROUP"
    // 2. No multiple responses (!field.multiple)
    // 3. Same profile type (field.profileType.id)
    // 4. Same group name (field.options.groupName)

    if (
      !field.multiple &&
      isNonNullish(field.profileType?.id) &&
      isNonNullish(field.options?.groupName)
    ) {
      const groupKey = `${field.profileType.id}-${field.options.groupName}`;

      if (!groupedFieldsMap[groupKey]) {
        groupedFieldsMap[groupKey] = [];
      }
      groupedFieldsMap[groupKey].push(field);
    } else {
      // Fields that don't meet conditions are kept separate
      const individualKey = `individual-${field.id}`;
      groupedFieldsMap[individualKey] = [field];
    }
  }

  // Return all groups (no need to filter for conflicts)
  return Object.values(groupedFieldsMap);
}

/**
 * Utility to count the total number of rows that will be displayed in the UI
 */
export function countTotalRows<T extends GroupableField = GroupableField>(
  groupedFields: T[][],
): number {
  return groupedFields.reduce((total, group) => {
    if (group.length === 1) {
      // Individual group: count all replies
      return total + group[0].replies.length;
    } else {
      // Merged group: count as 1 row (all replies merged)
      return total + 1;
    }
  }, 0);
}

/**
 * Utility to count rows that have an associated profile
 */
export function countLinkedRows<T extends GroupableField = GroupableField>(
  groupedFields: T[][],
): number {
  let linkedCount = 0;

  for (const group of groupedFields) {
    if (group.length === 1) {
      // Individual group: count replies with associated profile
      for (const reply of group[0].replies) {
        if (reply.associatedProfile?.id) {
          linkedCount++;
        }
      }
    } else {
      // Merged group: check if any reply has an associated profile
      const hasLinkedProfile = group.some((field) =>
        field.replies.some((reply) => reply.associatedProfile?.id),
      );
      if (hasLinkedProfile) {
        linkedCount++;
      }
    }
  }

  return linkedCount;
}

groupFieldsWithProfileTypes.fragments = {
  get PetitionField() {
    return gql`
      fragment groupFieldsWithProfileTypes_PetitionField on PetitionField {
        id
        type
        options
        multiple
        profileType {
          id
        }
        replies {
          ...groupFieldsWithProfileTypes_PetitionFieldReply
        }
      }
      ${this.PetitionFieldReply}
    `;
  },
  get PetitionFieldReply() {
    return gql`
      fragment groupFieldsWithProfileTypes_PetitionFieldReply on PetitionFieldReply {
        id
        children {
          field {
            profileTypeField {
              id
            }
          }
        }
        associatedProfile {
          id
        }
      }
    `;
  },
};
