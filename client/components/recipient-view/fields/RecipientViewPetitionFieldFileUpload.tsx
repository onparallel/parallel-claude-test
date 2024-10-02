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
} from "@chakra-ui/react";
import { Tooltip } from "@parallel/chakra/components";
import { CheckIcon, CloseIcon, DeleteIcon, DownloadIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { Dropzone } from "@parallel/components/common/Dropzone";
import { FileIcon } from "@parallel/components/common/FileIcon";
import { FileName } from "@parallel/components/common/FileName";
import { FileSize } from "@parallel/components/common/FileSize";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { useTone } from "@parallel/components/common/ToneProvider";
import { EsTaxDocumentsContentErrorMessage } from "@parallel/components/petition-common/EsTaxDocumentsContentErrorMessage";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { FORMATS } from "@parallel/utils/dates";
import { FieldOptions, FileUploadAccepts } from "@parallel/utils/petitionFields";
import { MaybePromise } from "@parallel/utils/types";
import { useCheckIfFileIsPasswordProtected } from "@parallel/utils/useCheckIfFileIsPasswordProtected";
import { useFileUploadFormats } from "@parallel/utils/useFileUploadFormats";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { FileRejection } from "react-dropzone";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import {
  RecipientViewPetitionFieldLayout,
  RecipientViewPetitionFieldLayoutProps,
  RecipientViewPetitionFieldLayout_PetitionFieldReplySelection,
  RecipientViewPetitionFieldLayout_PetitionFieldSelection,
} from "./RecipientViewPetitionFieldLayout";

export interface RecipientViewPetitionFieldFileUploadProps
  extends Omit<
    RecipientViewPetitionFieldLayoutProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  isDisabled: boolean;
  onDeleteReply: (replyId: string) => void;
  onCreateReply: (content: { file: File; password?: string }[]) => void;
  onDownloadReply: (replyId: string) => void;
  onError: (error: any) => void;
  isInvalid?: boolean;
  isCacheOnly?: boolean;
  parentReplyId?: string;
}

export function RecipientViewPetitionFieldFileUpload({
  field,
  isDisabled,
  onDownloadAttachment,
  onDeleteReply,
  onCreateReply,
  onDownloadReply,
  onCommentsButtonClick,
  onError,
  isCacheOnly,
  isInvalid,
  parentReplyId,
}: RecipientViewPetitionFieldFileUploadProps) {
  const [isDeletingReply, setIsDeletingReply] = useState<Record<string, boolean>>({});

  const handleDeletePetitionReply = useCallback(
    async function handleDeletePetitionReply({ replyId }: { replyId: string }) {
      setIsDeletingReply((curr) => ({ ...curr, [replyId]: true }));
      await onDeleteReply(replyId);
      setIsDeletingReply(({ [replyId]: _, ...curr }) => curr);
    },
    [onDeleteReply],
  );
  const [hasAlreadyRepliedError, setHasAlreadyRepliedError] = useState(false);
  const fieldReplies = completedFieldReplies(field);

  useEffect(() => {
    if (hasAlreadyRepliedError) {
      setHasAlreadyRepliedError(false);
    }
  }, [field.replies]);

  const handleError = useCallback((e: any) => {
    if (isApolloError(e, "FIELD_ALREADY_REPLIED_ERROR")) {
      setHasAlreadyRepliedError(true);
    }
    onError(e);
  }, []);

  return (
    <RecipientViewPetitionFieldLayout
      field={field}
      onCommentsButtonClick={onCommentsButtonClick}
      onDownloadAttachment={onDownloadAttachment}
    >
      {hasAlreadyRepliedError ? (
        <Text fontSize="sm" color="red.500">
          <FormattedMessage id="generic.reply-not-submitted" defaultMessage="Reply not sent" />
        </Text>
      ) : (
        <Text fontSize="sm" color="gray.600">
          <FormattedMessage
            id="component.recipient-view-petition-field-card.files-uploaded"
            defaultMessage="{count, plural, =0 {No files have been uploaded yet} =1 {1 file uploaded} other {# files uploaded}}"
            values={{ count: fieldReplies.length }}
          />
        </Text>
      )}

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
                  id={`reply-${field.id}${reply.parent ? `-${reply.parent.id}` : ""}-${reply.id}`}
                  type="FILE_UPLOAD"
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
          onError={handleError}
          isInvalid={isInvalid || hasAlreadyRepliedError}
          parentReplyId={parentReplyId}
        />
      </Box>
    </RecipientViewPetitionFieldLayout>
  );
}

