import { UpdatePetitionFieldInput } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { SettingsRowSwitch } from "./SettingsRowSwitch";

export function AllowCommentSettingsRow({
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
      isDisabled={isDisabled}
      onChange={(value) => onChange({ hasCommentsEnabled: value })}
      label={
        <FormattedMessage
          id="component.petition-compose-field-settings.enable-comments"
          defaultMessage="Allow comments"
        />
      }
      controlId="enable-comments"
    />
  );
}
