import { gql } from "@apollo/client";
import { Box, Grid, GridItem, HStack, Stack, Text, VisuallyHidden } from "@chakra-ui/react";
import { CheckIcon, CloseIcon } from "@parallel/chakra/icons";
import {
  PetitionFieldReplyStatus,
  PetitionFieldType,
  PetitionRepliesFieldReply_PetitionFieldReplyFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { formatNumberWithPrefix } from "@parallel/utils/formatNumberWithPrefix";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { Fragment } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { BreakLines } from "../common/BreakLines";
import { DateTime } from "../common/DateTime";
import { FileSize } from "../common/FileSize";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { UserOrContactReference } from "../petition-activity/UserOrContactReference";
import { CopyOrDownloadReplyButton } from "./CopyOrDownloadReplyButton";

export interface PetitionRepliesFieldReplyProps {
  reply: PetitionRepliesFieldReply_PetitionFieldReplyFragment;
  onUpdateStatus: (status: PetitionFieldReplyStatus) => void;
  onAction: (action: PetitionRepliesFieldAction) => void;
  isDisabled?: boolean;
}

export type PetitionRepliesFieldAction = "DOWNLOAD_FILE" | "PREVIEW_FILE";

export function PetitionRepliesFieldReply({
  reply,
  onUpdateStatus,
  onAction,
  isDisabled,
}: PetitionRepliesFieldReplyProps) {
  const intl = useIntl();
  const singleContents = isFileTypeField(reply.field!.type)
    ? [reply.content]
    : Array.isArray(reply.content.value)
    ? reply.field!.type === "DYNAMIC_SELECT"
      ? reply.content.value.map((v) => v[1])
      : reply.content.value
    : [reply.content.value];

  return (
    <HStack>
      <Grid flex="1" templateColumns="auto 1fr" columnGap={2}>
        {singleContents.map((content, i) => (
          <Fragment key={i}>
            <GridItem paddingBottom={1}>
              <CopyOrDownloadReplyButton reply={reply} content={content} onAction={onAction} />
            </GridItem>
            <GridItem
              borderLeft="2px solid"
              borderColor="gray.200"
              paddingBottom={1}
              paddingLeft={2}
            >
              {reply.isAnonymized ? (
                <ReplyNotAvailable type={reply.field!.type} />
              ) : isFileTypeField(reply.field!.type) ? (
                <Box>
                  <VisuallyHidden>
                    {intl.formatMessage({
                      id: "generic.file-name",
                      defaultMessage: "File name",
                    })}
                  </VisuallyHidden>
                  <Text as="span">{content.filename}</Text>
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
                    <FileSize value={content.size} />
                  </Text>
                </Box>
              ) : reply.field!.type === "NUMBER" ? (
                <Text wordBreak="break-all" whiteSpace="pre">
                  {formatNumberWithPrefix(
                    content as number,
                    reply.field!.options as FieldOptions["NUMBER"]
                  )}
                </Text>
              ) : reply.field!.type === "DATE" ? (
                <Text>
                  {intl.formatDate(content, {
                    ...FORMATS.L,
                    timeZone: "UTC",
                  })}
                </Text>
              ) : (
                <BreakLines>{content}</BreakLines>
              )}
            </GridItem>
          </Fragment>
        ))}
        <GridItem
          gridColumn={2}
          fontSize="sm"
          borderLeft="2px solid"
          borderColor="gray.200"
          paddingLeft={2}
        >
          {isFileTypeField(reply.field!.type) && reply.content.uploadComplete === false ? (
            <Text color="red.500">
              <FormattedMessage
                id="petition-replies.petition-field-reply.file-upload.file-incomplete"
                defaultMessage="File upload is incomplete"
              />
            </Text>
          ) : (
            <Text color="gray.500">
              {reply.updatedBy?.__typename === "User" && reply.updatedBy.isMe ? (
                <FormattedMessage id="generic.you" defaultMessage="You" />
              ) : (
                <UserOrContactReference userOrAccess={reply.updatedBy} isLink={false} />
              )}
              {", "}
              <DateTime as="span" value={reply.createdAt} format={FORMATS.LLL} />
            </Text>
          )}
        </GridItem>
      </Grid>
      <Stack direction="row" spacing={1} alignSelf="flex-start" data-section="approve-reject-reply">
        <IconButtonWithTooltip
          data-action="approve-reply"
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
          onClick={() => onUpdateStatus(reply.status === "APPROVED" ? "PENDING" : "APPROVED")}
          isDisabled={isDisabled || reply.isAnonymized}
        />
        <IconButtonWithTooltip
          data-action="reject-reply"
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
          onClick={() => onUpdateStatus(reply.status === "REJECTED" ? "PENDING" : "REJECTED")}
          isDisabled={isDisabled || reply.isAnonymized}
        />
      </Stack>
    </HStack>
  );
}

PetitionRepliesFieldReply.fragments = {
  PetitionFieldReply: gql`
    fragment PetitionRepliesFieldReply_PetitionFieldReply on PetitionFieldReply {
      id
      content
      status
      createdAt
      metadata
      field {
        type
        options
      }
      updatedBy {
        ...UserOrContactReference_UserOrPetitionAccess
        ... on User {
          isMe
        }
      }
      isAnonymized
      ...CopyOrDownloadReplyButton_PetitionFieldReply
    }
    ${UserOrContactReference.fragments.UserOrPetitionAccess}
    ${CopyOrDownloadReplyButton.fragments.PetitionFieldReply}
  `,
};

function ReplyNotAvailable({ type }: { type?: PetitionFieldType }) {
  return (
    <Text textStyle="hint">
      {type && isFileTypeField(type) ? (
        <FormattedMessage
          id="generic.document-not-available"
          defaultMessage="Document not available"
        />
      ) : (
        <FormattedMessage id="generic.reply-not-available" defaultMessage="Reply not available" />
      )}
    </Text>
  );
}
