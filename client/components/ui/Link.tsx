import { Link as ChakraLink, LinkProps } from "@chakra-ui/react";
import { forwardRef } from "react";

// Docs: https://chakra-ui.com/docs/components/link

// v3 API only - isExternal removed completely
// Use target="_blank" and rel="noopener noreferrer" directly
export interface ExtendedLinkProps extends LinkProps {
  // No isExternal prop in v3
}

export const Link = forwardRef<HTMLAnchorElement, ExtendedLinkProps>((props, ref) => {
  return <ChakraLink ref={ref} {...props} />;
});

Link.displayName = "Link";
