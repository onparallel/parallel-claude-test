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
    </Flex>
  );
}
