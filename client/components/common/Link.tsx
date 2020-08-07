import {
  Link as ChakraLink,
  LinkProps as ChakraLinkProps,
  useColorMode,
} from "@chakra-ui/core";
import NextLink, { LinkProps as NextLinkProps } from "next/link";
import { useRouter } from "next/router";
import { ReactNode, forwardRef, Ref } from "react";
import { omit } from "remeda";

export function linkColorProps(colorMode: string) {
  const theme: { [colorMode: string]: ChakraLinkProps } = {
    light: {
      color: "purple.600",
      _hover: {
        color: "purple.700",
      },
      _active: {
        color: "purple.800",
      },
    },
    dark: {
      color: "purple.200",
      _hover: {
        color: "purple.300",
      },
      _active: {
        color: "purple.400",
      },
    },
  };
  return theme[colorMode];
}

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
  const { colorMode } = useColorMode();
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
        <ChakraLink
          {...linkColorProps(colorMode)}
          {...omit(props, ["href", "as"])}
          ref={ref}
        >
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
  ref
) {
  const { colorMode } = useColorMode();
  return <ChakraLink {...linkColorProps(colorMode)} {...props} ref={ref} />;
});
