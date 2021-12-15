import { gql } from "@apollo/client";
import {
  Box,
  BoxProps,
  Center,
  Flex,
  List,
  ListItem,
  Progress,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { CheckIcon, CloseIcon, DeleteIcon, DownloadIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { Dropzone } from "@parallel/components/common/Dropzone";
import { FileIcon } from "@parallel/components/common/FileIcon";
import { FileName } from "@parallel/components/common/FileName";
import { FileSize } from "@parallel/components/common/FileSize";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { FORMATS } from "@parallel/utils/dates";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  RecipientViewPetitionFieldCard,
  RecipientViewPetitionFieldCardProps,
  RecipientViewPetitionFieldCard_PetitionFieldReplySelection,
  RecipientViewPetitionFieldCard_PetitionFieldSelection,
} from "./RecipientViewPetitionFieldCard";

export interface RecipientViewPetitionFieldFileUploadProps
  extends Omit<
    RecipientViewPetitionFieldCardProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  isDisabled: boolean;
  onDeleteReply: (replyId: string) => void;
  onCreateReply: (content: File[]) => void;
  onDownloadReply: (replyId: string) => void;
}

export function RecipientViewPetitionFieldFileUpload({
  field,
  isDisabled,
  isInvalid,
  hasCommentsEnabled,
  onDownloadAttachment,
  onDeleteReply,
  onCreateReply,
  onDownloadReply,
  onCommentsButtonClick,
}: RecipientViewPetitionFieldFileUploadProps) {
  const [isDeletingReply, setIsDeletingReply] = useState<Record<string, boolean>>({});

  const handleDeletePetitionReply = useCallback(
    async function handleDeletePetitionReply({ replyId }: { replyId: string }) {
      setIsDeletingReply((curr) => ({ ...curr, [replyId]: true }));
      await onDeleteReply(replyId);
      setIsDeletingReply(({ [replyId]: _, ...curr }) => curr);
    },
    [onDeleteReply]
  );

  return (
    <RecipientViewPetitionFieldCard
      field={field}
      isInvalid={isInvalid}
      hasCommentsEnabled={hasCommentsEnabled}
      onCommentsButtonClick={onCommentsButtonClick}
      onDownloadAttachment={onDownloadAttachment}
    >
      {field.replies.length ? (
        <List as={Stack} marginTop={1}>
          <AnimatePresence initial={false}>
            {field.replies.map((reply) => (
              <motion.li
                key={reply.id}
                layout
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0, transition: { ease: "easeOut" } }}
                exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
              >
                <RecipientViewPetitionFieldReplyFileUpload
                  reply={reply}
                  isDisabled={isDisabled || isDeletingReply[reply.id]}
                  onRemove={() =>
                    handleDeletePetitionReply({
                      replyId: reply.id,
                    })
                  }
                  onDownload={onDownloadReply}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </List>
      ) : null}
      <Box marginTop={2}>
        <PetitionFieldFileUploadDropzone
          isDisabled={isDisabled}
          field={field}
          onCreateReply={onCreateReply}
        />
      </Box>
    </RecipientViewPetitionFieldCard>
  );
}

interface RecipientViewPetitionFieldReplyFileUploadProps {
  reply: RecipientViewPetitionFieldCard_PetitionFieldReplySelection;
  isDisabled: boolean;
  onRemove: () => void;
  onDownload: (replyId: string) => void;
}

export function RecipientViewPetitionFieldReplyFileUpload({
  reply,
  isDisabled,
  onRemove,
  onDownload,
}: RecipientViewPetitionFieldReplyFileUploadProps) {
  const intl = useIntl();

  const uploadHasFailed =
    reply.content.uploadComplete === false && reply.content.progress === undefined;

  return (
    <Stack direction="row" alignItems="center" backgroundColor="white">
      <Center
        boxSize={10}
        borderRadius="md"
        border="1px solid"
        borderColor={uploadHasFailed ? "red.500" : "gray.300"}
        color="gray.600"
        boxShadow="sm"
        fontSize="xs"
        fontWeight="bold"
        textTransform="uppercase"
      >
        <FileIcon
          boxSize={5}
          filename={reply.content!.filename}
          contentType={reply.content!.contentType}
          hasFailed={uploadHasFailed}
        />
      </Center>
      <Box flex="1" overflow="hidden" paddingBottom="2px">
        <Flex minWidth={0} whiteSpace="nowrap" alignItems="baseline">
          <FileName value={reply.content?.filename} />
          <Text as="span" marginX={2}>
            -
          </Text>
          <Text as="span" fontSize="xs" color="gray.500">
            <FileSize value={reply.content?.size} />
          </Text>
        </Flex>
        {reply.content!.progress !== undefined ? (
          <Center height="18px">
            <Progress
              borderRadius="sm"
              width="100%"
              isIndeterminate={reply.content!.progress === 1}
              value={reply.content!.progress * 100}
              size="xs"
              colorScheme="green"
            />
          </Center>
        ) : (
          <Text fontSize="xs">
            {uploadHasFailed ? (
              <Text color="red.500">
                <FormattedMessage
                  id="component.recipient-view-petition-field-reply.file-incomplete"
                  defaultMessage="This file was not uploaded correctly. Please, delete it and try again."
                />
              </Text>
            ) : (
              <DateTime value={reply.createdAt} format={FORMATS.LLL} useRelativeTime />
            )}
          </Text>
        )}
      </Box>
      {reply.status !== "PENDING" ? (
        <Center boxSize={10}>
          {reply.status === "APPROVED" ? (
            <Tooltip
              label={intl.formatMessage({
                id: "component.recipient-view-petition-field-reply.approved-file",
                defaultMessage: "This file has been approved",
              })}
            >
              <CheckIcon color="green.600" />
            </Tooltip>
          ) : (
            <Tooltip
              label={intl.formatMessage({
                id: "component.recipient-view-petition-field-reply.rejected-file",
                defaultMessage: "This file has been rejected",
              })}
            >
              <CloseIcon fontSize="14px" color="red.500" />
            </Tooltip>
          )}
        </Center>
      ) : null}
      <IconButtonWithTooltip
        isDisabled={uploadHasFailed || reply.content!.progress < 1}
        onClick={() => onDownload(reply.id)}
        variant="ghost"
        icon={<DownloadIcon />}
        size="md"
        placement="bottom"
        label={intl.formatMessage({
          id: "component.recipient-view-petition-field-reply.download-label",
          defaultMessage: "Download file",
        })}
      />
      <IconButtonWithTooltip
        isDisabled={isDisabled || reply.status === "APPROVED"}
        onClick={onRemove}
        variant="ghost"
        icon={<DeleteIcon />}
        size="md"
        placement="bottom"
        label={intl.formatMessage({
          id: "component.recipient-view-petition-field-reply.remove-reply-label",
          defaultMessage: "Remove reply",
        })}
      />
    </Stack>
  );
}

interface PetitionFieldFileUploadDropzoneProps extends BoxProps {
  isDisabled: boolean;
  field: RecipientViewPetitionFieldCard_PetitionFieldSelection;
  onCreateReply: (files: File[]) => void;
}

function PetitionFieldFileUploadDropzone({
  field,
  isDisabled,
  onCreateReply,
  ...props
}: PetitionFieldFileUploadDropzoneProps) {
  const { accepts } = field.options as FieldOptions["FILE_UPLOAD"];
  const accept = accepts
    ? accepts.flatMap((type) => {
        switch (type) {
          case "IMAGE":
            return ["image/*"];
          case "DOCUMENT":
            return [
              "application/pdf",
              "application/msword",
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ];
          case "VIDEO":
            return ["video/*"];
          case "PDF":
            return ["application/pdf"];
          default:
            return [];
        }
      })
    : undefined;
  const _isDisabled = isDisabled || (!field.multiple && field.replies.length > 0);
  return (
    <Dropzone
      as={Center}
      {...props}
      minHeight="100px"
      textAlign="center"
      accept={accept}
      onDrop={onCreateReply}
      multiple={field.multiple}
      disabled={_isDisabled}
    >
      {({ isDragActive, isDragReject }) => (
        <Box pointerEvents="none">
          {isDragActive && isDragReject ? (
            <>
              <FormattedMessage
                id="generic.dropzone-allowed-types"
                defaultMessage="Only the following file types are allowed:"
              />
              <List paddingLeft={4}>
                {accepts!.map((type) => (
                  <ListItem listStyleType="disc" key={type}>
                    {type === "DOCUMENT" ? (
                      <FormattedMessage
                        id="generic.file-types.document"
                        defaultMessage="Documents (.pdf, .doc, .docx)"
                      />
                    ) : type === "IMAGE" ? (
                      <FormattedMessage
                        id="generic.file-types.image"
                        defaultMessage="Images (.jpeg, .png, etc.)"
                      />
                    ) : type === "VIDEO" ? (
                      <FormattedMessage
                        id="generic.file-types.video"
                        defaultMessage="Videos (.mp4, .avi, etc.)"
                      />
                    ) : type === "PDF" ? (
                      <FormattedMessage
                        id="generic.file-types.pdf"
                        defaultMessage="PDF Documents"
                      />
                    ) : null}
                  </ListItem>
                ))}
              </List>
            </>
          ) : (
            <FormattedMessage
              id="generic.dropzone-default"
              defaultMessage="Drag files here, or click to select them"
            />
          )}
        </Box>
      )}
    </Dropzone>
  );
}

const _publicFileUploadReplyDownloadLink = gql`
  mutation RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLink(
    $keycode: ID!
    $replyId: GID!
    $preview: Boolean
  ) {
    publicFileUploadReplyDownloadLink(keycode: $keycode, replyId: $replyId, preview: $preview) {
      result
      url
    }
  }
`;
