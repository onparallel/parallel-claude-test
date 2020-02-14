import {
  Link as ChakraLink,
  LinkProps as ChakraLinkProps,
  useColorMode
} from "@chakra-ui/core";
import NextLink, { LinkProps as NextLinkProps } from "next/link";
import { useRouter } from "next/router";
import { ReactNode, forwardRef } from "react";

export function linkColorProps(colorMode: string) {
  const theme: { [colorMode: string]: ChakraLinkProps } = {
    light: {
      color: "purple.600",
      _hover: {
        color: "purple.700"
      },
      _active: {
        color: "purple.800"
      }
    },
    dark: {
      color: "purple.200",
      _hover: {
        color: "purple.300"
      },
      _active: {
        color: "purple.400"
      }
    }
  };
  return theme[colorMode];
}

export type LinkProps = Omit<NextLinkProps, "href"> & {
  href: NextLinkProps["href"];
  render?: (children?: ReactNode) => ReactNode;
  chakra?: ChakraLinkProps;
  children?: ReactNode;
};

export function Link({ children, chakra, render, ...props }: LinkProps) {
  const { colorMode } = useColorMode();
  const { query } = useRouter();
  let { href, as, ...rest } = props;
  href = href === "/" ? "" : href;
  as = `/${query.locale}${as ?? href}`;
  href = `/[locale]${href}`;
  return (
    <NextLink href={href} as={as} {...rest} passHref>
      {render ? (
        render(children)
      ) : (
        <ChakraLink {...linkColorProps(colorMode)} {...chakra}>
          {children}
        </ChakraLink>
      )}
    </NextLink>
  );
}

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

export function NormalLink(props: ChakraLinkProps) {
  const { colorMode } = useColorMode();
  return <ChakraLink {...linkColorProps(colorMode)} {...props}></ChakraLink>;
}
