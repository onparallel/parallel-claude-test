import { gql } from "@apollo/client";
import { getFieldsReferencedInMonitoring_ProfileTypeFieldFragment } from "@parallel/graphql/__types";
import { ProfileTypeFieldOptions } from "./profileFields";

export function getFieldsReferencedInMonitoring({
  profileTypeFields,
  profileTypeFieldId,
}: {
  profileTypeFields: getFieldsReferencedInMonitoring_ProfileTypeFieldFragment[];
  profileTypeFieldId: string;
}) {
  return profileTypeFields
    .filter((f) => f.type === "BACKGROUND_CHECK" || f.type === "ADVERSE_MEDIA_SEARCH")
    .filter((f) => {
      const options = f.options as ProfileTypeFieldOptions<
        "BACKGROUND_CHECK" | "ADVERSE_MEDIA_SEARCH"
      >;
      return (
        options.monitoring?.activationCondition?.profileTypeFieldId === profileTypeFieldId ||
        (options.monitoring?.searchFrequency?.type === "VARIABLE" &&
          options.monitoring?.searchFrequency?.profileTypeFieldId === profileTypeFieldId)
      );
    });
}

const _fragments = {
  ProfileTypeField: gql`
    fragment getFieldsReferencedInMonitoring_ProfileTypeField on ProfileTypeField {
      id
      type
      options
      name
    }
  `,
};
