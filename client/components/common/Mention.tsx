import { gql } from "@apollo/client";
import { Box } from "@chakra-ui/react";
import { Tooltip } from "@parallel/chakra/components";
import { chakraComponent } from "@parallel/chakra/utils";
import { Mention_PetitionFieldCommentMentionFragment } from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish } from "remeda";
import { UserGroupMembersPopover } from "./UserGroupMembersPopover";
import { UserGroupReference } from "./UserGroupReference";

export function Mention({ mention }: { mention: Mention_PetitionFieldCommentMentionFragment }) {
  const intl = useIntl();
  if (isNonNullish(mention.__typename)) {
    if (mention.__typename === "PetitionFieldCommentUserMention") {
      const user = mention.user;
      if (isNullish(user)) {
        return (
          <MentionBadge mentionId={mention.mentionedId} isFaded fontStyle="italic">
            <FormattedMessage id="generic.deleted-user" defaultMessage="Deleted user" />
          </MentionBadge>
        );
      } else {
        return (
          <Tooltip
            label={intl.formatMessage({
              id: "generic.inactive-user-tooltip",
              defaultMessage: "This user is inactive",
            })}
            isDisabled={user.status !== "INACTIVE"}
          >
            <MentionBadge
              mentionId={mention.mentionedId}
              isFaded={user.status === "INACTIVE"}
              isHighlighted={user.isMe}
              textDecoration={user.status === "INACTIVE" ? "line-through" : undefined}
            >
              @{user.fullName}
            </MentionBadge>
          </Tooltip>
        );
      }
    } else if (mention.__typename === "PetitionFieldCommentUserGroupMention") {
      const userGroup = mention.userGroup;
      if (isNullish(userGroup)) {
        return (
          <MentionBadge mentionId={mention.mentionedId} isFaded fontStyle="italic">
            <FormattedMessage id="generic.deleted-user-group" defaultMessage="Deleted team" />
          </MentionBadge>
        );
      } else {
        return (
          <UserGroupMembersPopover userGroupId={userGroup.id}>
            <MentionBadge mentionId={mention.mentionedId} isHighlighted={userGroup.imMember}>
              @<UserGroupReference userGroup={userGroup} disablePopover />
            </MentionBadge>
          </UserGroupMembersPopover>
        );
      }
    }
  }
  return null;
}

interface MentionBadgeProps {
  mentionId: string;
  isHighlighted?: boolean;
  isFaded?: boolean;
}

const MentionBadge = chakraComponent<"span", MentionBadgeProps>(function MentionBadge({
  ref,
  mentionId,
  isHighlighted,
  isFaded,
  ...props
}) {
  return (
    <Box
      ref={ref as any}
      as="span"
      data-mention-id={mentionId}
      display="inline-block"
      borderRadius="sm"
      paddingX={1}
      lineHeight="short"
      marginX="0.1em"
      fontWeight={isHighlighted ? "semibold" : "normal"}
      backgroundColor={isHighlighted ? "blue.100" : "gray.100"}
      color={isHighlighted ? "blue.800" : isFaded ? "gray.400" : "gray.700"}
      {...props}
    />
  );
});

const _fragments = {
  PetitionFieldCommentMention: gql`
    fragment Mention_PetitionFieldCommentMention on PetitionFieldCommentMention {
      ... on PetitionFieldCommentUserMention {
        mentionedId
        user {
          id
          fullName
          status
          isMe
        }
      }
      ... on PetitionFieldCommentUserGroupMention {
        mentionedId
        userGroup {
          id
          imMember
          ...UserGroupReference_UserGroup
        }
      }
    }
  `,
};
