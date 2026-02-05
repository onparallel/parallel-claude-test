import { useConfirmDeleteDialog } from "@parallel/components/common/dialogs/ConfirmDeleteDialog";
import { useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Text } from "@parallel/components/ui";

export function useConfirmModifyBackgroundCheckSearch() {
  const showDialog = useConfirmDeleteDialog();
  const intl = useIntl();

  return useCallback(async ({ hasMonitoring }: { hasMonitoring: boolean }) => {
    return await showDialog({
      size: "lg",
      header: (
        <FormattedMessage
          id="component.confirm-modify-search-dialog.header"
          defaultMessage="Modify search"
        />
      ),

      description: (
        <Text>
          {hasMonitoring ? (
            <FormattedMessage
              id="component.confirm-modify-search-dialog.body-with-monitoring"
              defaultMessage="If you proceed, the saved entity will be deleted, interrupting monitoring and erasing the search history, if any. Are you sure you want to remove this entity?"
            />
          ) : (
            <FormattedMessage
              id="component.confirm-modify-search-dialog.body-without-monitoring"
              defaultMessage="If you proceed, the saved entity will be deleted. Are you sure you want to remove this entity?"
            />
          )}
        </Text>
      ),

      confirmation: intl.formatMessage({
        id: "component.confirm-modify-search-dialog.confirm",
        defaultMessage: "continue",
      }),
    });
  }, []);
}
