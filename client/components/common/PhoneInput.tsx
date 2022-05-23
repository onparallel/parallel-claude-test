import {
  FormControlOptions,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  ThemingProps,
} from "@chakra-ui/react";
import { FieldPhoneIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { phoneCodes } from "@parallel/utils/phoneCodes";
import { useConstant } from "@parallel/utils/useConstant";
import { useLoadCountryNames } from "@parallel/utils/useCountryName";
import { useMetadata } from "@parallel/utils/withMetadata";
import useMergedRef from "@react-hook/merged-ref";
import { AsYouType } from "libphonenumber-js";
import { ChangeEvent, FocusEvent, Ref, useEffect, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { isDefined } from "remeda";

export interface PhoneInputProps extends ThemingProps<"Input">, FormControlOptions {
  inputRef?: Ref<HTMLInputElement>;
  defaultCountry?: string;
  value?: string;
  onChange?(
    value: string | undefined,
    metadata: { isValid: boolean; country: string | undefined }
  ): void;
  onBlur?(
    value: string | undefined,
    metadata: { isValid: boolean; country: string | undefined }
  ): void;
}

const PhoneInput = chakraForwardRef<"input", PhoneInputProps>(function PhoneInput(
  { value, placeholder, onLoad, onChange, onBlur, defaultCountry, inputRef, ...props },
  ref
) {
  const _ref = useRef<HTMLInputElement>(null);
  const intl = useIntl();
  const { countries } = useLoadCountryNames(intl.locale);
  const mergedRef = useMergedRef(ref, _ref, ...(inputRef ? [inputRef] : []));
  const metadata = useMetadata();
  const _defaultCountry = defaultCountry ?? metadata.country ?? undefined;

  const formatter = useConstant(() => new AsYouType({ defaultCountry: _defaultCountry as any }));
  const [inputValue, setInputValue] = useState("");
  const [country, setCountry] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (formatter.getNumberValue() !== value) {
      formatter.reset();
      if (isDefined(value) && value !== "") {
        formatter.input(value);
      }
      const formatted = (formatter as any).formattedOutput;
      setInputValue(formatted);
      const _country = formatter.getCountry();
      if (_country !== country) {
        setCountry(_country as string);
      }
    }
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    const cursorPosition = [
      _ref.current?.selectionStart ?? null,
      _ref.current?.selectionEnd ?? null,
    ];
    if (inputValue === newValue) {
      return;
    }
    if (newValue && !newValue.startsWith("+")) {
      if (_defaultCountry) {
        newValue = phoneCodes[_defaultCountry] + newValue;
      } else {
        newValue = "+" + newValue;
      }
    }

    // The as-you-type formatter only works with append-only inputs.
    // Changes other than append require a reset.
    const isAppend =
      newValue.length > inputValue.length && newValue.slice(0, inputValue.length) === inputValue;

    if (isAppend) {
      const appended = newValue.slice(inputValue.length);
      formatter.input(appended);
    } else {
      // Reset the formatter, but do not reformat.
      // Doing so now will cause the user to loose their cursor position
      // Wait until blur or append to reformat.
      formatter.reset();
      formatter.input(newValue);
      setTimeout(() => {
        // move back the cursor to the correct position
        _ref.current?.focus();
        _ref.current?.setSelectionRange(cursorPosition[0], cursorPosition[1]);
      });
    }
    const formatted = (formatter as any).formattedOutput;
    setInputValue(formatted);
    const country = formatter.getCountry();
    const isValid = formatter.isPossible();
    const value = formatter.getNumberValue();
    setCountry(country);
    onChange?.(value, { country, isValid });
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    formatter.reset();
    formatter.input(newValue);
    const formatted = (formatter as any).formattedOutput;
    setInputValue(formatted);
    const country = formatter.getCountry();
    const isValid = formatter.isPossible();
    const value = formatter.getNumberValue();
    setCountry(country);
    onBlur?.(value, { country, isValid });
  };

  return (
    <InputGroup>
      <InputLeftElement pointerEvents="none">
        {country ? (
          <Image
            alt={countries?.[country]}
            boxSize={6}
            src={`${
              process.env.NEXT_PUBLIC_ASSETS_URL
            }/static/countries/flags/${country.toLowerCase()}.png`}
          />
        ) : (
          <FieldPhoneIcon />
        )}
      </InputLeftElement>
      <Input
        ref={mergedRef}
        type="tel"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder ?? (_defaultCountry ? phoneCodes[_defaultCountry] : "+")}
        {...props}
      />
    </InputGroup>
  );
});

export type PhoneInputType = typeof PhoneInput;

export default PhoneInput;
