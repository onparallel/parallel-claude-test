import { gql } from "@apollo/client";
import {
  Box,
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
} from "@chakra-ui/core";
import {
  CheckIcon,
  CloseIcon,
  CommentIcon,
  DeleteIcon,
} from "@parallel/chakra/icons";
import { ExtendChakra } from "@parallel/chakra/utils";
import { Card } from "@parallel/components/common/Card";
import {
  PetitionFieldReplyStatus,
  RecipientViewPetitionField_PublicPetitionFieldFragment,
} from "@parallel/graphql/__types";
import { generateCssStripe } from "@parallel/utils/css";
import { FORMATS } from "@parallel/utils/dates";
import { FieldOptions } from "@parallel/utils/FieldOptions";
import { forwardRef, ReactNode, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { BreakLines } from "../common/BreakLines";
import { DateTime } from "../common/DateTime";
import { FileSize } from "../common/FileSize";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { RecipientViewCommentsBadge } from "./RecipientViewCommentsBadge";

export type CreateReply = CreateReplyText | CreateReplyFileUpload;

type CreateReplyText = { type: "TEXT"; content: string };
type CreateReplyFileUpload = { type: "FILE_UPLOAD"; content: File[] };

export type PublicPetitionFieldProps = ExtendChakra<{
  canReply: boolean;
  contactId: string;
  field: RecipientViewPetitionField_PublicPetitionFieldFragment;
  isInvalid: boolean;
  uploadProgress?: { [replyId: string]: number };
  onOpenCommentsClick: () => void;
  onDeleteReply: (replyId: string) => void;
  onCreateReply: (payload: CreateReply) => void;
}>;

export function RecipientViewPetitionField({
  canReply,
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

  return field.type === "HEADING" ? (
    <Stack spacing={1} {...props} paddingX={2} paddingY={2}>
      {field.title ? (
        <Heading size="md">{field.title}</Heading>
      ) : (
        <Heading
          size="md"
          color="gray.500"
          fontWeight="normal"
          fontStyle="italic"
        >
          <FormattedMessage
            id="generic.empty-heading"
            defaultMessage="Untitled heading"
          />
        </Heading>
      )}
      {field.description ? (
        <Text color="gray.600" fontSize="sm" overflowWrap="anywhere">
          <BreakLines text={field.description} />
        </Text>
      ) : null}
    </Stack>
  ) : (
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
        <Box flex="1" marginRight={2}>
          <Heading flex="1" as="h2" fontSize="md" overflowWrap="anywhere">
            {field.title || (
              <Text
                as="span"
                color="gray.500"
                fontWeight="normal"
                fontStyle="italic"
              >
                <FormattedMessage
                  id="generic.untitled-field"
                  defaultMessage="Untitled field"
                />
              </Text>
            )}
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
                label={intl.formatMessage({
                  id: "generic.required-field",
                  defaultMessage: "Required field",
                })}
              >
                <Text as="span" userSelect="none" marginLeft={1}>
                  *
                </Text>
              </Tooltip>
            )}
          </Heading>
        </Box>
        <CommentsButton
          commentCount={field.comments.length}
          hasUnreadComments={field.comments.some((c) => c.isUnread)}
          hasUnpublishedComments={field.comments.some((c) => !c.publishedAt)}
          onClick={onOpenCommentsClick}
        />
      </Flex>
      <Box>
        {field.description ? (
          <Text
            fontSize="sm"
            color="gray.600"
            overflowWrap="anywhere"
            marginBottom={2}
          >
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
                canDeleteReply={!field.validated}
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
                    <Text as="span">{reply.content?.filename}</Text>
                    <Text as="span" marginX={2}>
                      -
                    </Text>
                    <Text as="span" fontSize="sm" color="gray.500">
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
          <TextReplyForm
            canReply={canReply}
            field={field}
            onCreateReply={onCreateReply}
          />
        ) : field.type === "FILE_UPLOAD" ? (
          <FileUploadReplyForm
            canReply={canReply}
            field={field}
            onCreateReply={onCreateReply}
          />
        ) : null}
      </Box>
    </Card>
  );
}

function ReplyWrapper({
  status,
  progress,
  children,
  canDeleteReply,
  onDeleteReply,
}: {
  status: PetitionFieldReplyStatus;
  progress?: number;
  canDeleteReply: boolean;
  onDeleteReply: () => void;
  children: ReactNode;
}) {
  const intl = useIntl();
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
      <Tooltip
        isDisabled={status === "PENDING"}
        placement="right"
        label={label}
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
            sx={generateCssStripe({ color: "gray.200", isAnimated: true })}
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
            <CloseIcon color="red.500" boxSize="12px" marginLeft={2} />
          ) : null}
        </Flex>
      </Tooltip>
      {status !== "APPROVED" && canDeleteReply ? (
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
  canReply,
  onCreateReply,
  ...props
}: ExtendChakra<{
  field: RecipientViewPetitionField_PublicPetitionFieldFragment;
  canReply: boolean;
  onCreateReply: (payload: CreateReplyText) => void;
}>) {
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
            isDisabled={!canReply}
            name="content"
            ref={register({
              required: true,
              validate: (val) => val.trim().length > 0,
            })}
            placeholder={placeholder ?? ""}
          />
        ) : (
          <Input
            name="content"
            isDisabled={!canReply}
            ref={register({
              required: true,
              validate: (val) => val.trim().length > 0,
            })}
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
        isDisabled={disabled || !canReply}
        marginTop={{ base: 2, sm: 0 }}
        marginLeft={{ base: 0, sm: 4 }}
      >
        <FormattedMessage id="generic.save" defaultMessage="Save" />
      </Button>
    </Flex>
  );
}

function FileUploadReplyForm({
  field,
  canReply,
  onCreateReply,
  ...props
}: ExtendChakra<{
  canReply: boolean;
  field: RecipientViewPetitionField_PublicPetitionFieldFragment;
  onCreateReply: (payload: CreateReplyFileUpload) => void;
}>) {
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
  const onDrop = useCallback((files: File[]) => {
    onCreateReply({ type: "FILE_UPLOAD", content: files });
  }, []);
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
  } = useDropzone({
    accept,
    onDrop,
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

const CommentsButton = forwardRef<
  HTMLButtonElement,
  {
    commentCount: number;
    hasUnreadComments: boolean;
    hasUnpublishedComments: boolean;
  } & ButtonProps
>(function CommentsButton(
  { commentCount, hasUnreadComments, hasUnpublishedComments, ...props },
  ref
) {
  const intl = useIntl();
  const common = {
    size: "sm",
    fontWeight: "normal",
    "aria-label": intl.formatMessage(
      {
        id: "generic.comments-button-label",
        defaultMessage:
          "{commentCount, plural, =0 {No comments} =1 {# comment} other {# comments}}",
      },
      { commentCount }
    ),
    ...props,
  } as const;
  return commentCount > 0 ? (
    <Button ref={ref} rightIcon={<CommentIcon fontSize="16px" />} {...common}>
      <RecipientViewCommentsBadge
        hasUnreadComments={hasUnreadComments}
        hasUnpublishedComments={hasUnpublishedComments}
        marginRight={2}
      />
      {intl.formatNumber(commentCount)}
    </Button>
  ) : (
    <Button {...common}>
      <FormattedMessage
        id="recipient-view.questions-button"
        defaultMessage="Questions?"
      />
    </Button>
  );
});

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
