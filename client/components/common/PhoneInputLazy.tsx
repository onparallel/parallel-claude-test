import { Input, InputGroup, InputLeftElement } from "@chakra-ui/react";
import { FieldPhoneIcon } from "@parallel/chakra/icons";
import { withDynamicLoadingProps } from "@parallel/utils/withDynamicLoadingProps";
import dynamic from "next/dynamic";
import type { PhoneInputType } from "./PhoneInput";

export const PhoneInputLazy = withDynamicLoadingProps((useLoadingProps) =>
  dynamic(() => import("./PhoneInput"), {
    ssr: false,
    loading: () => {
      const { defaultCountry: _, inputRef, ...props } = useLoadingProps();
      return (
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <FieldPhoneIcon />
          </InputLeftElement>
          <Input ref={inputRef} type="tel" {...props} />
        </InputGroup>
      );
    },
  })
) as PhoneInputType;
