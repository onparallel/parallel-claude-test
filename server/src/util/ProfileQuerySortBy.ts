import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import { ProfileTypeField } from "../db/__types";
import { SortBy } from "../db/helpers/utils";
import { parseSortBy } from "../graphql/helpers/paginationPlugin";
import { fromGlobalId, isGlobalId } from "./globalId";

const SORTABLE_PROFILE_TYPE_FIELDS = ["SHORT_TEXT", "NUMBER", "DATE", "SELECT"] as const;

export type ProfileQuerySortBy = SortBy<
  "name" | "createdAt" | "updatedAt" | "closedAt" | `field_${number}`
>;

export function mapAndValidateProfileQuerySortBy(
  sortBy: string[] | null | undefined,
  profileTypeFields: Record<number, ProfileTypeField> | undefined,
): ProfileQuerySortBy[] | null | undefined {
  return sortBy?.map((value) => {
    const [field, order] = parseSortBy(value as `${ProfileQuerySortBy["field"]}_${"ASC" | "DESC"}`);

    if (field.startsWith("field_")) {
      assert(isNonNullish(profileTypeFields), "Profile type fields are required");

      const globalId = field.split("_")[1];
      assert(isGlobalId(globalId, "ProfileTypeField"), `Invalid field: ${field}`);
      const fieldId = fromGlobalId(globalId).id;
      const profileTypeField = profileTypeFields[fieldId];
      assert(isNonNullish(profileTypeField), `Field with id ${fieldId} not found`);
      assert(
        SORTABLE_PROFILE_TYPE_FIELDS.includes(profileTypeField.type),
        `Field ${fieldId} is not sortable`,
      );

      return { field: `field_${fieldId}`, order };
    }

    return { field, order };
  });
}
