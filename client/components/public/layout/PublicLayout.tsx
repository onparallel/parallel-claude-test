import { Flex } from "@chakra-ui/react";
import languages from "@parallel/lang/languages.json";
import { resolveUrl } from "@parallel/utils/next";
import { useWindowScroll } from "beautiful-react-hooks";
import Head from "next/head";
import { useRouter } from "next/router";
import { ReactNode, useEffect, useState } from "react";
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
}

export function PublicLayout({
  title,
  description,
  children,
  hideFooter,
  hideHeader,
}: PublicLayoutProps) {
  const { query, pathname } = useRouter();
  const intl = useIntl();

  const [headerIsThin, setThinHeader] = useState(false);
  useWindowScroll(checkWindowScroll);
  useEffect(checkWindowScroll, []);

  function checkWindowScroll() {
    setThinHeader(window.scrollY > 20);
  }

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
      </Head>
      <Flex direction="column" minHeight="100vh">
        {hideHeader ? null : (
          <PublicHeader
            position="sticky"
            top={0}
            zIndex={1}
            isThin={headerIsThin}
          />
        )}
        <Flex as="main" flex="1" direction="column">
          {children}
        </Flex>
        {hideFooter ? null : <PublicFooter marginTop={8} />}
        <CookieConsent />
      </Flex>
    </>
  );
}
