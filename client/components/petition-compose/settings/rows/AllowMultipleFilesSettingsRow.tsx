import { UpdatePetitionFieldInput } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { SettingsRowSwitch } from "./SettingsRowSwitch";

export function AllowMultipleFilesSettingsRow({
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
      onChange={(value) => onChange({ multiple: value })}
      isDisabled={isDisabled}
      label={
        <FormattedMessage
          id="component.petition-compose-field-settings.file-multiple-label"
          defaultMessage="Allow uploading more than one file"
        />
      }
      description={
        <FormattedMessage
          id="component.petition-compose-field-settings.file-multiple-description"
          defaultMessage="Enabling this allows the recipient to upload multiple files to this field."
        />
      }
      controlId="field-multiple"
    />
  );
}
