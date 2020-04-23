import {
  BoxProps,
  Divider,
  Flex,
  IconButton,
  List,
  ListItem,
  Text,
  useColorMode,
  Box,
} from "@chakra-ui/core";
import { Link, NormalLink } from "@parallel/components/common/Link";
import { resolveUrl } from "@parallel/utils/next";
import { useRouter } from "next/router";
import { ChangeEvent } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { LanguageSelector } from "../../common/LanguageSelector";
import { PublicContainer } from "./PublicContainer";
import { PublicFooterBox } from "./PublicFooterBox";

export function PublicFooter(props: BoxProps) {
  const router = useRouter();
  const intl = useIntl();
  const supportUrl =
    ({
      en: "https://support.parallel.so/hc/en-us",
      es: "https://support.parallel.so/hc/es",
    } as any)[router.query.locale as string] ??
    "https://support.parallel.so/hc";

  function handleLangChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    router.push(
      router.pathname,
      resolveUrl(router.pathname, {
        ...router.query,
        locale: value,
      })
    );
  }

  return (
    <PublicContainer
      wrapper={{
        as: "footer",
        backgroundColor: "gray.50",
        paddingTop: 12,
        paddingBottom: 16,
        ...props,
      }}
    >
      <Flex
        justify="space-between"
        align="stretch"
        height="100%"
        wrap="wrap"
        marginBottom={10}
      >
        <PublicFooterBox
          flex="1"
          minWidth={{ base: "100%", md: 40 }}
          marginTop={{ base: 4, md: 0 }}
          heading={intl.formatMessage({
            id: "public.footer.product",
            defaultMessage: "Product",
          })}
        >
          <List>
            <ListItem>
              <Link href="/security" as="/security">
                <FormattedMessage
                  id="public.security-link"
                  defaultMessage="Security"
                ></FormattedMessage>
              </Link>
            </ListItem>
          </List>
        </PublicFooterBox>
        <PublicFooterBox
          flex="1"
          minWidth={{ base: "100%", md: 40 }}
          marginTop={{ base: 4, md: 0 }}
          heading={intl.formatMessage({
            id: "public.footer.support",
            defaultMessage: "Support",
          })}
        >
          <List>
            <ListItem>
              <NormalLink href={supportUrl}>
                <FormattedMessage
                  id="public.support.support-center"
                  defaultMessage="Support center"
                ></FormattedMessage>
              </NormalLink>
            </ListItem>
            <ListItem>
              <NormalLink
                href={`${supportUrl}/categories/360001331677-FAQ-Frequently-asked-questions`}
              >
                <FormattedMessage
                  id="public.support.faq"
                  defaultMessage="FAQ"
                ></FormattedMessage>
              </NormalLink>
            </ListItem>
          </List>
        </PublicFooterBox>
        <PublicFooterBox
          flex="1"
          minWidth={{ base: "100%", md: 40 }}
          marginTop={{ base: 4, md: 0 }}
          heading={intl.formatMessage({
            id: "public.footer.company",
            defaultMessage: "Company",
          })}
        >
          <List>
            <ListItem>
              <Link href="/about" as="/about">
                <FormattedMessage
                  id="public.about-link"
                  defaultMessage="About"
                ></FormattedMessage>
              </Link>
            </ListItem>
            <ListItem>
              <NormalLink href="/blog">
                <FormattedMessage
                  id="public.blog-link"
                  defaultMessage="Blog"
                ></FormattedMessage>
              </NormalLink>
            </ListItem>
            <ListItem>
              <NormalLink href="mailto:hello@parallel.so">
                <FormattedMessage
                  id="public.contact-link"
                  defaultMessage="Contact"
                ></FormattedMessage>
              </NormalLink>
            </ListItem>
          </List>
        </PublicFooterBox>
        <PublicFooterBox
          flex="1"
          minWidth={{ base: "100%", md: 40 }}
          marginTop={{ base: 4, md: 0 }}
          heading={intl.formatMessage({
            id: "public.footer.legal-information",
            defaultMessage: "Legal information",
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
      <Divider />
      <Flex marginTop={5} wrap="wrap" marginBottom={["30px", "0"]}>
        <Box flex="1">
          <Text fontSize="xs">© 2020 Parallel Solutions, S.L.</Text>
          <LanguageSelector
            value={router.query.locale}
            onChange={handleLangChange}
            marginTop={4}
          />
        </Box>
        <Box>
          <IconButton
            as={"a" as any}
            {...{
              href: "https://twitter.com/Parallel_SO",
              target: "_blank",
            }}
            icon={"twitter" as any}
            isRound
            variantColor="purple"
            aria-label={intl.formatMessage({
              id: "public.footer.twitter-profile",
              defaultMessage: "Twitter profile",
            })}
          ></IconButton>
          <IconButton
            as={"a" as any}
            {...{
              href: "https://www.linkedin.com/company/parallel-so/",
              target: "_blank",
            }}
            icon={"linkedin" as any}
            isRound
            variantColor="purple"
            marginLeft={2}
            aria-label={intl.formatMessage({
              id: "public.footer.linkedin-profile",
              defaultMessage: "LinkedIn profile",
            })}
          ></IconButton>
        </Box>
      </Flex>
    </PublicContainer>
  );
}
