import { FormErrorMessage, Input, Stack, Text } from "@chakra-ui/react";
import { HelpCenterLink } from "@parallel/components/common/HelpCenterLink";
import { ChangeEvent } from "react";
import { FormattedMessage } from "react-intl";
import { isDefined } from "remeda";
import { SettingsRow } from "./SettingsRow";

export type AliasErrorType = "UNIQUE" | "INVALID";

type SettingsRowAliasProps = {
  alias: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  isReadOnly?: boolean;
  errorType?: AliasErrorType | null;
};

export function SettingsRowAlias({
  alias,
  onChange,
  isReadOnly,
  errorType,
}: SettingsRowAliasProps) {
  return (
    <SettingsRow
      isDisabled={isReadOnly}
      label={<FormattedMessage id="field-settings.alias-label" defaultMessage="References" />}
      description={
        <Text fontSize="sm">
          <FormattedMessage
            id="field-settings.alias-description"
            defaultMessage="Allows to easily identify the field in API replies. In addition, it can be inserted into the field description to automatically replace the content."
          />
          <HelpCenterLink marginLeft={1} articleId={5998723}>
            <FormattedMessage id="generic.learn-more" defaultMessage="Learn more" />
          </HelpCenterLink>
        </Text>
      }
      controlId="alias-field"
      isInvalid={isDefined(errorType)}
    >
      <Stack width="100%">
        <Input value={alias} size="sm" onChange={onChange} maxLength={100} />
        <FormErrorMessage>
          {errorType === "INVALID" ? (
            <FormattedMessage
              id="field-settings.reference-invalid-error"
              defaultMessage="Use only letters, numbers or _"
            />
          ) : (
            <FormattedMessage
              id="field-settings.reference-exists-error"
              defaultMessage="This reference is already in use."
            />
          )}
        </FormErrorMessage>
      </Stack>
    </SettingsRow>
  );
}
