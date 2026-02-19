import { Box, BoxProps } from "@parallel/components/ui";

export type SpacerProps = BoxProps;

export function Spacer(props: SpacerProps) {
  return <Box flex="1" {...props} />;
}
