import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import { countryFlags } from "@parallel/utils/flags";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { countryPhoneCodes } from "@parallel/utils/phoneCodes";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { OptionType } from "@parallel/utils/react-select/types";
import { useLoadCountryNames } from "@parallel/utils/useCountryName";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import Select, { createFilter } from "react-select";
import { PetitionComposeFieldSettingsProps } from "./PetitionComposeFieldSettings";
import { SettingsRowPlaceholder } from "./SettingsRowPlaceholder";

export function PhoneSettings({
  field,
  onFieldEdit,
  isReadOnly,
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onFieldEdit" | "isReadOnly">) {
  const options = field.options as FieldOptions["PHONE"];
  const intl = useIntl();
  const data = useLoadCountryNames(intl.locale);
  const selectRef = useRef<Select<OptionType, false, never>>(null);
  const [placeholder, setPlaceholder] = useState(options.placeholder ?? "");

  const rsProps = useReactSelectProps<OptionType, false, never>({
    size: "sm",
  });

  const selectOptions =
    !data.loading && data.countries
      ? Object.entries(data.countries).map(([key, value]) => {
          return {
            label: value,
            value: key,
          };
        })
      : undefined;

  const formatOptionLabel = ({ value, label }: { value: string; label: string }) => (
    <HStack>
      <Text as="span" minWidth={4} role="presentation">
        {countryFlags[value]}
      </Text>
      <Text as="span">{label}</Text>
      <Text as="span" color="gray.500">
        {countryPhoneCodes[value]}
      </Text>
    </HStack>
  );

  useEffect(() => {
    if (!data.loading && selectRef.current) {
      selectRef.current.select.selectOption(
        selectOptions?.find((o) => o.value === options.defaultCountry)
      );
    }
  }, [data.loading, selectRef.current]);

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

  const handleDefaultCountryChange = function (option: OptionType | null) {
    debouncedOnUpdate(field.id, {
      options: {
        ...field.options,
        defaultCountry: option?.value ?? "ES",
      },
    });
  };

  return (
    <Stack spacing={4}>
      <HStack spacing={6} minHeight={8}>
        <Text whiteSpace="nowrap">
          <FormattedMessage
            id="component.petition-compose-phone-settings.default"
            defaultMessage="Default:"
          />
        </Text>
        <Box flex="1">
          <Select
            ref={selectRef}
            filterOption={createFilter({ ignoreAccents: false })}
            options={selectOptions}
            isSearchable={true}
            formatOptionLabel={formatOptionLabel}
            onChange={handleDefaultCountryChange}
            {...rsProps}
          />
        </Box>
      </HStack>
      <SettingsRowPlaceholder
        placeholder={placeholder}
        onChange={handlePlaceholderChange}
        isReadOnly={isReadOnly}
      />
    </Stack>
  );
}
