import { Box, BoxProps, Flex } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Ref } from "react";

export interface PublicContainerProps {
  wrapper?: BoxProps;
  wrapperRef?: Ref<HTMLDivElement>;
}

export const PublicContainer = chakraForwardRef<"div", PublicContainerProps>(
  function PublicContainer({ wrapper, wrapperRef, children, ...props }, ref) {
    return (
      <Flex ref={wrapperRef} width="100%" paddingX={{ base: 4, sm: 8, md: 12 }} {...wrapper}>
        <Box margin="0 auto" flex="1" maxWidth="container.xl" ref={ref} {...props}>
          {children}
        </Box>
      </Flex>
    );
  }
);
