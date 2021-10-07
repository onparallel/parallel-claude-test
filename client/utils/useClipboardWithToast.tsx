import { Box, useToast } from "@chakra-ui/react";
import copy from "copy-to-clipboard";
import { ReactNode } from "react";

export interface UseClipboardWithToastOptions {
  value: string;
  text: ReactNode;
}

export function useClipboardWithToast(options: Partial<UseClipboardWithToastOptions> = {}) {
  const toast = useToast();
  return function ({ value, text }: Partial<UseClipboardWithToastOptions> = {}) {
    if (!value && !options.value) {
      throw new Error("Please define a value");
    }
    if (!text && !options.text) {
      throw new Error("Please define a text");
    }
    copy((value ?? options.value)!);
    toast({
      position: "bottom",
      duration: 2000,
      render: () => (
        <Box
          color="white"
          paddingY={4}
          paddingX={8}
          bg="blue.500"
          rounded="md"
          fontWeight="bold"
          width="fit-content"
        >
          {text ?? options.text}
        </Box>
      ),
    });
  };
}
