import { BoxProps, Box as ChakraBox } from "@chakra-ui/react";
import { forwardRef } from "react";

// Docs: https://chakra-ui.com/docs/components/box

// Box is a basic container component
// In v3 it doesn't change drastically, but this abstraction will allow
// making the necessary changes when it's time to migrate
export const Box = forwardRef<HTMLDivElement, BoxProps>((props, ref) => {
  return <ChakraBox ref={ref} {...props} />;
});

Box.displayName = "Box";
