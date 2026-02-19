import { Center, useTheme } from "@chakra-ui/react";
import { Box } from "@parallel/components/ui";
import { ReactNode } from "react";

interface PetitionComposeDragActiveIndicatorProps {
  message: ReactNode;
  errorMessage: ReactNode;
  showErrorMessage: boolean;
  omitBorder?: boolean;
}

export function PetitionComposeDragActiveIndicator({
  message,
  errorMessage,
  showErrorMessage,
  omitBorder,
}: PetitionComposeDragActiveIndicatorProps) {
  const theme = useTheme();
  return (
    <Center
      position="absolute"
      inset={0}
      zIndex={1}
      backgroundColor="whiteAlpha.700"
      pointerEvents="none"
    >
      <Box
        position="absolute"
        inset={0}
        opacity={0.2}
        sx={{
          backgroundImage: (() => {
            const c = showErrorMessage ? theme.colors.red[100] : theme.colors.gray[100];
            return `linear-gradient(135deg, ${c} 25%, white 25%, white 50%, ${c} 50%, ${c} 75%, white 75%, white)`;
          }) as any,
          backgroundSize: `3rem 3rem`,
          backgroundPosition: "top left",
        }}
      />
      {omitBorder ? null : (
        <Box
          position="absolute"
          inset={2}
          border="2px dashed"
          borderRadius="md"
          borderColor={showErrorMessage ? "red.300" : "gray.300"}
        />
      )}
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
