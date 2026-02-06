import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Button } from "@parallel/components/ui";
import { FormattedMessage } from "react-intl";

function RestrictedProfilePropertiesDialog({ ...props }: DialogProps<{}>) {
  return (
    <ConfirmDialog
      {...props}
      header={
        <FormattedMessage
          id="component.restricted-profile-properties-dialog.header"
          defaultMessage="Properties without permissions"
        />
      }
      body={
        <FormattedMessage
          id="component.restricted-profile-properties-dialog.body"
          defaultMessage="There are some properties that do not have write permissions, so the information will neither be saved nor updated. Do you want to continue?"
        />
      }
      confirm={
        <Button colorPalette="primary" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
    />
  );
}

export function useRestrictedProfilePropertiesDialog() {
  return useDialog(RestrictedProfilePropertiesDialog);
}
