import { Box, Link } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import DOMPurify from "dompurify";
import parse, { domToReact, Element, HTMLReactParserOptions } from "html-react-parser";
import { useMemo } from "react";

export const HtmlBlock = chakraForwardRef<"div", { dangerousInnerHtml: string }>(function HtmlBlock(
  { children, dangerousInnerHtml: html, ...props },
  ref
) {
  const options: HTMLReactParserOptions = {
    replace: (domNode) => {
      if (domNode instanceof Element && domNode.name === "a") {
        return (
          <Link href={domNode.attribs.href} isExternal>
            {domToReact(domNode.children, options)}
          </Link>
        );
      }
    },
  };
  const memoizedHtml = useMemo(() => {
    return parse(DOMPurify.sanitize(html), options);
  }, [html]);

  return (
    <Box ref={ref} {...props}>
      {memoizedHtml}
    </Box>
  );
});
