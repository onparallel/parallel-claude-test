import { Box } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import DOMPurify from "dompurify";
import parse from "html-react-parser";

export const HtmlBlock = chakraForwardRef<"div", { dangerousInnerHtml: string }>(function HtmlBlock(
  { children, dangerousInnerHtml: html, ...props },
  ref
) {
  return (
    <Box
      ref={ref}
      sx={{
        a: { color: "purple.600", _hover: { color: "purple.800" } },
      }}
      {...props}
    >
      {parse(DOMPurify.sanitize(html))}
    </Box>
  );
});
