import { createIcon } from "@chakra-ui/react";
import { ExclamationOutlineIcon } from "@parallel/chakra/icons";
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

const FileDocIcon = createIcon({
  displayName: "FileDocIcon",
  viewBox: "0 0 24 24",
  path: (
    <g fill="none">
      <path
        d="M6.375 1.78613H14.7594L22.2139 9.18451V20.8C22.2139 21.1547 22.0623 21.5083 21.7702 21.7789C21.476 22.0514 21.065 22.2139 20.625 22.2139H6.375C5.93502 22.2139 5.52402 22.0514 5.22985 21.7789C4.93771 21.5083 4.78613 21.1547 4.78613 20.8V3.2C4.78613 2.84528 4.93771 2.4917 5.22985 2.22109C5.52401 1.94859 5.93502 1.78613 6.375 1.78613Z"
        fill="#F4F7F9"
        stroke="#4A5568"
        strokeWidth="1.57227"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M15 1V9H23" fill="#4A5568" />
      <rect x="1" y="10" width="11" height="9" rx="1.04818" fill="#3182CE" />
      <path
        d="M3.996 17.5L2.732 11.916H3.932L4.46 14.596L4.756 16.148H4.78L5.132 14.596L5.748 11.916H7.076L7.7 14.596L8.044 16.148H8.068L8.364 14.596L8.9 11.916H10.052L8.756 17.5H7.372L6.668 14.476L6.396 13.252H6.372L6.092 14.476L5.388 17.5H3.996Z"
        fill="white"
      />
    </g>
  ),
});

const FileSpreadsheetIcon = createIcon({
  displayName: "FileSpreadsheetIcon",
  viewBox: "0 0 24 24",
  path: (
    <g fill="none">
      <path
        d="M6.375 1.78613H14.7594L22.2139 9.18451V20.8C22.2139 21.1547 22.0623 21.5083 21.7702 21.7789C21.476 22.0514 21.065 22.2139 20.625 22.2139H6.375C5.93502 22.2139 5.52402 22.0514 5.22985 21.7789C4.93771 21.5083 4.78613 21.1547 4.78613 20.8V3.2C4.78613 2.84528 4.93771 2.4917 5.22985 2.22109C5.52401 1.94859 5.93502 1.78613 6.375 1.78613Z"
        fill="#F4F7F9"
        stroke="#4A5568"
        strokeWidth="1.57227"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M15 1V9H23" fill="#4A5568" />
      <rect x="1" y="10" width="11" height="9" rx="1.04818" fill="#38A169" />
      <path
        d="M9.256 17.5H7.848L6.64 15.444H6.616L5.44 17.5H4.128L5.92 14.612L4.216 11.916H5.632L6.72 13.804H6.744L7.848 11.916H9.16L7.44 14.636L9.256 17.5Z"
        fill="white"
      />
    </g>
  ),
});

export const FilePdfIcon = createIcon({
  displayName: "FilePdfIcon",
  viewBox: "0 0 24 24",
  path: (
    <g fill="none">
      <path
        d="M5.875 1.78613H14.2594L21.7139 9.18451V20.8C21.7139 21.1547 21.5623 21.5083 21.2702 21.7789C20.976 22.0514 20.565 22.2139 20.125 22.2139H5.875C5.43502 22.2139 5.02402 22.0514 4.72985 21.7789C4.43771 21.5083 4.28613 21.1547 4.28613 20.8V3.2C4.28613 2.84528 4.43771 2.4917 4.72985 2.22109C5.02401 1.94859 5.43502 1.78613 5.875 1.78613Z"
        fill="#F4F7F9"
        stroke="#4A5568"
        strokeWidth="1.57227"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14.5 1V9H22.5" fill="#4A5568" />
      <rect x="1.5" y="11" width="16" height="8" rx="1" fill="#E53E3E" />
      <path
        d="M3.039 17.5V12.614H5.349C5.57767 12.614 5.783 12.6537 5.965 12.733C6.147 12.8077 6.301 12.9127 6.427 13.048C6.55767 13.1833 6.658 13.349 6.728 13.545C6.798 13.7363 6.833 13.9463 6.833 14.175C6.833 14.4083 6.798 14.6207 6.728 14.812C6.658 15.0033 6.55767 15.1667 6.427 15.302C6.301 15.4373 6.147 15.5447 5.965 15.624C5.783 15.6987 5.57767 15.736 5.349 15.736H4.103V17.5H3.039ZM4.103 14.812H5.223C5.38167 14.812 5.50533 14.7723 5.594 14.693C5.68733 14.609 5.734 14.4877 5.734 14.329V14.021C5.734 13.8623 5.68733 13.7433 5.594 13.664C5.50533 13.58 5.38167 13.538 5.223 13.538H4.103V14.812ZM7.63275 12.614H9.47375C9.79575 12.614 10.0898 12.6653 10.3558 12.768C10.6218 12.8707 10.8481 13.0247 11.0348 13.23C11.2214 13.4307 11.3661 13.685 11.4688 13.993C11.5714 14.2963 11.6228 14.651 11.6228 15.057C11.6228 15.463 11.5714 15.82 11.4688 16.128C11.3661 16.4313 11.2214 16.6857 11.0348 16.891C10.8481 17.0917 10.6218 17.2433 10.3558 17.346C10.0898 17.4487 9.79575 17.5 9.47375 17.5H7.63275V12.614ZM9.47375 16.555C9.79108 16.555 10.0408 16.4663 10.2228 16.289C10.4048 16.1117 10.4958 15.827 10.4958 15.435V14.679C10.4958 14.287 10.4048 14.0023 10.2228 13.825C10.0408 13.6477 9.79108 13.559 9.47375 13.559H8.69675V16.555H9.47375ZM12.5136 17.5V12.614H15.7546V13.559H13.5776V14.56H15.4326V15.498H13.5776V17.5H12.5136Z"
        fill="white"
      />
    </g>
  ),
});

