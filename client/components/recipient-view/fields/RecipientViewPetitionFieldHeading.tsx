import { Box, Flex, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import { BreakLines } from "@parallel/components/common/BreakLines";
import { Linkify } from "@parallel/components/common/Linkify";
import { RecipientViewPetitionFieldCard_PublicPetitionFieldFragment } from "@parallel/graphql/__types";
import { CommentsButton } from "../CommentsButton";
import { RecipientViewFieldAttachment } from "./RecipientViewFieldAttachment";

export interface RecipientViewPetitionFieldHeadingProps {
  field: RecipientViewPetitionFieldCard_PublicPetitionFieldFragment;
  onDownloadAttachment: (attachmentId: string) => void;
  onCommentsButtonClick: () => Promise<void>;
}

export function RecipientViewPetitionFieldHeading({
  field,
  onDownloadAttachment,
  onCommentsButtonClick,
}: RecipientViewPetitionFieldHeadingProps) {
  return (
    <Stack as="header" id={`field-${field.id}`} spacing={1} paddingX={2} paddingY={2}>
      <HStack alignItems="flex-start">
        <Box flex="1">{field.title ? <Heading size="md">{field.title}</Heading> : null}</Box>
        {field.options.hasCommentsEnabled ? (
          <Box paddingRight={2}>
            <CommentsButton
              commentCount={field.commentCount}
              hasUnreadComments={field.unreadCommentCount > 0}
              onClick={onCommentsButtonClick}
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
