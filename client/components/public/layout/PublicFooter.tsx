import {
  Box,
  BoxProps,
  Divider,
  Flex,
  Grid,
  IconButton,
  Image,
  List,
  ListItem,
  Select,
  Stack,
  Text,
} from "@chakra-ui/react";
import { LinkedInIcon, TwitterIcon } from "@parallel/chakra/icons";
import { Link, NormalLink } from "@parallel/components/common/Link";
import { Spacer } from "@parallel/components/common/Spacer";
import { resolveUrl } from "@parallel/utils/next";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import { useRouter } from "next/router";
import { ChangeEvent } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { PublicContainer } from "./PublicContainer";
import { PublicFooterBox } from "./PublicFooterBox";

export function PublicFooter(props: BoxProps) {
  const router = useRouter();
  const intl = useIntl();
  const supportUrl =
    {
      en: "https://support.onparallel.com/hc/en-us",
      es: "https://support.onparallel.com/hc/es",
    }[router.locale!] ?? "https://support.onparallel.com/hc";

  function handleLangChange(event: ChangeEvent<HTMLSelectElement>) {
    const locale = event.target.value;
    router.push(resolveUrl(router.pathname, { ...router.query }), undefined, { locale });
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
      <Grid
        textAlign={{ base: "center", sm: "left" }}
        templateColumns={{
          base: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(5, 1fr)",
        }}
        gridGap={8}
        sx={{
          a: { paddingY: 1, display: "inline-block" },
        }}
      >
        <PublicFooterBox
          heading={intl.formatMessage({
            id: "public.footer.product",
            defaultMessage: "Product",
          })}
        >
          <List spacing={2}>
            <ListItem>
              <Link href="/security">
                <FormattedMessage id="public.security-link" defaultMessage="Security" />
              </Link>
            </ListItem>
            <ListItem>
              <Link href="/developers/api" next={{ locale: false }}>
                <FormattedMessage id="public.api-docs-link" defaultMessage="API Documentation" />
              </Link>
            </ListItem>
          </List>
        </PublicFooterBox>
        <PublicFooterBox
          heading={intl.formatMessage({
            id: "public.footer.resources",
            defaultMessage: "Resources",
          })}
        >
          <List spacing={2}>
            <ListItem>
              <NormalLink href={`${process.env.NEXT_PUBLIC_PARALLEL_URL}/blog`}>
                <FormattedMessage id="public.blog-link" defaultMessage="Blog" />
              </NormalLink>
            </ListItem>
            <ListItem>
              <NormalLink href={supportUrl}>
                <FormattedMessage
                  id="public.resources.support-center"
                  defaultMessage="Support center"
                />
              </NormalLink>
            </ListItem>
            <ListItem>
              <NormalLink
                href={`${supportUrl}/categories/360001331677-FAQ-Frequently-asked-questions`}
              >
                <FormattedMessage id="public.resources.faq" defaultMessage="FAQ" />
              </NormalLink>
            </ListItem>
            <ListItem>
              <NormalLink href="https://trello.com/b/iiG1jVp5/parallel-public-roadmap" isExternal>
                <FormattedMessage id="public.resources.roadmap" defaultMessage="Roadmap" />
              </NormalLink>
            </ListItem>
          </List>
        </PublicFooterBox>
        <PublicFooterBox
          heading={intl.formatMessage({
            id: "public.footer.company",
            defaultMessage: "Company",
          })}
        >
          <List spacing={2}>
            <ListItem>
              <Link href="/about">
                <FormattedMessage id="public.about-link" defaultMessage="About" />
              </Link>
            </ListItem>
            <ListItem>
              <Link href="/careers">
                <FormattedMessage id="public.careers" defaultMessage="Careers" />
              </Link>
            </ListItem>
            <ListItem>
              <NormalLink href="mailto:hello@onparallel.com">
                <FormattedMessage id="public.contact-link" defaultMessage="Contact" />
              </NormalLink>
            </ListItem>
          </List>
        </PublicFooterBox>
        <PublicFooterBox
          heading={intl.formatMessage({
            id: "public.footer.legal-information",
            defaultMessage: "Legal information",
          })}
        >
          <List spacing={2}>
            <ListItem>
              <Link href="/legal/terms">
                <FormattedMessage id="public.terms.title" defaultMessage="Terms & Conditions" />
              </Link>
            </ListItem>
            <ListItem>
              <Link href="/legal/privacy">
                <FormattedMessage id="public.privacy.title" defaultMessage="Privacy policy" />
              </Link>
            </ListItem>
            <ListItem>
              <Link href="/legal/cookies">
                <FormattedMessage id="public.cookies.title" defaultMessage="Cookie policy" />
              </Link>
            </ListItem>
          </List>
        </PublicFooterBox>
        <Flex as="section" flexDirection="column" align="center">
          <NormalLink
            href="https://www.capterra.com/reviews/236724/Parallel?utm_source=vendor&utm_medium=badge&utm_campaign=capterra_reviews_badge"
            isExternal
          >
            <Image
              alt="Cuatrecasas Acelera"
              width="150px"
              loading="lazy"
              src="https://assets.capterra.com/badge/5b8a84543b954403684b7b8ba854282d.svg?v=2198650&p=236724"
            />
          </NormalLink>
        </Flex>
      </Grid>
      <Divider marginY={8} />
      <Stack direction={{ base: "column", md: "row" }} spacing={8}>
        <Flex flex="1">
          <Box flex={{ base: "1", md: "unset" }}>
            <Text fontSize="xs">© {new Date().getFullYear()} Parallel Solutions, S.L.</Text>
            <Select
              size="sm"
              width="auto"
              minWidth="160px"
              marginTop={4}
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
          </Box>
          <Spacer display={{ base: "none", md: "block" }} />
        </Flex>
        <Stack direction="row" alignSelf="top" alignItems="center" justifyContent="space-around">
          <NormalLink href="https://acelera.cuatrecasas.com" isExternal>
            <Image
              alt="Cuatrecasas Acelera"
              width="120px"
              loading="lazy"
              filter="grayscale(100%)"
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/cuatrecasas-acelera2.png`}
            />
          </NormalLink>
          <NormalLink href="https://www.enisa.es/" isExternal>
            <Image
              alt="Enisa"
              width="80px"
              loading="lazy"
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/enisa_${router.locale}.png`}
            />
          </NormalLink>
        </Stack>
        <Stack direction="row" justifyContent="space-around">
          <IconButton
            as={"a" as any}
            {...{
              href: "https://twitter.com/Parallel_SO",
              target: "_blank",
              rel: "noopener noreferrer",
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
              href: "https://www.linkedin.com/company/onparallel/",
              target: "_blank",
              rel: "noopener noreferrer",
            }}
            icon={<LinkedInIcon />}
            isRound
            colorScheme="purple"
            aria-label={intl.formatMessage({
              id: "public.footer.linkedin-profile",
              defaultMessage: "LinkedIn profile",
            })}
          />
        </Stack>
      </Stack>
    </PublicContainer>
  );
}
