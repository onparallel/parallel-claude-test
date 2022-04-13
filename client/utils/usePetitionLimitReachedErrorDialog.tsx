import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { SupportLink } from "@parallel/components/common/SupportLink";
import { useCallback } from "react";
import { useIntl } from "react-intl";

export function usePetitionLimitReachedErrorDialog() {
  const showErrorDialog = useErrorDialog();
  const intl = useIntl();
  return useCallback(
    () =>
      showErrorDialog({
        header: intl.formatMessage({
          id: "component.petition-limit-reached-error-dialog.header",
          defaultMessage: "Error sending the petition",
        }),
        message: intl.formatMessage(
          {
            id: "component.petition-limit-reached-error-dialog.message",
            defaultMessage:
              "You have reached your limit of petitions sent, <a>reach out to us to upgrade your plan.</a>",
          },
          {
            a: (chunks: any[]) => (
              <SupportLink
                message={intl.formatMessage({
                  id: "generic.upgrade-plan-support-message",
                  defaultMessage:
                    "Hi, I would like to get more information about how to upgrade my plan.",
                })}
              >
                {chunks}
              </SupportLink>
            ),
          }
        ),
      }),
    [intl.locale]
  );
}
