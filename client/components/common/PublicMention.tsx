import { gql } from "@apollo/client";
import { Text } from "@chakra-ui/react";
import { PublicMention_PublicPetitionFieldCommentMentionFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { isDefined } from "remeda";
import { MentionBadge } from "./MentionBadge";

export function PublicMention({
  mention,
}: {
  mention: PublicMention_PublicPetitionFieldCommentMentionFragment;
}) {
  return (
    <MentionBadge
      mentionId={mention.id}
      isFaded={!isDefined(mention.name)}
      fontStyle={!isDefined(mention.name) ? "italic" : "inherit"}
    >
      {!isDefined(mention.name) ? (
        mention.type === "User" ? (
          <FormattedMessage id="generic.deleted-user" defaultMessage="Deleted user" />
        ) : (
          <FormattedMessage id="generic.deleted-user-group" defaultMessage="Deleted team" />
        )
      ) : (
        <Text>@{mention.name}</Text>
      )}
    </MentionBadge>
  );
}

PublicMention.fragments = {
  PublicPetitionFieldCommentMention: gql`
    fragment PublicMention_PublicPetitionFieldCommentMention on PublicPetitionFieldCommentMention {
      id
      name
      type
    }
  `,
};
