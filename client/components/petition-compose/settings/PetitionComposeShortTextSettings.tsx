import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import { SimpleSelect } from "@parallel/components/common/SimpleSelect";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import {
  ShortTextFormat,
  useShortTextFormatsSelectOptions,
} from "@parallel/utils/useShortTextFormats";
import { ChangeEvent, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { components } from "react-select";
import { PetitionComposeFieldSettingsProps } from "./PetitionComposeFieldSettings";
import { SettingsRowPlaceholder } from "./SettingsRowPlaceholder";

export function ShortTextSettings({
  field,
  onFieldEdit,
  isReadOnly,
  children,
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onFieldEdit" | "isReadOnly" | "children">) {
  const intl = useIntl();
  const options = field.options as FieldOptions["SHORT_TEXT"];
  const [placeholder, setPlaceholder] = useState(options.placeholder ?? "");

  const { grouped, allFormats } = useShortTextFormatsSelectOptions();

  const selected = allFormats.find((o) => o.value === options.format);

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
    <Stack spacing={4}>
      <Stack>
        <HStack spacing={4}>
          <Text textStyle={isReadOnly ? "muted" : undefined}>
            <FormattedMessage
              id="component.petition-compose-text-settings.format"
              defaultMessage="Format:"
            />
          </Text>
          <Box flex="1">
            <SimpleSelect
              size="sm"
              options={grouped}
              value={options.format}
              onChange={(format) => {
                onFieldEdit(field.id, {
                  options: {
                    ...field.options,
                    format: format,
                  },
                });
              }}
              isSearchable
              isClearable
              placeholder={intl.formatMessage({
                id: "component.petition-compose-text-settings.format-placeholder",
                defaultMessage: "No format",
              })}
              components={{ SingleValue: FormatSingleValue }}
              styles={{
                option: (base) => ({ ...base, ":first-letter": { textTransform: "capitalize" } }),
                singleValue: (base) => ({
                  ...base,
                  ":first-letter": { textTransform: "capitalize" },
                }),
              }}
            />
          </Box>
        </HStack>
        {selected ? (
          <Text fontSize="sm" color="gray.500">
            <FormattedMessage
              id="generic.example"
              defaultMessage="Example: {example}"
              values={{ example: selected.example }}
            />
          </Text>
        ) : null}
      </Stack>
      {children}
      <SettingsRowPlaceholder
        placeholder={placeholder}
        onChange={handlePlaceholderChange}
        isReadOnly={isReadOnly}
      />
    </Stack>
  );
}

const FormatSingleValue: typeof components.SingleValue = function FormatSingleValue(props) {
  const { label, countryName } = props.data as unknown as ShortTextFormat;
  return (
    <components.SingleValue {...props}>
      <Text as="span">{label}</Text>
      {countryName ? (
        <Text as="span">
          {" ("}
          {countryName}
          {")"}
        </Text>
      ) : null}
    </components.SingleValue>
  );
};
