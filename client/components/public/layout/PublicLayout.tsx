import { Flex } from "@chakra-ui/react";
import languages from "@parallel/lang/languages.json";
import { resolveUrl } from "@parallel/utils/next";
import { Maybe } from "@parallel/utils/types";
import Head from "next/head";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import { useIntl } from "react-intl";
import { PublicFooter } from "./PublicFooter";
import { PublicHeader } from "./PublicHeader";
import { ThirdParty } from "./ThirdParty";

export interface PublicLayoutProps {
  title: string;
  description?: string;
  children?: ReactNode;
  hideHeader?: boolean;
  hideFooter?: boolean;
  og?: Partial<Record<string, Maybe<string> | undefined>>;
  canonicalLocale?: string;
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
  const url = process.env.NEXT_PUBLIC_PARALLEL_URL;
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
        <link
          rel="canonical"
          href={`${url}/${canonicalLocale ?? locale}${
            pathname === "/" ? "" : resolveUrl(pathname, query)
          }`}
        />
        {([["source-sans-pro-v14-latin", ["600"]]] as [string, string[]][]).flatMap(
          ([name, types]) =>
            types.map((type) => (
              <link
                key={`${name}-${type}`}
                rel="preload"
                href={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/fonts/${name}-${type}.woff2`}
                as="font"
                type="font/woff2"
                crossOrigin="anonymous"
              />
            ))
        )}
      </Head>
      {(canonicalLocale ? [canonicalLocale] : languages.map((lang) => lang.locale)).map(
        (locale) => (
          <Head key={locale}>
            <link
              rel="alternate"
              hrefLang={locale}
              href={`${url}/${locale}${resolveUrl(pathname, query)}`}
            />
          </Head>
        )
      )}
      <Head>
        <meta property="og:title" content={og?.title ?? title} />
        <meta property="og:type" content={og?.type ?? "website"} />
        <meta property="og:url" content={og?.url ?? asPath} />
        <meta
          property="og:image"
          content={
            og?.image ??
            `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/hero/showcase_hero_${locale}.png?v=${process.env.BUILD_ID}`
          }
        />
        <meta property="og:description" content={og?.description ?? description} />
        {languages.map((lang) => (
          <meta
            key={lang.locale}
            property={lang.locale === locale ? "og:locale" : "og:locale:alternate"}
            content={lang.locale}
          />
        ))}
      </Head>
      <Flex direction="column" minHeight="100vh">
        {hideHeader ? null : <PublicHeader position="sticky" top={0} zIndex={1} />}
        <Flex as="main" flex="1" direction="column">
          {children}
        </Flex>
        {hideFooter ? null : <PublicFooter />}
        <ThirdParty />
      </Flex>
    </>
  );
}
