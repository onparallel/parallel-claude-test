import { chakraComponent } from "@parallel/chakra/utils";
import { Heading } from "@chakra-ui/react";
import { FieldDescription } from "@parallel/components/common/FieldDescription";
import { FileAttachmentButton } from "@parallel/components/common/FileAttachmentButton";
import { InternalFieldBadge } from "@parallel/components/common/InternalFieldBadge";
import { useFieldCommentsQueryState } from "@parallel/utils/useFieldCommentsQueryState";
import { Box, Flex, HStack, Stack } from "@parallel/components/ui";
import { isNonNullish } from "remeda";
import { CommentsButton } from "../CommentsButton";
import { RecipientViewPetitionFieldLayout_PetitionFieldSelection } from "./RecipientViewPetitionFieldLayout";

export interface RecipientViewPetitionFieldHeadingProps {
  field: RecipientViewPetitionFieldLayout_PetitionFieldSelection;
  headerNumber?: string | null;
  onDownloadAttachment: (attachmentId: string) => void;
  onCommentsButtonClick?: () => void;
}

export const RecipientViewPetitionFieldHeading = chakraComponent<
  "div",
  RecipientViewPetitionFieldHeadingProps
>(function RecipientViewPetitionFieldHeading({
  ref,
  field,
  headerNumber,
  onDownloadAttachment,
  onCommentsButtonClick,
  ...props
}) {
  const [commentsFieldId] = useFieldCommentsQueryState();

  const number = headerNumber ? `${headerNumber}. ` : "";
  const title = field.title ? field.title : "";

  return (
    <Stack as="header" id={`field-${field.id}`} gap={1} padding={2} {...props} ref={ref}>
      <HStack alignItems="flex-start">
        <Box flex="1">
          <Heading size="md">
            {field.isInternal ? <InternalFieldBadge marginEnd={2.5} marginBottom={0.5} /> : null}
            {`${number}${title}`}
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
