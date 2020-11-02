import {
  Box,
  BoxProps,
  Divider,
  Flex,
  IconButton,
  List,
  ListItem,
  Select,
  Text,
} from "@chakra-ui/core";
import { LinkedInIcon, TwitterIcon } from "@parallel/chakra/icons";
import { Link, NormalLink } from "@parallel/components/common/Link";
import { resolveUrl } from "@parallel/utils/next";
import { useRouter } from "next/router";
import { ChangeEvent } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { PublicContainer } from "./PublicContainer";
import { PublicFooterBox } from "./PublicFooterBox";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";

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
    const locale = event.target.value;
    router.push(resolveUrl(router.pathname, { ...router.query, locale }));
  }

  const locales = useSupportedLocales();

  return (
    <PublicContainer
      wrapper={{
        as: "footer",
        backgroundColor: "gray.50",
        paddingY: 12,
        ...props,
      }}
    >
      <Flex
        justify="space-between"
        align="stretch"
        wrap="wrap"
        textAlign={{ base: "center", md: "left" }}
      >
        <PublicFooterBox
          flex="1"
          minWidth={{ base: "100%", md: 40 }}
          heading={intl.formatMessage({
            id: "public.footer.product",
            defaultMessage: "Product",
          })}
        >
          <List>
            <ListItem>
              <Link href="/security">
                <FormattedMessage
                  id="public.security-link"
                  defaultMessage="Security"
                />
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
                />
              </NormalLink>
            </ListItem>
            <ListItem>
              <NormalLink
                href={`${supportUrl}/categories/360001331677-FAQ-Frequently-asked-questions`}
              >
                <FormattedMessage
                  id="public.support.faq"
                  defaultMessage="FAQ"
                />
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
              <Link href="/about">
                <FormattedMessage
                  id="public.about-link"
                  defaultMessage="About"
                />
              </Link>
            </ListItem>
            <ListItem>
              <Link href="/careers">
                <FormattedMessage
                  id="public.careers"
                  defaultMessage="Careers"
                />
              </Link>
            </ListItem>
            <ListItem>
              <NormalLink href="/blog">
                <FormattedMessage id="public.blog-link" defaultMessage="Blog" />
              </NormalLink>
            </ListItem>
            <ListItem>
              <NormalLink href="mailto:hello@parallel.so">
                <FormattedMessage
                  id="public.contact-link"
                  defaultMessage="Contact"
                />
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
              <Link href="/legal/terms">
                <FormattedMessage
                  id="public.terms.title"
                  defaultMessage="Terms & Conditions"
                />
              </Link>
            </ListItem>
            <ListItem>
              <Link href="/legal/privacy">
                <FormattedMessage
                  id="public.privacy.title"
                  defaultMessage="Privacy policy"
                />
              </Link>
            </ListItem>
            <ListItem>
              <Link href="/legal/cookies">
                <FormattedMessage
                  id="public.cookies.title"
                  defaultMessage="Cookie policy"
                />
              </Link>
            </ListItem>
          </List>
        </PublicFooterBox>
      </Flex>
      <Divider marginY={8} />
      <Flex wrap="wrap">
        <Box flex="1">
          <Text fontSize="xs">© 2020 Parallel Solutions, S.L.</Text>
          <Flex>
            <Select
              size="sm"
              width="auto"
              minWidth="160px"
              marginTop={4}
              onChange={handleLangChange}
              value={router.query.locale}
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
          </Flex>
        </Box>
        <Box>
          <IconButton
            as={"a" as any}
            {...{
              href: "https://twitter.com/Parallel_SO",
              target: "_blank",
              rel: "noopener",
            }}
            icon={<TwitterIcon />}
            isRound
            colorScheme="purple"
            aria-label={intl.formatMessage({
              id: "public.footer.twitter-profile",
              defaultMessage: "Twitter profile",
            })}
          />
          <IconButton
            as={"a" as any}
            {...{
              href: "https://www.linkedin.com/company/parallel-so/",
              target: "_blank",
              rel: "noopener",
            }}
            icon={<LinkedInIcon />}
            isRound
            colorScheme="purple"
            marginLeft={2}
            aria-label={intl.formatMessage({
              id: "public.footer.linkedin-profile",
              defaultMessage: "LinkedIn profile",
            })}
          />
        </Box>
      </Flex>
    </PublicContainer>
  );
}
