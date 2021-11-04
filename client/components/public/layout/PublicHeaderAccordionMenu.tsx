import {
  Accordion,
  AccordionButton,
  AccordionButtonProps,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Button,
  ButtonProps,
  Stack,
  StackProps,
  Text,
} from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { NakedLink } from "@parallel/components/common/Link";
import { usePublicMenu } from "@parallel/utils/usePublicMenu";
import { useRouter } from "next/router";
import { FormattedMessage } from "react-intl";
import { PublicHeaderLink } from "./PublicHeaderMenu";

export function PublicHeaderAccordionMenu(props: StackProps) {
  function trackCTAClick() {
    window.analytics?.track("Register CTA Clicked", { from: "public-header" });
  }

  const menu = usePublicMenu();

  return (
    <Stack {...props}>
      <Accordion
        allowToggle
        display="flex"
        flexDirection="column"
        gridGap={2}
        borderColor="transparent"
        sx={{
          "a, button": {
            paddingX: 2,
            rounded: "md",
            justifyContent: "flex-start",
            fontWeight: "normal",
            backgroundColor: "transparent",
            _hover: {
              color: "gray.500",
              backgroundColor: "transparent",
              _activeLink: {
                color: "purple.600",
              },
            },
          },
        }}
      >
        {menu.map((parent) => {
          if (parent.children !== null) {
            return (
              <AccordionItem key={parent.path}>
                <PublicHeaderAccordionButton urlPrefix={parent.path}>
                  {parent.title}
                </PublicHeaderAccordionButton>
                <AccordionPanel>
                  <Stack>
                    {parent.children.map((children) => (
                      <PublicHeaderAccordionInnerButton key={children.path} href={children.path}>
                        {children.title}
                      </PublicHeaderAccordionInnerButton>
                    ))}
                  </Stack>
                </AccordionPanel>
              </AccordionItem>
            );
          } else {
            return (
              <AccordionItem key={parent.path}>
                <PublicHeaderAccordionInnerButton href={parent.path}>
                  <Text as="b" flex="1" textAlign="left">
                    {parent.title}
                  </Text>
                </PublicHeaderAccordionInnerButton>
              </AccordionItem>
            );
          }
        })}
      </Accordion>
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

interface PublicHeaderAccordionInnerButton extends ButtonProps {
  href: string;
}

export const PublicHeaderAccordionInnerButton = chakraForwardRef<
  "button",
  PublicHeaderAccordionInnerButton
>(function AccordionButtonLink({ href, ...props }, ref) {
  const router = useRouter();
  const isCurrent = router.pathname === href || router.pathname.startsWith(`${href}/`);
  return (
    <NakedLink href={href}>
      <Button
        as="a"
        width="100%"
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
});

interface PublicHeaderAccordionButton extends AccordionButtonProps, ButtonProps {
  urlPrefix: string;
}

export const PublicHeaderAccordionButton = chakraForwardRef<"button", PublicHeaderAccordionButton>(
  function AccordionButtonHighlight({ urlPrefix, children, ...props }, ref) {
    const router = useRouter();
    const isCurrent = router.pathname === urlPrefix || router.pathname.startsWith(`${urlPrefix}/`);
    return (
      <AccordionButton
        ref={ref as any}
        as={Button}
        aria-current={isCurrent ? "page" : undefined}
        _activeLink={{ color: "purple.600" }}
        {...props}
      >
        <Text as="b" flex="1" textAlign="left">
          {children}
        </Text>
        <AccordionIcon boxSize={6} />
      </AccordionButton>
    );
  }
);
