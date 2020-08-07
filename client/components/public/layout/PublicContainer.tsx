import { Box, Flex } from "@chakra-ui/core";
import { ExtendChakra } from "@parallel/chakra/utils";

export type PublicContainerProps = ExtendChakra & {
  wrapper?: ExtendChakra;
};

export function PublicContainer({
  wrapper,
  children,
  ...props
}: PublicContainerProps) {
  return (
    <Flex width="100%" paddingX={{ base: 4, sm: 8, md: 12 }} {...wrapper}>
      <Box margin="0 auto" flex="1" maxWidth="container.xl" {...props}>
        {children}
      </Box>
    </Flex>
  );
}
