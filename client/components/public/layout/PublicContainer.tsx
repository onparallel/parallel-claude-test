import { Box, BoxProps, Flex } from "@chakra-ui/react";

export interface PublicContainerProps extends BoxProps {
  wrapper?: BoxProps;
}

export function PublicContainer({ wrapper, children, ...props }: PublicContainerProps) {
  return (
    <Flex width="100%" paddingX={{ base: 4, sm: 8, md: 12 }} {...wrapper}>
      <Box margin="0 auto" flex="1" maxWidth="container.xl" {...props}>
        {children}
      </Box>
    </Flex>
  );
}
