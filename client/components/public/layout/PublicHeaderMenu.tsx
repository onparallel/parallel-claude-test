import { Stack, StackProps } from "@chakra-ui/react";
import { Button } from "@parallel/components/ui";
import { Select } from "@parallel/chakra/components";
import { ArrowShortRightIcon } from "@parallel/chakra/icons";
import { useSupportedUserLocales } from "@parallel/utils/locales";
import { resolveUrl } from "@parallel/utils/next";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { ChangeEvent } from "react";
import { FormattedMessage, useIntl } from "react-intl";

export function PublicHeaderMenu(props: StackProps) {
  const router = useRouter();
  const intl = useIntl();

  function handleLangChange(event: ChangeEvent<HTMLSelectElement>) {
    const locale = event.target.value;
    router.push(resolveUrl(router.pathname, { ...router.query }), undefined, { locale });
  }

  const locales = useSupportedUserLocales();

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

      <Button as="a" fontWeight="normal" rightIcon={<ArrowShortRightIcon />} href="/">
        <FormattedMessage id="public.go-to-parallel" defaultMessage="Go to Parallel" />
      </Button>
      <Button as={NextLink} href="/login" variant="outline">
        <FormattedMessage id="public.login-button" defaultMessage="Login" />
      </Button>
    </Stack>
  );
}
