import { gql } from "@apollo/client";
import {
  Box,
  BoxProps,
  Center,
  Flex,
  List,
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
import { MaybePromise } from "@parallel/utils/types";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";
import { FileRejection } from "react-dropzone";
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
  isCacheOnly?: boolean;
}

export function RecipientViewPetitionFieldFileUpload({
  field,
  isDisabled,
  isInvalid,
  onDownloadAttachment,
  onDeleteReply,
  onCreateReply,
  onDownloadReply,
  onCommentsButtonClick,
  isCacheOnly,
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
                  isDisabled={isDisabled || isDeletingReply[reply.id] || reply.isAnonymized}
                  onRemove={() => handleDeletePetitionReply({ replyId: reply.id })}
                  onDownload={onDownloadReply}
                  isDownloadDisabled={isCacheOnly || reply.isAnonymized}
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
  onRemove?: () => void;
  onDownload?: (replyId: string) => void;
  isDownloadDisabled?: boolean;
}

export function RecipientViewPetitionFieldReplyFileUpload({
  reply,
  isDisabled,
  onRemove,
  onDownload,
  isDownloadDisabled,
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
        {!reply.isAnonymized ? (
          <FileIcon
            boxSize={5}
            filename={reply.content!.filename}
            contentType={reply.content!.contentType}
            hasFailed={uploadHasFailed}
          />
        ) : null}
      </Center>
      <Box flex="1" overflow="hidden" paddingBottom="2px">
        <Flex minWidth={0} whiteSpace="nowrap" alignItems="baseline">
          {!reply.isAnonymized ? (
            <>
              <FileName value={reply.content?.filename} />
              <Text as="span" marginX={2}>
                -
              </Text>
              <Text as="span" fontSize="xs" color="gray.500">
                <FileSize value={reply.content?.size} />
              </Text>
            </>
          ) : (
            <Text textStyle="hint">
              <FormattedMessage
                id="generic.document-not-available"
                defaultMessage="Document not available"
              />
            </Text>
          )}
        </Flex>
        {reply.isAnonymized || reply.content!.uploadComplete === false ? (
          <Center height="18px">
            <Progress
              borderRadius="sm"
              width="100%"
              isIndeterminate={reply.content!.progress === 1}
              value={reply.isAnonymized ? undefined : reply.content!.progress * 100}
              size="xs"
              colorScheme="green"
            />
          </Center>
        ) : (
          <Text fontSize="xs">
            {uploadHasFailed ? (
              <Text color="red.600">
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
      {onDownload !== undefined ? (
        <IconButtonWithTooltip
          isDisabled={reply.content!.uploadComplete === false || isDownloadDisabled}
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
      ) : null}
      {onRemove !== undefined ? (
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
      ) : null}
    </Stack>
  );
}

interface PetitionFieldFileUploadDropzoneProps extends BoxProps {
  isDisabled: boolean;
  field: RecipientViewPetitionFieldCard_PetitionFieldSelection;
  onCreateReply: (files: File[]) => MaybePromise<void>;
}

function PetitionFieldFileUploadDropzone({
  field,
  isDisabled,
  onCreateReply,
  ...props
}: PetitionFieldFileUploadDropzoneProps) {
  const _isDisabled = isDisabled || (!field.multiple && field.replies.length > 0);

  const MAX_FILE_SIZE = 50 * 1024 * 1024;
  const [fileDropError, setFileDropError] = useState<string | null>(null);

  async function handleFileDrop(files: File[], rejected: FileRejection[]) {
    if (rejected.length > 0) {
      setFileDropError(rejected[0].errors[0].code);
    } else {
      try {
        setFileDropError(null);
        await onCreateReply(files);
      } catch {}
    }
  }
  return (
    <>
      <Dropzone
        as={Center}
        {...(props as any)}
        minHeight="100px"
        textAlign="center"
        onDrop={handleFileDrop}
        multiple={field.multiple}
        disabled={_isDisabled}
        maxSize={MAX_FILE_SIZE}
      >
        {({ isDragActive, isDragReject }) => (
          <Box pointerEvents="none">
            <FormattedMessage
              id="generic.dropzone-default"
              defaultMessage="Drag files here, or click to select them"
            />
          </Box>
        )}
      </Dropzone>
      {fileDropError === "file-too-large" ? (
        <Text color="red.600" fontSize="sm">
          <FormattedMessage
            id="dropzone.error.file-too-large"
            defaultMessage="The file is too large. Maximum size allowed {size}"
            values={{ size: <FileSize value={MAX_FILE_SIZE} /> }}
          />
        </Text>
      ) : null}
    </>
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

const _fileUploadReplyDownloadLink = gql`
  mutation RecipientViewPetitionFieldFileUpload_fileUploadReplyDownloadLink(
    $petitionId: GID!
    $replyId: GID!
    $preview: Boolean
  ) {
    fileUploadReplyDownloadLink(petitionId: $petitionId, replyId: $replyId, preview: $preview) {
      result
      url
    }
  }
`;
