import { Input, InputProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import Cleave from "cleave.js/react";
import { ComponentProps, useImperativeHandle, useRef } from "react";

export const InputCleave = chakraForwardRef<"input", InputProps & ComponentProps<typeof Cleave>>(
  function InputCleave(props, ref) {
    const cleaveRef = useRef<any>();
    useImperativeHandle(ref, () => {
      return cleaveRef.current?.element;
    });
    return <Input as={Cleave} ref={cleaveRef} {...props} />;
  }
);
