import { useToast } from "@chakra-ui/react";
import { useCallback } from "react";
import { useIntl } from "react-intl";

export const useCodeExpiredToast = () => {
  const intl = useIntl();
  const toast = useToast();

  const showToast = useCallback(() => {
    toast({
      title: intl.formatMessage({
        id: "recipient-view.expired-code-title",
        defaultMessage: "Expired code",
      }),
      description: intl.formatMessage({
        id: "recipient-view.expired-code-description",
        defaultMessage: "The code has expired. Please try again.",
      }),
      status: "error",
      duration: 3000,
      isClosable: true,
    });
  }, [intl.locale]);

  return showToast;
};
