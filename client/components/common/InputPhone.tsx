import { Input, InputGroup, InputLeftElement, InputProps } from "@chakra-ui/react";
import { FieldPhoneIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { countryFlags } from "@parallel/utils/flags";
import PhoneFormatter from "react-headless-phone-input/lazy";
import { PhoneFormatterProps } from "react-headless-phone-input/types/PhoneFormatterProps";

export const InputPhone = chakraForwardRef<
  "input",
  Omit<InputProps, "onChange"> & Omit<PhoneFormatterProps, "children">,
  HTMLInputElement
>(function InputPhone({ onChange, onBlur, defaultCountry, value, isInvalid, ...props }, ref) {
  return (
    <PhoneFormatter defaultCountry={defaultCountry} value={value} onChange={onChange}>
      {({ country, impossible, onBlur: _onBlur, onInputChange, inputValue }) => {
        return (
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              {country ? countryFlags[country] : <FieldPhoneIcon color="gray.400" />}
            </InputLeftElement>
            <Input
              ref={ref}
              type="tel"
              isInvalid={isInvalid || Boolean(impossible)}
              value={inputValue}
              onBlur={(event: any) => {
                onBlur && event && onBlur(event);
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
    </PhoneFormatter>
  );
});
