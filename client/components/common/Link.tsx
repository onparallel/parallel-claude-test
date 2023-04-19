import { Link as ChakraLink } from "@chakra-ui/react";
import NextLink, { LinkProps as NextLinkProps } from "next/link";
import { PropsWithChildren } from "react";

export { Link } from "@chakra-ui/next-js";

export function NakedLink(props: PropsWithChildren<NextLinkProps>) {
  return <NextLink passHref legacyBehavior {...props} />;
}

export const NormalLink = ChakraLink;
