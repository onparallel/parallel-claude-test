import { gql } from "@apollo/client";
import { Text } from "@chakra-ui/react";
import { UsersIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { UserGroupReference_UserGroupFragment, UserLocale } from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { FormattedMessage } from "react-intl";
import { LocalizableUserTextRender, localizableUserTextRender } from "./LocalizableUserTextRender";
import { SmallPopover } from "./SmallPopover";

interface UserGroupReferenceProps {
  userGroup?: Maybe<UserGroupReference_UserGroupFragment>;
  disablePopover?: boolean;
}

export const UserGroupReference = Object.assign(
  chakraForwardRef<"span", UserGroupReferenceProps>(function UserGroupReference(
    { userGroup, disablePopover, ...props },
    ref,
  ) {
    if (userGroup) {
      return (
        <Text ref={ref} as="span" {...props}>
          <LocalizableUserTextRender value={userGroup.localizableName} default={userGroup.name} />
          {userGroup.type === "ALL_USERS" ? (
            <>
              &nbsp;
              <SmallPopover
                isDisabled={disablePopover}
                content={
                  <Text fontSize="sm">
                    <FormattedMessage
                      id="component.user-group-reference.all-users-description"
                      defaultMessage="This team contains all users from the organization."
                    />
                  </Text>
                }
              >
                <UsersIcon marginBottom={0.5} />
              </SmallPopover>
            </>
          ) : null}
        </Text>
      );
    } else {
      return (
        <Text ref={ref} as="em" {...props}>
          <FormattedMessage id="generic.deleted-user-group" defaultMessage="Deleted team" />
        </Text>
      );
    }
  }),
  {
    fragments: {
      UserGroup: gql`
        fragment UserGroupReference_UserGroup on UserGroup {
          name
          localizableName
          type
        }
      `,
    },
  },
);

export function userGroupReferenceText(
  userGroup: UserGroupReference_UserGroupFragment,
  locale: UserLocale,
) {
  return localizableUserTextRender({
    value: userGroup.localizableName,
    locale,
    default: userGroup.name,
  });
}
