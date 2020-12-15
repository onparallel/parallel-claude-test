import { Flex } from "@chakra-ui/core";
import languages from "@parallel/lang/languages.json";
import { resolveUrl } from "@parallel/utils/next";
import { useWindowScroll } from "beautiful-react-hooks";
import Head from "next/head";
import { useRouter } from "next/router";
import { ReactNode, useState } from "react";
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
  let headerIsThin = false;
  if (process.browser) {
    const [_headerIsThin, setThinHeader] = useState(false);
    headerIsThin = _headerIsThin;
    useWindowScroll(() => {
      if (headerIsThin && window.scrollY <= 20) {
        setThinHeader(false);
      } else if (!headerIsThin && window.scrollY > 20) {
        setThinHeader(true);
      }
    });
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
          <PublicHeader position="fixed" zIndex={2} isThin={headerIsThin} />
        )}
        <Flex
          as="main"
          marginTop={hideHeader ? 0 : headerIsThin ? 16 : 20}
          flex="1"
          direction="column"
          zIndex={1}
        >
          {children}
        </Flex>
        {hideFooter ? null : <PublicFooter marginTop={8} />}
        <CookieConsent />
      </Flex>
    </>
  );
}
