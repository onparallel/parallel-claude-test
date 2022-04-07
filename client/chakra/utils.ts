import { As, ComponentWithAs, forwardRef, HTMLChakraProps } from "@chakra-ui/react";
import { ElementRef, ForwardRefRenderFunction, RefAttributes } from "react";

export type WithChakraProps<T extends As, P> = P & Omit<HTMLChakraProps<T>, keyof P | "ref">;

export function chakraForwardRef<T extends As, P = {}, R = ElementRef<T>>(
  render: ForwardRefRenderFunction<R, WithChakraProps<T, P>>
): ComponentWithAs<T, WithChakraProps<T, P> & RefAttributes<R>> {
  return forwardRef(render as any) as any;
}
