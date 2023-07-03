import { gql } from "@apollo/client";
import { ProfileLink_ProfileFragment } from "@parallel/graphql/__types";
import { Link } from "./Link";
import { Text } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

export function ProfileLink({ profile }: { profile?: ProfileLink_ProfileFragment | null }) {
  return profile ? (
    <Link href={`/app/profiles/${profile.id}`}>
      {profile.name || (
        <Text textStyle="hint" as="span">
          <FormattedMessage id="generic.unnamed-profile" defaultMessage="Unnamed profile" />
        </Text>
      )}
    </Link>
  ) : (
    <Text textStyle="hint" as="span">
      <FormattedMessage id="generic.deleted-profile" defaultMessage="Deleted profile" />
    </Text>
  );
}

ProfileLink.fragments = {
  Profile: gql`
    fragment ProfileLink_Profile on Profile {
      id
      name
    }
  `,
};
