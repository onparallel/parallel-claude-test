import { UpdatePetitionFieldInput } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { SettingsRowSwitch } from "./SettingsRowSwitch";

export function AttachFilesToPdfSettingsRow({
  onChange,
  isChecked,
  isDisabled,
}: {
  onChange: (data: UpdatePetitionFieldInput) => void;
  isChecked: boolean;
  isDisabled?: boolean;
}) {
  return (
    <SettingsRowSwitch
      isChecked={isChecked}
      onChange={(value) => onChange({ options: { attachToPdf: value } })}
      isDisabled={isDisabled}
      label={
        <FormattedMessage id="generic.attach-files-to-pdf" defaultMessage="Attach files to PDF" />
      }
      description={
        <FormattedMessage
          id="generic.attach-files-to-pdf-description"
          defaultMessage="When this option is enabled, the image and pdf files uploaded to this field will be appended to the end of the exported PDF and the document to be signed."
        />
      }
      controlId="attach-to-pdf"
    />
  );
}
