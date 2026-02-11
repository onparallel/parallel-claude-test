import { ComponentWithAs, forwardRef, HTMLChakraProps } from "@chakra-ui/react";
import { ComponentRef, ElementType, ForwardRefRenderFunction, RefAttributes } from "react";

export type WithChakraProps<T extends ElementType, P> = P &
  Omit<HTMLChakraProps<T>, keyof P | "ref">;

export function chakraForwardRef<T extends ElementType, P = {}, R = ComponentRef<T>>(
  render: ForwardRefRenderFunction<R, WithChakraProps<T, P>>,
): ComponentWithAs<T, WithChakraProps<T, P> & RefAttributes<R>> {
  return forwardRef(render as any) as any;
}
