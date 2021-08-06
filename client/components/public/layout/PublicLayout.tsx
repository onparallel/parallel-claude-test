import { Flex } from "@chakra-ui/react";
import { Hubspot } from "@parallel/components/scripts/Hubspot";
import { Segment } from "@parallel/components/scripts/Segment";
import languages from "@parallel/lang/languages.json";
import { resolveUrl } from "@parallel/utils/next";
import { Maybe } from "@parallel/utils/types";
import Head from "next/head";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import { useIntl } from "react-intl";
import { CookieConsent } from "./CookieConsent";
import { PublicFooter } from "./PublicFooter";
import { PublicHeader } from "./PublicHeader";

export interface PublicLayoutProps {
  title: string;
  description?: string;
  children?: ReactNode;
  hideHeader?: boolean;
  hideFooter?: boolean;
  og?: Partial<Record<string, Maybe<string> | undefined>>;
}

export function PublicLayout({
  title,
  description,
  children,
  hideFooter,
  hideHeader,
  og,
}: PublicLayoutProps) {
  const { query, pathname, asPath } = useRouter();
  const intl = useIntl();

  return (
    <>
      <Head>
        <title>{title} | Parallel</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="description"
          content={
            description ||
            intl.formatMessage({
              id: "public.meta-description",
              defaultMessage:
                "Parallel helps professionals collect and organize the information from their clients with its email and checklists automation platform and form-like client portal.",
            })
          }
        />
        {languages.map(({ locale }) => (
          <link
            key={locale}
            rel="alternate"
            hrefLang={locale}
            href={`${process.env.NEXT_PUBLIC_PARALLEL_URL}${resolveUrl(
              pathname,
              { ...query, locale }
            )}`}
          />
        ))}
        <meta property="og:title" content={og?.title ?? title} />
        <meta property="og:type" content={og?.type ?? "website"} />
        <meta property="og:url" content={og?.url ?? asPath} />
        <meta
          property="og:image"
          content={
            og?.image ??
            `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/hero/showcase_hero_${query.locale}.png?v=${process.env.BUILD_ID}`
          }
        />
        <meta
          property="og:description"
          content={og?.description ?? description}
        />
        {languages.map(({ locale }) => (
          <meta
            key={locale}
            property={
              locale === query.locale ? "og:locale" : "og:locale:alternate"
            }
            content={locale}
          />
        ))}
      </Head>
      {process.env.NODE_ENV !== "development" ? (
        <>
          <Hubspot />
          <Segment />
        </>
      ) : null}
      <Flex direction="column" minHeight="100vh">
        {hideHeader ? null : (
          <PublicHeader position="sticky" top={0} zIndex={1} />
        )}
        <Flex as="main" flex="1" direction="column">
          {children}
        </Flex>
        {hideFooter ? null : <PublicFooter />}
        <CookieConsent />
      </Flex>
    </>
  );
}
