import { List, ListItem } from "@chakra-ui/react";
import { LocalizableUserText } from "@parallel/components/common/LocalizableUserTextRender";
import { ProfileTypeFieldReference } from "@parallel/components/common/ProfileTypeFieldReference";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { ErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { ProfileTypeFieldType } from "@parallel/graphql/__types";
import { Stack } from "@parallel/components/ui";
import { FormattedMessage } from "react-intl";

function UniqueValueConflictDialog({
  fields,
  ...props
}: DialogProps<{
  fields: { id: string; name: LocalizableUserText; type: ProfileTypeFieldType }[];
}>) {
  return (
    <ErrorDialog
      {...props}
      header={
        <FormattedMessage
          id="component.unique-value-conflict-dialog.header"
          defaultMessage="Unique value conflict"
        />
      }
      message={
        <Stack gap={2}>
          <FormattedMessage
            id="component.unique-value-conflict-dialog.body"
            defaultMessage="Can't save to the profile because the value in the following properties already exists in another profile."
          />
          <List>
            {fields.map((field) => {
              return (
                <ListItem key={field.id}>
                  <ProfileTypeFieldReference field={field} />
                </ListItem>
              );
            })}
          </List>
        </Stack>
      }
    />
  );
}

export function useUniqueValueConflictDialog() {
  return useDialog(UniqueValueConflictDialog);
}
