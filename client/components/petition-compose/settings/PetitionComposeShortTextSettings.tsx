import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import {
  ShortTextFormat,
  useShortTextFormatsSelectOptions,
} from "@parallel/utils/useShortTextFormats";
import { ChangeEvent, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import Select, { GroupTypeBase, components } from "react-select";
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

  const rsProps = useReactSelectProps<ShortTextFormat, false, GroupTypeBase<ShortTextFormat>>({
    size: "sm",
    components: {
      SingleValue: FormatSingleValue,
    },
    styles: useMemo(
      () => ({
        option: (base) => ({ ...base, ":first-letter": { textTransform: "capitalize" } }),
        singleValue: (base) => ({ ...base, ":first-letter": { textTransform: "capitalize" } }),
      }),
      []
    ),
  });

  const { grouped, allFormats } = useShortTextFormatsSelectOptions();

  const _value = useMemo(
    () => allFormats.find((o) => o.value === options.format),
    [options.format, allFormats]
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

  const handleFormatChange = (format: ShortTextFormat | null) => {
    onFieldEdit(field.id, {
      options: {
        ...field.options,
        format: format?.value ?? null,
      },
    });
  };

  return (
    <Stack spacing={4}>
      <Stack>
        <HStack spacing={4}>
          <Text>
            <FormattedMessage
              id="component.petition-compose-text-settings.format"
              defaultMessage="Format:"
            />
          </Text>
          <Box flex="1">
            <Select
              options={grouped}
              value={_value ?? null}
              onChange={handleFormatChange}
              {...rsProps}
              isSearchable
              isClearable
              placeholder={intl.formatMessage({
                id: "component.petition-compose-text-settings.format-placeholder",
                defaultMessage: "No format",
              })}
            />
          </Box>
        </HStack>
        {_value ? (
          <Text fontSize="sm" color="gray.500">
            <FormattedMessage
              id="generic.example"
              defaultMessage="Example: {example}"
              values={{ example: _value.example }}
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
