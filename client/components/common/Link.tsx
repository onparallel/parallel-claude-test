import {
  chakra,
  Link as ChakraLink,
  LinkProps as ChakraLinkProps,
  HTMLChakraProps,
  omitThemingProps,
  ThemingProps,
  useStyleConfig,
} from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import NextLink, { LinkProps as NextLinkProps } from "next/link";
import { PropsWithChildren } from "react";

const cx = (...classNames: any[]) => classNames.filter(Boolean).join(" ");

type Merge<P, T> = Omit<P, keyof T> & T;

export type LinkProps = Merge<
  HTMLChakraProps<"a"> & ThemingProps<"Link"> & ChakraLinkProps,
  Omit<NextLinkProps, "as" | "legacyBehavior" | "passHref">
>;

export const Link = chakraForwardRef<"a", LinkProps>(function Link(props, ref) {
  const styles = useStyleConfig("Link", props);
  const { className, isExternal, href, children, ...rest } = omitThemingProps(props);

  return (
    <chakra.a
      target={isExternal ? "_blank" : undefined}
      ref={ref}
      href={href as any}
      {...rest}
      className={cx("chakra-link", className)}
      __css={styles}
      as={NextLink}
    >
      {children}
    </chakra.a>
  );
});

export function NakedLink(props: PropsWithChildren<NextLinkProps>) {
  return <NextLink passHref legacyBehavior {...props} />;
}

export const NormalLink = ChakraLink;
