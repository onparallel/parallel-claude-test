import {
  Icon,
  InputGroup,
  InputLeftElement,
  PseudoBox,
  PseudoBoxProps,
  Select,
  SelectProps,
  useColorMode,
} from "@chakra-ui/core";
import { useIntl } from "react-intl";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";

export type LanguageSelectorProp = Pick<SelectProps, "value" | "onChange"> &
  PseudoBoxProps;

export function LanguageSelector({
  value,
  onChange,
  ...props
}: LanguageSelectorProp) {
  const { colorMode } = useColorMode();
  const intl = useIntl();
  const locales = useSupportedLocales();
  return (
    <PseudoBox {...props}>
      <InputGroup size="sm" display="inline-flex">
        <InputLeftElement>
          <Icon
            name={"language" as any}
            color={colorMode === "light" ? "purple.600" : "purple.200"}
            marginRight={3}
            aria-hidden="true"
          />
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
    </PseudoBox>
  );
}
