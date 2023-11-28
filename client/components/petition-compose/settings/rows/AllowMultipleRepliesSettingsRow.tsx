import { UpdatePetitionFieldInput } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { SettingsRowSwitch } from "./SettingsRowSwitch";

export function AllowMultipleRepliesSettingsRow({
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
          id="component.petition-compose-field-settings.multiple-label"
          defaultMessage="Allow more than one reply"
        />
      }
      description={
        <FormattedMessage
          id="component.petition-compose-field-settings.multiple-description"
          defaultMessage="Enabling this allows the recipient to submit multiple answers to this field."
        />
      }
      controlId="field-multiple"
    />
  );
}
