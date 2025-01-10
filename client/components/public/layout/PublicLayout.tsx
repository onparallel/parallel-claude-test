import { Box, Flex } from "@chakra-ui/react";
import { resolveUrl } from "@parallel/utils/next";
import { Maybe } from "@parallel/utils/types";
import Head from "next/head";
import { useRouter } from "next/router";
import Script from "next/script";
import { ReactNode } from "react";
import { useIntl } from "react-intl";
import { PublicFooter } from "./PublicFooter";
import { PublicHeader } from "./PublicHeader";

export interface PublicLayoutProps {
  title: string;
  description?: string;
  children?: ReactNode;
  hideHeader?: boolean;
  hideFooter?: boolean;
  og?: Partial<Record<string, Maybe<string> | undefined>>;
  canonicalLocale?: string;
}

function buildUrl(pathname: string, query: any, locale: string) {
  const path = pathname === "/" ? "" : resolveUrl(pathname, query);
  return `${process.env.NEXT_PUBLIC_PARALLEL_URL}${locale === "en" ? "" : `/${locale}`}${path}`;
}

export function PublicLayout({
  title,
  description,
  children,
  hideFooter,
  hideHeader,
  og,
  canonicalLocale,
}: PublicLayoutProps) {
  const { locale, query, pathname, asPath } = useRouter();
  const intl = useIntl();
  return (
    <>
      <Head>
        {([["source-sans-pro-v14-latin", ["600"]]] as [string, string[]][]).flatMap(
          ([name, types]) =>
            types.map((type) => (
              <link
                key={`${name}-${type}`}
                rel="preload"
                href={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/fonts/${name}-${type}.woff2`}
                as="font"
                type="font/woff2"
                crossOrigin="anonymous"
              />
            )),
        )}
        <title>{
          // eslint-disable-next-line formatjs/no-literal-string-in-jsx
          `${title} | Parallel`
        }</title>
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
        <link rel="canonical" href={buildUrl(pathname, query, canonicalLocale ?? locale!)} />
      </Head>
      <Script
        src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/js/consent.js`}
        strategy="beforeInteractive"
      />
      <Script
        src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/js/consent-manager.js`}
        strategy="afterInteractive"
      />
      {(canonicalLocale ? [canonicalLocale] : ["en", "es"]).map((locale) => (
        <Head key={locale}>
          <link rel="alternate" hrefLang={locale} href={buildUrl(pathname, query, locale)} />
        </Head>
      ))}
      <Head>
        <meta property="og:title" content={og?.title ?? title} />
        <meta property="og:type" content={og?.type ?? "website"} />
        <meta property="og:url" content={og?.url ?? asPath} />
        <meta
          property="og:image"
          content={
            og?.image ??
            `${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/parallel_software_bg.png?v=${process.env.BUILD_ID}`
          }
        />
        <meta property="og:description" content={og?.description ?? description} />
        {["en", "es"].map((l) => (
          <meta key={l} property={l === locale ? "og:locale" : "og:locale:alternate"} content={l} />
        ))}
      </Head>
      <Flex direction="column" minHeight="100vh">
        {hideHeader ? null : <PublicHeader position="sticky" top={0} zIndex={1} />}
        <Flex as="main" flex="1" direction="column">
          {children}
        </Flex>
        {hideFooter ? null : <PublicFooter />}
      </Flex>
      <Box
        id="target-container"
        data-testid="cookie-consent"
        position="fixed"
        insetStart="200px"
        insetEnd="200px"
        bottom="20px"
        sx={{
          "@media screen and (max-width: 991px)": {
            insetStart: "12px",
            insetEnd: "12px",
          },
        }}
      />
    </>
  );
}
