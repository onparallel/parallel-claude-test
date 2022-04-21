import { Box } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";

export const HtmlBlock = chakraForwardRef<"div", { html: string }>(function HtmlBlock(
  { children, html, ...props },
  ref
) {
  return (
    <Box
      ref={ref}
      sx={{
        a: { color: "purple.600", _hover: { color: "purple.800" } },
      }}
      dangerouslySetInnerHTML={{ __html: html }}
      {...props}
    />
  );
});
