import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { Button, Stack, Text } from "@parallel/components/ui";

import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useReopenProfile_reopenProfileDocument } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";

export function useReopenProfile() {
  const showReopenProfileDialog = useReopenProfileDialog();
  const [reopenProfile] = useMutation(useReopenProfile_reopenProfileDocument);
  return async function ({
    profileIds,
    profileName,
    confirmText,
  }: {
    profileIds: string[];
    profileName: React.ReactNode;
    confirmText?: string;
  }) {
    try {
      await showReopenProfileDialog({ profileCount: profileIds.length, profileName, confirmText });
      await reopenProfile({
        variables: {
          profileIds,
        },
      });
    } catch {}
  };
}

useReopenProfile.mutations = [
  gql`
    mutation useReopenProfile_reopenProfile($profileIds: [GID!]!) {
      reopenProfile(profileIds: $profileIds) {
        id
        status
      }
    }
  `,
];

function ReopenProfileDialog({
  profileCount,
  profileName,
  confirmText,
  ...props
}: DialogProps<
  { profileName: React.ReactNode; profileCount: number; confirmText?: string },
  void
>) {
  return (
    <ConfirmDialog
      {...props}
      content={{
        containerProps: {
          as: "form",
          onSubmit: () => {
            props.onResolve();
          },
        },
      }}
      hasCloseButton
      header={
        <FormattedMessage
          id="component.reopen-profile-dialog.header"
          defaultMessage="Reopen {count, plural, =1 {profile} other {# profiles}}"
          values={{ count: profileCount }}
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.reopen-profile-dialog.body"
              defaultMessage="When you reopen a profile, you will be able to edit its content again. Any data already anonymized cannot be recovered."
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.reopen-profile-dialog.body-question"
              defaultMessage="Do you want to reopen {count, plural, =1 {the profile of {profileName}} other {the selected profiles}}?"
              values={{
                profileName: (
                  <Text as="span" fontWeight="bold">
                    {profileName}
                  </Text>
                ),
                count: profileCount,
              }}
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button type="submit" colorPalette="primary">
          {confirmText ?? (
            <FormattedMessage
              id="component.reopen-profile-dialog.reopen-button"
              defaultMessage="Reopen"
            />
          )}
        </Button>
      }
    />
  );
}

function useReopenProfileDialog() {
  return useDialog(ReopenProfileDialog);
}
