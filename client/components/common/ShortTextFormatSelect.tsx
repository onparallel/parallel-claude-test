import { Text } from "@chakra-ui/react";
import {
  SimpleOption,
  SimpleSelect,
  SimpleSelectProps,
} from "@parallel/components/common/SimpleSelect";
import {
  ShortTextFormat,
  useShortTextFormatsSelectOptions,
} from "@parallel/utils/useShortTextFormats";
import { forwardRef } from "react";
import { useIntl } from "react-intl";
import { SelectInstance, components } from "react-select";

export type ShortTextFormatSelectProps = Omit<SimpleSelectProps<string>, "options">;

export const ShortTextFormatSelect = forwardRef<
  SelectInstance<SimpleOption<string>, false>,
  ShortTextFormatSelectProps
>(function ShortTextFormatSelect(props, ref) {
  const intl = useIntl();

  const { grouped } = useShortTextFormatsSelectOptions();
  return (
    <SimpleSelect
      ref={ref}
      singleLineOptions
      placeholder={intl.formatMessage({
        id: "component.petition-compose-text-settings.format-placeholder",
        defaultMessage: "No format",
      })}
      isSearchable
      isClearable
      options={grouped}
      components={{ SingleValue: FormatSingleValue }}
      styles={{
        option: (base) => ({ ...base, ":first-letter": { textTransform: "capitalize" } }),
        singleValue: (base) => ({
          ...base,
          ":first-letter": { textTransform: "capitalize" },
        }),
      }}
      {...props}
    />
  );
});

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
