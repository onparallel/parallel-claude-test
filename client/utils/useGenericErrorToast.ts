import { useToast } from "@chakra-ui/react";
import * as Sentry from "@sentry/nextjs";
import { useCallback } from "react";
import { useIntl } from "react-intl";
import { isNonNullish } from "remeda";

export function useGenericErrorToast(title?: string, description?: string) {
  const intl = useIntl();
  const toast = useToast();

  return useCallback(
    function (error?: any) {
      if (isNonNullish(error)) {
        Sentry.captureException(error);
      }
      toast({
        title:
          title ??
          intl.formatMessage({
            id: "generic.something-went-wrong",
            defaultMessage: "Something went wrong",
          }),
        description:
          description ??
          intl.formatMessage({
            id: "generic.please-try-again-later",
            defaultMessage: "Please try again later",
          }),
        status: "error",
        isClosable: true,
      });
    },
    [intl.locale],
  );
}
