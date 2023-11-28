import { Image } from "@chakra-ui/react";
import { UpdatePetitionFieldInput } from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";
import { SettingsRowSwitch } from "./SettingsRowSwitch";

export function ShowPdfSettingsRow({
  onChange,
  isChecked,
  isDisabled,
}: {
  onChange: (data: UpdatePetitionFieldInput) => void;
  isChecked: boolean;
  isDisabled?: boolean;
}) {
  const intl = useIntl();
  return (
    <SettingsRowSwitch
      isChecked={isChecked}
      isDisabled={isDisabled}
      onChange={(value) => onChange({ showInPdf: value })}
      label={
        <FormattedMessage
          id="component.petition-compose-field-settings.show-in-pdf"
          defaultMessage="Show in PDF"
        />
      }
      description={
        <>
          <FormattedMessage
            id="component.petition-compose-field-settings.show-in-pdf-description"
            defaultMessage="Enabling this option will make the content appear in the exported PDF and the document to be signed."
          />
          <Image
            marginTop={2}
            src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/field-types/FILE_UPLOAD_show_in_pdf_setting_${intl.locale}.png`}
          />
        </>
      }
      controlId="show-in-pdf"
    />
  );
}
