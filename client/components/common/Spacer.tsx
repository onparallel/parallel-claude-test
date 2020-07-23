import { Box, BoxProps } from "@chakra-ui/core";

export type SpacerProps = BoxProps;

export function Spacer(props: SpacerProps) {
  return <Box flex="1" {...props} />;
}
