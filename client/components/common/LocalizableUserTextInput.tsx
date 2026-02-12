import {
  Badge,
  ButtonProps,
  Image,
  Input,
  InputGroup,
  InputRightAddon,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Spacer,
  useFormControl,
  useTheme,
} from "@chakra-ui/react";
import { Menu } from "@parallel/chakra/components";
import { ChevronDownIcon } from "@parallel/chakra/icons";
import { chakraComponent } from "@parallel/chakra/utils";
import { Button, HStack, Text } from "@parallel/components/ui";
import { UserLocale } from "@parallel/graphql/__types";
import { ValueProps } from "@parallel/utils/ValueProps";
import { asSupportedUserLocale, useSupportedUserLocales } from "@parallel/utils/locales";
import { useEffectSkipFirst } from "@parallel/utils/useEffectSkipFirst";
import { useMergeRefs } from "@parallel/utils/useMergeRefs";
import { ChangeEvent, Ref, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { LocalizableUserText } from "./LocalizableUserTextRender";

interface LocalizableUserTextInputProps extends ValueProps<LocalizableUserText, false> {
  inputRef?: Ref<HTMLInputElement>;
  inputProps?: any;
  onBlur?: () => void;
  placeholder?: string;
  locale?: UserLocale;
  onChangeLocale?: (locale: UserLocale) => void;
}

export const LocalizableUserTextInput = chakraComponent<"div", LocalizableUserTextInputProps>(
  function ({
    ref,
    value,
    onChange,
    onBlur,
    inputRef: _inputRef,
    inputProps,
    placeholder,
    locale,
    onChangeLocale,
    ...props
  }) {
    const intl = useIntl();
    const inputRef = useRef<HTMLInputElement>(null);
    const mergedInputRef = useMergeRefs(inputRef, _inputRef);

    // Helper to check if a locale has a non-empty translation
    const hasTranslation = (loc: UserLocale | undefined): loc is UserLocale =>
      isNonNullish(loc) && isNonNullish(value[loc]) && value[loc]!.trim().length > 0;

    const [_selectedLocale, setSelectedLocale] = useState(() => {
      // Find the first locale with a non-empty translation
      // Priority: intl.locale > "en" > any other locale with a value > locale param > intl.locale
      return (
        [
          asSupportedUserLocale(intl.locale),
          "en" as UserLocale,
          ...(Object.keys(value) as UserLocale[]),
        ].find(hasTranslation) ||
        locale ||
        (intl.locale as UserLocale)
      );
    });
    const selectedLocale = locale ?? _selectedLocale;
    const [inputValue, setInputValue] = useState(() => value[selectedLocale] ?? "");
    function handleChangeLocale(locale: UserLocale) {
      const onChangeLocaleFn = onChangeLocale ?? setSelectedLocale;
      onChangeLocaleFn(locale);
      setInputValue(value[locale] ?? "");
      inputRef.current?.focus();
    }
    function handleValueChange(e: ChangeEvent<HTMLInputElement>) {
      setInputValue(e.target.value);
      onChange({ ...value, [selectedLocale]: e.target.value });
    }

    useEffectSkipFirst(() => {
      setInputValue(value[selectedLocale] ?? "");
    }, [value, selectedLocale]);
    return (
      <InputGroup ref={ref} {...props}>
        <Input
          ref={mergedInputRef}
          placeholder={placeholder}
          value={inputValue}
          onBlur={onBlur}
          onChange={handleValueChange}
          {...(inputProps as any)}
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
  },
);

interface LocaleSelectProps
  extends Omit<ButtonProps, "value" | "onChange">,
    ValueProps<UserLocale, false> {
  localizableUserText: LocalizableUserText;
}

function LocaleSelect({ value, onChange, localizableUserText, ...props }: LocaleSelectProps) {
  const locales = useSupportedUserLocales();
  const current = locales.find((l) => l.key === value)!;
  const _props = useFormControl(props);
  const theme = useTheme();
  return (
    <Menu placement="bottom-end">
      <MenuButton
        as={Button}
        rightIcon={<ChevronDownIcon />}
        {..._props}
        sx={{
          _invalid: {
            boxShadow: `0 0 0 1px ${theme.colors.red[500]}`,
            border: "1px solid",
            borderColor: "red.500",
          },
          "input:focus + &": {
            boxShadow: `0 0 0 1px ${theme.colors.blue[500]}`,
            border: "1px solid",
            borderColor: "blue.500",
            zIndex: 1,
          },
        }}
      >
        <Image
          alt={current.localizedLabel}
          boxSize={6}
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/countries/flags/${current.flag}.png`}
        />
      </MenuButton>
      <Portal>
        <MenuList>
          {locales.map((locale) => (
            <MenuItem as={HStack} key={locale.key} onClick={() => onChange(locale.key)}>
              <Image
                alt={locale.localizedLabel}
                boxSize={6}
                src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/countries/flags/${locale.flag}.png`}
              />

              <Text as="span">{locale.localizedLabel}</Text>
              <Spacer />
              {isNonNullish(localizableUserText[locale.key]) &&
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
      </Portal>
    </Menu>
  );
}
