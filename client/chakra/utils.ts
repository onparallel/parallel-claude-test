import {
  As,
  BoxProps,
  ComponentWithAs,
  forwardRef,
  HTMLChakraProps,
} from "@chakra-ui/react";
import { ElementRef, ForwardRefRenderFunction, Ref } from "react";

/**
 * @deprecated Use chakraForwardRef
 */
export type ExtendChakra<P = {}> = P & BoxProps;

export type WithChakraProps<T extends As, P> = P &
  Omit<HTMLChakraProps<T>, keyof P | "ref">;

export function chakraForwardRef<T extends As, P = {}, R = ElementRef<T>>(
  render: ForwardRefRenderFunction<R, WithChakraProps<T, P>>
): ComponentWithAs<T, WithChakraProps<T, P> & { ref?: Ref<R> }> {
  return forwardRef(render) as any;
}
