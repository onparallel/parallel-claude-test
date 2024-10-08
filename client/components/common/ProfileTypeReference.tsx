import { gql } from "@apollo/client";
import { ProfileTypeReference_ProfileTypeFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { LocalizableUserTextRender } from "./LocalizableUserTextRender";

export function ProfileTypeReference({
  profileType,
  usePlural,
}: {
  profileType: ProfileTypeReference_ProfileTypeFragment;
  usePlural?: boolean;
}) {
  if (usePlural) {
    return (
      <LocalizableUserTextRender
        value={profileType.pluralName}
        default={
          <LocalizableUserTextRender
            value={profileType.name}
            default={
              <FormattedMessage
                id="generic.unnamed-profile-type"
                defaultMessage="Unnamed profile type"
              />
            }
          />
        }
      />
    );
  }
  return (
    <LocalizableUserTextRender
      value={profileType.name}
      default={
        <FormattedMessage id="generic.unnamed-profile-type" defaultMessage="Unnamed profile type" />
      }
    />
  );
}

ProfileTypeReference.fragments = {
  ProfileType: gql`
    fragment ProfileTypeReference_ProfileType on ProfileType {
      id
      name
      pluralName
    }
  `,
};
