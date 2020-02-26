/** @jsx jsx */
import {
  Box,
  BoxProps,
  Button,
  Flex,
  useColorMode,
  LinkProps as ChakraLinkProps
} from "@chakra-ui/core";
import { css, jsx } from "@emotion/core";
import { FormattedMessage } from "react-intl";
import { PublicContainer } from "./PublicContainer";
import { Logo } from "@parallel/components/common/Logo";
import { Link } from "@parallel/components/common/Link";
import { ToggleColorModeButton } from "@parallel/components/common/ToggleColorModeButton";
import { Spacer } from "@parallel/components/common/Spacer";

function logoColorProps(colorMode: string) {
  const theme: { [colorMode: string]: ChakraLinkProps } = {
    light: {
      color: "gray.700",
      _hover: {
        color: "gray.800"
      },
      _focus: {
        color: "gray.800"
      },
      _active: {
        color: "gray.900"
      }
    },
    dark: {
      color: "purple.50",
      _hover: {
        color: "purple.100"
      },
      _focus: {
        color: "purple.100"
      },
      _active: {
        color: "purple.200"
      }
    }
  };
  return theme[colorMode];
}

export function PublicHeader(props: BoxProps) {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <PublicContainer
      wrapper={{
        as: "header",
        backgroundColor: colorMode === "light" ? "gray.50" : "gray.800",
        height: 20,
        ...props
      }}
      display="flex"
      alignItems="center"
    >
      <Link href="/" chakra={{ ...logoColorProps(colorMode) }}>
        <Logo width={152}></Logo>
      </Link>
      <Spacer />
      {/* <ToggleColorModeButton
          css={css`
            display: none;
            @media (prefers-color-scheme: dark) {
              display: inline-flex;
            }
          `}
          marginRight={2}
        ></ToggleColorModeButton> */}
      <Link
        href="/login"
        render={children => (
          <Button as="a" variantColor="purple">
            {children}
          </Button>
        )}
      >
        <FormattedMessage
          id="public.login-button"
          defaultMessage="Login"
        ></FormattedMessage>
      </Link>
    </PublicContainer>
  );
}
