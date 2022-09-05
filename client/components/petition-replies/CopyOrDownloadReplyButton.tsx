import { gql } from "@apollo/client";
import { Stack } from "@chakra-ui/react";
import { DownloadIcon, EyeIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { CopyOrDownloadReplyButton_PetitionFieldReplyFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { useIsGlobalKeyDown } from "@parallel/utils/useIsGlobalKeyDown";
import { useIsMouseOver } from "@parallel/utils/useIsMouseOver";
import useMergedRef from "@react-hook/merged-ref";
import { useRef } from "react";
import { useIntl } from "react-intl";
import { CopyToClipboardButton } from "../common/CopyToClipboardButton";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { NetDocumentsIconButton } from "../common/NetDocumentsLink";
import { PetitionRepliesFieldAction } from "./PetitionRepliesFieldReply";

interface CopyOrDownloadReplyButtonProps {
  reply: CopyOrDownloadReplyButton_PetitionFieldReplyFragment;
  content: any;
  onAction: (action: PetitionRepliesFieldAction) => void;
}

export function CopyOrDownloadReplyButton({
  reply,
  content,
  onAction,
}: CopyOrDownloadReplyButtonProps) {
  const intl = useIntl();

  return (
    <Stack spacing={1} paddingRight={2}>
      {reply.field!.type === "NUMBER" ? (
        <CopyToClipboardButton
          size="xs"
          isDisabled={reply.isAnonymized}
          text={intl.formatNumber(content, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 20,
          })}
        />
      ) : reply.field!.type === "DATE" ? (
        <CopyToClipboardButton
          size="xs"
          isDisabled={reply.isAnonymized}
          text={intl.formatDate(content, {
            ...FORMATS.L,
            timeZone: "UTC",
          })}
        />
      ) : isFileTypeField(reply.field!.type) ? (
        <ReplyDownloadButton
          isDisabled={reply.isAnonymized || content.uploadComplete === false}
          contentType={content.contentType}
          onDownload={(preview) => onAction(preview ? "PREVIEW_FILE" : "DOWNLOAD_FILE")}
        />
      ) : (
        <CopyToClipboardButton size="xs" text={content} isDisabled={reply.isAnonymized} />
      )}
      {reply.metadata.EXTERNAL_ID_CUATRECASAS ? (
        <NetDocumentsIconButton
          externalId={reply.metadata.EXTERNAL_ID_CUATRECASAS}
          size="xs"
          placement="right"
        />
      ) : null}
    </Stack>
  );
}

CopyOrDownloadReplyButton.fragments = {
  PetitionFieldReply: gql`
    fragment CopyOrDownloadReplyButton_PetitionFieldReply on PetitionFieldReply {
      metadata
      isAnonymized
      field {
        type
      }
    }
  `,
};

const ReplyDownloadButton = chakraForwardRef<
  "button",
  { contentType: string; onDownload: (preview: boolean) => void; isDisabled: boolean }
>(function ReplyDownloadButton({ contentType, onDownload, ...props }, ref) {
  const intl = useIntl();
  const isPreviewable =
    !!contentType && (contentType === "application/pdf" || contentType.startsWith("image/"));
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
