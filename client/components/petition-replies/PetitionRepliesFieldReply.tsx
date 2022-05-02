import { gql, useApolloClient } from "@apollo/client";
import { Box, Flex, List, ListItem, Stack, Text, VisuallyHidden } from "@chakra-ui/react";
import { CheckIcon, CloseIcon, DownloadIcon, EyeIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  PetitionFieldReplyStatus,
  PetitionRepliesFieldReply_PetitionFieldReplyFragment,
} from "@parallel/graphql/__types";
import { getMyId } from "@parallel/utils/apollo/getMyId";
import { FORMATS } from "@parallel/utils/dates";
import { formatNumberWithPrefix } from "@parallel/utils/formatNumberWithPrefix";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useIsGlobalKeyDown } from "@parallel/utils/useIsGlobalKeyDown";
import { useIsMouseOver } from "@parallel/utils/useIsMouseOver";
import useMergedRef from "@react-hook/merged-ref";
import { useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { BreakLines } from "../common/BreakLines";
import { CopyToClipboardButton } from "../common/CopyToClipboardButton";
import { DateTime } from "../common/DateTime";
import { FileSize } from "../common/FileSize";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { NetDocumentsIconButton } from "../common/NetDocumentsLink";
import { UserOrContactReference } from "../petition-activity/UserOrContactReference";

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
      <Stack spacing={1} paddingRight={2} borderRight="2px solid" borderColor="gray.200">
        {isTextLikeType ? (
          <CopyToClipboardButton size="xs" text={reply.content.value} />
        ) : reply.field!.type === "NUMBER" ? (
          <CopyToClipboardButton
            size="xs"
            text={intl.formatNumber(reply.content.value, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 20,
            })}
          />
        ) : reply.field!.type === "DATE" ? (
          <CopyToClipboardButton
            size="xs"
            text={intl.formatDate(reply.content.value, {
              ...FORMATS.L,
              timeZone: "UTC",
            })}
          />
        ) : reply.field!.type === "PHONE" ? (
          <CopyToClipboardButton size="xs" text={reply.content.value} />
        ) : isFileTypeField(reply.field!.type) ? (
          <ReplyDownloadButton
            isDisabled={reply.content.uploadComplete === false}
            contentType={reply.content.contentType}
            onDownload={(preview) => onAction(preview ? "PREVIEW_FILE" : "DOWNLOAD_FILE")}
          />
        ) : reply.field!.type === "DYNAMIC_SELECT" ? (
          <Stack spacing={1}>
            {(reply.content.value as [string, string | null][]).map(([label, value], index) =>
              value ? (
                <CopyToClipboardButton
                  key={index}
                  aria-label={intl.formatMessage(
                    {
                      id: "petition-replies.petition-field-reply.copy-dynamic-select-reply",
                      defaultMessage: "Copy {label} to clipboard",
                    },
                    { label }
                  )}
                  size="xs"
                  text={value}
                />
              ) : null
            )}
          </Stack>
        ) : reply.field!.type === "CHECKBOX" ? (
          <Stack spacing={1}>
            {(reply.content.value as string[]).map((value, index) => (
              <CopyToClipboardButton key={index} size="xs" text={value} />
            ))}
          </Stack>
        ) : null}
        {reply.metadata.EXTERNAL_ID_CUATRECASAS ? (
          <NetDocumentsIconButton
            externalId={reply.metadata.EXTERNAL_ID_CUATRECASAS}
            size="xs"
            placement="right"
          />
        ) : null}
      </Stack>
      <Flex flexDirection="column" justifyContent="center" flex="1" marginLeft={2}>
        {isTextLikeType ? (
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
          <BreakLines>{reply.content.value}</BreakLines>
        ) : isFileTypeField(reply.field!.type) ? (
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
    }
    ${UserOrContactReference.fragments.UserOrPetitionAccess}
  `,
};

const ReplyDownloadButton = chakraForwardRef<
  "button",
  { contentType: string; onDownload: (preview: boolean) => void; isDisabled: boolean }
>(function ReplyDownloadButton({ contentType, onDownload, ...props }, ref) {
  const intl = useIntl();
  const isPreviewable = contentType === "application/pdf" || contentType.startsWith("image/");
  const innerRef = useRef<HTMLElement>(null);
  const _ref = useMergedRef(ref, innerRef);
  const isMouseOver = useIsMouseOver(innerRef);
  const isShiftDown = useIsGlobalKeyDown("Shift");
  const mode: "PREVIEW" | "DOWNLOAD" = isPreviewable
    ? isMouseOver && isShiftDown
      ? "DOWNLOAD"
      : "PREVIEW"
    : "DOWNLOAD";
  return (
    <IconButtonWithTooltip
      ref={_ref}
      {...props}
      size="xs"
      icon={mode === "PREVIEW" ? <EyeIcon /> : <DownloadIcon />}
      placement="right"
      label={
        isPreviewable
          ? intl.formatMessage({
              id: "petition-replies.petition-field-reply.file-preview-download",
              defaultMessage: "Preview file. ⇧ + click to download",
            })
          : intl.formatMessage({
              id: "petition-replies.petition-field-reply.file-download",
              defaultMessage: "Download file",
            })
      }
      onClick={() => onDownload(mode === "PREVIEW")}
    />
  );
});
