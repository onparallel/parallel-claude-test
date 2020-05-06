import { Box, Flex, Heading, BoxProps } from "@chakra-ui/core";
import { ReactNode } from "react";

export type PublicFooterBoxProps = BoxProps & {
  heading?: ReactNode;
  children?: ReactNode;
};

export function PublicFooterBox({
  heading,
  children,
  ...rest
}: PublicFooterBoxProps) {
  return (
    <Flex as="section" flexDirection="column" {...rest}>
      {heading && (
        <Box as="header" marginBottom={2}>
          <Heading fontSize="md">{heading}</Heading>
        </Box>
      )}
      <Box flex="1">{children}</Box>
    </Flex>
  );
}
