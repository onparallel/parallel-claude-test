import { FormErrorMessage, Input, Stack, Text } from "@chakra-ui/react";
import { ExternalLink } from "@parallel/components/common/Link";
import { ChangeEvent } from "react";
import { FormattedMessage, useIntl } from "react-intl";
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
  const intl = useIntl();
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
          <ExternalLink
            marginLeft={1}
            href={
              intl.locale === "es"
                ? "https://help.onparallel.com/es/articles/5998723-como-generar-textos-dinamicos"
                : "https://help.onparallel.com/en/articles/5998723-how-to-generate-dynamic-texts-references"
            }
          >
            <FormattedMessage id="generic.learn-more" defaultMessage="Learn more" />
          </ExternalLink>
        </Text>
      }
      controlId="alias-field"
      isInvalid={isInvalid}
    >
      <Stack width="100%">
        <Input value={alias} size="sm" onChange={onChange} maxLength={100} />
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
