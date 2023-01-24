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
import { Maybe } from "@parallel/graphql/__types";
import { useIntl } from "react-intl";

export interface FileIconProps {
  filename: Maybe<string>;
  contentType: Maybe<string>;
  hasFailed?: boolean;
}

export const FileIcon = chakraForwardRef<"svg", FileIconProps>(function FileIcon(
  { filename, contentType, hasFailed, ...props },
  ref
) {
  const [Icon, label] = useGetIconAndLabelForFile({ filename, contentType, hasFailed });
  return <Icon ref={ref} color={hasFailed ? "red.500" : "inherit"} alt={label} {...props} />;
});

function useGetIconAndLabelForFile({ filename, contentType, hasFailed }: FileIconProps) {
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

  if (!filename && !contentType) {
    return [
      FileOtherIcon,
      intl.formatMessage({
        id: "component.file-icon.other-file",
        defaultMessage: "File",
      }),
    ];
  }

  const type = contentType ?? "";

  if (
    [
      "application/vnd.ms-word",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ].includes(type) ||
    filename?.endsWith(".pages")
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
    ].includes(type) ||
    filename?.endsWith(".numbers")
  ) {
    return [
      FileSpreadsheetIcon,
      intl.formatMessage({
        id: "component.file-icon.spreadsheet-file",
        defaultMessage: "Spreadsheet file",
      }),
    ] as const;
  } else if (["application/pdf"].includes(type)) {
    return [
      FilePdfIcon,
      intl.formatMessage({
        id: "component.file-icon.pdf-file",
        defaultMessage: "PDF file",
      }),
    ] as const;
  } else if (["application/zip", "application/x-zip-compressed"].includes(type)) {
    return [
      FileZipIcon,
      intl.formatMessage({
        id: "component.file-icon.zip-file",
        defaultMessage: "Zip file",
      }),
    ] as const;
  } else if (type.startsWith("image/")) {
    return [
      FileImageIcon,
      intl.formatMessage({
        id: "component.file-icon.image-file",
        defaultMessage: "Image file",
      }),
    ] as const;
  } else if (type.startsWith("audio/")) {
    return [
      FileMediaIcon,
      intl.formatMessage({
        id: "component.file-icon.audio-file",
        defaultMessage: "Audio file",
      }),
    ] as const;
  } else if (type.startsWith("video/")) {
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
