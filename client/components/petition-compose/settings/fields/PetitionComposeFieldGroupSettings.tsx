import { Input, Text } from "@chakra-ui/react";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { PetitionComposeFieldSettingsProps } from "../PetitionComposeFieldSettings";
import { SettingsRow } from "../rows/SettingsRow";

export function PetitionComposeFieldGroupSettings({
  field,
  onFieldEdit,
  isReadOnly,
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onFieldEdit" | "isReadOnly">) {
  const intl = useIntl();
  const options = field.options as FieldOptions["FIELD_GROUP"];
  const [groupName, setGroupName] = useState(options.groupName ?? "");

  const debouncedOnUpdate = useDebouncedCallback(onFieldEdit, 300, [field.id]);

  const handleGroupNameChange = function (event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setGroupName(value);
    debouncedOnUpdate(field.id, {
      options: {
        ...field.options,
        groupName: value || null,
      },
    });
  };

  return (
    <>
      <SettingsRow
        isDisabled={isReadOnly}
        label={
          <FormattedMessage
            id="component.petition-compose-field-group-settings.group-name"
            defaultMessage="Group name"
          />
        }
        description={
          <>
            <Text fontSize="sm" marginBottom={2}>
              <FormattedMessage
                id="component.petition-compose-field-group-settings.group-name-description-1"
                defaultMessage="Name your question groups for easier identification."
              />
            </Text>
            <Text fontSize="sm">
              <FormattedMessage
                id="component.petition-compose-field-group-settings.group-name-description-2"
                defaultMessage='If you choose "Relative", groups will be labeled “Relative 1”, “Relative 2” and so on. If left unnamed, groups default to “Reply 1”, “Reply 2”, etc.'
              />
            </Text>
          </>
        }
        controlId="text-group-mame"
      >
        <Input
          value={groupName}
          maxWidth="260px"
          size="sm"
          onChange={handleGroupNameChange}
          placeholder={intl.formatMessage({
            id: "component.petition-compose-field-group-settings.input-group-name-placeholder",
            defaultMessage: "E.g., Family member",
          })}
        />
      </SettingsRow>
    </>
  );
}
