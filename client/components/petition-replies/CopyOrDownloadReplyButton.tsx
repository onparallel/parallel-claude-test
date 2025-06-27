import { gql } from "@apollo/client";
import { Stack } from "@chakra-ui/react";
import { DownloadIcon, EyeIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  CopyOrDownloadReplyButton_PetitionFieldReplyFragment,
  PetitionFieldType,
} from "@parallel/graphql/__types";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { useHasRemovePreviewFiles } from "@parallel/utils/useHasRemovePreviewFiles";
import { useIsGlobalKeyDown } from "@parallel/utils/useIsGlobalKeyDown";
import { useIsMouseOver } from "@parallel/utils/useIsMouseOver";
import useMergedRef from "@react-hook/merged-ref";
import { useRef } from "react";
import { useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { AIGeneratedPopover } from "../common/AIGeneratedPopover";
import { CopyToClipboardButton } from "../common/CopyToClipboardButton";
import { FileExportAccessIconButton } from "../common/FileExportAccessIconButton";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { NetDocumentsIconButton } from "../common/NetDocumentsLink";
import { PetitionRepliesFieldAction } from "./PetitionRepliesFieldReply";

interface CopyOrDownloadReplyButtonProps {
  reply: CopyOrDownloadReplyButton_PetitionFieldReplyFragment;
  petitionFieldType: PetitionFieldType;
  content: any;
  onAction: (action: PetitionRepliesFieldAction) => void;
}

export function CopyOrDownloadReplyButton({
  reply,
  petitionFieldType,
  content,
  onAction,
}: CopyOrDownloadReplyButtonProps) {
  const intl = useIntl();
  return (
    <Stack spacing={1}>
      {petitionFieldType === "BACKGROUND_CHECK" ? (
        <IconButtonWithTooltip
          isDisabled={reply.isAnonymized}
          onClick={() => onAction(isNonNullish(content?.entity) ? "VIEW_DETAILS" : "VIEW_RESULTS")}
          icon={<EyeIcon />}
          size="xs"
          label={
            isNonNullish(content?.entity)
              ? intl.formatMessage({
                  id: "component.copy-or-download-reply-button.view-details",
                  defaultMessage: "View details",
                })
              : intl.formatMessage({
                  id: "component.copy-or-download-reply-button.view-results",
                  defaultMessage: "View results",
                })
          }
        />
      ) : petitionFieldType === "ADVERSE_MEDIA_SEARCH" ? (
        <IconButtonWithTooltip
          isDisabled={reply.isAnonymized}
          onClick={() => onAction("VIEW_ARTICLES")}
          icon={<EyeIcon />}
          size="xs"
          label={intl.formatMessage({
            id: "component.copy-or-download-reply-button.view-articles",
            defaultMessage: "View articles",
          })}
        />
      ) : isFileTypeField(petitionFieldType) ? (
        <>
          <ReplyDownloadButton
            isDisabled={reply.isAnonymized || content.uploadComplete === false || content.error}
            contentType={reply.isAnonymized ? "" : content.contentType}
            onDownload={(preview) => onAction(preview ? "PREVIEW_FILE" : "DOWNLOAD_FILE")}
          />
          {petitionFieldType === "FILE_UPLOAD" &&
          reply.metadata.inferred_data_schema &&
          reply.metadata.inferred_data ? (
            <AIGeneratedPopover marginTop={2} />
          ) : null}
        </>
      ) : (
        <CopyToClipboardButton
          size="xs"
          fontSize="md"
          text={petitionFieldType === "PROFILE_SEARCH" ? content.search : content}
          isDisabled={reply.isAnonymized}
        />
      )}
      {reply.metadata.EXTERNAL_ID_CUATRECASAS ? (
        <NetDocumentsIconButton
          externalId={reply.metadata.EXTERNAL_ID_CUATRECASAS}
          size="xs"
          placement="right"
        />
      ) : null}
      {reply.metadata.FILE_EXPORT_IMANAGE_URL !== undefined ? (
        <FileExportAccessIconButton
          size="xs"
          placement="right"
          url={reply.metadata.FILE_EXPORT_IMANAGE_URL}
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
    }
  `,
};

const ReplyDownloadButton = chakraForwardRef<
  "button",
  { contentType: string; onDownload: (preview: boolean) => void; isDisabled: boolean }
>(function ReplyDownloadButton({ contentType, onDownload, ...props }, ref) {
  const intl = useIntl();
  const userHasRemovePreviewFiles = useHasRemovePreviewFiles();
  const isPreviewable =
    !userHasRemovePreviewFiles &&
    !!contentType &&
    (contentType === "application/pdf" || contentType.startsWith("image/"));
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
