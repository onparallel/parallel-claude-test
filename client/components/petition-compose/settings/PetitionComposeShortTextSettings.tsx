import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useInlineReactSelectProps } from "@parallel/utils/react-select/hooks";
import { OptionType } from "@parallel/utils/react-select/types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import Select from "react-select";
import { PetitionComposeFieldSettingsProps } from "./PetitionComposeFieldSettings";
import { SettingsRowPlaceholder } from "./SettingsRowPlaceholder";

export function ShortTextSettings({
  field,
  onFieldEdit,
  isReadOnly,
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onFieldEdit" | "isReadOnly">) {
  const intl = useIntl();
  const options = field.options as FieldOptions["SHORT_TEXT"];
  const [placeholder, setPlaceholder] = useState(options.placeholder ?? "");
  const [format, setFormat] = useState<string | null>(options.format);

  const rsProps = useInlineReactSelectProps<any, false, never>({
    size: "sm",
  });

  const formatOptions = useMemo<OptionType[]>(
    () => [
      {
        value: "EMAIL",
        label: intl.formatMessage({
          id: "component.petition-compose-text-settings.email-format",
          defaultMessage: "E-mail",
        }),
      },
      {
        value: "DNI",
        label: intl.formatMessage({
          id: "component.petition-compose-text-settings.dni-format",
          defaultMessage: "Spanish ID number",
        }),
      },
      {
        value: "CIF",
        label: intl.formatMessage({
          id: "component.petition-compose-text-settings.cif-format",
          defaultMessage: "Spanish tax ID number",
        }),
      },
      {
        value: "IBAN",
        label: intl.formatMessage({
          id: "component.petition-compose-text-settings.iban-format",
          defaultMessage: "Account number (IBAN)",
        }),
      },
      {
        value: "SSN_SPAIN",
        label: intl.formatMessage({
          id: "component.petition-compose-text-settings.ssn-spain-format",
          defaultMessage: "Social Security number (Spain)",
        }),
      },
      {
        value: "SSN_USA",
        label: intl.formatMessage({
          id: "component.petition-compose-text-settings.ssn-usa-format",
          defaultMessage: "Social Security number (USA)",
        }),
      },
      {
        value: "POSTAL_SPAIN",
        label: intl.formatMessage({
          id: "component.petition-compose-text-settings.postal-spain-format",
          defaultMessage: "Postal code (Spain)",
        }),
      },
      {
        value: "POSTAL_USA",
        label: intl.formatMessage({
          id: "component.petition-compose-text-settings.postal-usa-format",
          defaultMessage: "Postal code (USA)",
        }),
      },
    ],
    [intl.locale]
  );

  const _value = useMemo(
    () => formatOptions.find((o) => o.value === format),
    [format, formatOptions]
  );

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

  const handleFormatChange = (selected: OptionType) => {
    const format = selected?.value ?? null;
    setFormat(format);
    debouncedOnUpdate(field.id, {
      options: {
        ...field.options,
        format,
      },
    });
  };

  return (
    <Stack spacing={4}>
      <HStack spacing={4}>
        <Text>
          <FormattedMessage
            id="component.petition-compose-text-settings.format"
            defaultMessage="Format:"
          />
        </Text>
        <Box flex="1">
          <Select
            options={formatOptions}
            value={_value}
            onChange={handleFormatChange}
            {...rsProps}
            isSearchable
            isClearable
            placeholder={intl.formatMessage({
              id: "component.petition-compose-text-settings.format-placeholder",
              defaultMessage: "Without format",
            })}
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
