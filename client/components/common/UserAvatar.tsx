import { gql } from "@apollo/client";
import { Avatar, AvatarProps } from "@chakra-ui/react";
import { UserAvatar_UserFragment } from "@parallel/graphql/__types";

interface UserAvatarProps extends AvatarProps {
  user: UserAvatar_UserFragment;
}

export function UserAvatar({ user, ...props }: UserAvatarProps) {
  return (
    <Avatar name={user?.fullName ?? undefined} src={user?.avatarUrl ?? undefined} {...props} />
  );
}

UserAvatar.fragments = {
  User: gql`
    fragment UserAvatar_User on User {
      fullName
      avatarUrl
    }
  `,
};
