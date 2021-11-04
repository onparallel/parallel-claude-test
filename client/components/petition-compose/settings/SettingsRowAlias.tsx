import { Input, Text, FormErrorMessage, Stack } from "@chakra-ui/react";
import { ChangeEvent } from "react";
import { FormattedMessage } from "react-intl";
import { SettingsRow } from "./SettingsRow";

type SettingsRowAliasProps = {
  alias: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  isReadOnly?: boolean;
  isInvalid?: boolean;
};

export function SettingsRowAlias({
  alias,
  onChange,
  isReadOnly,
  isInvalid,
}: SettingsRowAliasProps) {
  return (
    <SettingsRow
      isDisabled={isReadOnly}
      label={<FormattedMessage id="field-settings.alias-label" defaultMessage="Alias" />}
      description={
        <Text fontSize="sm">
          <FormattedMessage
            id="field-settings.alias-description"
            defaultMessage="Unique identifier within the petition that serves to easily identify the field in API responses."
          />
        </Text>
      }
      controlId="alias-field"
      isInvalid={isInvalid}
      alignItems="flex-start"
    >
      <Stack width="100%">
        <Input
          id="alias-field"
          value={alias}
          size="sm"
          onChange={onChange}
          isDisabled={isReadOnly}
          maxLength={100}
        />
        <FormErrorMessage>
          <FormattedMessage
            id="field-settings.alias-exists-error"
            defaultMessage="This alias already exists, please choose another one"
          />
        </FormErrorMessage>
      </Stack>
    </SettingsRow>
  );
}
