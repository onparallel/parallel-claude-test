import { Box, useClipboard, useToast } from "@chakra-ui/react";
import { useEffect } from "react";

export const useClipboardWithToast = ({ value, text }: { value: string; text: string }) => {
  const toast = useToast();
  const { hasCopied, onCopy } = useClipboard(value);

  useEffect(() => {
    if (hasCopied) {
      toast({
        position: "bottom",
        duration: 3000,
        render: () => (
          <Box
            color="white"
            py={4}
            px={8}
            bg="blue.500"
            rounded={"md"}
            fontWeight="bold"
            width="fit-content"
          >
            {text}
          </Box>
        ),
      });
    }
  }, [hasCopied]);

  return { hasCopied, onCopy };
};
