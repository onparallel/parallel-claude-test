import { Box, BoxProps, Flex, useDisclosure } from "@chakra-ui/react";
import { BurgerButton } from "@parallel/components/common/BurgerButton";
import { NakedLink } from "@parallel/components/common/Link";
import { Logo } from "@parallel/components/common/Logo";
import { Spacer } from "@parallel/components/common/Spacer";
import { useWindowScroll } from "beautiful-react-hooks";
import { useEffect, useState } from "react";
import { PublicContainer } from "./PublicContainer";
import { PublicHeaderAccordionMenu } from "./PublicHeaderAccordionMenu";
import { PublicHeaderMenu } from "./PublicHeaderMenu";

export function PublicHeader(props: BoxProps) {
  const [isThin, setIsThin] = useState(false);
  useWindowScroll(checkWindowScroll);
  useEffect(checkWindowScroll, []);

  const { isOpen, onToggle } = useDisclosure();
  const bp = "lg" as const;

  function checkWindowScroll() {
    setIsThin(window.scrollY > 20);
  }
  return (
    <PublicContainer
      wrapper={{
        as: "header",
        backgroundColor: "white",
        boxShadow: "short",
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
          <NakedLink href="/">
            <Box as="a">
              <Logo width="152px" />
            </Box>
          </NakedLink>
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
            display={{ base: "none", [bp]: "flex" }}
            direction="row"
            spacing={{ base: 2, xl: 4 }}
          />
          <PublicHeaderAccordionMenu display={{ base: "flex", [bp]: "none" }} spacing={2} />
        </Box>
      </Flex>
    </PublicContainer>
  );
}
