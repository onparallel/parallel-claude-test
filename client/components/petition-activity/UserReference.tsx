import { gql } from "@apollo/client";
import { Text, Tooltip } from "@chakra-ui/react";
import { UserReference_UserFragment } from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { FormattedMessage, useIntl } from "react-intl";

export function UserReference({ user }: { user?: Maybe<UserReference_UserFragment> }) {
  const intl = useIntl();

  return user ? (
    <Tooltip
      label={intl.formatMessage({
        id: "generic.inactive-user.tooltip",
        defaultMessage: "This user is inactive",
      })}
      isDisabled={user.status !== "INACTIVE"}
    >
      <Text as="strong" textDecoration={user.status === "INACTIVE" ? "line-through" : "none"}>
        {user.fullName}
      </Text>
    </Tooltip>
  ) : (
    <Text as="em">
      <FormattedMessage id="generic.deleted-user" defaultMessage="Deleted user" />
    </Text>
  );
}

UserReference.fragments = {
  User: gql`
    fragment UserReference_User on User {
      id
      fullName
      status
    }
  `,
};
