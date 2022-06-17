import { Box, BoxProps, Flex, useDisclosure } from "@chakra-ui/react";
import { BurgerButton } from "@parallel/components/common/BurgerButton";
import { Logo } from "@parallel/components/common/Logo";
import { Spacer } from "@parallel/components/common/Spacer";
import useWindowScroll from "beautiful-react-hooks/useWindowScroll";
import { useEffect, useState } from "react";
import { PublicContainer } from "./PublicContainer";
import { PublicHeaderMenu } from "./PublicHeaderMenu";

export function PublicHeader(props: BoxProps) {
  const [isThin, setIsThin] = useState(false);
  const onWindowScroll = useWindowScroll();

  const { isOpen, onToggle } = useDisclosure();
  const bp = "lg" as const;

  function checkWindowScroll() {
    setIsThin(window.scrollY > 20);
  }
  useEffect(checkWindowScroll, []);
  onWindowScroll(checkWindowScroll);
  return (
    <PublicContainer
      wrapper={{
        as: "header",
        backgroundColor: "gray.50",
        boxShadow: isThin ? "short" : undefined,
        ...props,
      }}
    >
      <Flex
        direction={{ base: "column", [bp]: "row" }}
        alignItems={{ base: "stretch", [bp]: "center" }}
      >
        <Flex
          alignSelf="stretch"
          alignItems="center"
          flex="1"
          minHeight={{ base: 16, [bp]: isThin ? 16 : 20 }}
          transition="min-height 300ms"
        >
          <Box as="a" href="/">
            <Logo width="152px" />
          </Box>
          <Spacer />
          <BurgerButton
            isOpen={isOpen}
            display={{ base: "block", [bp]: "none" }}
            onClick={onToggle}
          />
        </Flex>
        <Box
          height={{ base: isOpen ? "auto" : 0, [bp]: "auto" }}
          opacity={{ base: isOpen ? 1 : 0, [bp]: 1 }}
          overflow="hidden"
          transition="opacity 500ms"
          padding={{ base: 1, [bp]: 2 }}
          margin={{ base: -1, [bp]: 0 }}
          paddingBottom={{ base: isOpen ? 4 : 2, [bp]: 2 }}
        >
          <PublicHeaderMenu
            direction={{ base: "column", [bp]: "row" }}
            spacing={{ base: 2, xl: 4 }}
            alignItems={{ base: undefined, [bp]: "center" }}
          />
        </Box>
      </Flex>
    </PublicContainer>
  );
}
