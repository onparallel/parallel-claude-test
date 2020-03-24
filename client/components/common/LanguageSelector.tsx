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
import languages from "@parallel/lang/languages.json";
import { useIntl } from "react-intl";

export type LanguageSelectorProp = Pick<SelectProps, "value" | "onChange"> &
  PseudoBoxProps;

export function LanguageSelector({
  value,
  onChange,
  ...props
}: LanguageSelectorProp) {
  const { colorMode } = useColorMode();
  const intl = useIntl();
  return (
    <PseudoBox {...props}>
      <InputGroup size="sm" display="inline-flex">
        <InputLeftElement
          children={
            <Icon
              name={"language" as any}
              color={colorMode === "light" ? "purple.600" : "purple.200"}
              marginRight={3}
              aria-hidden="true"
            />
          }
        />
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
          {languages.map(({ locale, text }) => (
            <option key={locale} value={locale}>
              {text}
            </option>
          ))}
        </Select>
      </InputGroup>
    </PseudoBox>
  );
}
