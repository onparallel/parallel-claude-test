import {
  BoxProps,
  Button,
  Collapse,
  Flex,
  LinkProps as ChakraLinkProps,
  Stack,
  StackProps,
  useDisclosure,
} from "@chakra-ui/core";
import { BurgerButton } from "@parallel/components/common/BurgerButton";
import { Link, NakedLink } from "@parallel/components/common/Link";
import { Logo } from "@parallel/components/common/Logo";
import { Spacer } from "@parallel/components/common/Spacer";
import { FormattedMessage } from "react-intl";
import { PublicContainer } from "./PublicContainer";

function logoColorProps(colorMode: string) {
  const theme: { [colorMode: string]: ChakraLinkProps } = {
    light: {
      color: "gray.700",
      _hover: {
        color: "gray.800",
      },
      _focus: {
        color: "gray.800",
      },
      _active: {
        color: "gray.900",
      },
    },
    dark: {
      color: "purple.50",
      _hover: {
        color: "purple.100",
      },
      _focus: {
        color: "purple.100",
      },
      _active: {
        color: "purple.200",
      },
    },
  };
  return theme[colorMode];
}

export type PublicHeaderProps = BoxProps & {
  isThin?: boolean;
};

export function PublicHeader({ isThin, ...props }: PublicHeaderProps) {
  const { isOpen, onToggle } = useDisclosure();
  const breakpoint = "lg" as const;

  return (
    <PublicContainer
      wrapper={{
        as: "header",
        backgroundColor: "white",
        shadow: isThin || isOpen ? "md" : "none",
        ...props,
      }}
    >
      <Flex
        alignItems="center"
        minHeight={isThin ? 16 : 20}
        transition="min-height 300ms"
      >
        <Link href="/" {...logoColorProps("light")}>
          <Logo width={152} />
        </Link>
        <Spacer />
        <PublicHeaderMenu
          direction="row"
          alignItems="center"
          spacing={4}
          display={{ base: "none", [breakpoint]: "flex" }}
        />
        <BurgerButton
          isOpen={isOpen}
          display={{ base: "block", [breakpoint]: "none" }}
          onClick={onToggle}
        />
      </Flex>
      <Collapse
        isOpen={isOpen}
        display={{ base: "block", [breakpoint]: "none" }}
      >
        <PublicHeaderMenu direction="column" spacing={2} paddingBottom={4} />
      </Collapse>
    </PublicContainer>
  );
}

function PublicHeaderMenu(props: StackProps) {
  return (
    <Stack {...props}>
      <Flex>
        <NakedLink href="/security">
          <Button flex="1" as="a" variant="ghost">
            <FormattedMessage
              id="public.security-link"
              defaultMessage="Security"
            />
          </Button>
        </NakedLink>
      </Flex>
      <Flex>
        <NakedLink href="/people">
          <Button flex="1" as="a" variant="ghost">
            <FormattedMessage
              id="public.persons-link"
              defaultMessage="For whom"
            />
          </Button>
        </NakedLink>
      </Flex>
      <Flex>
        <NakedLink href="/about">
          <Button flex="1" as="a" variant="ghost">
            <FormattedMessage id="public.about-link" defaultMessage="About" />
          </Button>
        </NakedLink>
      </Flex>
      <Button as="a" variant="ghost" {...{ href: "/blog" }}>
        <FormattedMessage id="public.blog-link" defaultMessage="Blog" />
      </Button>
      <Flex>
        <NakedLink href="/login">
          <Button as="a" flex="1" variant="outline">
            <FormattedMessage id="public.login-button" defaultMessage="Login" />
          </Button>
        </NakedLink>
      </Flex>
      <Flex>
        <NakedLink href="/invite">
          <Button flex="1" as="a" variantColor="purple">
            <FormattedMessage
              id="public.invite-button"
              defaultMessage="Request an invite"
            />
          </Button>
        </NakedLink>
      </Flex>
    </Stack>
  );
}
