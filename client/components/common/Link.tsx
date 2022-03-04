import { Link as ChakraLink, LinkProps as ChakraLinkProps } from "@chakra-ui/react";
import { ExternalLinkIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import NextLink, { LinkProps as NextLinkProps } from "next/link";
import { PropsWithChildren, ReactNode } from "react";

interface LinkProps extends Pick<NextLinkProps, "href">, Omit<ChakraLinkProps, "href"> {
  next?: Omit<NextLinkProps, "href">;
  children?: ReactNode;
}

export const Link = chakraForwardRef<"a", LinkProps>(function Link({ next, href, ...props }, ref) {
  return (
    <NextLink href={href} {...next} passHref>
      <ChakraLink ref={ref} {...props} />
    </NextLink>
  );
});

export function NakedLink(props: PropsWithChildren<NextLinkProps>) {
  return <NextLink passHref {...props} />;
}
export const NormalLink = ChakraLink;

export function ExternalLink({ children, ...props }: ChakraLinkProps) {
  return (
    <NormalLink isExternal {...props}>
      {children}
      <ExternalLinkIcon verticalAlign="sub" marginLeft={1} />
    </NormalLink>
  );
}
