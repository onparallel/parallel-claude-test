import { gql } from "@apollo/client";
import { Avatar, AvatarProps } from "@chakra-ui/react";
import { UserAvatar_UserFragment } from "@parallel/graphql/__types";

interface UserAvatarProps extends AvatarProps {
  user: UserAvatar_UserFragment;
  showImage?: boolean;
}

export function UserAvatar({ user, showImage, ...props }: UserAvatarProps) {
  return (
    <Avatar
      name={user.fullName ?? undefined}
      src={showImage ? user.avatarUrl ?? undefined : undefined}
      getInitials={user.initials ? () => user.initials! : undefined}
      {...props}
    />
  );
}

UserAvatar.fragments = {
  User: gql`
    fragment UserAvatar_User on User {
      fullName
      avatarUrl
      initials
    }
  `,
};