export const FileZipIcon = createIcon({
  displayName: "FileZipIcon",
  viewBox: "0 0 24 24",
  path: (
    <g fill="none">
      <path
        d="M5.875 1.78613H14.2594L21.7139 9.18451V20.8C21.7139 21.1547 21.5623 21.5083 21.2702 21.7789C20.976 22.0514 20.565 22.2139 20.125 22.2139H5.875C5.43502 22.2139 5.02402 22.0514 4.72985 21.7789C4.43771 21.5083 4.28613 21.1547 4.28613 20.8V3.2C4.28613 2.84528 4.43771 2.4917 4.72985 2.22109C5.02401 1.94859 5.43502 1.78613 5.875 1.78613Z"
        fill="#F4F7F9"
        stroke="#4A5568"
        strokeWidth="1.57227"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14.5 1V9H22.5" fill="#4A5568" />
      <rect x="1.5" y="11" width="16" height="8" rx="1" fill="#4A5568" />
      <path
        d="M7.476 17.5H3.773V16.555L6.181 13.559H3.892V12.614H7.42V13.559L5.005 16.555H7.476V17.5ZM8.10195 17.5V16.653H8.73195V13.461H8.10195V12.614H10.426V13.461H9.79595V16.653H10.426V17.5H8.10195ZM11.3124 17.5V12.614H13.6224C13.8511 12.614 14.0564 12.6537 14.2384 12.733C14.4204 12.8077 14.5744 12.9127 14.7004 13.048C14.8311 13.1833 14.9314 13.349 15.0014 13.545C15.0714 13.7363 15.1064 13.9463 15.1064 14.175C15.1064 14.4083 15.0714 14.6207 15.0014 14.812C14.9314 15.0033 14.8311 15.1667 14.7004 15.302C14.5744 15.4373 14.4204 15.5447 14.2384 15.624C14.0564 15.6987 13.8511 15.736 13.6224 15.736H12.3764V17.5H11.3124ZM12.3764 14.812H13.4964C13.6551 14.812 13.7788 14.7723 13.8674 14.693C13.9608 14.609 14.0074 14.4877 14.0074 14.329V14.021C14.0074 13.8623 13.9608 13.7433 13.8674 13.664C13.7788 13.58 13.6551 13.538 13.4964 13.538H12.3764V14.812Z"
        fill="white"
      />
    </g>
  ),
});

const FileImageIcon = createIcon({
  displayName: "FileImageIcon",
  viewBox: "0 0 24 24",
  path: (
    <g fill="none">
      <path
        d="M4.22222 2.83333H19.7778C20.5448 2.83333 21.1667 3.45516 21.1667 4.22222V19.7778C21.1667 20.5448 20.5448 21.1667 19.7778 21.1667H4.22222C3.45516 21.1667 2.83333 20.5448 2.83333 19.7778V4.22222C2.83333 3.45516 3.45516 2.83333 4.22222 2.83333Z"
        fill="#F4F7F9"
        stroke="#4A5568"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.111 9.77865C9.03148 9.77865 9.77767 9.03245 9.77767 8.11198C9.77767 7.1915 9.03148 6.44531 8.111 6.44531C7.19053 6.44531 6.44434 7.1915 6.44434 8.11198C6.44434 9.03245 7.19053 9.77865 8.111 9.77865Z"
        fill="#4A5568"
        stroke="#4A5568"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M20.3337 15.334L15.3337 9.77734L3.66699 20.334H20.3337V15.334Z" fill="#4A5568" />
    </g>
  ),
});

const FileMediaIcon = createIcon({
  displayName: "FileMediaIcon",
  viewBox: "0 0 24 24",
  path: (
    <g fill="none">
      <path
        d="M4.22222 2.83333H19.7778C20.5448 2.83333 21.1667 3.45516 21.1667 4.22222V19.7778C21.1667 20.5448 20.5448 21.1667 19.7778 21.1667H4.22222C3.45516 21.1667 2.83333 20.5448 2.83333 19.7778V4.22222C2.83333 3.45516 3.45516 2.83333 4.22222 2.83333Z"
        fill="#F4F7F9"
        stroke="#4A5568"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.6665 7.61056C8.6665 7.34683 8.95825 7.18755 9.18009 7.33016L16.0081 11.7196C16.2122 11.8508 16.2122 12.1492 16.0081 12.2804L9.18009 16.6698C8.95825 16.8124 8.6665 16.6532 8.6665 16.3894V7.61056Z"
        fill="#4A5568"
      />
    </g>
  ),
});

const FileOtherIcon = createIcon({
  displayName: "FileOtherIcon",
  viewBox: "0 0 24 24",
  path: (
    <g fill="none">
      <path
        d="M4.875 1.78613H13.2594L20.7139 9.18451V20.8C20.7139 21.1547 20.5623 21.5083 20.2702 21.7789C19.976 22.0514 19.565 22.2139 19.125 22.2139H4.875C4.43502 22.2139 4.02402 22.0514 3.72985 21.7789C3.43771 21.5083 3.28613 21.1547 3.28613 20.8V3.2C3.28613 2.84528 3.43771 2.4917 3.72985 2.22109C4.02401 1.94859 4.43502 1.78613 4.875 1.78613Z"
        fill="#F4F7F9"
        stroke="#4A5568"
        strokeWidth="1.57227"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13.5 1V9H21.5" fill="#4A5568" />
    </g>
  ),
});
