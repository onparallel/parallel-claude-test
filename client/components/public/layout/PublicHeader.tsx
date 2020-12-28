import {
  Box,
  BoxProps,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Stack,
  StackProps,
  useDisclosure,
} from "@chakra-ui/react";
import { BurgerButton } from "@parallel/components/common/BurgerButton";
import { NakedLink } from "@parallel/components/common/Link";
import { Logo } from "@parallel/components/common/Logo";
import { Spacer } from "@parallel/components/common/Spacer";
import { useWindowScroll } from "beautiful-react-hooks";
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
        boxShadow: isThin
          ? "md"
          : isOpen
          ? { base: "md", [bp]: "none" }
          : "none",
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
          padding={{ base: 0, [bp]: 2 }}
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

function PublicHeaderMenu(props: StackProps) {
  return (
    <Stack {...props}>
      <Menu placement="bottom">
        <MenuButton as={Button} variant="ghost">
          <FormattedMessage id="public.product-link" defaultMessage="Product" />
        </MenuButton>
        <Portal>
          <MenuList>
            <NakedLink href="/product/request">
              <MenuItem as="a">
                <FormattedMessage
                  id="public.request-link"
                  defaultMessage="Request"
                />
              </MenuItem>
            </NakedLink>
            <NakedLink href="/product/follow">
              <MenuItem as="a">
                <FormattedMessage
                  id="public.follow-link"
                  defaultMessage="Follow"
                />
              </MenuItem>
            </NakedLink>
            <NakedLink href="/product/review">
              <MenuItem as="a">
                <FormattedMessage
                  id="public.review-link"
                  defaultMessage="Review"
                />
              </MenuItem>
            </NakedLink>
            <NakedLink href="/product/collaborate">
              <MenuItem as="a">
                <FormattedMessage
                  id="public.collaborate-link"
                  defaultMessage="Collaborate"
                />
              </MenuItem>
            </NakedLink>
            <NakedLink href="/security">
              <MenuItem as="a">
                <FormattedMessage
                  id="public.security-link"
                  defaultMessage="Security"
                />
              </MenuItem>
            </NakedLink>
          </MenuList>
        </Portal>
      </Menu>
      <Menu placement="bottom">
        <MenuButton as={Button} variant="ghost">
          <FormattedMessage
            id="public.persons-link"
            defaultMessage="For whom"
          />
        </MenuButton>
        <Portal>
          <MenuList>
            <NakedLink href="/for-whom/people">
              <MenuItem as="a">
                <FormattedMessage
                  id="public.for-whom.freelance"
                  defaultMessage="Freelancers"
                />
              </MenuItem>
            </NakedLink>
            <NakedLink href="/for-whom/legal-industry">
              <MenuItem as="a">
                <FormattedMessage
                  id="public.for-whom.legal"
                  defaultMessage="Legal"
                />
              </MenuItem>
            </NakedLink>
            <NakedLink href="/for-whom/services">
              <MenuItem as="a">
                <FormattedMessage
                  id="public.for-whom.services"
                  defaultMessage="Professional Services"
                />
              </MenuItem>
            </NakedLink>
          </MenuList>
        </Portal>
      </Menu>
      <NakedLink href="/about">
        <Button as="a" variant="ghost">
          <FormattedMessage id="public.about-link" defaultMessage="About" />
        </Button>
      </NakedLink>
      <Button as="a" variant="ghost" href="/blog">
        <FormattedMessage id="public.blog-link" defaultMessage="Blog" />
      </Button>
      <NakedLink href="/login">
        <Button as="a" variant="outline" id="pw-public-login">
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
