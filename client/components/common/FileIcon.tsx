import {
  ExclamationOutlineIcon,
  FileDocIcon,
  FileImageIcon,
  FileMediaIcon,
  FileOtherIcon,
  FilePdfIcon,
  FileSpreadsheetIcon,
  FileZipIcon,
} from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { useIntl } from "react-intl";

export interface FileIconProps {
  filename: string;
  contentType: string;
  hasFailed?: boolean;
}

export const FileIcon = chakraForwardRef<"svg", FileIconProps>(function FileIcon(
  { filename, contentType, hasFailed, ...props },
  ref
) {
  const [Icon, label] = useGetIconAndLabelForFile(filename, contentType, hasFailed);
  return <Icon color={hasFailed ? "red.500" : "inherit"} alt={label} {...props} />;
});

function useGetIconAndLabelForFile(filename: string, contentType: string, hasFailed?: boolean) {
  const intl = useIntl();

  if (hasFailed) {
    return [
      ExclamationOutlineIcon,
      intl.formatMessage({
        id: "component.file-icon.upload-failed",
        defaultMessage: "This file did not upload correctly",
      }),
    ];
  }
  if (
    [
      "application/vnd.ms-word",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ].includes(contentType) ||
    filename.endsWith(".pages")
  ) {
    return [
      FileDocIcon,
      intl.formatMessage({
        id: "component.file-icon.document-file",
        defaultMessage: "Document file",
      }),
    ] as const;
  } else if (
    [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/csv",
    ].includes(contentType) ||
    filename.endsWith(".numbers")
  ) {
    return [
      FileSpreadsheetIcon,
      intl.formatMessage({
        id: "component.file-icon.spreadsheet-file",
        defaultMessage: "Spreadsheet file",
      }),
    ] as const;
  } else if (["application/pdf"].includes(contentType)) {
    return [
      FilePdfIcon,
      intl.formatMessage({
        id: "component.file-icon.pdf-file",
        defaultMessage: "PDF file",
      }),
    ] as const;
  } else if (["application/zip", "application/x-zip-compressed"].includes(contentType)) {
    return [
      FileZipIcon,
      intl.formatMessage({
        id: "component.file-icon.zip-file",
        defaultMessage: "Zip file",
      }),
    ] as const;
  } else if (contentType.startsWith("image/")) {
    return [
      FileImageIcon,
      intl.formatMessage({
        id: "component.file-icon.image-file",
        defaultMessage: "Image file",
      }),
    ] as const;
  } else if (contentType.startsWith("audio/")) {
    return [
      FileMediaIcon,
      intl.formatMessage({
        id: "component.file-icon.audio-file",
        defaultMessage: "Audio file",
      }),
    ] as const;
  } else if (contentType.startsWith("video/")) {
    return [
      FileMediaIcon,
      intl.formatMessage({
        id: "component.file-icon.video-file",
        defaultMessage: "Video file",
      }),
    ] as const;
  } else {
    return [
      FileOtherIcon,
      intl.formatMessage({
        id: "component.file-icon.other-file",
        defaultMessage: "File",
      }),
    ] as const;
  }
}
