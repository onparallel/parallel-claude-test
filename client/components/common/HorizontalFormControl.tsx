import { FormControl, FormControlProps } from "@chakra-ui/core";
import { cloneElement, ReactElement } from "react";

export type HorizontalFormControl = Omit<FormControlProps, "children"> & {
  labelMinWidth?: number;
  children: ReactElement[];
};

export function HorizontalFormControl({
  labelMinWidth,
  children,
  ...props
}: HorizontalFormControl) {
  const [label, control] = children;
  return (
    <FormControl display="flex" alignItems="center" {...props}>
      {cloneElement(label, {
        paddingBottom: 0,
        minWidth: labelMinWidth ?? "120px",
      })}
      {control}
    </FormControl>
  );
}
