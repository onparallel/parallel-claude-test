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
import { lazy, Suspense } from "react";
import type { PhoneFormatterProps } from "react-headless-phone-input/types/PhoneFormatterProps";

interface PhoneInputProps
  extends ThemingProps<"Input">,
    FormControlOptions,
    Omit<PhoneFormatterProps, "children"> {}

export const PhoneInput = chakraForwardRef<"input", PhoneInputProps>(function InputPhone(
  { onChange, onBlur, defaultCountry, value, isInvalid, ...props },
  ref
) {
  return (
    <LazyPhoneFormatter defaultCountry={defaultCountry} value={value} onChange={onChange}>
      {({ country, impossible, onBlur: _onBlur, onInputChange, inputValue }) => {
        console.log(country);
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
              ref={ref}
              type="tel"
              isInvalid={isInvalid || Boolean(impossible)}
              value={inputValue}
              onBlur={(event) => {
                onBlur?.(event);
                _onBlur();
              }}
              onChange={(e) => {
                onInputChange(e.target.value);
              }}
              {...props}
            />
          </InputGroup>
        );
      }}
    </LazyPhoneFormatter>
  );
});

const PhoneFormatter = lazy(() => import("react-headless-phone-input"));
function LazyPhoneFormatter(props: PhoneFormatterProps) {
  return (
    <Suspense
      fallback={
        <>
          {props.children({
            inputValue: props.value || "",
            onInputChange(v) {
              props.onChange(v);
            },
            onBlur() {},
          })}
        </>
      }
    >
      <PhoneFormatter {...props} />
    </Suspense>
  );
}
