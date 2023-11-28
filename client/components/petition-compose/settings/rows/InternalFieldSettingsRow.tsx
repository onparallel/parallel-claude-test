import { UpdatePetitionFieldInput } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { SettingsRowSwitch } from "./SettingsRowSwitch";

export function InternalFieldSettingsRow({
  isRestricted,
  onChange,
  isChecked,
  isDisabled,
}: {
  isRestricted: boolean;
  onChange: (data: UpdatePetitionFieldInput) => void;
  isChecked: boolean;
  isDisabled?: boolean;
}) {
  return (
    <SettingsRowSwitch
      isChecked={isChecked}
      isDisabled={isDisabled}
      disabledReadon={
        isRestricted ? (
          <FormattedMessage
            id="component.petition-compose-field-settings.internal-field-restricted"
            defaultMessage="This field can only be used internally."
          />
        ) : null
      }
      onChange={(value) => onChange({ isInternal: value })}
      label={
        <FormattedMessage
          id="component.petition-compose-field-settings.internal-field"
          defaultMessage="Internal field"
        />
      }
      description={
        <FormattedMessage
          id="component.petition-compose-field-settings.internal-field-description"
          defaultMessage="Enabling this will make the field invisible to the recipient."
        />
      }
      controlId="internal-field"
    />
  );
}
