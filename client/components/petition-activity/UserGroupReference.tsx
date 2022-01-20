import { gql } from "@apollo/client";
import { Text } from "@chakra-ui/react";
import { UserGroupReference_UserGroupFragment } from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { FormattedMessage } from "react-intl";

export function UserGroupReference({
  userGroup,
}: {
  userGroup?: Maybe<UserGroupReference_UserGroupFragment>;
}) {
  return userGroup ? (
    <Text as="strong">{userGroup.name}</Text>
  ) : (
    <Text as="em">
      <FormattedMessage id="generic.deleted-user-group" defaultMessage="Deleted user group" />
    </Text>
  );
}

UserGroupReference.fragments = {
  UserGroup: gql`
    fragment UserGroupReference_UserGroup on UserGroup {
      name
    }
  `,
};
