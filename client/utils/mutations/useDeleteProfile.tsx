import { gql, useMutation } from "@apollo/client";
import { Button, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useDeleteProfile_scheduleProfileForDeletionDocument } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";

export function useDeleteProfile() {
  const [scheduleProfileForDeletion] = useMutation(
    useDeleteProfile_scheduleProfileForDeletionDocument,
  );

  const showConfirmDeleteProfile = useConfirmDeleteProfileDialog();

  return async function ({ profileIds }: { profileIds: string[] }) {
    try {
      await showConfirmDeleteProfile({
        profileCount: profileIds.length,
      });
      await scheduleProfileForDeletion({
        variables: {
          profileIds,
        },
      });
    } catch {}
  };
}

useDeleteProfile.mutations = [
  gql`
    mutation useDeleteProfile_scheduleProfileForDeletion($profileIds: [GID!]!) {
      scheduleProfileForDeletion(profileIds: $profileIds) {
        id
        status
      }
    }
  `,
];

function ConfirmDeleteProfileDialog({
  profileCount,
  ...props
}: DialogProps<{ profileCount: number }, void>) {
  return (
    <ConfirmDialog
      {...props}
      content={{
        as: "form",
        onSubmit: () => {
          props.onResolve();
        },
      }}
      hasCloseButton
      header={
        <FormattedMessage
          id="component.confirm-delete-profile-dialog.header"
          defaultMessage="Delete {count, plural, =1 {profile} other {# profiles}}"
          values={{
            count: profileCount,
          }}
        />
      }
      body={
        <Text>
          <FormattedMessage
            id="component.confirm-delete-profile-dialog.description"
            defaultMessage="If you continue, {profileCount, plural, =1 {this profile} other {the selected profiles}} will go to the recycle bin and will be permanently deleted after {n} days."
            values={{
              profileCount,
              n: 90,
            }}
          />
        </Text>
      }
      confirm={
        <Button type="submit" colorScheme="red">
          <FormattedMessage id="generic.delete" defaultMessage="Delete" />
        </Button>
      }
    />
  );
}

function useConfirmDeleteProfileDialog() {
  return useDialog(ConfirmDeleteProfileDialog);
}
