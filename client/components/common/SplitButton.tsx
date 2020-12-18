import { ButtonProps, Flex, BoxProps } from "@chakra-ui/react";
import { Children, cloneElement, ReactElement } from "react";
import { Divider, DividerProps } from "./Divider";
import { MaybeArray } from "@parallel/utils/types";

export type SplitButtonProps = {
  dividerColor?: DividerProps["color"];
  withoutDivider?: boolean;
  isDisabled?: boolean;
  children: MaybeArray<ReactElement<ButtonProps>>;
} & BoxProps;

export function SplitButton({
  dividerColor,
  withoutDivider,
  isDisabled,
  children,
  ...props
}: SplitButtonProps) {
  const length = Array.isArray(children) ? children.length : 1;
  return (
    <Flex {...props}>
      {Children.map(children as any, (child, index) => [
        cloneElement(child, {
          isDisabled,
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
          <Divider
            isVertical
            color={dividerColor}
            opacity={isDisabled ? 0.4 : 1}
          />
        ) : undefined,
      ])}
    </Flex>
  );
}
