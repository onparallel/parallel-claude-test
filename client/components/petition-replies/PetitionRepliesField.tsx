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
  PetitionFieldReplyStatus,
  PetitionRepliesField_PetitionFieldFragment,
  PetitionRepliesField_PetitionFieldReplyFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { gql } from "apollo-boost";
import { ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { BreakLines } from "../common/BreakLines";
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
  onUpdateReplyStatus: (
    replyId: string,
    status: PetitionFieldReplyStatus
  ) => void;
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
  onUpdateReplyStatus,
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
          hasNewComments={field.comments.some((c) => c.isUnread)}
          hasUnpublishedComments={field.comments.some((c) => !c.publishedAt)}
          onClick={onToggleComments}
        />
      </Flex>
      <Box marginBottom={2}>
        {field.description ? (
          <Text color="gray.600" fontSize="sm">
            <BreakLines text={field.description} />
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
        <Stack spacing={4}>
          {field.replies.map((reply) => (
            <PetitionRepliesFieldReply
              key={reply.id}
              reply={reply}
              onUpdateStatus={(status) => onUpdateReplyStatus(reply.id, status)}
              actions={
                field.type === "TEXT" ? (
                  <CopyToClipboardButton size="xs" text={reply.content.text} />
                ) : field.type === "FILE_UPLOAD" ? (
                  <>
                    <IconButtonWithTooltip
                      size="xs"
                      icon="download"
                      label={intl.formatMessage({
                        id:
                          "petition-replies.petition-field-reply.file-download",
                        defaultMessage: "Download file",
                      })}
                      onClick={() => onAction({ type: "DOWNLOAD_FILE", reply })}
                    />
                    {isPreviewable(reply.content.contentType) ? (
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
                      />
                    ) : null}
                  </>
                ) : null
              }
            >
              {field.type === "TEXT" ? (
                <BreakLines text={reply.content.text} />
              ) : field.type === "FILE_UPLOAD" ? (
                <Box>
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
              ) : null}
            </PetitionRepliesFieldReply>
          ))}
        </Stack>
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
  onUpdateStatus,
  ...props
}: {
  actions: ReactNode;
  reply: PetitionRepliesField_PetitionFieldReplyFragment;
  onUpdateStatus: (status: PetitionFieldReplyStatus) => void;
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
          onClick={() =>
            onUpdateStatus(reply.status === "APPROVED" ? "PENDING" : "APPROVED")
          }
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
          onClick={() =>
            onUpdateStatus(reply.status === "REJECTED" ? "PENDING" : "REJECTED")
          }
        />
      </Stack>
    </Flex>
  );
}

function CommentsButton({
  commentCount,
  hasNewComments,
  hasUnpublishedComments,
  isActive,
  onClick,
}: {
  commentCount: number;
  hasNewComments: boolean;
  hasUnpublishedComments: boolean;
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
        <Button rightIcon={"comment" as any} fontWeight="normal" {...common}>
          {hasNewComments || hasUnpublishedComments ? (
            <Box
              {...(!hasNewComments
                ? { borderColor: "yellow.500" }
                : !hasUnpublishedComments
                ? { borderColor: isActive ? "white" : "purple.500" }
                : {
                    borderLeftColor: "yellow.500",
                    borderTopColor: "yellow.500",
                    borderRightColor: isActive ? "white" : "purple.500",
                    borderBottomColor: isActive ? "white" : "purple.500",
                  })}
              borderWidth="4px"
              transform="rotate(-45deg)"
              rounded="9999px"
              marginRight={2}
            />
          ) : null}
          {intl.formatNumber(commentCount)}
        </Button>
      ) : (
        <IconButton icon={"comment" as any} {...common} />
      )}
    </Box>
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
        publishedAt
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
