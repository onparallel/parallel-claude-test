import { Box, useClipboard, useToast } from "@chakra-ui/react";
import { useEffect, useState } from "react";

export const useClipboardWithToast = ({ value, text }: { value: string; text: string }) => {
  const toast = useToast();
  const [copyValue, setCopyValue] = useState(value);
  const { hasCopied, onCopy } = useClipboard(copyValue);

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

  useEffect(() => {
    if (copyValue !== value) onCopy();
  }, [copyValue]);

  const onCopyValue = (value: string) => {
    setCopyValue(value);
  };

  return { hasCopied, onCopy, onCopyValue };
};
