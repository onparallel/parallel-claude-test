import { Box, Flex, Heading, HStack, Stack } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { FieldDescription } from "@parallel/components/common/FieldDescription";
import { FileAttachmentButton } from "@parallel/components/common/FileAttachmentButton";
import { InternalFieldBadge } from "@parallel/components/common/InternalFieldBadge";
import { useFieldCommentsQueryState } from "@parallel/utils/useFieldCommentsQueryState";
import { isNonNullish } from "remeda";
import { CommentsButton } from "../CommentsButton";
import { RecipientViewPetitionFieldLayout_PetitionFieldSelection } from "./RecipientViewPetitionFieldLayout";

export interface RecipientViewPetitionFieldHeadingProps {
  field: RecipientViewPetitionFieldLayout_PetitionFieldSelection;
  onDownloadAttachment: (attachmentId: string) => void;
  onCommentsButtonClick?: () => void;
}

export const RecipientViewPetitionFieldHeading = chakraForwardRef<
  "div",
  RecipientViewPetitionFieldHeadingProps
>(function RecipientViewPetitionFieldHeading(
  { field, onDownloadAttachment, onCommentsButtonClick, ...props },
  ref,
) {
  const [commentsFieldId] = useFieldCommentsQueryState();

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
        isNonNullish(onCommentsButtonClick) ? (
          <Box paddingEnd={2}>
            <CommentsButton
              commentCount={field.commentCount}
              hasUnreadComments={field.unreadCommentCount > 0}
              onClick={onCommentsButtonClick}
              backgroundColor={commentsFieldId === field.id ? "gray.300" : undefined}
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
