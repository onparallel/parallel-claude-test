import {
  Box,
  BoxProps,
  Button,
  ButtonProps,
  Flex,
  Menu,
  MenuButton,
  MenuButtonProps,
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
        boxShadow: "short",
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

function trackCTAClick() {
  window.analytics?.track("Register CTA Clicked", { from: "public-header" });
}

function PublicHeaderMenu(props: StackProps) {
  return (
    <Stack {...props}>
      <Flex>
        <Menu placement="bottom" matchWidth={true}>
          <PublicHeaderMenuButton flex="1" variant="ghost" urlPrefix="/product">
            <FormattedMessage id="public.product-link" defaultMessage="Product" />
          </PublicHeaderMenuButton>
          <Portal>
            <MenuList>
              <PublicHeaderMenuItemLink href="/product/request-information">
                <FormattedMessage
                  id="public.product.request-information-link"
                  defaultMessage="Request information"
                />
              </PublicHeaderMenuItemLink>
              <PublicHeaderMenuItemLink href="/product/monitor-progress">
                <FormattedMessage
                  id="public.product.monitor-link"
                  defaultMessage="Monitor progress"
                />
              </PublicHeaderMenuItemLink>
              <PublicHeaderMenuItemLink href="/product/review-files">
                <FormattedMessage
                  id="public.product.review-files-link"
                  defaultMessage="Review your files"
                />
              </PublicHeaderMenuItemLink>
              <PublicHeaderMenuItemLink href="/product/team-collaboration">
                <FormattedMessage
                  id="public.product.team-collaboration-link"
                  defaultMessage="Collaborate with your team"
                />
              </PublicHeaderMenuItemLink>
              <PublicHeaderMenuItemLink href="/security">
                <FormattedMessage
                  id="public.product.security-link"
                  defaultMessage="A secure environment"
                />
              </PublicHeaderMenuItemLink>
            </MenuList>
          </Portal>
        </Menu>
      </Flex>
      <Flex>
        <Menu placement="bottom" matchWidth={true}>
          <PublicHeaderMenuButton flex="1" variant="ghost" urlPrefix="/solutions">
            <FormattedMessage id="public.solutions-link" defaultMessage="Solutions" />
          </PublicHeaderMenuButton>
          <Portal>
            <MenuList>
              <PublicHeaderMenuItemLink href="/solutions/law-firms">
                <FormattedMessage id="public.solutions.law-firms-link" defaultMessage="Law firms" />
              </PublicHeaderMenuItemLink>
              <PublicHeaderMenuItemLink href="/solutions/consultancy">
                <FormattedMessage
                  id="public.solutions.consultancy-link"
                  defaultMessage="Consultancy"
                />
              </PublicHeaderMenuItemLink>
              <PublicHeaderMenuItemLink href="/solutions/accounting">
                <FormattedMessage
                  id="public.solutions.accounting-link"
                  defaultMessage="BPO and accounting"
                />
              </PublicHeaderMenuItemLink>
            </MenuList>
          </Portal>
        </Menu>
      </Flex>
      <PublicHeaderLink href="/templates" variant="ghost">
        <FormattedMessage id="public.templates-link" defaultMessage="Templates" />
      </PublicHeaderLink>
      <PublicHeaderLink href="/about" variant="ghost">
        <FormattedMessage id="public.about-link" defaultMessage="About" />
      </PublicHeaderLink>
      <PublicHeaderLink href="/pricing" variant="ghost">
        <FormattedMessage id="public.pricing-link" defaultMessage="Pricing" />
      </PublicHeaderLink>
      <PublicHeaderLink href="/login" variant="outline" id="pw-public-login">
        <FormattedMessage id="public.login-button" defaultMessage="Login" />
      </PublicHeaderLink>
      <PublicHeaderLink
        href="/signup"
        colorScheme="purple"
        _activeLink={{}}
        onClick={trackCTAClick}
      >
        <FormattedMessage id="public.try-for-free-button" defaultMessage="Try for free" />
      </PublicHeaderLink>
    </Stack>
  );
}

interface PublicHeaderLink extends ButtonProps {
  href: string;
}

export const PublicHeaderLink = chakraForwardRef<"a", PublicHeaderLink>(function PublicHeaderLink(
  { href, children, ...props },
  ref
) {
  const router = useRouter();
  const isCurrent = router.pathname === href || router.pathname.startsWith(`${href}/`);
  return (
    <NakedLink href={href}>
      <Button
        ref={ref as any}
        as="a"
        aria-current={isCurrent ? "page" : undefined}
        _activeLink={{ color: "purple.500" }}
        {...props}
      >
        {children}
      </Button>
    </NakedLink>
  );
});

interface PublicHeaderMenuItemLinkProps extends MenuItemProps {
  href: string;
}

export const PublicHeaderMenuItemLink = chakraForwardRef<"a", PublicHeaderMenuItemLinkProps>(
  function MenuItemLink({ href, ...props }, ref) {
    const router = useRouter();
    const isCurrent = router.pathname === href || router.pathname.startsWith(`${href}/`);
    return (
      <NakedLink href={href}>
        <MenuItem
          as="a"
          ref={ref as any}
          aria-current={isCurrent ? "page" : undefined}
          _activeLink={{
            fontWeight: "bold",
            color: "purple.600",
          }}
          {...props}
        />
      </NakedLink>
    );
  }
);
interface PublicHeaderMenuButton extends MenuButtonProps, ButtonProps {
  urlPrefix: string;
}

export const PublicHeaderMenuButton = chakraForwardRef<"button", PublicHeaderMenuButton>(
  function MenuButtonHighlight({ urlPrefix, children, ...props }, ref) {
    const router = useRouter();
    const isCurrent = router.pathname === urlPrefix || router.pathname.startsWith(`${urlPrefix}/`);
    return (
      <MenuButton
        ref={ref as any}
        as={Button}
        rightIcon={
          <ChevronDownIcon
            sx={{
              g: { strokeWidth: "3.2" },
            }}
          />
        }
        aria-current={isCurrent ? "page" : undefined}
        _activeLink={{ color: "purple.600" }}
        {...props}
      >
        {children}
      </MenuButton>
    );
  }
);
