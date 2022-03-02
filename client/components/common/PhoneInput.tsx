import {
  Box,
  FormControlOptions,
  Input,
  InputGroup,
  InputLeftElement,
  ThemingProps,
} from "@chakra-ui/react";
import { FieldPhoneIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { flags } from "@parallel/utils/flags";
import { phoneCodes } from "@parallel/utils/phoneCodes";
import { useConstant } from "@parallel/utils/useConstant";
import { useMetadata } from "@parallel/utils/withMetadata";
import useMergedRef from "@react-hook/merged-ref";
import { AsYouType } from "libphonenumber-js/min/index";
import { ChangeEvent, FocusEvent, useEffect, useRef, useState } from "react";
import { isDefined } from "remeda";

export interface PhoneInputProps extends ThemingProps<"Input">, FormControlOptions {
  defaultCountry?: string;
  value: string | undefined;
  onChange(
    value: string | undefined,
    metadata: { isValid: boolean; country: string | undefined }
  ): void;
  onBlur(
    value: string | undefined,
    metadata: { isValid: boolean; country: string | undefined }
  ): void;
}

export default chakraForwardRef<"input", PhoneInputProps>(function PhoneInput(
  { value, placeholder, onLoad, onChange, onBlur, defaultCountry, ...props },
  ref
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mergedRef = useMergedRef(ref, inputRef);
  const metadata = useMetadata();
  const _defaultCountry = defaultCountry ?? metadata?.country ?? undefined;

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
      inputRef.current?.selectionStart ?? null,
      inputRef.current?.selectionEnd ?? null,
    ];
    if (inputValue === newValue) {
      return;
    }
    if (newValue && !newValue.startsWith("+")) {
      if (defaultCountry) {
        newValue = phoneCodes[defaultCountry] + newValue;
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
        inputRef.current?.focus();
        inputRef.current?.setSelectionRange(cursorPosition[0], cursorPosition[1]);
      });
    }
    const formatted = (formatter as any).formattedOutput;
    setInputValue(formatted);
    const country = formatter.getCountry();
    const isValid = formatter.isPossible();
    const value = formatter.getNumberValue();
    setCountry(country);
    onChange(value, { country, isValid });
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
    onBlur(value, { country, isValid });
  };

  return (
    <InputGroup>
      <InputLeftElement pointerEvents="none">
        {country ? (
          <Box fontSize="xl">{flags[country]}</Box>
        ) : defaultCountry ? (
          <Box fontSize="xl">{flags[defaultCountry]}</Box>
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
