import { Image, Input, Text } from "@chakra-ui/react";
import { ChangeEvent } from "react";
import { FormattedMessage } from "react-intl";
import { SettingsRow } from "./SettingsRow";

type SettingsRowPlaceholderProps = {
  placeholder: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  isReadOnly?: boolean;
};

export function SettingsRowPlaceholder({
  placeholder,
  onChange,
  isReadOnly,
}: SettingsRowPlaceholderProps) {
  return (
    <SettingsRow
      isDisabled={isReadOnly}
      label={
        <FormattedMessage id="field-settings.text-placeholder-label" defaultMessage="Placeholder" />
      }
      description={
        <>
          <Text fontSize="sm">
            <FormattedMessage
              id="field-settings.text-placeholder-description"
              defaultMessage="The placeholder is the subtle descriptive text that shows when the input field is empty."
            />
          </Text>
          <Image
            height="55px"
            marginTop={2}
            src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/placeholder.gif`}
            role="presentation"
          />
        </>
      }
      controlId="text-placeholder"
    >
      <Input value={placeholder} size="sm" onChange={onChange} />
    </SettingsRow>
  );
}
