import { Box, Flex, List, ListItem, Stack, Text } from "@chakra-ui/core";
import { ExtendChakra } from "@parallel/chakra/utils";
import { Link, NakedLink, NormalLink } from "@parallel/components/common/Link";
import { Logo } from "@parallel/components/common/Logo";
import { useRouter } from "next/router";
import { FormattedMessage } from "react-intl";

export type RecipientViewFooterProps = ExtendChakra<{}>;

export function RecipientViewFooter(props: RecipientViewFooterProps) {
  const router = useRouter();
  const supportUrl = ({
    en: "https://support.parallel.so/hc/en-us",
    es: "https://support.parallel.so/hc/es",
  } as any)[router.query.locale as any];
  return (
    <Flex
      flexDirection="column"
      marginTop={12}
      as="footer"
      alignItems="center"
      {...props}
    >
      <Text as="div" fontSize="sm">
        <FormattedMessage
          id="recipient-view.powered-by"
          defaultMessage="Powered by {parallel}"
          values={{
            parallel: (
              <NakedLink href="/" passHref>
                <Box as="a" marginLeft="10px" position="relative" top="-1px">
                  <Logo display="inline-block" width="100px" />
                </Box>
              </NakedLink>
            ),
          }}
        />
      </Text>
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
            target="_blank"
            rel="noopener"
            href={`${supportUrl}/categories/360001331677-FAQ-Frequently-asked-questions`}
          >
            <FormattedMessage id="public.support.faq" defaultMessage="FAQ" />
          </NormalLink>
        </ListItem>
        <ListItem>
          <Link href="/security">
            <FormattedMessage
              id="recipient-view.security-link"
              defaultMessage="About security"
            />
          </Link>
        </ListItem>
        <ListItem>
          <Link href="/legal/[doc]" as="/legal/terms">
            <FormattedMessage
              id="public.terms.title"
              defaultMessage="Terms & Conditions"
            />
          </Link>
        </ListItem>
      </Stack>
    </Flex>
  );
}
