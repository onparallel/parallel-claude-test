import { Flex } from "@chakra-ui/core";
import languages from "@parallel/lang/languages.json";
import { resolveUrl } from "@parallel/utils/next";
import { useWindowScroll } from "beautiful-react-hooks";
import Head from "next/head";
import { ReactNode, useState } from "react";
import { PublicFooter } from "./PublicFooter";
import { PublicHeader } from "./PublicHeader";
import { useRouter } from "next/router";
import { useIntl } from "react-intl";
import { CookieConsent } from "./CookieConsent";

export interface PublicLayoutProps {
  children?: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const { query, pathname } = useRouter();
  const intl = useIntl();
  let headerIsThin = false;
  let setThinHeader: Function;
  if (process.browser) {
    [headerIsThin, setThinHeader] = useState(false);
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
        <meta
          name="description"
          content={intl.formatMessage({
            id: "public.meta-description",
            defaultMessage:
              "Parallel helps professionals collect and organize the information from their clients with its email automation platform and form-like client portal.",
          })}
        />
        {languages.map(({ locale }) => (
          <link
            key={locale}
            rel="alternate"
            hrefLang={locale}
            href={resolveUrl(pathname, { ...query, locale })}
          />
        ))}
      </Head>
      <Flex direction="column" minHeight="100vh">
        <PublicHeader
          position="fixed"
          zIndex={2}
          isThin={headerIsThin}
        ></PublicHeader>
        <Flex
          as="main"
          marginTop={headerIsThin ? 16 : 20}
          flex="1"
          direction="column"
          zIndex={1}
        >
          {children}
        </Flex>
        <PublicFooter marginTop={8}></PublicFooter>
        <CookieConsent />
      </Flex>
    </>
  );
}
