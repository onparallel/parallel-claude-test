import { Button, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";

interface OverwriteNamePatternDialogProps {
  numberOfProfiles: number;
}

function OverwriteNamePatternDialog({
  numberOfProfiles,
  ...props
}: DialogProps<OverwriteNamePatternDialogProps, {}>) {
  return (
    <ConfirmDialog
      {...props}
      closeOnEsc
      size="md"
      header={
        <FormattedMessage
          id="component.overwrite-name-pattern-dialog.title"
          defaultMessage="Overwrite name"
        />
      }
      body={
        <Text>
          <FormattedMessage
            id="component.overwrite-name-pattern-dialog.body"
            defaultMessage="There <b>{count, plural, =1 {is # profile} other {are # profiles}}</b> that use this type of profile. If you continue, {count, plural, =1 {its} other {their}} name will be updated according to the new rule. Would you like to continue?"
            values={{
              count: numberOfProfiles,
            }}
          />
        </Text>
      }
      confirm={
        <Button colorScheme="primary" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.overwrite-name-pattern-dialog.change-name"
            defaultMessage="Change name"
          />
        </Button>
      }
    />
  );
}

export function useOverwriteNamePatternDialog() {
  return useDialog(OverwriteNamePatternDialog);
}
