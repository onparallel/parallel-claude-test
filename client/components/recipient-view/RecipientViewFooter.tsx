import { Flex, FlexProps, List, ListItem, Stack } from "@chakra-ui/react";
import { Link, NakedLink, NormalLink } from "@parallel/components/common/Link";
import { Logo } from "@parallel/components/common/Logo";
import { FormattedMessage, useIntl } from "react-intl";

export type RecipientViewFooterProps = FlexProps;

export function RecipientViewFooter(props: RecipientViewFooterProps) {
  const intl = useIntl();
  return (
    <Flex flexDirection="column" marginTop={12} as="footer" alignItems="center" {...props}>
      <Flex fontSize="sm" alignItems="center">
        <FormattedMessage
          id="recipient-view.created-with"
          defaultMessage="Created with {parallel}"
          values={{
            parallel: (
              <NakedLink
                href="/?utm_source=parallel&utm_medium=recipient_view&utm_campaign=recipients"
                passHref
              >
                <Flex as="a" marginLeft={2.5}>
                  <Logo display="inline-block" width="100px" />
                </Flex>
              </NakedLink>
            ),
          }}
        />
      </Flex>
      <Stack
        as={List}
        textAlign="center"
        marginTop={4}
        marginBottom={8}
        direction={{ base: "column", sm: "row" }}
        spacing={{ base: 4, sm: 8 }}
      >
        <ListItem>
          <NormalLink
            href={`https://help.onparallel.com/${intl.locale}/collections/3391072?utm_source=parallel&utm_medium=recipient_view&utm_campaign=recipients`}
            isExternal
          >
            <FormattedMessage id="public.support.faq" defaultMessage="FAQ" />
          </NormalLink>
        </ListItem>
        <ListItem>
          <Link
            href="/security?utm_source=parallel&utm_medium=recipient_view&utm_campaign=recipients"
            target="_blank"
          >
            <FormattedMessage id="recipient-view.security-link" defaultMessage="About security" />
          </Link>
        </ListItem>
        <ListItem>
          <Link
            href="/legal/terms?utm_source=parallel&utm_medium=recipient_view&utm_campaign=recipients"
            target="_blank"
          >
            <FormattedMessage id="public.terms.title" defaultMessage="Terms & Conditions" />
          </Link>
        </ListItem>
      </Stack>
    </Flex>
  );
}
