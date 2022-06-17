import { Button, ButtonProps, Select, Stack, StackProps } from "@chakra-ui/react";
import { ArrowShortRightIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { NakedLink } from "@parallel/components/common/Link";
import { resolveUrl } from "@parallel/utils/next";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import { useRouter } from "next/router";
import { ChangeEvent } from "react";
import { FormattedMessage, useIntl } from "react-intl";

export function PublicHeaderMenu(props: StackProps) {
  const router = useRouter();
  const intl = useIntl();
  function trackCTAClick() {
    window.analytics?.track("Register CTA Clicked", { from: "public-header" });
  }

  function handleLangChange(event: ChangeEvent<HTMLSelectElement>) {
    const locale = event.target.value;
    router.push(resolveUrl(router.pathname, { ...router.query }), undefined, { locale });
  }

  const locales = useSupportedLocales();

  return (
    <Stack {...props}>
      <Select
        size="md"
        width="auto"
        minWidth="120px"
        onChange={handleLangChange}
        value={router.locale}
        aria-label={intl.formatMessage({
          id: "public.footer.language-select-label",
          defaultMessage: "Change language",
        })}
      >
        {locales.map(({ label, key }) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </Select>

      <PublicHeaderLink
        fontWeight="normal"
        id="pw-public-login"
        rightIcon={<ArrowShortRightIcon />}
        href="/"
      >
        <FormattedMessage id="public.go-to-parallel" defaultMessage="Go to Parallel" />
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
        <FormattedMessage id="public.sign-up-button" defaultMessage="Sign up" />
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
