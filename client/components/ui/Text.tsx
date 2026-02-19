/* eslint-disable no-restricted-imports */
import { Text as ChakraText, TextProps } from "@chakra-ui/react";
import { chakraComponent } from "@parallel/chakra/utils";

// Docs: https://chakra-ui.com/docs/components/text

// v3 API compatibility layer:
// - noOfLines -> lineClamp
// - isTruncated -> truncate
export interface ExtendedTextProps extends Omit<TextProps, "noOfLines" | "isTruncated"> {
  lineClamp?: number;
  truncate?: boolean;
}

export const Text = chakraComponent<"p" | "span", ExtendedTextProps>(function Text({
  lineClamp,
  truncate,
  ref,
  ...props
}) {
  return <ChakraText ref={ref} noOfLines={lineClamp} isTruncated={truncate} {...props} />;
});
