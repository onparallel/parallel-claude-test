import { UpdatePetitionFieldInput } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { SettingsRowSwitch } from "./SettingsRowSwitch";

export function IncludeApprovalSettingsRow({
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
      onChange={(value) => onChange({ requireApproval: value })}
      isDisabled={isDisabled}
      label={
        <FormattedMessage
          id="component.petition-compose-field-settings.include-approval"
          defaultMessage="Include approval"
        />
      }
      description={
        <FormattedMessage
          id="component.petition-compose-field-settings.include-approval-description"
          defaultMessage="Enabling this option will include the buttons for approving and rejecting replies."
        />
      }
      controlId="include-approval"
    />
  );
}
