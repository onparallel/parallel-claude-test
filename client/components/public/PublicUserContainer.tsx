import { Box, BoxProps, Flex } from "@chakra-ui/react";
import { Card } from "../common/Card";

export interface PublicUserFormContainerProps extends BoxProps {
  wrapper?: BoxProps;
}

export function PublicUserFormContainer({
  wrapper,
  children,
  ...props
}: PublicUserFormContainerProps) {
  return (
    <Flex
      flex="1"
      width="100%"
      direction="column"
      alignItems="stretch"
      {...wrapper}
    >
      <Box flex="1" />
      <Box
        marginY={16}
        marginX="auto"
        width="100%"
        paddingX={4}
        maxWidth="container.xs"
      >
        <Card padding={4} {...props}>
          {children}
        </Card>
      </Box>
      <Box flex="3" />
    </Flex>
  );
}
