import { Box, Flex, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import { BreakLines } from "@parallel/components/common/BreakLines";
import { FileAttachmentButton } from "@parallel/components/common/FileAttachmentButton";
import { InternalFieldBadge } from "@parallel/components/common/InternalFieldBadge";
import { Linkify } from "@parallel/components/common/Linkify";
import { CommentsButton } from "../CommentsButton";
import { RecipientViewPetitionFieldCard_PetitionFieldSelection } from "./RecipientViewPetitionFieldCard";

export interface RecipientViewPetitionFieldHeadingProps {
  field: RecipientViewPetitionFieldCard_PetitionFieldSelection;
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
        <Box flex="1">
          {field.title ? (
            <Heading size="md">
              {field.isInternal ? (
                <InternalFieldBadge marginRight={2.5} marginBottom={0.5} />
              ) : null}
              {field.title}
            </Heading>
          ) : null}
        </Box>
        {field.options.hasCommentsEnabled || field.__typename === "PetitionField" ? (
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
              <FileAttachmentButton
                showDownloadIcon
                key={attachment.id}
                file={attachment.file}
                onClick={() => onDownloadAttachment(attachment.id)}
              />
            ))}
          </Flex>
        </Box>
      ) : null}
    </Stack>
  );
}
