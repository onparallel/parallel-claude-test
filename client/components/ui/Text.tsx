import { Text as ChakraText, TextProps } from "@chakra-ui/react";
import { forwardRef } from "react";

// Docs: https://chakra-ui.com/docs/components/text

// v3 API only - no v2 compatibility
export interface ExtendedTextProps extends Omit<TextProps, "noOfLines" | "isTruncated"> {
  lineClamp?: number;
  truncate?: boolean;
}

export const Text = forwardRef<HTMLParagraphElement, ExtendedTextProps>(
  ({ lineClamp, truncate, ...props }, ref) => {
    return <ChakraText ref={ref} noOfLines={lineClamp} isTruncated={truncate} {...props} />;
  },
);

Text.displayName = "Text";
