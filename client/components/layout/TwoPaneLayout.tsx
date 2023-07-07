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
  ref,
) {
  return (
    <Flex ref={ref} minHeight="100%" {...props}>
      <Box
        flex="1"
        minWidth={0}
        display={{ base: isSidePaneActive ? "none" : "block", lg: "block" }}
      >
        {children}
      </Box>
      <Box
        width={{ base: "auto", lg: "495px" }}
        display={{ base: isSidePaneActive ? "block" : "none", lg: "block" }}
      >
        {sidePane ? (
          <Box position={{ base: "relative", lg: "sticky" }} top={top}>
            {sidePane}
          </Box>
        ) : null}
      </Box>
    </Flex>
  );
});
