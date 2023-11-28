import { Text } from "@chakra-ui/react";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { FormattedMessage } from "react-intl";
import { PetitionComposeFieldSettingsProps } from "../PetitionComposeFieldSettings";
import { SettingsRowSwitch } from "../rows/SettingsRowSwitch";
import { isDefined } from "remeda";

export function PetitionComposeHeadingSettings({
  field,
  onFieldEdit,
  isReadOnly,
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onFieldEdit" | "isReadOnly">) {
  const options = field.options as FieldOptions["HEADING"];
  const isDisabled = field.visibility !== null || isReadOnly || field.isFixed;
  return (
    <>
      <SettingsRowSwitch
        isDisabled={isDisabled}
        isChecked={options.hasPageBreak}
        onChange={(value) =>
          onFieldEdit(field.id, {
            options: {
              ...field.options,
              hasPageBreak: value,
            },
          })
        }
        disabledReadon={
          isDefined(field.visibility) ? (
            <Text fontSize="sm">
              <FormattedMessage
                id="component.petition-compose-heading-settings.visibility"
                defaultMessage="Can't add page breaks on headings with visibility conditions"
              />
            </Text>
          ) : null
        }
        label={
          <FormattedMessage
            id="component.petition-compose-heading-settings.label"
            defaultMessage="Start new page"
          />
        }
        description={
          <Text fontSize="sm">
            <FormattedMessage
              id="component.petition-compose-heading-settings.description"
              defaultMessage="Enabling this will create a new page and use this as the heading of the new page"
            />
          </Text>
        }
        controlId="heading-page-break"
      />
    </>
  );
}
