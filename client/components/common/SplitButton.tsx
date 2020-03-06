import { ButtonProps, Flex } from "@chakra-ui/core";
import { Children, cloneElement, ReactElement } from "react";
import { Divider, DividerProps } from "./Divider";

export type SplitButtonProps = {
  dividerColor: DividerProps["color"];
  children: ReactElement<ButtonProps>[];
};

export function SplitButton({ dividerColor, children }: SplitButtonProps) {
  return (
    <Flex>
      {Children.map(children, (child, index) => [
        cloneElement(child, {
          style: {
            ...child.props?.style,
            ...(index !== 0
              ? { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }
              : {}),
            ...(index !== children.length - 1
              ? { borderTopRightRadius: 0, borderBottomRightRadius: 0 }
              : {})
          }
        }),
        index !== children.length - 1 ? (
          <Divider isVertical color={dividerColor} />
        ) : (
          undefined
        )
      ])}
    </Flex>
  );
}
