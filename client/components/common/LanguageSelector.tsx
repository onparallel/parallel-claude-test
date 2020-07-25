import {
  Box,
  BoxProps,
  InputGroup,
  InputLeftElement,
  Select,
  SelectProps,
} from "@chakra-ui/core";
import { LanguageIcon } from "@parallel/chakra/icons";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import { useIntl } from "react-intl";

export type LanguageSelectorProp = Pick<SelectProps, "value" | "onChange"> &
  BoxProps;

export function LanguageSelector({
  value,
  onChange,
  ...props
}: LanguageSelectorProp) {
  const intl = useIntl();
  const locales = useSupportedLocales();
  return (
    <Box {...props}>
      <InputGroup size="sm" display="inline-flex">
        <InputLeftElement>
          <LanguageIcon color="purple.600" marginRight={3} aria-hidden="true" />
        </InputLeftElement>
        <Select
          variant="flushed"
          paddingLeft={6}
          onChange={onChange}
          value={value}
          aria-label={intl.formatMessage({
            id: "public.footer.language-select-label",
            defaultMessage: "Change language",
          })}
        >
          {locales.map(({ label, key }) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
      </InputGroup>
    </Box>
  );
}
