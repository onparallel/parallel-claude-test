import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useConfirmDeleteDialog } from "@parallel/components/common/dialogs/ConfirmDeleteDialog";
import { Text } from "@parallel/components/ui";
import { usePermanentlyDeleteProfile_deleteProfileDocument } from "@parallel/graphql/__types";
import { ReactNode, useCallback } from "react";
import { FormattedMessage } from "react-intl";

export function usePermanentlyDeleteProfile() {
  const [deleteProfile] = useMutation(usePermanentlyDeleteProfile_deleteProfileDocument);
  const showConfirmPermanentlyDeleteProfile = useConfirmPermanentlyDeleteProfileDialog();

  return async function ({
    profileIds,
    profileName,
  }: {
    profileIds: string[];
    profileName: ReactNode;
  }) {
    try {
      await showConfirmPermanentlyDeleteProfile({
        profileCount: profileIds.length,
        profileName,
      });
      await deleteProfile({
        variables: {
          profileIds,
          force: true,
        },
        update(cache) {
          for (const id of profileIds) {
            cache.evict({ id });
          }
          cache.gc();
        },
      });
    } catch {}
  };
}

usePermanentlyDeleteProfile.mutations = [
  gql`
    mutation usePermanentlyDeleteProfile_deleteProfile($profileIds: [GID!]!, $force: Boolean) {
      deleteProfile(profileIds: $profileIds, force: $force)
    }
  `,
];

function useConfirmPermanentlyDeleteProfileDialog() {
  const showDialog = useConfirmDeleteDialog();
  return useCallback(
    async ({ profileCount, profileName }: { profileCount: number; profileName: ReactNode }) => {
      return await showDialog({
        size: "lg",
        header: (
          <FormattedMessage
            id="component.use-confirm-permanently-delete-profile-dialog.header"
            defaultMessage="Permanently delete"
          />
        ),
        description: (
          <Text>
            <FormattedMessage
              id="component.use-confirm-permanently-delete-profile-dialog.description"
              defaultMessage="If you continue, {profileCount, plural, =1 {the profile <b>{profileName}</b>} other {the selected profiles}} and its content will be permanently deleted and you won't be able to recover it."
              values={{
                profileCount,
                profileName,
              }}
            />
          </Text>
        ),
      });
    },
    [],
  );
}
