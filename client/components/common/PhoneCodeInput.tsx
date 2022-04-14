import { HStack, Text } from "@chakra-ui/react";
import { HighlightText } from "@parallel/components/common/HighlightText";
import { flags } from "@parallel/utils/flags";
import { phoneCodes } from "@parallel/utils/phoneCodes";
import { OptimizedMenuList } from "@parallel/utils/react-select/OptimizedMenuList";
import { useLoadCountryNames } from "@parallel/utils/useCountryName";
import { forwardRef, useMemo } from "react";
import { useIntl } from "react-intl";
import { createFilter, Props as SelectProps, SelectInstance } from "react-select";
import { isDefined } from "remeda";
import { SimpleOption, SimpleSelect, SimpleSelectProps } from "./SimpleSelect";

interface PhoneCodeSelectOptionType extends SimpleOption {
  flag: string;
  code: string;
}

export const PhoneCodeSelect = forwardRef<
  SelectInstance<PhoneCodeSelectOptionType, false>,
  Omit<SimpleSelectProps<string, false, PhoneCodeSelectOptionType>, "options">
>(function PhoneCodeSelect(props, ref) {
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
  return (
    <SimpleSelect
      ref={ref}
      options={options}
      isSearchable
      isClearable
      placeholder={intl.formatMessage({
        id: "component.phone-code-input.placeholder",
        defaultMessage: "Select a country...",
      })}
      {...props}
      formatOptionLabel={formatOptionLabel}
      getOptionLabel={(o) => `${o.label} ${o.code}`}
      filterOption={createFilter({ ignoreAccents: false })}
      components={{ MenuList: OptimizedMenuList as any }}
    />
  );
});

const formatOptionLabel: SelectProps<
  PhoneCodeSelectOptionType,
  false,
  never
>["formatOptionLabel"] = ({ label, flag, code }, { inputValue }) => {
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
