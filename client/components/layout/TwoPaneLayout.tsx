import { Box, Flex, PositionProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { ReactNode } from "react";

export interface PaneWithFlyoutProps {
  isSidePaneActive: boolean;
  sidePane: ReactNode;
  top?: PositionProps["top"];
  children: ReactNode;
}

export const TwoPaneLayout = chakraForwardRef<"div", PaneWithFlyoutProps>(function TwoPaneLayout(
  { isSidePaneActive, sidePane, top = 0, children, ...props },
  ref
) {
  return (
    <Flex ref={ref} minHeight="100%" {...props}>
      <Box
        flex="2"
        minWidth={0}
        display={{ base: isSidePaneActive ? "none" : "block", md: "block" }}
      >
        {children}
      </Box>
      <Box
        flex="1"
        minWidth={{ base: 0, sm: "320px" }}
        display={{ base: isSidePaneActive ? "block" : "none", md: "block" }}
      >
        {sidePane ? (
          <Box position={{ base: "relative", md: "sticky" }} top={top}>
            {sidePane}
          </Box>
        ) : null}
      </Box>
    </Flex>
  );
});
