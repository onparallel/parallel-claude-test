import {
  HStack as ChakraHStack,
  Stack as ChakraStack,
  VStack as ChakraVStack,
  StackProps,
} from "@chakra-ui/react";
import { forwardRef } from "react";

// Docs: https://chakra-ui.com/docs/components/stack

// Stack v3 API - uses gap instead of spacing
export interface ExtendedStackProps extends Omit<StackProps, "spacing"> {
  gap?: StackProps["spacing"];
}

export const Stack = forwardRef<HTMLDivElement, ExtendedStackProps>(({ gap, ...props }, ref) => {
  // Map v3 gap to v2 spacing
  return <ChakraStack ref={ref} spacing={gap} {...props} />;
});

export const HStack = forwardRef<HTMLDivElement, ExtendedStackProps>(({ gap, ...props }, ref) => {
  return <ChakraHStack ref={ref} spacing={gap} {...props} />;
});

export const VStack = forwardRef<HTMLDivElement, ExtendedStackProps>(({ gap, ...props }, ref) => {
  return <ChakraVStack ref={ref} spacing={gap} {...props} />;
});

Stack.displayName = "Stack";
HStack.displayName = "HStack";
VStack.displayName = "VStack";
