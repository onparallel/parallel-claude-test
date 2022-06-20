import { Button, Select, Stack, StackProps } from "@chakra-ui/react";
import { ArrowShortRightIcon } from "@parallel/chakra/icons";
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

      <Button
        as="a"
        fontWeight="normal"
        id="pw-public-login"
        rightIcon={<ArrowShortRightIcon />}
        href="/"
      >
        <FormattedMessage id="public.go-to-parallel" defaultMessage="Go to Parallel" />
      </Button>
      <NakedLink href="/login">
        <Button as="a" variant="outline" id="pw-public-login">
          <FormattedMessage id="public.login-button" defaultMessage="Login" />
        </Button>
      </NakedLink>
      <NakedLink href="/signup">
        <Button as="a" colorScheme="purple" onClick={trackCTAClick}>
          <FormattedMessage id="public.sign-up-button" defaultMessage="Sign up" />
        </Button>
      </NakedLink>
    </Stack>
  );
}
