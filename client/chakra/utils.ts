import { ComponentWithAs, HTMLChakraProps } from "@chakra-ui/react";
import { ComponentRef, ElementType, FunctionComponent, RefAttributes } from "react";

export type WithChakraProps<T extends ElementType, P> = P & Omit<HTMLChakraProps<T>, keyof P>;

export function chakraComponent<T extends ElementType, P = {}, R = ComponentRef<T>>(
  render: FunctionComponent<WithChakraProps<T, P> & RefAttributes<R>>,
): ComponentWithAs<T, WithChakraProps<T, P> & RefAttributes<R>> {
  return render as any;
}
