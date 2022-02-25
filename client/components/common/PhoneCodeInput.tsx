import { HStack, Text } from "@chakra-ui/react";
import { HighlightText } from "@parallel/components/common/HighlightText";
import { flags } from "@parallel/utils/flags";
import { phoneCodes } from "@parallel/utils/phoneCodes";
import { UseReactSelectProps, useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { OptimizedMenuList } from "@parallel/utils/react-select/OptimizedMenuList";
import { OptionType } from "@parallel/utils/react-select/types";
import { useLoadCountryNames } from "@parallel/utils/useCountryName";
import { forwardRef, useMemo } from "react";
import { useIntl } from "react-intl";
import Select, { createFilter, Props as SelectProps } from "react-select";
import { isDefined } from "remeda";

interface PhoneCodeSelectProps extends UseReactSelectProps {
  value?: string | null;
  onChange?: (value: string | null) => void;
}

interface PhoneCodeSelectOptionType extends OptionType {
  flag: string;
  code: string;
}

export const PhoneCodeSelect = forwardRef<
  Select<PhoneCodeSelectOptionType, false, never>,
  PhoneCodeSelectProps
>(function PhoneCodeSelect({ value, onChange, placeholder, ...props }, ref) {
  const intl = useIntl();
  const { countries } = useLoadCountryNames(intl.locale);
  const options = useMemo<PhoneCodeSelectOptionType[] | undefined>(() => {
    if (!isDefined(countries)) return undefined;

    const sortedCountries = Object.entries(countries).sort((a, b) =>
      a[1].localeCompare(b[1], intl.locale)
    );

    return sortedCountries.map(([key, value]) => {
      return {
        label: value,
        value: key,
        flag: flags[key],
        code: phoneCodes[key],
      };
    });
  }, [countries]);
  const _value = useMemo(() => options?.find((o) => o.value === value), [options, value]);
  const rsProps = useReactSelectProps<PhoneCodeSelectOptionType, false, never>({
    components: {
      MenuList: OptimizedMenuList,
    },
    ...props,
  });
  return (
    <Select
      ref={ref}
      {...rsProps}
      filterOption={createFilter({ ignoreAccents: false })}
      options={options}
      value={_value}
      isSearchable
      isClearable
      placeholder={
        placeholder ??
        intl.formatMessage({
          id: "component.phone-code-input.placeholder",
          defaultMessage: "Select a country...",
        })
      }
      formatOptionLabel={formatOptionLabel}
      getOptionLabel={(o) => `${o.label} ${o.code}`}
      onChange={(option) => onChange?.(option?.value ?? null)}
    />
  );
});

const formatOptionLabel: SelectProps<PhoneCodeSelectOptionType, false, never>["formatOptionLabel"] =
  ({ label, flag, code }, { inputValue }) => {
    return (
      <HStack>
        <Text as="span" minWidth={4} role="presentation">
          {flag}
        </Text>
        <Text as="span">
          <HighlightText text={label} search={inputValue} />
        </Text>
        <Text as="span" color="gray.500">
          {code}
        </Text>
      </HStack>
    );
  };
