import { List, ListItem, Text } from "@chakra-ui/react";
import { NormalLink } from "@parallel/components/common/Link";
import { ErrorPage } from "@parallel/components/public/ErrorPage";
import { FormattedMessage, useIntl } from "react-intl";

export default function Custom404() {
  const intl = useIntl();

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
          <NormalLink href="/">
            <FormattedMessage id="public.home-link" defaultMessage="Home" />
          </NormalLink>
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
