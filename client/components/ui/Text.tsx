/* eslint-disable no-restricted-imports */
import { Text as ChakraText, forwardRef, TextProps } from "@chakra-ui/react";

// Docs: https://chakra-ui.com/docs/components/text

// v3 API compatibility layer:
// - noOfLines -> lineClamp
// - isTruncated -> truncate
export interface ExtendedTextProps extends Omit<TextProps, "noOfLines" | "isTruncated"> {
  lineClamp?: number;
  truncate?: boolean;
}

export const Text = forwardRef<ExtendedTextProps, "p">(({ lineClamp, truncate, ...props }, ref) => {
  return <ChakraText ref={ref} noOfLines={lineClamp} isTruncated={truncate} {...props} />;
});

Text.displayName = "Text";
