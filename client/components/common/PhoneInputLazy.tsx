import { Input, InputGroup, InputLeftElement } from "@chakra-ui/react";
import { FieldPhoneIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { lazy, Suspense } from "react";
import type { PhoneInputProps } from "./PhoneInput";

const LazyPhoneInput = lazy(() => import("./PhoneInput"));

export const PhoneInputLazy = chakraForwardRef<"input", PhoneInputProps>(function InputPhone(
  { onChange, onBlur, defaultCountry, value, ...props },
  ref
) {
  return (
    <Suspense
      fallback={
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <FieldPhoneIcon />
          </InputLeftElement>
          <Input type="tel" {...props} />
        </InputGroup>
      }
    >
      <LazyPhoneInput
        ref={ref}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        defaultCountry={defaultCountry}
        {...props}
      />
    </Suspense>
  );
});
