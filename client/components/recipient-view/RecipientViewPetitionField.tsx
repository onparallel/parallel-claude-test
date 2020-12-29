import { DataProxy, gql, useApolloClient } from "@apollo/client";
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
} from "@chakra-ui/react";
import { CommentIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Card } from "@parallel/components/common/Card";
import {
  RecipientViewPetitionField_PublicPetitionFieldFragment,
  RecipientViewPetitionField_updateFieldReplies_PublicPetitionFieldFragment,
  RecipientViewPetitionField_updateReplyContent_PublicPetitionFieldReplyFragment,
  useRecipientViewPetitionField_publicCreateFileUploadReplyMutation,
  useRecipientViewPetitionField_publicCreateSimpleReplyMutation,
  useRecipientViewPetitionField_publicDeletePetitionReplyMutation,
  useRecipientViewPetitionField_publicFileUploadReplyCompleteMutation,
} from "@parallel/graphql/__types";
import { updateFragment } from "@parallel/utils/apollo/updateFragment";
import { generateCssStripe } from "@parallel/utils/css";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useReactSelectProps } from "@parallel/utils/useReactSelectProps";
import { useCallback, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import Select from "react-select";
import { pick } from "remeda";
import { BreakLines } from "../common/BreakLines";
import { RecipientViewCommentsBadge } from "./RecipientViewCommentsBadge";
import { RecipientViewPetitionFieldReply } from "./RecipientViewPetitionFieldReply";

export type CreateReply =
  | CreateReplyText
  | CreateReplyFileUpload
  | CreateReplySelect;

type CreateReplyText = { type: "TEXT"; content: string };
type CreateReplySelect = { type: "SELECT"; content: string };
type CreateReplyFileUpload = { type: "FILE_UPLOAD"; content: File[] };

export interface PublicPetitionFieldProps extends BoxProps {
  keycode: string;
  canReply: boolean;
  contactId: string;
  field: RecipientViewPetitionField_PublicPetitionFieldFragment;
  isInvalid: boolean;
  hasCommentsEnabled: boolean;
  onOpenCommentsClick: () => void;
}

export function RecipientViewPetitionField({
  keycode,
  canReply,
  contactId,
  field,
  isInvalid,
  hasCommentsEnabled,
  onOpenCommentsClick,
  ...props
}: PublicPetitionFieldProps) {
  const intl = useIntl();

  const uploads = useRef<Record<string, XMLHttpRequest>>({});

  const [
    deletePetitionReply,
  ] = useRecipientViewPetitionField_publicDeletePetitionReplyMutation({
    optimisticResponse: { publicDeletePetitionReply: "SUCCESS" },
  });
  async function handleRemove(replyId: string) {
    if (uploads.current[replyId]) {
      uploads.current[replyId].abort();
      delete uploads.current[replyId];
    }
    return await deletePetitionReply({
      variables: { replyId, keycode },
      update(cache) {
        updateFieldReplies(cache, field.id, (replies) =>
          replies.filter(({ id }) => id !== replyId)
        );
        // TODO: update petition status COMPLETED -> PENDING
      },
    });
  }

  const [
    createSimpleReply,
  ] = useRecipientViewPetitionField_publicCreateSimpleReplyMutation();
  const [
    createFileUploadReply,
  ] = useRecipientViewPetitionField_publicCreateFileUploadReplyMutation();
  const apollo = useApolloClient();
  const [
    fileUploadReplyComplete,
  ] = useRecipientViewPetitionField_publicFileUploadReplyCompleteMutation();
  async function handleCreateReply(payload: CreateReply) {
    switch (payload.type) {
      case "FILE_UPLOAD":
        for (const file of payload.content) {
          const { data } = await createFileUploadReply({
            variables: {
              keycode,
              fieldId: field.id,
              data: {
                filename: file.name,
                size: file.size,
                contentType: file.type,
              },
            },
            update(cache, { data }) {
              const reply = data!.publicCreateFileUploadReply.reply;
              updateFieldReplies(cache, field.id, (replies) => [
                ...replies,
                pick(reply, ["id", "__typename"]),
              ]);
              updateReplyContent(cache, reply.id, (content) => ({
                ...content,
                progress: 0,
              }));
              // TODO: update petition status COMPLETED -> PENDING
            },
          });
          const { reply, endpoint } = data!.publicCreateFileUploadReply;

          const form = new FormData();
          form.append("file", file);

          const request = new XMLHttpRequest();
          request.open("PUT", endpoint);
          request.setRequestHeader("Content-Type", file.type);
          uploads.current[reply.id] = request;

          request.upload.addEventListener("progress", (e) =>
            updateReplyContent(apollo, reply.id, (content) => ({
              ...content,
              progress: e.loaded / e.total,
            }))
          );
          request.addEventListener("load", async () => {
            delete uploads.current[reply.id];
            await fileUploadReplyComplete({
              variables: { keycode, replyId: reply.id },
            });
          });
          request.send(form);
        }
        break;
      case "TEXT":
      case "SELECT":
        await createSimpleReply({
          variables: {
            keycode,
            fieldId: field.id,
            reply: payload.content,
          },
          update(cache, { data }) {
            updateFieldReplies(cache, field.id, (replies) => [
              ...replies,
              pick(data!.publicCreateSimpleReply, ["id", "__typename"]),
            ]);
            // TODO: update petition status COMPLETED -> PENDING
          },
        });
        break;
      default:
        break;
    }
  }

  const isTextLikeType = ["TEXT", "SELECT"].includes(field.type);

  return field.type === "HEADING" ? (
    <Stack spacing={1} paddingX={2} paddingY={2} {...props}>
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
        {hasCommentsEnabled ? (
          <CommentsButton
            commentCount={field.comments.length}
            hasUnreadComments={field.comments.some((c) => c.isUnread)}
            hasUnpublishedComments={field.comments.some((c) => !c.publishedAt)}
            onClick={onOpenCommentsClick}
          />
        ) : null}
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
        {isTextLikeType ? (
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
        <List as={Stack} marginTop={1}>
          {field.replies.map((reply) => (
            <ListItem key={reply.id}>
              <RecipientViewPetitionFieldReply
                keycode={keycode}
                field={field}
                reply={reply}
                onRemove={() => handleRemove(reply.id)}
              />
            </ListItem>
          ))}
        </List>
      ) : null}
      <Box marginTop={2}>
        {field.type === "TEXT" ? (
          <TextReplyForm
            canReply={canReply}
            field={field}
            onCreateReply={handleCreateReply}
          />
        ) : field.type === "FILE_UPLOAD" ? (
          <FileUploadReplyForm
            canReply={canReply}
            field={field}
            onCreateReply={handleCreateReply}
          />
        ) : field.type === "SELECT" ? (
          <OptionSelectReplyForm
            field={field}
            canReply={canReply}
            onCreateReply={handleCreateReply}
          />
        ) : null}
      </Box>
    </Card>
  );
}

function CommonRecipientViewPetitionField() {}

interface TextReplyFormProps extends BoxProps {
  field: RecipientViewPetitionField_PublicPetitionFieldFragment;
  canReply: boolean;
  onCreateReply: (payload: CreateReplyText) => void;
}

function TextReplyForm({
  field,
  canReply,
  onCreateReply,
  ...props
}: TextReplyFormProps) {
  const intl = useIntl();
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
            placeholder={
              placeholder ??
              intl.formatMessage({
                id: "recipient-view.text-placeholder",
                defaultMessage: "Enter your answer",
              })
            }
          />
        ) : (
          <Input
            name="content"
            isDisabled={!canReply}
            ref={register({
              required: true,
              validate: (val) => val.trim().length > 0,
            })}
            placeholder={
              placeholder ??
              intl.formatMessage({
                id: "recipient-view.text-placeholder",
                defaultMessage: "Enter your answer",
              })
            }
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

interface FileUploadReplyFormProps extends BoxProps {
  canReply: boolean;
  field: RecipientViewPetitionField_PublicPetitionFieldFragment;
  onCreateReply: (payload: CreateReplyFileUpload) => void;
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

interface OptionSelectReplyFormProps extends BoxProps {
  canReply: boolean;
  field: RecipientViewPetitionField_PublicPetitionFieldFragment;
  onCreateReply: (payload: CreateReplySelect) => void;
}

function OptionSelectReplyForm({
  field,
  canReply,
  onCreateReply,
  ...props
}: OptionSelectReplyFormProps) {
  const intl = useIntl();

  const { values, placeholder } = field.options as FieldOptions["SELECT"];
  const [selection, setSelection] = useState<string | null>();
  const [showError, setShowError] = useState(false);
  const disabled = !field.multiple && field.replies.length > 0;

  const _reactSelectProps = useReactSelectProps({
    id: `field-select-option-${field.id}`,
    isDisabled: disabled || !canReply,
    isInvalid: showError,
  });

  const reactSelectProps = useMemo(
    () =>
      ({
        ..._reactSelectProps,
        styles: {
          ..._reactSelectProps.styles,
          menu: (styles) => ({
            ...styles,
            zIndex: 1000,
          }),
        },
      } as typeof _reactSelectProps),
    [_reactSelectProps]
  );

  const availableOptions = useMemo(() => {
    return values.map((value) => ({ value, label: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (selection) {
      onCreateReply({ type: "SELECT", content: selection });
      setTimeout(() => setSelection(null));
    } else {
      setShowError(true);
    }
  }, [selection]);

  return (
    <Flex flexDirection={{ base: "column", sm: "row" }} {...props}>
      <FormControl flex="1" isInvalid={showError} isDisabled={disabled}>
        <Select
          value={selection ? { value: selection, label: selection } : null}
          options={availableOptions}
          onChange={({ value }: any) => {
            setSelection(value as any);
            setShowError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSubmit();
            }
          }}
          placeholder={
            placeholder ??
            intl.formatMessage({
              id: "recipient-view.select-placeholder",
              defaultMessage: "Select an option",
            })
          }
          {...reactSelectProps}
        />
        {showError && (
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
        onClick={handleSubmit}
      >
        <FormattedMessage id="generic.save" defaultMessage="Save" />
      </Button>
    </Flex>
  );
}

interface CommentsButtonProps extends ButtonProps {
  commentCount: number;
  hasUnreadComments: boolean;
  hasUnpublishedComments: boolean;
}

const CommentsButton = chakraForwardRef<"button", CommentsButtonProps>(
  function CommentsButton(
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
  }
);

function updateFieldReplies(
  proxy: DataProxy,
  fieldId: string,
  updateFn: (
    cached: RecipientViewPetitionField_updateFieldReplies_PublicPetitionFieldFragment["replies"]
  ) => RecipientViewPetitionField_updateFieldReplies_PublicPetitionFieldFragment["replies"]
) {
  updateFragment<
    RecipientViewPetitionField_updateFieldReplies_PublicPetitionFieldFragment
  >(proxy, {
    id: fieldId,
    fragment: gql`
      fragment RecipientViewPetitionField_updateFieldReplies_PublicPetitionField on PublicPetitionField {
        replies {
          id
        }
      }
    `,
    data: (cached) => ({ ...cached, replies: updateFn(cached!.replies) }),
  });
}

function updateReplyContent(
  proxy: DataProxy,
  replyId: string,
  updateFn: (
    cached: RecipientViewPetitionField_updateReplyContent_PublicPetitionFieldReplyFragment["content"]
  ) => RecipientViewPetitionField_updateReplyContent_PublicPetitionFieldReplyFragment["content"]
) {
  updateFragment<
    RecipientViewPetitionField_updateReplyContent_PublicPetitionFieldReplyFragment
  >(proxy, {
    fragment: gql`
      fragment RecipientViewPetitionField_updateReplyContent_PublicPetitionFieldReply on PublicPetitionFieldReply {
        content
      }
    `,
    id: replyId,
    data: (cached) => ({
      ...cached,
      content: updateFn(cached!.content),
    }),
  });
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
        ...RecipientViewPetitionFieldReply_PublicPetitionField
      }
      ${this.PublicPetitionFieldReply}
      ${RecipientViewPetitionFieldReply.fragments.PublicPetitionField}
    `;
  },
  get PublicPetitionFieldReply() {
    return gql`
      fragment RecipientViewPetitionField_PublicPetitionFieldReply on PublicPetitionFieldReply {
        ...RecipientViewPetitionFieldReply_PublicPetitionFieldReply
      }
      ${RecipientViewPetitionFieldReply.fragments.PublicPetitionFieldReply}
    `;
  },
};

RecipientViewPetitionField.mutations = [
  gql`
    mutation RecipientViewPetitionField_publicCreateSimpleReply(
      $keycode: ID!
      $fieldId: GID!
      $reply: String!
    ) {
      publicCreateSimpleReply(
        keycode: $keycode
        fieldId: $fieldId
        reply: $reply
      ) {
        ...RecipientViewPetitionField_PublicPetitionFieldReply
      }
    }
    ${RecipientViewPetitionField.fragments.PublicPetitionFieldReply}
  `,
  gql`
    mutation RecipientViewPetitionField_publicCreateFileUploadReply(
      $keycode: ID!
      $fieldId: GID!
      $data: CreateFileUploadReplyInput!
    ) {
      publicCreateFileUploadReply(
        keycode: $keycode
        fieldId: $fieldId
        data: $data
      ) {
        endpoint
        reply {
          ...RecipientViewPetitionField_PublicPetitionFieldReply
        }
      }
    }
    ${RecipientViewPetitionField.fragments.PublicPetitionFieldReply}
  `,
  gql`
    mutation RecipientViewPetitionField_publicFileUploadReplyComplete(
      $keycode: ID!
      $replyId: GID!
    ) {
      publicFileUploadReplyComplete(keycode: $keycode, replyId: $replyId) {
        id
        content
      }
    }
  `,
  gql`
    mutation RecipientViewPetitionField_publicDeletePetitionReply(
      $replyId: GID!
      $keycode: ID!
    ) {
      publicDeletePetitionReply(replyId: $replyId, keycode: $keycode)
    }
  `,
];
