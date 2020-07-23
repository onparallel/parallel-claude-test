import { Box, BoxProps, Flex } from "@chakra-ui/core";
import { Card } from "../common/Card";

export type PublicUserFormContainerProps = BoxProps & {
  wrapper?: BoxProps;
};

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
        margin="0 auto"
        width="100%"
        paddingX={4}
        maxWidth={{ xs: "containers.xs" }}
      >
        <Card padding={4} {...props}>
          {children}
        </Card>
      </Box>
      <Box flex="3" />
    </Flex>
  );
}
