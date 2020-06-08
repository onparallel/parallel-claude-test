import { useCallback, useState } from "react";
import { useErrorDialog } from "@parallel/components/common/ErrorDialog";
import { useIntl } from "react-intl";

export type PetitionState = "SAVED" | "SAVING" | "ERROR";

export function usePetitionState() {
  const [state, setState] = useState<PetitionState>("SAVED");
  const showError = useErrorDialog();
  const intl = useIntl();
  return [
    state,
    useCallback(function <T extends (...args: any[]) => Promise<any>>(
      updater: T
    ) {
      return async function (...args: any[]) {
        setState("SAVING");
        try {
          const result = await updater(...args);
          setState("SAVED");
          return result;
        } catch (error) {
          setState("ERROR");
          console.log(error);
          await showError({
            message: intl.formatMessage({
              id: "generic.unexpected-error-happened",
              defaultMessage:
                "An unexpected error happened. Please try refreshing your browser window and, if it persists, reach out to support for help.",
            }),
          });
        }
      } as T;
    },
    []),
  ] as const;
}
