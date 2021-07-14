import { Box, BoxProps } from "@chakra-ui/react";

export function NewPetitionContainer({ children, ...props }: BoxProps) {
  return (
    <Box {...props}>
      <Box
        margin="auto"
        width={{
          base: "100%",
          sm: "calc(min(360px, 100vw - 7rem))",
          md: "calc(min(1024px, 100vw - 7rem))",
        }}
        paddingX={4}
      >
        {children}
      </Box>
    </Box>
  );
}