interface RecipientViewPetitionFieldReplyFileUploadProps {
  id: string;
  type: PetitionFieldType;
  reply: RecipientViewPetitionFieldLayout_PetitionFieldReplySelection;
  isDisabled: boolean;
  onRemove?: () => void;
  onDownload?: (replyId: string) => void;
  isDownloadDisabled?: boolean;
}

export function RecipientViewPetitionFieldReplyFileUpload({
  id,
  reply,
  type,
  isDisabled,
  onRemove,
  onDownload,
  isDownloadDisabled,
}: RecipientViewPetitionFieldReplyFileUploadProps) {
  const intl = useIntl();
  const tone = useTone();
  const uploadHasFailed =
    reply.content.uploadComplete === false && reply.content.progress === undefined;

  return (
    <Stack direction="row" alignItems="center" backgroundColor="white" id={id}>
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
            hasFailed={uploadHasFailed || reply.content.error}
          />
        ) : null}
      </Center>
      <Box flex="1" overflow="hidden" paddingBottom="2px">
        <Flex minWidth={0} whiteSpace="nowrap" alignItems="baseline">
          {!reply.isAnonymized ? (
            reply.content.error ? (
              <Text>
                {reply.content.type === "identity-verification" ? (
                  <FormattedMessage
                    id="component.recipient-view-petition-field-reply.es-tax-documents-identity-verification-error-header"
                    defaultMessage="Identity Verification"
                  />
                ) : (
                  [reply.content.request.model.type, reply.content.request.model.year]
                    .filter(isNonNullish)
                    .join("_")
                )}
              </Text>
            ) : (
              <>
                <FileName value={reply.content?.filename} />
                <Text as="span" marginX={2}>
                  -
                </Text>
                <Text as="span" fontSize="xs" color="gray.500">
                  <FileSize value={reply.content?.size} />
                </Text>
              </>
            )
          ) : (
            <Text textStyle="hint">
              <FormattedMessage
                id="generic.document-not-available"
                defaultMessage="Document not available"
              />
            </Text>
          )}
        </Flex>
        {reply.isAnonymized ||
        (reply.content!.uploadComplete === false && !uploadHasFailed && !reply.content.error) ? (
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
          <>
            {uploadHasFailed ? (
              <Text as="span" color="red.600" fontSize="xs">
                <FormattedMessage
                  id="component.recipient-view-petition-field-reply.file-incomplete"
                  defaultMessage="There was an error uploading the file. {tone, select, INFORMAL {Please try again} other {Please upload it again}}."
                  values={{
                    tone,
                  }}
                />
              </Text>
            ) : type === "ES_TAX_DOCUMENTS" && reply.content.error ? (
              <EsTaxDocumentsContentErrorMessage
                type={reply.content.type}
                error={reply.content.error}
              />
            ) : type === "ES_TAX_DOCUMENTS" &&
              reply.content.warning === "manual_review_required" &&
              reply.status === "PENDING" ? (
              <Text fontSize="xs" color="yellow.500">
                <FormattedMessage
                  id="component.recipient-view-petition-field-reply.manual-review-required"
                  defaultMessage="We could not verify automatically that this is a valid document."
                />
              </Text>
            ) : (
              <DateTime
                fontSize="xs"
                value={reply.createdAt}
                format={FORMATS.LLL}
                useRelativeTime
              />
            )}
          </>
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
          isDisabled={
            reply.content!.uploadComplete === false || isDownloadDisabled || reply.content.error
          }
          onClick={() => onDownload(reply.id)}
          variant="ghost"
          icon={<DownloadIcon />}
          size="md"
          placement="bottom"
          label={intl.formatMessage({
            id: "generic.download-file",
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
  field: RecipientViewPetitionFieldLayout_PetitionFieldSelection;
  onCreateReply: (content: { file: File; password?: string }[]) => MaybePromise<void>;
  onError: (error: any) => void;
  isInvalid?: boolean;
  parentReplyId?: string;
}

function PetitionFieldFileUploadDropzone({
  field,
  isDisabled,
  onCreateReply,
  onError,
  isInvalid,
  parentReplyId,
  ...props
}: PetitionFieldFileUploadDropzoneProps) {
  const tone = useTone();
  const intl = useIntl();

  const { accepts, maxFileSize }: FieldOptions["FILE_UPLOAD"] = field.options as any;

  const _isDisabled = isDisabled || (!field.multiple && field.replies.length > 0);

  const fileUploadFormats = useFileUploadFormats();

  function getAcceptFormats(acceptTypes: FileUploadAccepts[]): Record<string, string[]> {
    const formats: Record<FileUploadAccepts, Record<string, string[]>> = {
      PDF: { "application/pdf": [".pdf"] },
      IMAGE: {
        "image/png": [".png"],
        "image/jpeg": [".jpeg", ".jpg"],
      },
    };
    return Object.assign({}, ...acceptTypes.map((type) => formats[type]));
  }

  const MIN_FILE_SIZE = 1;
  const MAX_FILE_SIZE = maxFileSize ?? 300 * 1024 * 1024;
  const [fileDropError, setFileDropError] = useState<string | null>(null);

  const checkIfPdfIsPasswordProtected = useCheckIfFileIsPasswordProtected();
  async function handleFileDrop(files: File[], rejected: FileRejection[]) {
    if (rejected.length > 0) {
      setFileDropError(rejected[0].errors[0].code);
    } else {
      try {
        setFileDropError(null);
        const finalFiles: { file: File; password?: string }[] = [];
        for (const file of files) {
          const result = await checkIfPdfIsPasswordProtected(file);
          if (result.message === "PASSWORD_ENTERED") {
            finalFiles.push({ file, password: result.password });
          } else if (result.message === "NO_PASSWORD") {
            finalFiles.push({ file });
          }
        }
        await onCreateReply(finalFiles);
      } catch (e) {
        onError(e);
      }
    }
  }
  return (
    <>
      <Dropzone
        as={Center}
        data-testid="recipient-view-field-file-upload-new-reply-dropzone"
        {...(props as any)}
        minHeight="100px"
        textAlign="center"
        onDrop={handleFileDrop}
        multiple={field.multiple}
        accept={accepts ? getAcceptFormats(accepts) : undefined}
        disabled={_isDisabled}
        minSize={MIN_FILE_SIZE}
        maxSize={MAX_FILE_SIZE}
        isInvalid={isInvalid}
        id={`reply-${field.id}${parentReplyId ? `-${parentReplyId}` : ""}-new`}
      >
        {({ isDragActive, isDragReject }) => (
          <Box pointerEvents="none">
            {isDragActive && isDragReject ? (
              <>
                <FormattedMessage
                  id="generic.dropzone-allowed-types"
                  defaultMessage="Only the following file types are allowed:"
                />
                <List paddingStart={4} textAlign="start">
                  {accepts?.map((type) => {
                    const option = fileUploadFormats.find((f) => f.value === type);

                    if (!option || option.extensions === undefined) {
                      return null;
                    }

                    const text = `${option.label} (${intl.formatList(option.extensions, {
                      type: "conjunction",
                    })})`;

                    return (
                      <ListItem listStyleType="disc" key={type}>
                        {text}
                      </ListItem>
                    );
                  })}
                </List>
              </>
            ) : (
              <FormattedMessage
                id="component.recipient-view-petition-field-file-upload.dropzone-placeholder"
                defaultMessage="Drag files here, or click to select them"
                values={{ tone }}
              />
            )}
          </Box>
        )}
      </Dropzone>
      {fileDropError === "file-too-large" ? (
        <Text color="red.600" fontSize="sm" marginTop={2}>
          <FormattedMessage
            id="generic.dropzone-error-file-too-large"
            defaultMessage="The file is too large. Maximum size allowed {size}"
            values={{ size: <FileSize value={MAX_FILE_SIZE} /> }}
          />
        </Text>
      ) : null}
      {fileDropError === "file-too-small" ? (
        <Text color="red.600" fontSize="sm" marginTop={2}>
          <FormattedMessage
            id="generic.dropzone-error-file-too-small"
            defaultMessage="The file is too small. Minimum size allowed {size}"
            values={{ size: <FileSize value={MIN_FILE_SIZE} /> }}
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
