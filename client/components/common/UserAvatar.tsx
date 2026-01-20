import { gql } from "@apollo/client";
import { Avatar, AvatarRootProps } from "@parallel/components/ui";
import { UserAvatar_UserFragment } from "@parallel/graphql/__types";

interface UserAvatarProps extends AvatarRootProps {
  user: UserAvatar_UserFragment;
  showImage?: boolean;
}

export function UserAvatar({ user, showImage, ...props }: UserAvatarProps) {
  return (
    <Avatar.Root
      getInitials={user.initials ? () => user.initials! : undefined}
      borderless
      {...props}
    >
      <Avatar.Image src={showImage ? (user.avatarUrl ?? undefined) : undefined} />
      <Avatar.Fallback name={user.fullName} />
    </Avatar.Root>
  );
}

const _fragments = {
  User: gql`
    fragment UserAvatar_User on User {
      fullName
      avatarUrl
      initials
    }
  `,
};
