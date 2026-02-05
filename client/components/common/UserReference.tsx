import { gql } from "@apollo/client";

import { Tooltip } from "@parallel/chakra/components";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { UserReference_UserFragment } from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { Text } from "@parallel/components/ui";

export const UserReference = chakraForwardRef<
  "span",
  {
    user?: Maybe<UserReference_UserFragment>;
    useYou?: boolean;
  }
>(function UserReference({ user, useYou, ...props }, ref) {
  const intl = useIntl();

  return isNonNullish(user) ? (
    user.status === "INACTIVE" ? (
      <Tooltip
        label={intl.formatMessage({
          id: "generic.inactive-user-tooltip",
          defaultMessage: "This user is inactive",
        })}
      >
        <Text as="strong" textDecoration="line-through" {...props}>
          {user.fullName}
        </Text>
      </Tooltip>
    ) : useYou && user.isMe ? (
      <Text as="strong" fontStyle="italic" ref={ref} {...props}>
        <FormattedMessage id="generic.you" defaultMessage="You" />
      </Text>
    ) : (
      <Text as="strong" ref={ref} {...props}>
        {user.fullName}
      </Text>
    )
  ) : (
    <Text as="em" ref={ref} {...props}>
      <FormattedMessage id="generic.deleted-user" defaultMessage="Deleted user" />
    </Text>
  );
});

const _fragments = {
  User: gql`
    fragment UserReference_User on User {
      id
      fullName
      status
      isMe
    }
  `,
};
