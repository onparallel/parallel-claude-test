import {
  Link as ChakraLink,
  LinkProps as ChakraLinkProps,
} from "@chakra-ui/core";
import NextLink, { LinkProps as NextLinkProps } from "next/link";
import { useRouter } from "next/router";
import { ReactNode, forwardRef, Ref } from "react";
import { omit } from "remeda";

export type LinkProps = Pick<NextLinkProps, "href" | "as"> &
  Omit<ChakraLinkProps, "href" | "as"> & {
    render?: (children?: ReactNode) => ReactNode;
    next?: Omit<NextLinkProps, "href" | "as">;
    children?: ReactNode;
  };

export const Link = forwardRef(function Link(
  { next, render, children, ...props }: LinkProps,
  ref: Ref<HTMLAnchorElement>
) {
  const { query } = useRouter();
  let { href, as } = props;
  href = href === "/" ? "" : href;
  as = `/${query.locale}${as ?? href}`;
  href = `/[locale]${href}`;
  return (
    <NextLink href={href} as={as} {...next} passHref>
      {render ? (
        render(children)
      ) : (
        <ChakraLink {...omit(props, ["href", "as"])} ref={ref}>
          {children}
        </ChakraLink>
      )}
    </NextLink>
  );
});

export type NakedLinkProps = NextLinkProps & {
  children?: ReactNode;
};

export function NakedLink({ href, as, children, ...props }: NakedLinkProps) {
  const { query } = useRouter();
  href = href === "/" ? "" : href;
  as = `/${query.locale}${as ?? href}`;
  href = `/[locale]${href}`;
  return (
    <NextLink href={href} as={as} {...props} passHref>
      {children}
    </NextLink>
  );
}

export const NormalLink: typeof ChakraLink = forwardRef(function NormalLink(
  props: ChakraLinkProps,
  ref: any
) {
  return <ChakraLink {...props} ref={ref} />;
}) as any; // TODO: Try after rc.1 is fixed
