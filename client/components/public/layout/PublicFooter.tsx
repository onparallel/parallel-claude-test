import {
  Flex,
  IconButton,
  List,
  ListItem,
  Text,
  BoxProps,
  Select,
  InputLeftElement,
  InputGroup,
  Icon,
  useColorMode
} from "@chakra-ui/core";
import { FormattedMessage, useIntl } from "react-intl";
import { PublicContainer } from "./PublicContainer";
import { PublicFooterBox } from "./PublicFooterBox";
import { useRouter } from "next/router";
import { ChangeEvent } from "react";
import languages from "@parallel/lang/languages.json";
import { resolveUrl } from "@parallel/utils/next";
import { Link } from "@parallel/components/common/Link";

export function PublicFooter(props: BoxProps) {
  const { colorMode } = useColorMode();
  const router = useRouter();
  const intl = useIntl();

  function handleLangChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    router.push(
      router.pathname,
      resolveUrl(router.pathname, {
        ...router.query,
        locale: value
      })
    );
  }

  return (
    <PublicContainer wrapper={{ as: "footer", ...props }}>
      <Flex justify="space-between" align="stretch" height="100%" wrap="wrap">
        <PublicFooterBox flex="3" minWidth={{ base: "100%", md: 40 }}>
          <Text fontSize="xs">© 2020 Parallel Solutions, S.L.</Text>
          <InputGroup size="sm" display="inline-flex">
            <InputLeftElement
              children={
                <Icon
                  name={"language" as any}
                  color={colorMode === "light" ? "purple.600" : "purple.200"}
                  aria-hidden="true"
                />
              }
            />
            <Select
              variant="flushed"
              paddingLeft={6}
              onChange={handleLangChange}
              value={router.query.locale}
              aria-label={intl.formatMessage({
                id: "public.footer.language-select-label",
                defaultMessage: "Change language"
              })}
            >
              {languages.map(({ locale, text }) => (
                <option key={locale} value={locale}>
                  {text}
                </option>
              ))}
            </Select>
          </InputGroup>
        </PublicFooterBox>
        <PublicFooterBox
          flex="1"
          minWidth={{ base: "100%", md: 40 }}
          marginTop={{ base: 4, md: 0 }}
          heading={intl.formatMessage({
            id: "public.footer.follow-us",
            defaultMessage: "Follow us"
          })}
        >
          <IconButton
            as={"a" as any}
            {...{
              href: "https://twitter.com/Parallel_SO",
              target: "_blank"
            }}
            icon={"twitter" as any}
            isRound
            variantColor="purple"
            aria-label={intl.formatMessage({
              id: "public.footer.twitter-profile",
              defaultMessage: "Twitter profile"
            })}
          ></IconButton>
          <IconButton
            as={"a" as any}
            {...{
              href: "https://www.linkedin.com/company/parallel-so/",
              target: "_blank"
            }}
            icon={"linkedin" as any}
            isRound
            variantColor="purple"
            marginLeft={2}
            aria-label={intl.formatMessage({
              id: "public.footer.linkedin-profile",
              defaultMessage: "LinkedIn profile"
            })}
          ></IconButton>
        </PublicFooterBox>
        <PublicFooterBox
          flex="1"
          minWidth={{ base: "100%", md: 40 }}
          marginTop={{ base: 4, md: 0 }}
          heading={intl.formatMessage({
            id: "public.footer.legal-information",
            defaultMessage: "Legal information"
          })}
        >
          <List>
            <ListItem>
              <Link href="/legal/[doc]" as="/legal/terms">
                <FormattedMessage
                  id="public.terms.title"
                  defaultMessage="Terms & Conditions"
                ></FormattedMessage>
              </Link>
            </ListItem>
            <ListItem>
              <Link href="/legal/[doc]" as="/legal/privacy">
                <FormattedMessage
                  id="public.privacy.title"
                  defaultMessage="Privacy policy"
                ></FormattedMessage>
              </Link>
            </ListItem>
            <ListItem>
              <Link href="/legal/[doc]" as="/legal/cookies">
                <FormattedMessage
                  id="public.cookies.title"
                  defaultMessage="Cookies"
                ></FormattedMessage>
              </Link>
            </ListItem>
          </List>
        </PublicFooterBox>
      </Flex>
    </PublicContainer>
  );
}
