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
        paddingX={{ base: 4, sm: 8, md: 12 }}
        width="100%"
        maxWidth={{ lg: "containers.xl" }}
        {...props}
      >
        {children}
      </Box>
    </Flex>
  );
}
