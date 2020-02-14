import { Box, BoxProps, Flex, useColorMode } from "@chakra-ui/core";

export type PublicUserFormContainerProps = BoxProps & {
  wrapper?: BoxProps;
};

export function PublicUserFormContainer({
  wrapper,
  children,
  ...props
}: PublicUserFormContainerProps) {
  const { colorMode } = useColorMode();
  return (
    <Flex flex="1" width="100%" direction="column" align="stretch" {...wrapper}>
      <Box flex="1"></Box>
      <Box
        margin="0 auto"
        width="100%"
        paddingX={4}
        maxWidth={{ xs: "containers.xs" }}
      >
        <Box
          as="section"
          borderWidth="1px"
          backgroundColor={{ light: "white", dark: "gray.900" }[colorMode]}
          shadow="md"
          rounded="lg"
          padding={4}
          {...props}
        >
          {children}
        </Box>
      </Box>
      <Box flex="3"></Box>
    </Flex>
  );
}
