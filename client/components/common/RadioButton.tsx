import { Button, layoutPropNames, RadioProps, useRadio } from "@chakra-ui/react";
import { pick } from "remeda";

export function RadioButton(props: RadioProps) {
  const rootProps = pick(props, layoutPropNames as any);
  const { getInputProps, getCheckboxProps } = useRadio(props);

  const input = getInputProps();

  return (
    <Button
      fontWeight="normal"
      as="label"
      htmlFor={input.id}
      cursor="pointer"
      _checked={{
        backgroundColor: "blue.500",
        borderColor: "blue.500",
        color: "white",
        _hover: {
          backgroundColor: "blue.600",
          borderColor: "blue.600",
        },
      }}
      {...getCheckboxProps()}
      {...(rootProps as any)}
    >
      <input {...getInputProps()} />
      {props.children}
    </Button>
  );
}
