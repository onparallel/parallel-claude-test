/** @jsx jsx */
import {
  Box,
  BoxProps,
  Button,
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
  useTheme,
  Tooltip,
} from "@chakra-ui/core";
import { jsx } from "@emotion/core";
import { Card } from "@parallel/components/common/Card";
import { RecipientViewPetitionField_PublicPetitionFieldFragment } from "@parallel/graphql/__types";
import { animatedStripe, generateCssStripe } from "@parallel/utils/css";
import { FORMATS } from "@parallel/utils/dates";
import { FieldOptions } from "@parallel/utils/petitions";
import { gql } from "apollo-boost";
import { Fragment, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { DateTime } from "../common/DateTime";
import { FileSize } from "../common/FileSize";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";

export type CreateReply = CreateReplyText | CreateReplyFileUpload;

type CreateReplyText = { type: "TEXT"; content: string };
type CreateReplyFileUpload = { type: "FILE_UPLOAD"; content: File[] };

export type PublicPetitionFieldProps = BoxProps & {
  field: RecipientViewPetitionField_PublicPetitionFieldFragment;
  isInvalid: boolean;
  uploadProgress?: { [replyId: string]: number };
  onDeleteReply: (replyId: string) => void;
  onCreateReply: (payload: CreateReply) => void;
};

export function RecipientViewPetitionField({
  field,
  isInvalid,
  uploadProgress,
  onDeleteReply,
  onCreateReply,
  ...props
}: PublicPetitionFieldProps) {
  const intl = useIntl();

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
      {...(isInvalid
        ? {
            border: "2px solid",
            borderColor: "red.500",
          }
        : {})}
      {...props}
    >
      <Heading as="h2" fontSize="md">
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
            zIndex={1000}
            showDelay={300}
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
      {field.description ? (
        <Text fontSize="sm" color="gray.600">
          {field.description?.split("\n").map((line, index) => (
            <Fragment key={index}>
              {line}
              <br />
            </Fragment>
          ))}
        </Text>
      ) : null}
      <Text fontSize="sm" color="gray.500">
        {field.type === "TEXT" ? (
          <FormattedMessage
            id="sendout.replies-submitted"
            defaultMessage="{count, plural, =0 {No replies have been submitted yet} =1 {1 reply submitted} other {# replies submitted}}"
            values={{ count: field.replies.length }}
          />
        ) : field.type === "FILE_UPLOAD" ? (
          <FormattedMessage
            id="sendout.files-uploaded"
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
                progress={uploadProgress?.[reply.id]}
                onDeleteReply={() => onDeleteReply(reply.id)}
              >
                {field.type === "TEXT" ? (
                  <FormattedMessage
                    id="sendout.text-reply"
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
                      {reply.publicContent?.filename}
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
                      <FileSize value={reply.publicContent?.size} />
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
  progress,
  children,
  onDeleteReply,
  ...props
}: BoxProps & { progress?: number; onDeleteReply: () => void }) {
  const intl = useIntl();
  const { colors } = useTheme();
  return (
    <Flex alignItems="center" {...props}>
      <Box
        fontSize="sm"
        backgroundColor="gray.100"
        paddingX={1}
        rounded="sm"
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
          rounded="sm"
          backgroundColor="gray.300"
          transition="width 100ms ease"
          willChange="width"
          width={progress !== undefined ? `${Math.round(progress * 100)}%` : 0}
          css={[
            generateCssStripe({ color: colors.gray[200] }),
            animatedStripe({}),
          ]}
        ></Box>
        <Box position="relative" lineHeight="24px" minHeight="24px" zIndex={1}>
          {children}
        </Box>
      </Box>
      <IconButtonWithTooltip
        onClick={onDeleteReply}
        variant="ghost"
        icon="close"
        size="xs"
        placement="bottom"
        label={intl.formatMessage({
          id: "sendout.remove-reply-label",
          defaultMessage: "Remove reply",
        })}
        marginLeft={1}
      />
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
            ></FormattedMessage>
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
          id="sendout.field-reply-submit"
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
    isDragAccept,
  } = useDropzone({ accept, onDrop, multiple: field.multiple, disabled });
  const { colors } = useTheme();
  return (
    <Flex
      color={
        isDragActive ? (isDragAccept ? "gray.600" : "red.500") : "gray.500"
      }
      border="2px dashed"
      borderColor={
        isDragActive ? (isDragAccept ? "gray.400" : "red.500") : "gray.300"
      }
      cursor="pointer"
      rounded="md"
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
              color: isDragAccept ? colors.gray[50] : colors.red[50],
            })
          : null
      }
      {...props}
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      <Box pointerEvents="none">
        {isDragActive && !isDragAccept ? (
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

RecipientViewPetitionField.fragments = {
  PublicPetitionField: gql`
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
        id
        publicContent
        createdAt
      }
    }
  `,
};
