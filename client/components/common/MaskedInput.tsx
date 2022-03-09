import { FormControlOptions, Input, ThemingProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { useDynamicMaskFromValue } from "@parallel/utils/useDynamicMaskFromValue";
import { Maybe } from "graphql/jsutils/Maybe";
import { useImperativeHandle, useRef, useState } from "react";
import { IMaskInput } from "react-imask";

interface MaskedInputProps extends ThemingProps<"Input">, FormControlOptions {
  onChange: (value: string) => void;
  format?: Maybe<string>;
  value: string | undefined;
}

export const MaskedInput = chakraForwardRef<"input", MaskedInputProps>(function MaskedInput(
  { value, onChange, format, ...props },
  ref
) {
  const [_value, setValue] = useState(value ?? "");

  const inputRef = useRef<any>();

  useImperativeHandle(ref, () => {
    return inputRef.current?.element;
  });

  const handleOnAccept = (value: string) => {
    setValue(value);
    onChange(value);
  };

  const options = useDynamicMaskFromValue(format, _value);

  return (
    <Input
      as={IMaskInput}
      value={_value}
      onAccept={handleOnAccept}
      ref={inputRef}
      autoComplete="off"
      {...props}
      {...options}
    />
  );
});
