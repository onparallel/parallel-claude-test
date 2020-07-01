import {
  Box,
  BoxProps,
  Button,
  ButtonProps,
  Flex,
  IconButton,
  PseudoBoxProps,
  Stack,
  Text,
  VisuallyHidden,
} from "@chakra-ui/core";
import { Card } from "@parallel/components/common/Card";
import { PetitionFieldTypeIndicator } from "@parallel/components/petition-common/PetitionFieldTypeIndicator";
import {
  PetitionRepliesField_PetitionFieldFragment,
  PetitionRepliesField_PetitionFieldReplyFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { gql } from "apollo-boost";
import { Fragment, ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { CopyToClipboardButton } from "../common/CopyToClipboardButton";
import { DateTime } from "../common/DateTime";
import { FileSize } from "../common/FileSize";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { Spacer } from "../common/Spacer";

export type PetitionRepliesFieldAction = {
  type: "DOWNLOAD_FILE" | "PREVIEW_FILE";
  reply: PetitionRepliesField_PetitionFieldReplyFragment;
};

export type PetitionRepliesFieldProps = BoxProps & {
  field: PetitionRepliesField_PetitionFieldFragment;
  index: number;
  highlighted: boolean;
  commentCount: number;
  newCommentCount: number;
  isActive: boolean;
  onAction: (action: PetitionRepliesFieldAction) => void;
  onToggleComments: () => void;
  onValidateToggle: () => void;
};

export function PetitionRepliesField({
  field,
  index,
  highlighted,
  commentCount,
  newCommentCount,
  isActive: isShowingComments,
  onAction,
  onToggleComments,
  onValidateToggle,
  ...props
}: PetitionRepliesFieldProps) {
  const intl = useIntl();
  return (
    <Card
      display="flex"
      flexDirection="column"
      position="relative"
      backgroundColor={highlighted ? "purple.50" : "white"}
      paddingY={{ base: 4 }}
      paddingX={{ base: 4, md: 6 }}
      {...props}
    >
      <Flex alignItems="center">
        <PetitionFieldTypeIndicator type={field.type} index={index} as="div" />
        <Box marginLeft={4}>
          {field.title ? (
            <Text as="h4">{field.title}</Text>
          ) : (
            <Text as="h4" color="gray.400" fontStyle="italic">
              <FormattedMessage
                id="generic.untitled-field"
                defaultMessage="Untitled field"
              />
            </Text>
          )}
        </Box>
        <Spacer />
        {/* <Button
          size="sm"
          variant={field.validated ? "solid" : "ghost"}
          onClick={onValidateToggle}
        >
          <Checkbox
            isChecked={field.validated}
            isReadOnly
            size="md"
            pointerEvents="none"
            marginRight={2}
          />
          <FormattedMessage
            id="petition-replies.validate-field-button"
            defaultMessage="Reviewed"
          ></FormattedMessage>
        </Button> */}
        <CommentsButton
          isActive={isShowingComments}
          commentCount={field.comments.length}
          newCommentCount={field.comments.filter((c) => c.isUnread).length}
          onClick={onToggleComments}
        />
      </Flex>
      <Box marginBottom={2}>
        {field.description ? (
          <Text color="gray.600" fontSize="sm">
            {field.description?.split("\n").map((line, index) => (
              <Fragment key={index}>
                {line}
                <br />
              </Fragment>
            ))}
          </Text>
        ) : (
          <Text color="gray.400" fontSize="sm" fontStyle="italic">
            <FormattedMessage
              id="generic.no-description"
              defaultMessage="No description"
            />
          </Text>
        )}
      </Box>
      {field.replies.length ? (
        field.type === "TEXT" ? (
          <Stack spacing={4}>
            {field.replies.map((reply) => (
              <PetitionRepliesFieldReply
                key={reply.id}
                reply={reply}
                actions={
                  <CopyToClipboardButton size="xs" text={reply.content.text} />
                }
              >
                {(reply.content.text as string)
                  .split(/\n/)
                  .map((line, index) => (
                    <Fragment key={index}>
                      {line}
                      <br />
                    </Fragment>
                  ))}
              </PetitionRepliesFieldReply>
            ))}
          </Stack>
        ) : field.type === "FILE_UPLOAD" ? (
          <Stack spacing={4}>
            {field.replies.map((reply) => (
              <PetitionRepliesFieldReply
                key={reply.id}
                reply={reply}
                actions={[
                  <IconButtonWithTooltip
                    key="1"
                    size="xs"
                    icon="download"
                    label={intl.formatMessage({
                      id: "petition-replies.petition-field-reply.file-download",
                      defaultMessage: "Download file",
                    })}
                    onClick={() => onAction({ type: "DOWNLOAD_FILE", reply })}
                  />,
                  ...(isPreviewable(reply.content.contentType)
                    ? [
                        <IconButtonWithTooltip
                          key="2"
                          size="xs"
                          icon="view"
                          label={intl.formatMessage({
                            id:
                              "petition-replies.petition-field-reply.file-preview",
                            defaultMessage: "Preview file",
                          })}
                          onClick={() =>
                            onAction({ type: "PREVIEW_FILE", reply })
                          }
                        />,
                      ]
                    : []),
                ]}
              >
                <Box display="inling-flex">
                  <VisuallyHidden>
                    {intl.formatMessage({
                      id: "generic.file-name",
                      defaultMessage: "File name",
                    })}
                  </VisuallyHidden>
                  <Text as="span">{reply.content.filename}</Text>
                  <Text as="span" marginX={2}>
                    -
                  </Text>
                  <Text
                    as="span"
                    aria-label={intl.formatMessage({
                      id: "generic.file-size",
                      defaultMessage: "File size",
                    })}
                    fontSize="sm"
                    color="gray.500"
                  >
                    <FileSize value={reply.content.size} />
                  </Text>
                </Box>
              </PetitionRepliesFieldReply>
            ))}
          </Stack>
        ) : null
      ) : (
        <Box paddingY={4}>
          <Text color="gray.400" fontStyle="italic" textAlign="center">
            <FormattedMessage
              id="petition-replies.petition-field.no-replies"
              defaultMessage="There are no replies to this field yet"
            />
          </Text>
        </Box>
      )}
    </Card>
  );
}

function isPreviewable(contentType: string) {
  return contentType === "application/pdf" || contentType.startsWith("image/");
}

function PetitionRepliesFieldReply({
  actions,
  children,
  reply,
  ...props
}: {
  actions: ReactNode;
  reply: PetitionRepliesField_PetitionFieldReplyFragment;
} & PseudoBoxProps) {
  const intl = useIntl();
  return (
    <Flex {...props}>
      <Stack
        spacing={1}
        paddingRight={2}
        borderRight="2px solid"
        borderColor="gray.200"
      >
        {actions}
      </Stack>
      <Flex
        flexDirection="column"
        justifyContent="center"
        flex="1"
        marginLeft={2}
      >
        {children}
        <Box fontSize="sm">
          <DateTime
            as="span"
            color="gray.500"
            value={reply.createdAt}
            format={FORMATS.LLL}
          />
        </Box>
      </Flex>
      <Stack direction="row" spacing={1}>
        <IconButtonWithTooltip
          icon="check"
          label={intl.formatMessage({
            id: "petition-replies.petition-field-reply.approve",
            defaultMessage: "Approve",
          })}
          variantColor="green"
          size="xs"
          placement="bottom"
          role="switch"
          aria-checked={reply.status === "APPROVED"}
          {...(reply.status === "APPROVED"
            ? {
                backgroundColor: "green.500",
                color: "white",
                _hover: {
                  backgroundColor: "green.600",
                  color: "white",
                },
              }
            : {
                backgroundColor: "gray.100",
                color: "black",
                _hover: {
                  backgroundColor: "green.500",
                  color: "white",
                },
              })}
        />
        <IconButtonWithTooltip
          icon="close"
          label={intl.formatMessage({
            id: "petition-replies.petition-field-reply.reject",
            defaultMessage: "Reject",
          })}
          variantColor="red"
          size="xs"
          placement="bottom"
          role="switch"
          aria-checked={reply.status === "REJECTED"}
          {...(reply.status === "REJECTED"
            ? {
                backgroundColor: "red.500",
                color: "white",
                _hover: {
                  backgroundColor: "red.600",
                  color: "white",
                },
              }
            : {
                backgroundColor: "gray.100",
                color: "black",
                _hover: {
                  backgroundColor: "red.500",
                  color: "white",
                },
              })}
        />
      </Stack>
    </Flex>
  );
}

PetitionRepliesField.fragments = {
  PetitionField: gql`
    fragment PetitionRepliesField_PetitionField on PetitionField {
      id
      type
      title
      description
      validated
      replies {
        ...PetitionRepliesField_PetitionFieldReply
      }
      comments {
        id
        isUnread
      }
    }
    fragment PetitionRepliesField_PetitionFieldReply on PetitionFieldReply {
      id
      content
      status
      createdAt
    }
  `,
};

function CommentsButton({
  commentCount,
  newCommentCount,
  isActive,
  onClick,
}: {
  commentCount: number;
  newCommentCount: number;
  isActive: boolean;
  onClick: ButtonProps["onClick"];
}) {
  const intl = useIntl();
  const common = {
    role: "switch",
    "aria-checked": isActive,
    size: "sm",
    variant: isActive ? "solid" : "ghost",
    variantColor: isActive ? "purple" : "gray",
    "aria-label": intl.formatMessage(
      {
        id: "petition-replies.comments-label",
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
        <Button rightIcon={"comment" as any} fontWeight="normal" {...common}>
          {intl.formatNumber(commentCount)}
        </Button>
      ) : (
        <IconButton icon={"comment" as any} {...common} />
      )}
      {newCommentCount ? (
        <Box
          backgroundColor="purple.500"
          size={2}
          position="absolute"
          top="50%"
          transform="translate(-150%,-50%)"
          rounded="9999px"
        />
      ) : null}
    </Box>
  );
}
