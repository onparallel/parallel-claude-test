import { useMemo } from "react";
import { useIntl } from "react-intl";
import { FileUploadAccepts } from "./petitionFields";

export function useFileUploadFormats() {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        value: "ALL" as const,
        label: intl.formatMessage({
          id: "generic.file-upload-format-any",
          defaultMessage: "Any format",
        }),
      },
      {
        value: "PDF" as FileUploadAccepts,
        label: intl.formatMessage({
          id: "generic.file-upload-format-pdf",
          defaultMessage: "PDF",
        }),
        extensions: ["pdf"],
      },
      {
        value: "IMAGE" as FileUploadAccepts,
        label: intl.formatMessage({
          id: "generic.file-upload-format-image",
          defaultMessage: "Images",
        }),
        extensions: ["jpg", "jpeg", "png"],
      },
    ],
    [intl.locale],
  );
}
