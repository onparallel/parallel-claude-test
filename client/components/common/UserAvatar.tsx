import { gql } from "@apollo/client";
import { Avatar, AvatarBadge, AvatarProps } from "@chakra-ui/react";
import { UserAvatar_UserFragment } from "@parallel/graphql/__types";

interface UserAvatarProps extends AvatarProps {
  user: UserAvatar_UserFragment;
  showImage?: boolean;
  showBadge?: boolean;
  badgeUser?: UserAvatar_UserFragment;
}

export function UserAvatar({ user, showImage, showBadge, badgeUser, ...props }: UserAvatarProps) {
  return (
    <Avatar
      name={user.fullName ?? undefined}
      src={showImage ? user.avatarUrl ?? undefined : undefined}
      getInitials={user.initials ? () => user.initials! : undefined}
      {...props}
    >
      {showBadge ? (
        <AvatarBadge bgColor="white">
          <Avatar
            name={badgeUser?.fullName ?? undefined}
            src={showImage ? badgeUser?.avatarUrl ?? undefined : undefined}
            getInitials={badgeUser?.initials ? () => badgeUser.initials! : undefined}
            size="xs"
          />
        </AvatarBadge>
      ) : null}
    </Avatar>
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
