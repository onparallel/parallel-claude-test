import { gql } from "@apollo/client";
import { Text } from "@chakra-ui/react";
import { UserReference_UserFragment } from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { FormattedMessage } from "react-intl";

export function UserReference({
  user,
}: {
  user?: Maybe<UserReference_UserFragment>;
}) {
  return user ? (
    <Text as="strong">{user.fullName}</Text>
  ) : (
    <Text as="em">
      <FormattedMessage
        id="generic.deleted-user"
        defaultMessage="Deleted user"
      />
    </Text>
  );
}

UserReference.fragments = {
  User: gql`
    fragment UserReference_User on User {
      id
      fullName
    }
  `,
};
