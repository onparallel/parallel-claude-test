import { Box, Flex, Heading, Stack, Text, HStack } from "@chakra-ui/react";
import { BreakLines } from "@parallel/components/common/BreakLines";
import { Linkify } from "@parallel/components/common/Linkify";
import {
  RecipientViewPetitionFieldCard_PublicPetitionAccessFragment,
  RecipientViewPetitionFieldCard_PublicPetitionFieldFragment,
} from "@parallel/graphql/__types";
import { CommentsButton } from "../CommentsButton";
import { RecipientViewFieldAttachment } from "./RecipientViewFieldAttachment";
import { usePetitionFieldCommentsDialog } from "./RecipientViewPetitionFieldCommentsDialog";

export interface RecipientViewPetitionFieldHeadingProps {
  keycode: string;
  access: RecipientViewPetitionFieldCard_PublicPetitionAccessFragment;
  field: RecipientViewPetitionFieldCard_PublicPetitionFieldFragment;
  onDownloadAttachment: (attachmentId: string) => void;
}

export function RecipientViewPetitionFieldHeading({
  keycode,
  access,
  field,
  onDownloadAttachment,
}: RecipientViewPetitionFieldHeadingProps) {
  const showFieldComments = usePetitionFieldCommentsDialog();
  async function handleCommentsButtonClick() {
    try {
      await showFieldComments({
        keycode,
        access,
        field,
      });
    } catch {}
  }

  return (
    <Stack as="header" id={`field-${field.id}`} spacing={1} paddingX={2} paddingY={2}>
      <HStack alignItems="flex-start">
        <Box flex="1">{field.title ? <Heading size="md">{field.title}</Heading> : null}</Box>
        {field.options.hasCommentsEnabled ? (
          <Box paddingRight={2}>
            <CommentsButton
              commentCount={field.commentCount}
              hasUnreadComments={field.unreadCommentCount > 0}
              onClick={handleCommentsButtonClick}
            />
          </Box>
        ) : null}
      </HStack>

      {field.description ? (
        <Text color="gray.600" fontSize="sm" overflowWrap="anywhere">
          <Linkify>
            <BreakLines>{field.description}</BreakLines>
          </Linkify>
        </Text>
      ) : null}
      {field.attachments.length ? (
        <Box>
          <Flex flexWrap="wrap" gridGap={2}>
            {field.attachments.map((attachment) => (
              <RecipientViewFieldAttachment
                key={attachment.id}
                attachment={attachment}
                onClick={() => onDownloadAttachment(attachment.id)}
              />
            ))}
          </Flex>
        </Box>
      ) : null}
    </Stack>
  );
}
