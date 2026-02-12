/* eslint-disable no-restricted-imports */
import {
  HStack as ChakraHStack,
  Stack as ChakraStack,
  StackProps as ChakraStackProps,
  VStack as ChakraVStack,
} from "@chakra-ui/react";
import { chakraComponent } from "@parallel/chakra/utils";

// Docs: https://chakra-ui.com/docs/components/stack

// Stack v3 migration shim: accepts v3 API (gap) but uses v2 behavior (spacing).
// Code uses gap={X} → wrapper passes spacing={X} to v2 Stack.
// When migrating to Chakra v3, remove this wrapper and re-export directly.
export interface ExtendedStackProps extends Omit<ChakraStackProps, "spacing"> {
  gap?: ChakraStackProps["spacing"];
}

export type StackProps = ExtendedStackProps;

export const Stack = chakraComponent<"div", ExtendedStackProps>(function Stack({
  gap,
  ref,
  ...props
}) {
  return <ChakraStack ref={ref} spacing={gap} {...props} />;
});

export const HStack = chakraComponent<"div", ExtendedStackProps>(function HStack({
  gap,
  ref,
  ...props
}) {
  return <ChakraHStack ref={ref} spacing={gap} {...props} />;
});

export const VStack = chakraComponent<"div", ExtendedStackProps>(function VStack({
  gap,
  ref,
  ...props
}) {
  return <ChakraVStack ref={ref} spacing={gap} {...props} />;
});
