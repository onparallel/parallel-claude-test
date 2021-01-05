import { gql } from "@apollo/client";
import {
  Center,
  Text,
  Box,
  BoxProps,
  Flex,
  List,
  ListItem,
  Stack,
  Progress,
} from "@chakra-ui/react";
import { DeleteIcon, DownloadIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { DateTime } from "@parallel/components/common/DateTime";
import { FileName } from "@parallel/components/common/FileName";
import { FileSize } from "@parallel/components/common/FileSize";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { useFailureGeneratingLinkDialog } from "@parallel/components/petition-replies/FailureGeneratingLinkDialog";
import {
  RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragment,
  RecipientViewPetitionField_PublicPetitionFieldFragment,
  useRecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkMutation,
} from "@parallel/graphql/__types";
import { generateCssStripe } from "@parallel/utils/css";
import { FORMATS } from "@parallel/utils/dates";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { FormattedMessage, useIntl } from "react-intl";
import { useCreateFileUploadReply, useDeletePetitionReply } from "./mutations";
import {
  RecipientViewPetitionFieldCard,
  RecipientViewPetitionFieldCardProps,
} from "./RecipientViewPetitionFieldCard";

export interface RecipientViewPetitionFieldFileUploadProps
  extends Omit<RecipientViewPetitionFieldCardProps, "children"> {
  keycode: string;
  isDisabled: boolean;
}

export const RecipientViewPetitionFieldFileUpload = chakraForwardRef<
  "section",
  RecipientViewPetitionFieldFileUploadProps
>(function RecipientViewPetitionFieldFileUpload(
  {
    keycode,
    access,
    field,
    isDisabled,
    isInvalid,
    hasCommentsEnabled,
    ...props
  },
  ref
) {
  const uploads = useRef<Record<string, XMLHttpRequest>>({});

  const deletePetitionReply = useDeletePetitionReply();
  const handleDeletePetitionReply = useCallback(
    async function handleDeletePetitionReply({
      keycode,
      fieldId,
      replyId,
    }: {
      keycode: string;
      fieldId: string;
      replyId: string;
    }) {
      if (uploads.current[replyId]) {
        uploads.current[replyId].abort();
        delete uploads.current[replyId];
      }
      await deletePetitionReply({ fieldId, replyId, keycode });
    },
    [deletePetitionReply, uploads]
  );
  const createFileUploadReply = useCreateFileUploadReply(uploads);

  const handleCreateReply = useCallback(
    (content: File[]) =>
      createFileUploadReply({
        keycode,
        fieldId: field.id,
        content,
      }),
    [createFileUploadReply, keycode, field.id]
  );

  return (
    <RecipientViewPetitionFieldCard
      ref={ref}
      keycode={keycode}
      access={access}
      field={field}
      isInvalid={isInvalid}
      hasCommentsEnabled={hasCommentsEnabled}
      {...props}
    >
      {field.replies.length ? (
        <List as={Stack} marginTop={1}>
          {field.replies.map((reply) => (
            <ListItem key={reply.id}>
              <RecipientViewPetitionFieldReplyFileUpload
                keycode={keycode}
                options={field.options as FieldOptions["FILE_UPLOAD"]}
                reply={reply}
                onRemove={() =>
                  handleDeletePetitionReply({
                    keycode,
                    fieldId: field.id,
                    replyId: reply.id,
                  })
                }
              />
            </ListItem>
          ))}
        </List>
      ) : null}
      <Box marginTop={2}>
        <FileUploadReplyForm
          canReply={!isDisabled}
          field={field}
          onCreateReply={handleCreateReply}
        />
      </Box>
    </RecipientViewPetitionFieldCard>
  );
});

interface RecipientViewPetitionFieldReplyFileUploadProps {
  keycode: string;
  options: FieldOptions["FILE_UPLOAD"];
  reply: RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragment;
  onRemove: () => void;
}

export function RecipientViewPetitionFieldReplyFileUpload({
  keycode,
  reply,
  onRemove,
}: RecipientViewPetitionFieldReplyFileUploadProps) {
  const intl = useIntl();
  const [
    downloadFileUploadReply,
  ] = useRecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkMutation();
  const showFailure = useFailureGeneratingLinkDialog();
  async function handleDownloadClick() {
    const _window = window.open(undefined, "_blank")!;
    const { data } = await downloadFileUploadReply({
      variables: {
        keycode,
        replyId: reply.id,
        preview: false,
      },
    });
    const { url, result } = data!.publicFileUploadReplyDownloadLink;
    if (result === "SUCCESS") {
      _window.location.href = url!;
    } else {
      _window.close();
      try {
        await showFailure({ filename: reply.content.filename });
      } catch {}
    }
  }
  return (
    <Stack direction="row" alignItems="center">
      <Center
        boxSize={10}
        borderRadius="md"
        border="1px solid"
        borderColor="gray.300"
        color="gray.600"
        boxShadow="sm"
        fontSize="xs"
        fontWeight="bold"
        textTransform="uppercase"
      >
        {reply.content.extension || null}
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
            <DateTime
              value={reply.createdAt}
              format={FORMATS.LLL}
              useRelativeTime
            />
          </Text>
        )}
      </Box>
      <IconButtonWithTooltip
        onClick={handleDownloadClick}
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
        onClick={onRemove}
        variant="ghost"
        icon={<DeleteIcon />}
        size="md"
        placement="bottom"
        label={intl.formatMessage({
          id:
            "component.recipient-view-petition-field-reply.remove-reply-label",
          defaultMessage: "Remove reply",
        })}
      />
    </Stack>
  );
}

interface FileUploadReplyFormProps extends BoxProps {
  canReply: boolean;
  field: RecipientViewPetitionField_PublicPetitionFieldFragment;
  onCreateReply: (files: File[]) => void;
}

function FileUploadReplyForm({
  field,
  canReply,
  onCreateReply,
  ...props
}: FileUploadReplyFormProps) {
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
  const isDisabled = !field.multiple && field.replies.length > 0;
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
  } = useDropzone({
    accept,
    onDrop: onCreateReply,
    multiple: field.multiple,
    disabled: isDisabled,
  });
  return (
    <Flex
      color={
        isDragActive ? (isDragReject ? "red.500" : "gray.600") : "gray.500"
      }
      border="2px dashed"
      borderColor={
        isDragActive ? (isDragReject ? "red.500" : "gray.400") : "gray.300"
      }
      cursor="pointer"
      borderRadius="md"
      flexDirection="column"
      justifyContent="center"
      minHeight="100px"
      padding={4}
      textAlign="center"
      {...(isDisabled || !canReply
        ? {
            opacity: 0.4,
            cursor: "not-allowed",
          }
        : {})}
      sx={
        isDragActive
          ? generateCssStripe({
              size: "1rem",
              color: isDragReject ? "red.50" : "gray.50",
            })
          : {}
      }
      {...props}
      {...getRootProps()}
    >
      <input disabled={!canReply} {...getInputProps()} />
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
    </Flex>
  );
}

const _publicFileUploadReplyDownloadLink = gql`
  mutation RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLink(
    $keycode: ID!
    $replyId: GID!
    $preview: Boolean
  ) {
    publicFileUploadReplyDownloadLink(
      keycode: $keycode
      replyId: $replyId
      preview: $preview
    ) {
      result
      url
    }
  }
`;
