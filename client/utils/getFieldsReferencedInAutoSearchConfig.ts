import { gql } from "@apollo/client";
import { getFieldsReferencedInAutoSearchConfig_ProfileTypeFieldFragment } from "@parallel/graphql/__types";
import { ProfileTypeFieldOptions } from "./profileFields";

export function getFieldsReferencedInAutoSearchConfig({
  profileTypeFields,
  profileTypeFieldId,
}: {
  profileTypeFields: getFieldsReferencedInAutoSearchConfig_ProfileTypeFieldFragment[];
  profileTypeFieldId: string;
}) {
  return profileTypeFields
    .filter((f) => f.type === "BACKGROUND_CHECK")
    .filter((f) => {
      const options = f.options as ProfileTypeFieldOptions<"BACKGROUND_CHECK">;
      return (
        options.autoSearchConfig?.name.some((name) => name === profileTypeFieldId) ||
        options.autoSearchConfig?.date === profileTypeFieldId ||
        options.autoSearchConfig?.country === profileTypeFieldId ||
        options.autoSearchConfig?.birthCountry === profileTypeFieldId ||
        options.autoSearchConfig?.activationCondition?.profileTypeFieldId === profileTypeFieldId
      );
    });
}

const _fragments = {
  ProfileTypeField: gql`
    fragment getFieldsReferencedInAutoSearchConfig_ProfileTypeField on ProfileTypeField {
      id
      type
      options
      name
    }
  `,
};
