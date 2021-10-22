import { Box, BoxProps, Flex } from "@chakra-ui/react";

export interface PublicUserFormContainerProps extends BoxProps {
  wrapper?: BoxProps;
}

export function PublicUserFormContainer({
  wrapper,
  children,
  ...props
}: PublicUserFormContainerProps) {
  return (
    <Flex flex="1" width="100%" direction="column" alignItems="stretch" {...wrapper}>
      <Box width="100%" maxWidth="md" {...props}>
        {children}
      </Box>
    </Flex>
  );
}
