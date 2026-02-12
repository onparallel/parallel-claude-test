import { chakraComponent } from "@parallel/chakra/utils";
import { Box, BoxProps, Flex } from "@parallel/components/ui";
import { Ref } from "react";

export interface PublicContainerProps {
  wrapper?: BoxProps;
  wrapperRef?: Ref<HTMLDivElement>;
}

export const PublicContainer = chakraComponent<"div", PublicContainerProps>(
  function PublicContainer({ ref, wrapper, wrapperRef, children, ...props }) {
    return (
      <Flex ref={wrapperRef} width="100%" paddingX={{ base: 4, sm: 8, md: 12 }} {...wrapper}>
        <Box margin="0 auto" flex="1" maxWidth="container.xl" ref={ref} {...props}>
          {children}
        </Box>
      </Flex>
    );
  },
);
