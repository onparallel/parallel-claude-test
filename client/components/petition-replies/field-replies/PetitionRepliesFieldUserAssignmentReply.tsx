import { gql } from "@apollo/client";
import { Text } from "@chakra-ui/react";
import { UserReference } from "@parallel/components/common/UserReference";
import { HStack } from "@parallel/components/ui";
import { PetitionRepliesFieldUserAssignmentReply_PetitionFieldReplyFragment } from "@parallel/graphql/__types";
import { isNonNullish } from "remeda";

export function PetitionRepliesFieldUserAssignmentReply({
  reply,
}: {
  reply: PetitionRepliesFieldUserAssignmentReply_PetitionFieldReplyFragment;
}) {
  return (
    <HStack gap={1} wrap="wrap" alignItems="baseline">
      <UserReference
        useYou={false}
        user={
          isNonNullish(reply.content.user)
            ? {
                id: reply.content.user.id,
                fullName: reply.content.user.fullName,
                status: reply.content.user.status,
                isMe: false,
              }
            : null
        }
        marginEnd={1}
        as="span"
      />
      {isNonNullish(reply.content.user) ? (
        <Text as="span" fontSize="md" textStyle="hint">
          {reply.content.user.email}
        </Text>
      ) : null}
    </HStack>
  );
}

PetitionRepliesFieldUserAssignmentReply.fragments = {
  PetitionFieldReply: gql`
    fragment PetitionRepliesFieldUserAssignmentReply_PetitionFieldReply on PetitionFieldReply {
      id
      content
    }
  `,
};
