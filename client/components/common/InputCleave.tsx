import { FormControlOptions, Input, ThemingProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { CleaveOptions } from "cleave.js/options";
import Cleave from "cleave.js/react";
import { useRef, useImperativeHandle } from "react";

interface CleaveInputProps extends ThemingProps<"Input">, FormControlOptions {
  options: CleaveOptions;
}

export interface InputCleaveElement extends HTMLInputElement {
  rawValue?: string;
}

export const InputCleave = chakraForwardRef<
  "input",
  CleaveInputProps,
  HTMLInputElement & { rawValue: string }
>(function InputCleave(props, ref) {
  const cleaveRef = useRef<InputCleaveElement>();
  useImperativeHandle(ref, () => cleaveRef.current!.element);
  return <Input as={Cleave} ref={cleaveRef} {...props} />;
});
