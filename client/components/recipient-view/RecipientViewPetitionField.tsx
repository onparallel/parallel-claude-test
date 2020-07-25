/** @jsx jsx */
import { gql } from "@apollo/client";
import {
  Box,
  BoxProps,
  Button,
  ButtonProps,
  Flex,
  FormControl,
  FormErrorMessage,
  Heading,
  Input,
  List,
  ListItem,
  Stack,
  Text,
  Textarea,
  Tooltip,
  useTheme,
} from "@chakra-ui/core";
import { jsx } from "@emotion/core";
import {
  CheckIcon,
  CloseIcon,
  CommentIcon,
  DeleteIcon,
} from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import {
  PetitionFieldReplyStatus,
  RecipientViewPetitionField_PublicPetitionFieldFragment,
} from "@parallel/graphql/__types";
import { animatedStripe, generateCssStripe } from "@parallel/utils/css";
import { FORMATS } from "@parallel/utils/dates";
import { FieldOptions } from "@parallel/utils/FieldOptions";
import { ReactNode, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { BreakLines } from "../common/BreakLines";
import { DateTime } from "../common/DateTime";
import { DisableableTooltip } from "../common/DisableableTooltip";
import { FileSize } from "../common/FileSize";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";

export type CreateReply = CreateReplyText | CreateReplyFileUpload;

type CreateReplyText = { type: "TEXT"; content: string };
type CreateReplyFileUpload = { type: "FILE_UPLOAD"; content: File[] };

export type PublicPetitionFieldProps = BoxProps & {
  contactId: string;
  field: RecipientViewPetitionField_PublicPetitionFieldFragment;
  isInvalid: boolean;
  uploadProgress?: { [replyId: string]: number };
  onOpenCommentsClick: () => void;
  onDeleteReply: (replyId: string) => void;
  onCreateReply: (payload: CreateReply) => void;
};

export function RecipientViewPetitionField({
  contactId,
  field,
  isInvalid,
  uploadProgress,
  onOpenCommentsClick,
  onDeleteReply,
  onCreateReply,
  ...props
}: PublicPetitionFieldProps) {
  const intl = useIntl();
  const theme = useTheme();

  const labels = {
    filesize: intl.formatMessage({
      id: "generic.file-size",
      defaultMessage: "File size",
    }),
    filename: intl.formatMessage({
      id: "generic.file-name",
      defaultMessage: "File name",
    }),
    required: intl.formatMessage({
      id: "generic.required-field",
      defaultMessage: "Required field",
    }),
  };

  return (
    <Card
      padding={4}
      overflow="hidden"
      {...(isInvalid
        ? {
            border: "2px solid",
            borderColor: "red.500",
          }
        : {})}
      {...props}
    >
      <Flex alignItems="baseline">
        <Heading flex="1" as="h2" fontSize="md">
          {field.title}
          {field.optional ? (
            <Text
              as="span"
              marginLeft={2}
              color="gray.400"
              fontSize="sm"
              fontWeight="normal"
            >
              <FormattedMessage
                id="generic.optional-field"
                defaultMessage="Optional"
              />
            </Text>
          ) : (
            <Tooltip
              placement="right"
              zIndex={theme.zIndices.tooltip}
              aria-label={labels.required}
              label={labels.required}
            >
              <Text
                as="span"
                userSelect="none"
                marginLeft={1}
                aria-label={labels.required}
              >
                *
              </Text>
            </Tooltip>
          )}
        </Heading>
        <CommentsButton
          commentCount={field.comments.length}
          hasNewComments={field.comments.some((c) => c.isUnread)}
          hasUnpublishedComments={field.comments.some((c) => !c.publishedAt)}
          onClick={onOpenCommentsClick}
        />
      </Flex>
      <Box>
        {field.description ? (
          <Text fontSize="sm" color="gray.600">
            <BreakLines text={field.description} />
          </Text>
        ) : null}
      </Box>
      <Text fontSize="sm" color="gray.500">
        {field.type === "TEXT" ? (
          <FormattedMessage
            id="recipient-view.replies-submitted"
            defaultMessage="{count, plural, =0 {No replies have been submitted yet} =1 {1 reply submitted} other {# replies submitted}}"
            values={{ count: field.replies.length }}
          />
        ) : field.type === "FILE_UPLOAD" ? (
          <FormattedMessage
            id="recipient-view.files-uploaded"
            defaultMessage="{count, plural, =0 {No files have been uploaded yet} =1 {1 file uploaded} other {# files uploaded}}"
            values={{ count: field.replies.length }}
          />
        ) : null}
      </Text>
      {field.replies.length ? (
        <List as={Stack} marginTop={1} alignItems="flex-start">
          {field.replies.map((reply) => (
            <ListItem key={reply.id}>
              <ReplyWrapper
                status={reply.status}
                progress={uploadProgress?.[reply.id]}
                onDeleteReply={() => onDeleteReply(reply.id)}
              >
                {field.type === "TEXT" ? (
                  <FormattedMessage
                    id="recipient-view.text-reply"
                    defaultMessage="Reply added on {date}"
                    values={{
                      date: (
                        <DateTime
                          value={reply.createdAt}
                          format={FORMATS.LLL}
                        />
                      ),
                    }}
                  />
                ) : field.type === "FILE_UPLOAD" ? (
                  <>
                    <Text as="span" aria-label={labels.filename}>
                      {reply.content?.filename}
                    </Text>
                    <Text as="span" marginX={2}>
                      -
                    </Text>
                    <Text
                      as="span"
                      aria-label={labels.filesize}
                      fontSize="sm"
                      color="gray.500"
                    >
                      <FileSize value={reply.content?.size} />
                    </Text>
                  </>
                ) : null}
              </ReplyWrapper>
            </ListItem>
          ))}
        </List>
      ) : null}
      <Box marginTop={2}>
        {field.type === "TEXT" ? (
          <TextReplyForm field={field} onCreateReply={onCreateReply} />
        ) : field.type === "FILE_UPLOAD" ? (
          <FileUploadReplyForm field={field} onCreateReply={onCreateReply} />
        ) : null}
      </Box>
    </Card>
  );
}

function ReplyWrapper({
  status,
  progress,
  children,
  onDeleteReply,
}: {
  status: PetitionFieldReplyStatus;
  progress?: number;
  onDeleteReply: () => void;
  children: ReactNode;
}) {
  const intl = useIntl();
  const { colors } = useTheme();
  const label =
    status === "APPROVED"
      ? intl.formatMessage({
          id: "recipient-view.approved-reply",
          defaultMessage: "This reply has been approved",
        })
      : intl.formatMessage({
          id: "recipient-view.rejected-reply",
          defaultMessage: "This reply has been rejected",
        });
  return (
    <Flex alignItems="center">
      <DisableableTooltip
        isDisabled={status === "PENDING"}
        placement="right"
        label={label}
        aria-label={label}
      >
        <Flex
          alignItems="center"
          fontSize="sm"
          backgroundColor={
            status === "APPROVED"
              ? "green.100"
              : status === "REJECTED"
              ? "red.100"
              : "gray.100"
          }
          paddingX={2}
          borderRadius="sm"
          position="relative"
          {...(progress !== undefined
            ? {
                "aria-valuemax": 100,
                "aria-valuemin": 0,
                "aria-valuenow": Math.round(progress * 100),
                role: "progressbar",
              }
            : {})}
        >
          <Box
            display={progress !== undefined ? "block" : "none"}
            position="absolute"
            left={0}
            top={0}
            height="100%"
            borderRadius="sm"
            transition="width 100ms ease"
            willChange="width"
            width={`${Math.round((progress ?? 0) * 100)}%`}
            css={[
              generateCssStripe({ color: colors.gray[200] }),
              animatedStripe({}),
            ]}
          />
          <Box
            position="relative"
            lineHeight="24px"
            minHeight="24px"
            zIndex={1}
          >
            {children}
          </Box>
          {status === "APPROVED" ? (
            <CheckIcon color="green.500" marginLeft={2} />
          ) : status === "REJECTED" ? (
            <CloseIcon color="red.500" size="12px" marginLeft={2} />
          ) : null}
        </Flex>
      </DisableableTooltip>
      {status !== "APPROVED" ? (
        <IconButtonWithTooltip
          onClick={onDeleteReply}
          variant="ghost"
          icon={<DeleteIcon />}
          size="xs"
          placement="bottom"
          label={intl.formatMessage({
            id: "recipient-view.remove-reply-label",
            defaultMessage: "Remove reply",
          })}
          marginLeft={1}
        />
      ) : null}
    </Flex>
  );
}

function TextReplyForm({
  field,
  onCreateReply,
  ...props
}: BoxProps & {
  field: RecipientViewPetitionField_PublicPetitionFieldFragment;
  onCreateReply: (payload: CreateReplyText) => void;
}) {
  const { placeholder, multiline } = field.options as FieldOptions["TEXT"];
  const { handleSubmit, register, reset, errors } = useForm<{
    content: string;
  }>({ mode: "onSubmit" });
  const disabled = !field.multiple && field.replies.length > 0;
  return (
    <Flex
      as="form"
      flexDirection={{ base: "column", sm: "row" }}
      onSubmit={handleSubmit(({ content }) => {
        onCreateReply({ type: "TEXT", content });
        setTimeout(() => reset({ content: "" }));
      })}
      {...props}
    >
      <FormControl flex="1" isInvalid={!!errors.content} isDisabled={disabled}>
        {multiline ? (
          <Textarea
            name="content"
            ref={register({ required: true })}
            placeholder={placeholder ?? ""}
          />
        ) : (
          <Input
            name="content"
            ref={register({ required: true })}
            placeholder={placeholder ?? ""}
          />
        )}
        {errors.content && (
          <FormErrorMessage>
            <FormattedMessage
              id="generic.forms.required-field-error"
              defaultMessage="A value is required"
            />
          </FormErrorMessage>
        )}
      </FormControl>
      <Button
        type="submit"
        variant="outline"
        isDisabled={disabled}
        marginTop={{ base: 2, sm: 0 }}
        marginLeft={{ base: 0, sm: 4 }}
      >
        <FormattedMessage
          id="recipient-view.field-reply-submit"
          defaultMessage="Submit"
        />
      </Button>
    </Flex>
  );
}

function FileUploadReplyForm({
  field,
  onCreateReply,
  ...props
}: BoxProps & {
  field: RecipientViewPetitionField_PublicPetitionFieldFragment;
  onCreateReply: (payload: CreateReplyFileUpload) => void;
}) {
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
  const disabled = !field.multiple && field.replies.length > 0;
  const onDrop = useCallback((files: File[]) => {
    onCreateReply({ type: "FILE_UPLOAD", content: files });
  }, []);
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
  } = useDropzone({ accept, onDrop, multiple: field.multiple, disabled });
  const { colors } = useTheme();
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
      {...(disabled
        ? {
            opacity: 0.4,
            cursor: "not-allowed",
          }
        : {})}
      css={
        isDragActive
          ? generateCssStripe({
              size: "1rem",
              color: isDragReject ? colors.red[50] : colors.gray[50],
            })
          : null
      }
      {...props}
      {...getRootProps()}
    >
      <input {...getInputProps()} />
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

function CommentsButton({
  commentCount,
  hasNewComments,
  hasUnpublishedComments,
  onClick,
}: {
  commentCount: number;
  hasNewComments: boolean;
  hasUnpublishedComments: boolean;
  onClick: ButtonProps["onClick"];
}) {
  const intl = useIntl();
  const common = {
    size: "sm",
    variant: "ghost",
    fontWeight: "normal",
    "aria-label": intl.formatMessage(
      {
        id: "generic.comments-button-label",
        defaultMessage:
          "{commentCount, plural, =0 {No comments} =1 {# comment} other {# comments}}",
      },
      { commentCount }
    ),
    onClick,
  } as const;
  return (
    <Box position="relative">
      {commentCount > 0 ? (
        <Button rightIcon={<CommentIcon />} {...common}>
          {hasNewComments || hasUnpublishedComments ? (
            <Box
              {...(!hasNewComments
                ? { borderColor: "yellow.500" }
                : !hasUnpublishedComments
                ? { borderColor: "purple.500" }
                : {
                    borderLeftColor: "yellow.500",
                    borderTopColor: "yellow.500",
                    borderRightColor: "purple.500",
                    borderBottomColor: "purple.500",
                  })}
              borderWidth="4px"
              transform="rotate(-45deg)"
              borderRadius="9999px"
              marginRight={2}
            />
          ) : null}
          {intl.formatNumber(commentCount)}
        </Button>
      ) : (
        <Button {...common}>
          <FormattedMessage
            id="recipient-view.questions-button"
            defaultMessage="Questions?"
          />
        </Button>
      )}
    </Box>
  );
}

RecipientViewPetitionField.fragments = {
  get PublicPetitionField() {
    return gql`
      fragment RecipientViewPetitionField_PublicPetitionField on PublicPetitionField {
        id
        type
        title
        description
        options
        optional
        multiple
        validated
        replies {
          ...RecipientViewPetitionField_PublicPetitionFieldReply
        }
        comments {
          id
          isUnread
          publishedAt
        }
      }
      ${this.PublicPetitionFieldReply}
    `;
  },
  get PublicPetitionFieldReply() {
    return gql`
      fragment RecipientViewPetitionField_PublicPetitionFieldReply on PublicPetitionFieldReply {
        id
        status
        content
        createdAt
      }
    `;
  },
};
