import { gql } from "@apollo/client";
import { Text } from "@chakra-ui/react";
import { ProfileSubscribers_UserFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { UserAvatarList } from "../common/UserAvatarList";

export function ProfileSubscribers({ users }: { users: ProfileSubscribers_UserFragment[] }) {
  if (!users?.length) {
    return (
      <Text fontWeight={400} fontStyle="italic" color="gray.600">
        <FormattedMessage
          id="component.profile-subscribers.no-subscribers-button"
          defaultMessage="No subscribers"
        />
      </Text>
    );
  }

  return <UserAvatarList size="sm" boxSize={9} usersOrGroups={users} />;
}

ProfileSubscribers.fragments = {
  User: gql`
    fragment ProfileSubscribers_User on User {
      id
      ...UserAvatarList_User
    }
    ${UserAvatarList.fragments.User}
  `,
};
