import { gql } from "@apollo/client";
import {
  Box,
  BoxProps,
  Button,
  ButtonProps,
  Flex,
  IconButton,
  Stack,
  Switch,
  Text,
  VisuallyHidden,
  Heading,
} from "@chakra-ui/core";
import { Card } from "@parallel/components/common/Card";
import { PetitionFieldTypeIndicator } from "@parallel/components/petition-common/PetitionFieldTypeIndicator";
import {
  PetitionFieldReplyStatus,
  PetitionRepliesField_PetitionFieldFragment,
  PetitionRepliesField_PetitionFieldReplyFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { forwardRef, ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { noop } from "remeda";
import { BreakLines } from "../common/BreakLines";
import { CopyToClipboardButton } from "../common/CopyToClipboardButton";
import { DateTime } from "../common/DateTime";
import { FileSize } from "../common/FileSize";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { Spacer } from "../common/Spacer";
import {
  EyeIcon,
  DownloadIcon,
  CheckIcon,
  CloseIcon,
  CommentIcon,
} from "@parallel/chakra/icons";
import { ExtendChakra } from "@parallel/chakra/utils";

export type PetitionRepliesFieldAction = {
  type: "DOWNLOAD_FILE" | "PREVIEW_FILE";
  reply: PetitionRepliesField_PetitionFieldReplyFragment;
};

export type PetitionRepliesFieldProps = ExtendChakra<{
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
}>;

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
  return field.type === "HEADING" ? (
    <Stack
      spacing={1}
      paddingX={{ base: 4, md: 6 }}
      paddingY={2}
      as="section"
      {...props}
    >
      <Flex alignItems="center">
        <PetitionFieldTypeIndicator
          marginLeft="1px"
          type={field.type}
          index={index}
        />
        <Box flex="1" minWidth="0">
          {field.title ? (
            <Heading marginLeft={4} size="md" isTruncated>
              {field.title}
            </Heading>
          ) : (
            <Heading
              marginLeft={4}
              size="md"
              color="gray.500"
              fontWeight="normal"
              fontStyle="italic"
              isTruncated
            >
              <FormattedMessage
                id="generic.empty-heading"
                defaultMessage="Untitled heading"
              />
            </Heading>
          )}
        </Box>
      </Flex>
      {field.description ? (
        <Text color="gray.600" fontSize="sm" overflowWrap="anywhere">
          <BreakLines text={field.description} />
        </Text>
      ) : null}
    </Stack>
  ) : (
    <Card
      display="flex"
      flexDirection="column"
      position="relative"
      backgroundColor={highlighted ? "purple.50" : "white"}
      paddingY={4}
      paddingX={{ base: 4, md: 6 }}
      {...props}
    >
      <Flex flexWrap="wrap" justifyContent="space-between">
        <Flex width={{ base: "100%", lg: "auto" }} flex="1">
          <PetitionFieldTypeIndicator
            marginTop="2px"
            type={field.type}
            index={index}
          />
          <Box marginLeft={4} flex="1">
            {field.title ? (
              <Text as="h4" overflowWrap="anywhere">
                {field.title}
              </Text>
            ) : (
              <Text as="h4" textStyle="hint" whiteSpace="nowrap">
                <FormattedMessage
                  id="generic.untitled-field"
                  defaultMessage="Untitled field"
                />
              </Text>
            )}
          </Box>
        </Flex>
        <Flex width={{ base: "100%", lg: "auto" }}>
          <Spacer />
          <Button
            size="sm"
            variant="ghost"
            onClick={onValidateToggle}
            aria-pressed={field.validated}
            aria-label={
              field.validated
                ? intl.formatMessage({
                    id: "petition-replies.validate-field-button.validated",
                    defaultMessage: "Reviewed",
                  })
                : intl.formatMessage({
                    id: "petition-replies.validate-field-button.not-validated",
                    defaultMessage: "Not reviewed",
                  })
            }
            marginRight={1}
          >
            <Switch
              color="green"
              isChecked={field.validated}
              onChange={noop}
              size="sm"
              pointerEvents="none"
              marginRight={2}
              position="relative"
              top="1px"
              aria-hidden={field.validated}
            />
            <FormattedMessage
              id="petition-replies.validate-field-button"
              defaultMessage="Reviewed"
            />
          </Button>
          {/* This Flex element makes the reviewed buttons to be aligned */}
          <Flex width="66px">
            <Spacer />
            <CommentsButton
              isActive={isShowingComments}
              commentCount={field.comments.length}
              hasUnreadComments={field.comments.some((c) => c.isUnread)}
              hasUnpublishedComments={field.comments.some(
                (c) => !c.publishedAt
              )}
              onClick={onToggleComments}
              id={`comment-${index}`}
            />
          </Flex>
        </Flex>
      </Flex>
      <Box marginBottom={2}>
        {field.description ? (
          <Text color="gray.600" fontSize="sm" overflowWrap="anywhere">
            <BreakLines text={field.description} />
          </Text>
        ) : (
          <Text fontSize="sm" textStyle="hint">
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
                  <Stack spacing={1}>
                    <IconButtonWithTooltip
                      size="xs"
                      icon={<DownloadIcon />}
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
                        icon={<EyeIcon />}
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
                  </Stack>
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
          <Text textStyle="hint" textAlign="center">
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
} & BoxProps) {
  const intl = useIntl();
  return (
    <Flex {...props}>
      <Box paddingRight={2} borderRight="2px solid" borderColor="gray.200">
        {actions}
      </Box>
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
          icon={<CheckIcon />}
          label={intl.formatMessage({
            id: "petition-replies.petition-field-reply.approve",
            defaultMessage: "Approve",
          })}
          size="xs"
          placement="bottom"
          colorScheme={reply.status === "APPROVED" ? "green" : "gray"}
          role="switch"
          aria-checked={reply.status === "APPROVED"}
          onClick={() =>
            onUpdateStatus(reply.status === "APPROVED" ? "PENDING" : "APPROVED")
          }
        />
        <IconButtonWithTooltip
          icon={<CloseIcon />}
          label={intl.formatMessage({
            id: "petition-replies.petition-field-reply.reject",
            defaultMessage: "Reject",
          })}
          size="xs"
          placement="bottom"
          role="switch"
          colorScheme={reply.status === "REJECTED" ? "red" : "gray"}
          aria-checked={reply.status === "REJECTED"}
          onClick={() =>
            onUpdateStatus(reply.status === "REJECTED" ? "PENDING" : "REJECTED")
          }
        />
      </Stack>
    </Flex>
  );
}

const CommentsButton = forwardRef<
  HTMLButtonElement,
  {
    commentCount: number;
    hasUnreadComments: boolean;
    hasUnpublishedComments: boolean;
    isActive: boolean;
  } & ButtonProps
>(function CommentsButton(
  {
    commentCount,
    hasUnreadComments,
    hasUnpublishedComments,
    isActive,
    ...props
  },
  ref
) {
  const intl = useIntl();
  const common = {
    "aria-pressed": isActive,
    size: "sm",
    variant: isActive ? "solid" : "ghost",
    colorScheme: isActive ? "purple" : "gray",
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
    <Button
      rightIcon={<CommentIcon />}
      fontWeight="normal"
      {...common}
      ref={ref}
    >
      {hasUnreadComments || hasUnpublishedComments ? (
        <Box
          {...(!hasUnreadComments
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
          borderRadius="full"
          marginRight={2}
        />
      ) : null}
      {intl.formatNumber(commentCount)}
    </Button>
  ) : (
    <IconButton icon={<CommentIcon />} {...common} ref={ref} />
  );
});

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
