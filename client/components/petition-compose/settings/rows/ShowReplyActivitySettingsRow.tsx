import { UpdatePetitionFieldInput } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { SettingsRowSwitch } from "./SettingsRowSwitch";

export function ShowReplyActivitySettingsRow({
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
      onChange={(value) => onChange({ showActivityInPdf: value })}
      label={
        <FormattedMessage
          id="component.petition-compose-field-settings.petition-show-activity-pdf"
          defaultMessage="Show reply activity"
        />
      }
      description={
        <FormattedMessage
          id="component.petition-compose-field-settings.show-activity-pdf-description"
          defaultMessage="Enabling this option will include who and when a reply and its approval were submitted in the PDF."
        />
      }
      controlId="show-activity-in-pdf"
    />
  );
}
