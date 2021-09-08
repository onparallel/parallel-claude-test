import { useToast } from "@chakra-ui/react";
import { useCallback } from "react";
import { useIntl } from "react-intl";

export const useGenericErrorToast = () => {
  const intl = useIntl();
  const toast = useToast();

  const showToast = useCallback(() => {
    toast({
      title: intl.formatMessage({
        id: "generic.something-went-wrong",
        defaultMessage: "Something went wrong",
      }),
      description: intl.formatMessage({
        id: "generic.please-try-again-later",
        defaultMessage: "Please try again later",
      }),
      status: "error",
      isClosable: true,
    });
  }, [intl.locale]);

  return showToast;
};
