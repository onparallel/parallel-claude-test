import {
  Badge,
  Button,
  ButtonProps,
  HStack,
  Image,
  Input,
  InputGroup,
  InputRightAddon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
  Text,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Scalars, UserLocale } from "@parallel/graphql/__types";
import { asSupportedUserLocale, useSupportedUserLocales } from "@parallel/utils/locales";
import { useEffectSkipFirst } from "@parallel/utils/useEffectSkipFirst";
import { ValueProps } from "@parallel/utils/ValueProps";
import useMergedRef from "@react-hook/merged-ref";
import { ChangeEvent, Ref, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";

type LocalizableUserText = Scalars["LocalizableUserText"];

interface LocalizableUserTextInputProps extends ValueProps<LocalizableUserText, false> {
  inputRef?: Ref<HTMLInputElement>;
  onBlur?: () => void;
  placeholder?: string;
}

export const LocalizableUserTextInput = chakraForwardRef<"div", LocalizableUserTextInputProps>(
  function ({ value, onChange, onBlur, inputRef: _inputRef, placeholder, ...props }, ref) {
    const intl = useIntl();
    const inputRef = useRef<HTMLInputElement>(null);
    const mergedInputRef = useMergedRef(inputRef, ...(_inputRef ? [_inputRef] : []));
    const [selectedLocale, setSelectedLocale] = useState(
      () =>
        // initial state, by priority get the first that is defined
        [
          asSupportedUserLocale(intl.locale),
          "en" as UserLocale,
          Object.keys(value)[0] as UserLocale,
        ].find((locale) => isDefined(value[locale]))!
    );
    const [inputValue, setInputValue] = useState(() => value[selectedLocale]);
    function handleChangeLocale(locale: UserLocale) {
      setSelectedLocale(locale);
      setInputValue(value[locale] ?? "");
      inputRef.current?.focus();
    }
    function handleValueChange(e: ChangeEvent<HTMLInputElement>) {
      setInputValue(e.target.value);
      onChange({ ...value, [selectedLocale]: e.target.value });
    }

    useEffectSkipFirst(() => {
      setInputValue(value[selectedLocale]);
    }, [value]);
    return (
      <InputGroup ref={ref} {...props}>
        <Input
          ref={mergedInputRef}
          placeholder={placeholder}
          value={inputValue}
          onBlur={onBlur}
          onChange={handleValueChange}
        />
        <InputRightAddon
          as={LocaleSelect}
          paddingInline={3}
          localizableUserText={value}
          value={selectedLocale}
          onChange={handleChangeLocale as any}
        />
      </InputGroup>
    );
  }
);

interface LocaleSelectProps
  extends Omit<ButtonProps, "value" | "onChange">,
    ValueProps<UserLocale, false> {
  localizableUserText: LocalizableUserText;
}

function LocaleSelect({ value, onChange, localizableUserText, ...props }: LocaleSelectProps) {
  const locales = useSupportedUserLocales();
  const current = locales.find((l) => l.key === value)!;
  return (
    <Menu placement="bottom-end">
      <MenuButton as={Button} rightIcon={<ChevronDownIcon />} {...props}>
        <Image
          alt={current.localizedLabel}
          boxSize={6}
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/countries/flags/${current.flag}.png`}
        />
      </MenuButton>
      <MenuList>
        {locales.map((locale) => (
          <MenuItem as={HStack} key={locale.key} onClick={() => onChange(locale.key)}>
            <Image
              alt={locale.localizedLabel}
              boxSize={6}
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/countries/flags/${locale.flag}.png`}
            />
            <Text as="span">{locale.localizedLabel}</Text>
            <Spacer />
            {isDefined(localizableUserText[locale.key]) &&
            localizableUserText[locale.key]!.trim().length ? (
              <Badge variant="subtle" colorScheme="green">
                <FormattedMessage
                  id="component.localizable-user-text-input.translated-badge"
                  defaultMessage="Translated"
                />
              </Badge>
            ) : null}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
}
