import {
  BoxProps,
  ButtonGroup,
  ButtonGroupProps,
  ButtonProps,
} from "@chakra-ui/react";
import { Children, cloneElement, ReactElement } from "react";

import { MaybeArray } from "@parallel/utils/types";

export type SplitButtonProps = {
  dividerColor?: BoxProps["borderColor"];
  children: MaybeArray<ReactElement<ButtonProps>>;
} & ButtonGroupProps;

export function SplitButton({
  dividerColor,
  children,
  ...props
}: SplitButtonProps) {
  const length = Array.isArray(children) ? children.length : 1;
  return (
    <ButtonGroup isAttached {...props}>
      {Children.map(children as any, (child, index) => [
        cloneElement(
          child,
          index !== length - 1
            ? {
                style: {
                  borderRightWidth: "1px",
                },
                borderRightColor: dividerColor,
              }
            : {}
        ),
      ])}
    </ButtonGroup>
  );
}
