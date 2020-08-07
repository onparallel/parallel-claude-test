import { Box, Flex, Heading } from "@chakra-ui/core";
import { ExtendChakra } from "@parallel/chakra/utils";
import { ReactNode } from "react";

export type PublicFooterBoxProps = ExtendChakra<{
  heading?: ReactNode;
  children?: ReactNode;
}>;

export function PublicFooterBox({
  heading,
  children,
  ...rest
}: PublicFooterBoxProps) {
  return (
    <Flex as="section" flexDirection="column" {...rest}>
      {heading && (
        <Box as="header" marginBottom={2}>
          <Heading size="sm">{heading}</Heading>
        </Box>
      )}
      <Box flex="1">{children}</Box>
    </Flex>
  );
}
