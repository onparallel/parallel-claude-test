import { Input, InputGroup, InputLeftElement, PropsOf } from "@chakra-ui/react";
import { FieldPhoneIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { phoneCodes } from "@parallel/utils/phoneCodes";
import { withDynamicLoadingProps } from "@parallel/utils/withDynamicLoadingProps";
import { useMetadata } from "@parallel/utils/withMetadata";
import useMergedRef from "@react-hook/merged-ref";
import dynamic from "next/dynamic";
import { ChangeEvent, FocusEvent, useRef } from "react";
import type { PhoneInputProps } from "./PhoneInput";

export const PhoneInputLazy = withDynamicLoadingProps<PropsOf<typeof FakeInputPhone>>(
  (useLoadingProps) =>
    dynamic(() => import("./PhoneInput"), {
      ssr: false,
      loading: () => {
        const props = useLoadingProps();
        return <FakeInputPhone {...props} />;
      },
    }),
);

const FakeInputPhone = chakraForwardRef<"input", PhoneInputProps>(
  ({ value, placeholder, defaultCountry, onChange, onBlur, inputRef, ...props }, ref) => {
    const _ref = useRef<HTMLInputElement>(null);
    const metadata = useMetadata();
    const _defaultCountry = defaultCountry ?? metadata.country ?? undefined;
    const mergedRef = useMergedRef(ref, _ref, ...(inputRef ? [inputRef] : []));
    const handleChange =
      onChange &&
      ((e: ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        value = value.replaceAll(/[^\d]/g, "");
        if (value.length === 0) {
          return onChange?.(undefined, { isValid: false, country: undefined });
        }
        value = "+" + value;
        onChange(value, { isValid: value.length >= 10, country: undefined });
      });
    const handleBlur =
      onBlur &&
      ((e: FocusEvent<HTMLInputElement>) => {
        const value = e.target.value;
        onBlur(value.length === 0 ? undefined : value, {
          isValid: value.length >= 10,
          country: undefined,
        });
      });
    return (
      <InputGroup>
        <InputLeftElement pointerEvents="none" color={value ? undefined : "gray.400"}>
          <FieldPhoneIcon />
        </InputLeftElement>
        <Input
          value={value}
          ref={mergedRef}
          type="tel"
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder ?? (_defaultCountry ? phoneCodes[_defaultCountry] : "+")}
          {...props}
        />
      </InputGroup>
    );
  },
);
