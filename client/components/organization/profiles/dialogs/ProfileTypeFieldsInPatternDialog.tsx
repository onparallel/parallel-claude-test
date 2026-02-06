import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Button, Text } from "@parallel/components/ui";
import { FormattedMessage } from "react-intl";

interface ProfileTypeFieldsInPatternDialogProps {
  numberOfProfileTypeFields: number;
  profileTypeName: string;
}

function ProfileTypeFieldsInPatternDialog({
  numberOfProfileTypeFields,
  profileTypeName,
  ...props
}: DialogProps<ProfileTypeFieldsInPatternDialogProps, {}>) {
  return (
    <ConfirmDialog
      {...props}
      closeOnEsc
      size="md"
      header={
        <FormattedMessage
          id="component.property-used-in-pattern-dialog.title"
          defaultMessage="{count, plural, =1 {Property} other {Properties}} used in profile name"
          values={{
            count: numberOfProfileTypeFields,
          }}
        />
      }
      body={
        <Text>
          <FormattedMessage
            id="component.property-used-in-pattern-dialog.body"
            defaultMessage="{count, plural, =1 {This property is} other {Some of the properties are}} being used as part of the name for profiles of type {type}. To continue, first you need to remove {count, plural, =1 {it} other {them}} from the name."
            values={{
              count: numberOfProfileTypeFields,
              type: <i>{profileTypeName}</i>,
            }}
          />
        </Text>
      }
      confirm={
        <Button colorPalette="primary" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.accept" defaultMessage="Accept" />
        </Button>
      }
    />
  );
}

export function useProfileTypeFieldsInPatternDialog() {
  return useDialog(ProfileTypeFieldsInPatternDialog);
}
