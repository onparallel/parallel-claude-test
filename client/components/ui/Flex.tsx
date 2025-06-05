import { Flex as ChakraFlex, FlexProps } from "@chakra-ui/react";
import { forwardRef } from "react";

// Docs: https://chakra-ui.com/docs/components/flex

// Flex changes spacing to gap in v3
export interface ExtendedFlexProps extends FlexProps {
  gap?: FlexProps["gap"] | FlexProps["columnGap"] | FlexProps["rowGap"]; // For v3
}

export const Flex = forwardRef<HTMLDivElement, ExtendedFlexProps>(({ gap, ...props }, ref) => {
  // In v2 we use columnGap/rowGap depending on direction
  // In v3 gap is directly supported
  return <ChakraFlex ref={ref} {...(gap ? { gap } : {})} {...props} />;
});

Flex.displayName = "Flex";
