import { Flex } from "@chakra-ui/core";
import { useWindowScroll } from "beautiful-react-hooks";
import { ReactNode, useState } from "react";
import { PublicFooter } from "./PublicFooter";
import { PublicHeader } from "./PublicHeader";

export interface PublicLayoutProps {
  children?: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
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
    <Flex direction="column" minHeight="100vh">
      <PublicHeader
        position="fixed"
        transition="height 150ms"
        zIndex={2}
        {...(headerIsThin ? { shadow: "md", height: 16 } : {})}
      ></PublicHeader>
      <Flex as="main" marginTop={24} flex="1" direction="column" zIndex={1}>
        {children}
      </Flex>
      <PublicFooter marginTop={8} marginBottom={4}></PublicFooter>
      {/* <CookieConsent /> */}
    </Flex>
  );
}
