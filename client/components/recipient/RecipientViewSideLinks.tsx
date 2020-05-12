import { List, ListItem, BoxProps, Box } from "@chakra-ui/core";
import { Link, NormalLink } from "@parallel/components/common/Link";
import { FormattedMessage } from "react-intl";
import { useRouter } from "next/router";

export default function RecipientViewSideLinks(
  props: Omit<BoxProps, "children">
) {
  const router = useRouter();
  const supportUrl = ({
    en: "https://support.parallel.so/hc/en-us",
    es: "https://support.parallel.so/hc/es",
  } as any)[router.query.locale as any];
  return (
    <Box padding={4} {...props}>
      <List>
        <ListItem>
          <NormalLink
            href={`${supportUrl}/categories/360001331677-FAQ-Frequently-asked-questions`}
          >
            <FormattedMessage id="public.support.faq" defaultMessage="FAQ" />
          </NormalLink>
        </ListItem>
        <ListItem>
          <Link href="/security">
            <FormattedMessage
              id="sendout.security-link"
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
      </List>
    </Box>
  );
}
