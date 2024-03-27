import { gql } from "@apollo/client";
import { getReferencedInBackgroundCheck_ProfileTypeFieldFragment } from "@parallel/graphql/__types";
import { ProfileTypeFieldOptions } from "./profileFields";

export function getReferencedInBackgroundCheck({
  profileTypeFields,
  profileTypeFieldId,
}: {
  profileTypeFields: getReferencedInBackgroundCheck_ProfileTypeFieldFragment[];
  profileTypeFieldId: string;
}) {
  return profileTypeFields
    .filter((f) => f.type === "BACKGROUND_CHECK")
    .filter((f) => {
      const options = f.options as ProfileTypeFieldOptions<"BACKGROUND_CHECK">;
      return (
        options.monitoring?.activationCondition?.profileTypeFieldId === profileTypeFieldId ||
        (options.monitoring?.searchFrequency?.type === "VARIABLE" &&
          options.monitoring?.searchFrequency?.profileTypeFieldId === profileTypeFieldId)
      );
    });
}

getReferencedInBackgroundCheck.fragments = {
  ProfileTypeField: gql`
    fragment getReferencedInBackgroundCheck_ProfileTypeField on ProfileTypeField {
      id
      type
      options
      name
    }
  `,
};
