import { List, ListItem } from "@chakra-ui/react";
import {
  LocalizableUserText,
  LocalizableUserTextRender,
} from "@parallel/components/common/LocalizableUserTextRender";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { ErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { Stack, Text } from "@parallel/components/ui";
import { FormattedMessage } from "react-intl";

export interface RecoverProfileConflict {
  recoveringProfileId: string;
  recoveringProfileName: LocalizableUserText;
  profileTypeFieldId: string;
  profileTypeFieldName: LocalizableUserText;
  conflictingProfileId: string;
  conflictingProfileName: LocalizableUserText;
  value: string;
}

function RecoverProfileConflictDialog({
  conflicts,
  ...props
}: DialogProps<{
  conflicts: RecoverProfileConflict[];
}>) {
  // Group conflicts by recovering profile
  const groupedByProfile = conflicts.reduce(
    (acc, conflict) => {
      const key = conflict.recoveringProfileId;
      if (!acc[key]) {
        acc[key] = {
          profileName: conflict.recoveringProfileName,
          conflicts: [],
        };
      }
      acc[key].conflicts.push(conflict);
      return acc;
    },
    {} as Record<string, { profileName: LocalizableUserText; conflicts: RecoverProfileConflict[] }>,
  );

  return (
    <ErrorDialog
      {...props}
      header={
        <FormattedMessage
          id="component.recover-profile-conflict-dialog.header"
          defaultMessage="Cannot recover profile"
        />
      }
      message={
        <Stack gap={4}>
          <Text>
            <FormattedMessage
              id="component.recover-profile-conflict-dialog.body"
              defaultMessage="The following profiles cannot be recovered because their unique field values now conflict with existing profiles:"
            />
          </Text>
          {Object.entries(groupedByProfile).map(([profileId, { profileName, conflicts }]) => (
            <Stack key={profileId} gap={2}>
              <Text fontWeight="bold">
                <LocalizableUserTextRender value={profileName} default="" />
              </Text>
              <List paddingStart={4}>
                {conflicts.map((conflict, idx) => (
                  <ListItem key={idx}>
                    <Text>
                      <FormattedMessage
                        id="component.recover-profile-conflict-dialog.conflict-item"
                        defaultMessage={`{fieldName}: value "{value}" conflicts with profile {conflictingProfileName}`}
                        values={{
                          fieldName: (
                            <LocalizableUserTextRender
                              value={conflict.profileTypeFieldName}
                              default=""
                            />
                          ),
                          value: conflict.value,
                          conflictingProfileName: (
                            <Text as="span" fontWeight="semibold">
                              <LocalizableUserTextRender
                                value={conflict.conflictingProfileName}
                                default=""
                              />
                            </Text>
                          ),
                        }}
                      />
                    </Text>
                  </ListItem>
                ))}
              </List>
            </Stack>
          ))}
        </Stack>
      }
    />
  );
}

export function useRecoverProfileConflictDialog() {
  return useDialog(RecoverProfileConflictDialog);
}
