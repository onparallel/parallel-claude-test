import { Box, BoxProps } from "@chakra-ui/core";

export function Divider(props: BoxProps) {
  return (
    <Box borderBottom="1px solid" borderBottomColor="gray.200" {...props} />
  );
}
