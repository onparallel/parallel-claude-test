import {
  chakra,
  Link as ChakraLink,
  LinkProps as ChakraLinkProps,
  HTMLChakraProps,
  omitThemingProps,
  ThemingProps,
  useStyleConfig,
} from "@chakra-ui/react";
import { chakraComponent } from "@parallel/chakra/utils";
import NextLink, { LinkProps as NextLinkProps } from "next/link";

const cx = (...classNames: any[]) => classNames.filter(Boolean).join(" ");

type Merge<P, T> = Omit<P, keyof T> & T;

export type LinkProps = Merge<
  HTMLChakraProps<"a"> & ThemingProps<"Link"> & ChakraLinkProps,
  Omit<NextLinkProps, "as" | "legacyBehavior" | "passHref">
>;

export const Link = chakraComponent<"a", LinkProps>(function Link({ ref, ...props }) {
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

export const NormalLink = ChakraLink;
