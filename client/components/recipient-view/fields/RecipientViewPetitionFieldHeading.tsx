import { Box, Flex, Heading, HStack, Stack } from "@chakra-ui/react";
import { FieldDescription } from "@parallel/components/common/FieldDescription";
import { FileAttachmentButton } from "@parallel/components/common/FileAttachmentButton";
import { InternalFieldBadge } from "@parallel/components/common/InternalFieldBadge";
import { CommentsButton } from "../CommentsButton";
import { RecipientViewPetitionFieldLayout_PetitionFieldSelection } from "./RecipientViewPetitionFieldLayout";
import { isDefined } from "remeda";
import { chakraForwardRef } from "@parallel/chakra/utils";

export interface RecipientViewPetitionFieldHeadingProps {
  field: RecipientViewPetitionFieldLayout_PetitionFieldSelection;
  onDownloadAttachment: (attachmentId: string) => void;
  onCommentsButtonClick?: () => Promise<void>;
}

export const RecipientViewPetitionFieldHeading = chakraForwardRef<
  "div",
  RecipientViewPetitionFieldHeadingProps
>(function RecipientViewPetitionFieldHeading(
  { field, onDownloadAttachment, onCommentsButtonClick, ...props },
  ref,
) {
  return (
    <Stack as="header" id={`field-${field.id}`} spacing={1} padding={2} {...props} ref={ref}>
      <HStack alignItems="flex-start">
        <Box flex="1">
          <Heading size="md">
            {field.isInternal ? <InternalFieldBadge marginEnd={2.5} marginBottom={0.5} /> : null}
            {field.title ? field.title : null}
          </Heading>
        </Box>
        {(field.hasCommentsEnabled || field.__typename === "PetitionField") &&
        isDefined(onCommentsButtonClick) ? (
          <Box paddingEnd={2}>
            <CommentsButton
              commentCount={field.commentCount}
              hasUnreadComments={field.unreadCommentCount > 0}
              onClick={onCommentsButtonClick}
            />
          </Box>
        ) : null}
      </HStack>

      {field.description ? (
        <FieldDescription
          description={field.description}
          color="gray.800"
          fontSize="sm"
          overflowWrap="anywhere"
        />
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
});
