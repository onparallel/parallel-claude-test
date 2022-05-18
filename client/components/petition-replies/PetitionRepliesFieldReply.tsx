import { gql, useApolloClient } from "@apollo/client";
import { Box, Flex, List, ListItem, Stack, Text, VisuallyHidden } from "@chakra-ui/react";
import { CheckIcon, CloseIcon } from "@parallel/chakra/icons";
import {
  PetitionFieldReplyStatus,
  PetitionFieldType,
  PetitionRepliesFieldReply_PetitionFieldReplyFragment,
} from "@parallel/graphql/__types";
import { getMyId } from "@parallel/utils/apollo/getMyId";
import { FORMATS } from "@parallel/utils/dates";
import { formatNumberWithPrefix } from "@parallel/utils/formatNumberWithPrefix";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { FieldOptions } from "@parallel/utils/petitionFields";
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
}

export type PetitionRepliesFieldAction = "DOWNLOAD_FILE" | "PREVIEW_FILE";

export function PetitionRepliesFieldReply({
  reply,
  onUpdateStatus,
  onAction,
}: PetitionRepliesFieldReplyProps) {
  const intl = useIntl();
  const isTextLikeType = ["TEXT", "SHORT_TEXT", "SELECT"].includes(reply.field!.type);

  const apollo = useApolloClient();
  const myId = getMyId(apollo);

  return (
    <Flex>
      <CopyOrDownloadReplyButton reply={reply} onAction={onAction} />
      <Flex flexDirection="column" justifyContent="center" flex="1" marginLeft={2}>
        {reply.isAnonymized ? (
          <ReplyNotAvailable type={reply.field?.type} />
        ) : isTextLikeType ? (
          <BreakLines>{reply.content.value}</BreakLines>
        ) : reply.field!.type === "NUMBER" ? (
          <Text wordBreak="break-all" whiteSpace="pre">
            {formatNumberWithPrefix(
              reply.content.value,
              reply.field!.options as FieldOptions["NUMBER"]
            )}
          </Text>
        ) : reply.field!.type === "DATE" ? (
          <Text>
            {intl.formatDate(reply.content.value, {
              ...FORMATS.L,
              timeZone: "UTC",
            })}
          </Text>
        ) : reply.field!.type === "PHONE" ? (
          reply.isAnonymized ? (
            <ReplyNotAvailable />
          ) : (
            <BreakLines>{reply.content.value}</BreakLines>
          )
        ) : isFileTypeField(reply.field!.type) ? (
          reply.isAnonymized ? (
            <ReplyNotAvailable type={reply.field!.type} />
          ) : (
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
          )
        ) : reply.field!.type === "DYNAMIC_SELECT" ? (
          <List spacing={1}>
            {(reply.content.value as [string, string][]).map(([, value], index) => (
              <ListItem key={index}>{value}</ListItem>
            ))}
          </List>
        ) : reply.field!.type === "CHECKBOX" ? (
          <List spacing={1}>
            {(reply.content.value as string[]).map((value, index) => (
              <ListItem key={index}>{value}</ListItem>
            ))}
          </List>
        ) : null}
        <Box fontSize="sm">
          {reply.field?.type === "FILE_UPLOAD" && reply.content.uploadComplete === false ? (
            <Text color="red.500">
              <FormattedMessage
                id="petition-replies.petition-field-reply.file-upload.file-incomplete"
                defaultMessage="File upload is incomplete"
              />
            </Text>
          ) : (
            <Text color="gray.500">
              {reply.updatedBy?.__typename === "User" && reply.updatedBy.id === myId ? (
                <FormattedMessage id="generic.you" defaultMessage="You" />
              ) : (
                <UserOrContactReference userOrAccess={reply.updatedBy} isLink={false} />
              )}
              {", "}
              <DateTime as="span" value={reply.createdAt} format={FORMATS.LLL} />
            </Text>
          )}
        </Box>
      </Flex>
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
        />
      </Stack>
    </Flex>
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
