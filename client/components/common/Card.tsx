import { Box, BoxProps, useColorMode } from "@chakra-ui/core";

export type CardProps = BoxProps;

export function Card({ children, ...props }: CardProps) {
  const { colorMode } = useColorMode();
  return (
    <Box
      as="section"
      borderWidth="1px"
      backgroundColor={{ light: "white", dark: "gray.900" }[colorMode]}
      shadow="md"
      rounded="md"
      {...props}
    >
      {children}
    </Box>
  );
}
