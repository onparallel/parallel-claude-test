import { Box, BoxProps } from "@chakra-ui/react";

export type SpacerProps = BoxProps;

export function Spacer(props: SpacerProps) {
  return <Box flex="1" {...props} />;
}
