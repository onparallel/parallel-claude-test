import { Image, Input, Text } from "@chakra-ui/react";
import { ChangeEvent, useState } from "react";
import { FormattedMessage } from "react-intl";
import { SettingsRow } from "./SettingsRow";
import { PetitionComposeFieldSettingsProps } from "../PetitionComposeFieldSettings";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";

export function SettingsRowPlaceholder({
  field,
  onFieldEdit,
  isReadOnly,
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onFieldEdit" | "isReadOnly">) {
  const [placeholder, setPlaceholder] = useState(field.options?.placeholder ?? "");

  const debouncedOnUpdate = useDebouncedCallback(onFieldEdit, 300, [field.id]);

  const handlePlaceholderChange = function (event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setPlaceholder(value);
    debouncedOnUpdate(field.id, {
      options: {
        ...field.options,
        placeholder: value || null,
      },
    });
  };
  return (
    <SettingsRow
      isDisabled={isReadOnly}
      label={
        <FormattedMessage
          id="component.settings-row-placeholder.placeholder-label"
          defaultMessage="Placeholder"
        />
      }
      description={
        <>
          <Text fontSize="sm">
            <FormattedMessage
              id="component.settings-row-placeholder.placeholder-description"
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
      <Input value={placeholder} size="sm" onChange={handlePlaceholderChange} />
    </SettingsRow>
  );
}
