import { Box, Center } from "@chakra-ui/react";
import { getColor } from "@chakra-ui/theme-tools";
import { ReactNode } from "react";

interface PetitionComposeDragActiveIndicatorProps {
  message: ReactNode;
  errorMessage: ReactNode;
  showErrorMessage: boolean;
}

export function PetitionComposeDragActiveIndicator({
  message,
  errorMessage,
  showErrorMessage,
}: PetitionComposeDragActiveIndicatorProps) {
  return (
    <Center position="absolute" inset={0} zIndex={1} backgroundColor="whiteAlpha.700">
      <Box
        position="absolute"
        inset={0}
        opacity={0.2}
        sx={{
          backgroundImage: ((theme: any) => {
            const c = showErrorMessage ? getColor(theme, "red.100") : getColor(theme, "gray.100");
            return `linear-gradient(135deg, ${c} 25%, white 25%, white 50%, ${c} 50%, ${c} 75%, white 75%, white)`;
          }) as any,
          backgroundSize: `3rem 3rem`,
          backgroundPosition: "top left",
        }}
      />
      <Box
        position="absolute"
        inset={2}
        border="2px dashed"
        borderRadius="md"
        borderColor={showErrorMessage ? "red.300" : "gray.300"}
      />
      <Box
        padding={2}
        borderRadius="lg"
        color={showErrorMessage ? "red.500" : "gray.500"}
        backgroundColor="white"
        fontWeight="bold"
        zIndex={1}
      >
        {showErrorMessage ? errorMessage : message}
      </Box>
    </Center>
  );
}
