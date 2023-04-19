import { ComponentWithAs, IconProps } from "@chakra-ui/react";
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
import match from "mime-match";
import { IntlShape, useIntl } from "react-intl";
import { isDefined } from "remeda";

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
  return (
    <Icon ref={ref} color={hasFailed ? "red.500" : "inherit"} alt={label} {...(props as any)} />
  );
});

interface FileType {
  icon: ComponentWithAs<"svg", IconProps>;
  name: (intl: IntlShape) => string;
  contentTypes: string[];
  extensions: string[];
}

const FILE_TYPES: FileType[] = [
  {
    name: (intl) =>
      intl.formatMessage({
        id: "component.file-icon.document-file",
        defaultMessage: "Document file",
      }),
    icon: FileDocIcon,
    contentTypes: [
      "application/vnd.ms-word",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    extensions: [".pages", ".docx", ".doc"],
  },
  {
    name: (intl) =>
      intl.formatMessage({
        id: "component.file-icon.spreadsheet-file",
        defaultMessage: "Spreadsheet file",
      }),
    icon: FileSpreadsheetIcon,
    contentTypes: [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/csv",
    ],
    extensions: [".numbers", ".csv", ".xls", ".xlsx"],
  },
  {
    name: (intl) =>
      intl.formatMessage({
        id: "component.file-icon.pdf-file",
        defaultMessage: "PDF file",
      }),
    icon: FilePdfIcon,
    contentTypes: ["application/pdf"],
    extensions: [".pdf"],
  },
  {
    name: (intl) =>
      intl.formatMessage({
        id: "component.file-icon.zip-file",
        defaultMessage: "Zip file",
      }),
    icon: FileZipIcon,
    contentTypes: ["application/zip", "application/x-zip-compressed"],
    extensions: [".zip"],
  },
  {
    name: (intl) =>
      intl.formatMessage({
        id: "component.file-icon.image-file",
        defaultMessage: "Image file",
      }),
    icon: FileImageIcon,
    contentTypes: ["image/*"],
    extensions: [],
  },
  {
    name: (intl) =>
      intl.formatMessage({
        id: "component.file-icon.audio-file",
        defaultMessage: "Audio file",
      }),
    icon: FileMediaIcon,
    contentTypes: ["audio/*"],
    extensions: [],
  },
  {
    name: (intl) =>
      intl.formatMessage({
        id: "component.file-icon.video-file",
        defaultMessage: "Video file",
      }),
    icon: FileMediaIcon,
    contentTypes: ["video/*"],
    extensions: [],
  },
];

function useGetIconAndLabelForFile({
  filename,
  contentType,
  hasFailed,
}: FileIconProps): [ComponentWithAs<"svg", IconProps>, string] {
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
  for (const { icon, name, contentTypes, extensions } of FILE_TYPES) {
    if (
      (isDefined(contentType) && contentTypes.some((t) => match(contentType, t))) ||
      (isDefined(filename) && extensions.some((e) => filename.toLowerCase().endsWith(e)))
    ) {
      return [icon, name(intl)];
    }
  }
  return [
    FileOtherIcon,
    intl.formatMessage({
      id: "component.file-icon.other-file",
      defaultMessage: "File",
    }),
  ];
}
