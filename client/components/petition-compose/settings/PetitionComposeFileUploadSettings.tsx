import { Switch } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { PetitionComposeFieldSettingsProps } from "./PetitionComposeFieldSettings";
import { SettingsRow } from "./SettingsRow";

export function FileUploadSettings({
  field,
  onFieldEdit,
  isReadOnly,
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onFieldEdit" | "isReadOnly">) {
  return (
    <SettingsRow
      isDisabled={isReadOnly}
      label={
        <FormattedMessage
          id="component.petition-settings.petition-attach-files-to-pdf"
          defaultMessage="Attach files to PDF"
        />
      }
      description={
        <FormattedMessage
          id="component.petition-settings.petition-attach-files-to-pdf.description"
          defaultMessage="When this option is enabled, the image and pdf files uploaded to this field will be appended to the end of the exported PDF and the document to be signed."
        />
      }
      controlId="attach-to-pdf"
    >
      <Switch
        height="20px"
        display="block"
        id="attach-to-pdf"
        color="green"
        isChecked={!!field.options.attachToPdf}
        onChange={(event) =>
          onFieldEdit(field.id, {
            options: { attachToPdf: event.target.checked },
          })
        }
        isDisabled={isReadOnly}
      />
    </SettingsRow>
  );
}
