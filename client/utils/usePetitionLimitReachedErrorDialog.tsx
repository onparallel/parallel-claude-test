import { useErrorDialog } from "@parallel/components/common/ErrorDialog";
import { NormalLink } from "@parallel/components/common/Link";
import { useIntl } from "react-intl";

export function usePetitionLimitReachedErrorDialog() {
  const showErrorDialog = useErrorDialog();
  const intl = useIntl();
  return () =>
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
            <NormalLink display="contents" href="mailto:support@onparallel.com">
              {chunks}
            </NormalLink>
          ),
        }
      ),
    });
}
