import { useToast } from "@chakra-ui/react";
import { useCallback } from "react";
import { useIntl } from "react-intl";
import * as Sentry from "@sentry/node";
import { isDefined } from "remeda";

export function useGenericErrorToast() {
  const intl = useIntl();
  const toast = useToast();

  return useCallback(
    function (error?: any) {
      if (isDefined(error)) {
        Sentry.captureException(error);
      }
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
    },
    [intl.locale]
  );
}
