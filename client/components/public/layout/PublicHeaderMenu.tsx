import {
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
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { NakedLink } from "@parallel/components/common/Link";
import { useRouter } from "next/router";
import { FormattedMessage } from "react-intl";

export function PublicHeaderMenu(props: StackProps) {
  function trackCTAClick() {
    window.analytics?.track("Register CTA Clicked", { from: "public-header" });
  }

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
              <PublicHeaderMenuItemLink href="/solutions/real-estate">
                <FormattedMessage
                  id="public.solutions.real-estate-link"
                  defaultMessage="Real Estate"
                />
              </PublicHeaderMenuItemLink>
            </MenuList>
          </Portal>
        </Menu>
      </Flex>
      <PublicHeaderLink href="/templates" variant="ghost">
        <FormattedMessage id="public.templates-link" defaultMessage="Templates" />
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
