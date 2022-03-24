import { List, ListItem, Text } from "@chakra-ui/react";
import { useSetLocale } from "@parallel/components/common/I18nProvider";
import { NormalLink } from "@parallel/components/common/Link";
import { ErrorPage } from "@parallel/components/public/ErrorPage";
import languages from "@parallel/lang/languages.json";
import NextLink from "next/link";
import { useEffect } from "react";
import { FormattedMessage, useIntl } from "react-intl";

export default function Custom404() {
  const setLocale = useSetLocale();
  const intl = useIntl();

  useEffect(() => {
    const match = document.location.pathname.match(/^\/([a-z-]*)\//i);
    const locale = match?.[1]?.toLowerCase();
    if (locale && languages.some((l) => l.locale === locale) && locale !== "en") {
      setLocale(locale);
    }
  }, []);
  return (
    <ErrorPage
      header={
        <FormattedMessage
          id="error.404.header"
          defaultMessage="We can't seem to find the page you're looking for."
        />
      }
      imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/undraw_void.svg`}
    >
      <Text>
        <FormattedMessage
          id="error.404.helpful-links"
          defaultMessage="Here are some helpful links instead:"
        />
      </Text>
      <List>
        <ListItem>
          <NextLink href="/" passHref>
            <NormalLink>
              <FormattedMessage id="public.home-link" defaultMessage="Home" />
            </NormalLink>
          </NextLink>
        </ListItem>
        <ListItem>
          <NormalLink href={`https://help.onparallel.com/${intl.locale}`}>
            <FormattedMessage id="public.support.support-center" defaultMessage="Support center" />
          </NormalLink>
        </ListItem>
        <ListItem>
          <NormalLink href={`https://help.onparallel.com/${intl.locale}/collections/3391072`}>
            <FormattedMessage id="public.support.faq" defaultMessage="FAQ" />
          </NormalLink>
        </ListItem>
      </List>
    </ErrorPage>
  );
}
