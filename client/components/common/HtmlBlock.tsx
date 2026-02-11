import { Box, Link } from "@chakra-ui/react";
import { chakraComponent } from "@parallel/chakra/utils";
import { sanitizeHtml } from "@parallel/utils/sanitizeHtml";
import parse, { domToReact, Element, HTMLReactParserOptions } from "html-react-parser";
import { useMemo } from "react";

export const HtmlBlock = chakraComponent<"div", { dangerousInnerHtml: string }>(function HtmlBlock({
  ref,
  children,
  dangerousInnerHtml: html,
  ...props
}) {
  const options: HTMLReactParserOptions = {
    replace: (domNode) => {
      if (domNode instanceof Element && domNode.name === "a") {
        return (
          <Link href={domNode.attribs.href} isExternal>
            {domToReact(domNode.children as any, options)}
          </Link>
        );
      }
    },
  };
  const memoizedHtml = useMemo(() => {
    return parse(sanitizeHtml(html), options);
  }, [html]);

  return (
    <Box ref={ref} {...props}>
      {memoizedHtml}
    </Box>
  );
});
