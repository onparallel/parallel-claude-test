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
import { usePublicMenu } from "@parallel/utils/usePublicMenu";
import { useRouter } from "next/router";
import { FormattedMessage } from "react-intl";

export function PublicHeaderMenu(props: StackProps) {
  function trackCTAClick() {
    window.analytics?.track("Register CTA Clicked", { from: "public-header" });
  }

  const menu = usePublicMenu();

  return (
    <Stack {...props}>
      {menu.map((parent) => {
        if (parent.children !== null) {
          return (
            <Flex key={parent.path}>
              <Menu placement="bottom" matchWidth={true}>
                <PublicHeaderMenuButton flex="1" variant="ghost" urlPrefix={parent.path}>
                  {parent.title}
                </PublicHeaderMenuButton>
                <Portal>
                  <MenuList>
                    {parent.children.map((children) => (
                      <PublicHeaderMenuItemLink key={children.path} href={children.path}>
                        {children.title}
                      </PublicHeaderMenuItemLink>
                    ))}
                  </MenuList>
                </Portal>
              </Menu>
            </Flex>
          );
        } else {
          return (
            <PublicHeaderLink key={parent.path} href={parent.path} variant="ghost">
              {parent.title}
            </PublicHeaderLink>
          );
        }
      })}
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
