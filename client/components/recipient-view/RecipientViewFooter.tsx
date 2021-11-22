import { FlexProps, Flex, List, ListItem, Stack } from "@chakra-ui/react";
import { Link, NakedLink, NormalLink } from "@parallel/components/common/Link";
import { Logo } from "@parallel/components/common/Logo";
import { useRouter } from "next/router";
import { FormattedMessage } from "react-intl";

export type RecipientViewFooterProps = FlexProps;

export function RecipientViewFooter(props: RecipientViewFooterProps) {
  const router = useRouter();
  const supportUrl = (
    {
      en: "https://support.onparallel.com/hc/en-us",
      es: "https://support.onparallel.com/hc/es",
    } as any
  )[router.locale!];
  return (
    <Flex flexDirection="column" marginTop={12} as="footer" alignItems="center" {...props}>
      <Flex fontSize="sm" alignItems="center">
        <FormattedMessage
          id="recipient-view.powered-by"
          defaultMessage="Powered by {parallel}"
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
            href={`${supportUrl}/categories/360001331677-FAQ-Frequently-asked-questions?utm_source=parallel&utm_medium=recipient_view&utm_campaign=recipients`}
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
