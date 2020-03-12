import { Box, BoxProps, Flex } from "@chakra-ui/core";

export type PublicContainerProps = BoxProps & {
  wrapper?: BoxProps;
};

export function PublicContainer({
  wrapper,
  children,
  ...props
}: PublicContainerProps) {
  return (
    <Flex width="100%" alignItems="center" {...wrapper}>
      <Box
        margin="0 auto"
        paddingX={4}
        width="100%"
        maxWidth={{ lg: "containers.xl" }}
        {...props}
      >
        {children}
      </Box>
    </Flex>
  );
}
