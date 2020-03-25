import { ButtonProps, Flex } from "@chakra-ui/core";
import { Children, cloneElement, ReactElement } from "react";
import { Divider, DividerProps } from "./Divider";
import { MaybeArray } from "@parallel/utils/types";

export type SplitButtonProps = {
  dividerColor?: DividerProps["color"];
  withoutDivider?: boolean;
  children: MaybeArray<ReactElement<ButtonProps>>;
};

export function SplitButton({
  dividerColor,
  withoutDivider,
  children,
}: SplitButtonProps) {
  const length = Array.isArray(children) ? children.length : 1;
  return (
    <Flex>
      {Children.map(children as any, (child, index) => [
        cloneElement(child, {
          style: {
            ...child.props?.style,
            ...(index !== 0
              ? {
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                  borderLeftWidth: 0,
                }
              : {}),
            ...(index !== length - 1
              ? {
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                  borderRightWidth: 0,
                }
              : {}),
          },
        }),
        index !== length - 1 && !withoutDivider ? (
          <Divider isVertical color={dividerColor} />
        ) : undefined,
      ])}
    </Flex>
  );
}
