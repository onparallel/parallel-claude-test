import {
  Link as ChakraLink,
  LinkProps as ChakraLinkProps,
} from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionLocale } from "@parallel/graphql/__types";
import NextLink, { LinkProps as NextLinkProps } from "next/link";
import { useRouter } from "next/router";
import { ReactNode } from "react";

export interface LinkProps
  extends Pick<NextLinkProps, "href">,
    Omit<ChakraLinkProps, "href"> {
  next?: Omit<NextLinkProps, "href">;
  children?: ReactNode;
  omitLocale?: boolean;
  locale?: PetitionLocale;
}

export const Link = chakraForwardRef<"a", LinkProps>(function Link(
  { next, locale, children, href, omitLocale, ...props },
  ref
) {
  const { query } = useRouter();
  const _href = omitLocale
    ? href
    : `/${locale ?? query.locale ?? "en"}/${href
        .toString()
        .replace(/^\//, "")}`;
  return (
    <NextLink href={_href} {...next} passHref>
      <ChakraLink {...props} ref={ref}>
        {children}
      </ChakraLink>
    </NextLink>
  );
});

export type NakedLinkProps = NextLinkProps & {
  locale?: PetitionLocale;
  children?: ReactNode;
};

export function NakedLink({
  href,
  locale,
  children,
  ...props
}: NakedLinkProps) {
  const { query } = useRouter();
  return (
    <NextLink
      href={`/${locale ?? query.locale ?? "en"}/${href
        .toString()
        .replace(/^\//, "")}`}
      {...props}
      passHref
    >
      {children}
    </NextLink>
  );
}

export const NormalLink = ChakraLink;
