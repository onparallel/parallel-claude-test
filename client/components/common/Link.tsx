import {
  Link as ChakraLink,
  LinkProps as ChakraLinkProps,
} from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import NextLink, { LinkProps as NextLinkProps } from "next/link";
import { useRouter } from "next/router";
import { ReactNode } from "react";

export interface LinkProps
  extends Pick<NextLinkProps, "href">,
    Omit<ChakraLinkProps, "href"> {
  next?: Omit<NextLinkProps, "href">;
  children?: ReactNode;
}

export const Link = chakraForwardRef<"a", LinkProps>(function Link(
  { next, children, href, ...props },
  ref
) {
  const { query } = useRouter();
  return (
    <NextLink
      href={`/${query.locale}/${href.toString().replace(/^\//, "")}`}
      {...next}
      passHref
    >
      <ChakraLink {...props} ref={ref}>
        {children}
      </ChakraLink>
    </NextLink>
  );
});

export type NakedLinkProps = NextLinkProps & {
  children?: ReactNode;
};

export function NakedLink({ href, children, ...props }: NakedLinkProps) {
  const { query } = useRouter();
  return (
    <NextLink
      href={`/${query.locale}/${href.toString().replace(/^\//, "")}`}
      {...props}
      passHref
    >
      {children}
    </NextLink>
  );
}

export const NormalLink = ChakraLink;
