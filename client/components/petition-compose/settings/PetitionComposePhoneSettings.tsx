import { Box, Stack } from "@chakra-ui/react";
import { PhoneCodeSelect } from "@parallel/components/common/PhoneCodeInput";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, useState } from "react";
import { FormattedMessage } from "react-intl";
import { PetitionComposeFieldSettingsProps } from "./PetitionComposeFieldSettings";
import { SettingsRow } from "./SettingsRow";
import { SettingsRowPlaceholder } from "./SettingsRowPlaceholder";

export function PhoneSettings({
  field,
  onFieldEdit,
  isReadOnly,
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onFieldEdit" | "isReadOnly">) {
  const options = field.options as FieldOptions["PHONE"];
  // const selectRef = useRef<Select<OptionType, false, never>>(null);
  const [placeholder, setPlaceholder] = useState(options.placeholder ?? "");

  // useEffect(() => {
  //   if (!data.loading && selectRef.current && selectOptions) {
  //     selectRef.current.select.selectOption(
  //       selectOptions.find((o) => o.value === options.defaultCountry) ?? selectOptions[0]
  //     );
  //   }
  // }, [data.loading, selectRef.current]);

  const debouncedOnUpdate = useDebouncedCallback(onFieldEdit, 300, [field.id]);

  const handlePlaceholderChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setPlaceholder(value);
    debouncedOnUpdate(field.id, {
      options: {
        ...field.options,
        placeholder: value || null,
      },
    });
  };

  const handleDefaultCountryChange = (country: string | null) => {
    debouncedOnUpdate(field.id, {
      options: {
        ...field.options,
        defaultCountry: country,
      },
    });
  };

  return (
    <Stack spacing={4}>
      <SettingsRow
        isDisabled={isReadOnly}
        label={
          <FormattedMessage
            id="component.petition-compose-phone-settings.default-country"
            defaultMessage="Default country"
          />
        }
        controlId="default-country"
      >
        <Box width="100%">
          <PhoneCodeSelect
            size="sm"
            value={options.defaultCountry}
            onChange={handleDefaultCountryChange}
          />
        </Box>
      </SettingsRow>
      <SettingsRowPlaceholder
        placeholder={placeholder}
        onChange={handlePlaceholderChange}
        isReadOnly={isReadOnly}
      />
    </Stack>
  );
}
