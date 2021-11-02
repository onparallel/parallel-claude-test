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
import { useRouter } from "next/router";
import { FormattedMessage } from "react-intl";
import { PublicHeaderLink } from "./PublicHeaderMenu";

export function PublicHeaderAccordionMenu(props: StackProps) {
  function trackCTAClick() {
    window.analytics?.track("Register CTA Clicked", { from: "public-header" });
  }

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
        <AccordionItem>
          <PublicHeaderAccordionButton urlPrefix="/product">
            <FormattedMessage id="public.product-link" defaultMessage="Product" />
          </PublicHeaderAccordionButton>
          <AccordionPanel>
            <Stack>
              <PublicHeaderAccordionInnerButton href="/product/request-information">
                <FormattedMessage
                  id="public.product.request-information-link"
                  defaultMessage="Request information"
                />
              </PublicHeaderAccordionInnerButton>
              <PublicHeaderAccordionInnerButton href="/product/monitor-progress">
                <FormattedMessage
                  id="public.product.monitor-link"
                  defaultMessage="Monitor progress"
                />
              </PublicHeaderAccordionInnerButton>
              <PublicHeaderAccordionInnerButton href="/product/review-files">
                <FormattedMessage
                  id="public.product.review-files-link"
                  defaultMessage="Review your files"
                />
              </PublicHeaderAccordionInnerButton>
              <PublicHeaderAccordionInnerButton href="/product/team-collaboration">
                <FormattedMessage
                  id="public.product.team-collaboration-link"
                  defaultMessage="Collaborate with your team"
                />
              </PublicHeaderAccordionInnerButton>
              <PublicHeaderAccordionInnerButton href="/security">
                <FormattedMessage
                  id="public.product.security-link"
                  defaultMessage="A secure environment"
                />
              </PublicHeaderAccordionInnerButton>
            </Stack>
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <PublicHeaderAccordionButton urlPrefix="/solutions">
            <FormattedMessage id="public.solutions-link" defaultMessage="Solutions" />
          </PublicHeaderAccordionButton>
          <AccordionPanel>
            <Stack>
              <PublicHeaderAccordionInnerButton href="/solutions/law-firms">
                <FormattedMessage id="public.solutions.law-firms-link" defaultMessage="Law firms" />
              </PublicHeaderAccordionInnerButton>
              <PublicHeaderAccordionInnerButton href="/solutions/consultancy">
                <FormattedMessage
                  id="public.solutions.consultancy-link"
                  defaultMessage="Consultancy"
                />
              </PublicHeaderAccordionInnerButton>
              <PublicHeaderAccordionInnerButton href="/solutions/accounting">
                <FormattedMessage
                  id="public.solutions.accounting-link"
                  defaultMessage="BPO and accounting"
                />
              </PublicHeaderAccordionInnerButton>
            </Stack>
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <PublicHeaderAccordionInnerButton href="/templates">
            <Text as="b" flex="1" textAlign="left">
              <FormattedMessage id="public.templates-link" defaultMessage="Templates" />
            </Text>
          </PublicHeaderAccordionInnerButton>
        </AccordionItem>

        <AccordionItem>
          <PublicHeaderAccordionInnerButton href="/pricing">
            <Text as="b" flex="1" textAlign="left">
              <FormattedMessage id="public.pricing-link" defaultMessage="Pricing" />
            </Text>
          </PublicHeaderAccordionInnerButton>
        </AccordionItem>
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
