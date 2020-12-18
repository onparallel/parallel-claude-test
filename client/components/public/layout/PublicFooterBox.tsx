import { Box, BoxProps, Flex, Heading } from "@chakra-ui/react";
import { ReactNode } from "react";

export interface PublicFooterBoxProps extends BoxProps {
  heading?: ReactNode;
  children?: ReactNode;
}

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
