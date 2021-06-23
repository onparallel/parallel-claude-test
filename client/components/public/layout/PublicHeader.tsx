import {
  Box,
  BoxProps,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuItemProps,
  MenuList,
  Portal,
  Stack,
  StackProps,
  useDisclosure,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { BurgerButton } from "@parallel/components/common/BurgerButton";
import { NakedLink } from "@parallel/components/common/Link";
import { Logo } from "@parallel/components/common/Logo";
import { Spacer } from "@parallel/components/common/Spacer";
import { useWindowScroll } from "beautiful-react-hooks";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { PublicContainer } from "./PublicContainer";

export function PublicHeader(props: BoxProps) {
  const [isThin, setIsThin] = useState(false);
  useWindowScroll(checkWindowScroll);
  useEffect(checkWindowScroll, []);

  const { isOpen, onToggle } = useDisclosure();
  const bp = "lg" as const;

  function checkWindowScroll() {
    setIsThin(window.scrollY > 20);
  }
  return (
    <PublicContainer
      wrapper={{
        as: "header",
        backgroundColor: "white",
        boxShadow: "md",
        ...props,
      }}
    >
      <Flex
        direction={{ base: "column", [bp]: "row" }}
        alignItems={{ base: "stretch", [bp]: "center" }}
      >
        <Flex
          alignSelf="stretch"
          alignItems="center"
          flex="1"
          minHeight={{ base: 16, [bp]: isThin ? 16 : 20 }}
          transition="min-height 300ms"
        >
          <NakedLink href="/">
            <Box
              as="a"
              color="gray.700"
              _hover={{ color: "gray.800" }}
              _focus={{ color: "gray.800" }}
              _active={{ color: "gray.900" }}
            >
              <Logo width="152px" />
            </Box>
          </NakedLink>
          <Spacer />
          <BurgerButton
            isOpen={isOpen}
            display={{ base: "block", [bp]: "none" }}
            onClick={onToggle}
          />
        </Flex>
        <Box
          height={{ base: isOpen ? "auto" : 0, [bp]: "auto" }}
          opacity={{ base: isOpen ? 1 : 0, [bp]: 1 }}
          overflow="hidden"
          transition="opacity 500ms"
          padding={{ base: 1, [bp]: 2 }}
          margin={{ base: -1, [bp]: 0 }}
          paddingBottom={{ base: isOpen ? 4 : 2, [bp]: 2 }}
        >
          <PublicHeaderMenu
            direction={{ base: "column", [bp]: "row" }}
            spacing={{ base: 2, [bp]: 4 }}
            alignItems={{ base: "stretch", [bp]: "center" }}
          />
        </Box>
      </Flex>
    </PublicContainer>
  );
}

interface MenuItemLinkProps extends MenuItemProps {
  href: string;
}

const MenuItemLink = chakraForwardRef<"a", MenuItemLinkProps>(
  function MenuItemLink({ href, ...props }, ref) {
    const router = useRouter();
    const current = router.pathname.startsWith("/[locale]")
      ? router.asPath.replace(/^\/[^\/]+/, "")
      : router.asPath;
    return (
      <NakedLink href={href}>
        <MenuItem
          as="a"
          ref={ref as any}
          {...(current === href
            ? {
                fontWeight: "bold",
                color: "purple.600",
              }
            : {})}
          {...props}
        />
      </NakedLink>
    );
  }
);

function PublicHeaderMenu(props: StackProps) {
  const router = useRouter();
  const current = router.pathname.startsWith("/[locale]")
    ? router.asPath.replace(/^\/[^\/]+/, "")
    : router.asPath;

  return (
    <Stack {...props}>
      <Menu placement="bottom">
        <MenuButton
          as={Button}
          variant="ghost"
          rightIcon={<ChevronDownIcon />}
          {...(current.includes("/product/")
            ? {
                fontWeight: "bold",
                color: "purple.500",
              }
            : {})}
          sx={{
            "svg g": {
              strokeWidth: "3.2",
            },
          }}
        >
          <FormattedMessage id="public.product-link" defaultMessage="Product" />
        </MenuButton>
        <Portal>
          <MenuList>
            <MenuItemLink href="/product/request-information">
              <FormattedMessage
                id="public.product.request-information-link"
                defaultMessage="Request information"
              />
            </MenuItemLink>
            <MenuItemLink href="/product/monitor-progress">
              <FormattedMessage
                id="public.product.monitor-link"
                defaultMessage="Monitor progress"
              />
            </MenuItemLink>
            <MenuItemLink href="/product/review-files">
              <FormattedMessage
                id="public.product.review-files-link"
                defaultMessage="Review your files"
              />
            </MenuItemLink>
            <MenuItemLink href="/product/team-collaboration">
              <FormattedMessage
                id="public.product.team-collaboration-link"
                defaultMessage="Collaborate with your team"
              />
            </MenuItemLink>
            <MenuItemLink href="/security">
              <FormattedMessage
                id="public.product.security-link"
                defaultMessage="A secure environment"
              />
            </MenuItemLink>
          </MenuList>
        </Portal>
      </Menu>
      <Menu placement="bottom">
        <MenuButton
          as={Button}
          variant="ghost"
          rightIcon={<ChevronDownIcon />}
          {...(current.includes("/solutions/")
            ? {
                fontWeight: "bold",
                color: "purple.600",
              }
            : {})}
          sx={{
            "svg g": {
              strokeWidth: "3.2",
            },
          }}
        >
          <FormattedMessage
            id="public.solutions-link"
            defaultMessage="Solutions"
          />
        </MenuButton>
        <Portal>
          <MenuList>
            <MenuItemLink href="/solutions/law-firms">
              <FormattedMessage
                id="public.solutions.law-firms-link"
                defaultMessage="Law firms"
              />
            </MenuItemLink>
            <MenuItemLink href="/solutions/accountants">
              <FormattedMessage
                id="public.solutions.accountants-link"
                defaultMessage="Accountants"
              />
            </MenuItemLink>
          </MenuList>
        </Portal>
      </Menu>
      <NakedLink href="/about">
        <Button
          as="a"
          variant="ghost"
          {...(current.includes("/about")
            ? {
                fontWeight: "bold",
                color: "purple.500",
              }
            : {})}
        >
          <FormattedMessage id="public.about-link" defaultMessage="About" />
        </Button>
      </NakedLink>
      <Button as="a" variant="ghost" href="/blog">
        <FormattedMessage id="public.blog-link" defaultMessage="Blog" />
      </Button>
      <NakedLink href="/login">
        <Button
          as="a"
          variant="outline"
          id="pw-public-login"
          {...(current.includes("/login")
            ? {
                fontWeight: "bold",
                color: "purple.500",
              }
            : {})}
        >
          <FormattedMessage id="public.login-button" defaultMessage="Login" />
        </Button>
      </NakedLink>
      <NakedLink href="/book-demo">
        <Button as="a" colorScheme="purple">
          <FormattedMessage
            id="public.book-demo-button"
            defaultMessage="Book a demo"
          />
        </Button>
      </NakedLink>
    </Stack>
  );
}
