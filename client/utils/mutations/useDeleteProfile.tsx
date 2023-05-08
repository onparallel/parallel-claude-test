import { gql, useMutation } from "@apollo/client";
import { Text } from "@chakra-ui/react";
import { useConfirmDeleteDialog } from "@parallel/components/common/dialogs/ConfirmDeleteDialog";
import { useDeleteProfile_deleteProfileDocument } from "@parallel/graphql/__types";
import { useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { isDefined } from "remeda";
import { isApolloError } from "../apollo/isApolloError";
import { withError } from "../promises/withError";

export function useDeleteProfile() {
  const [deleteProfile] = useMutation(useDeleteProfile_deleteProfileDocument);
  const showConfirmDeleteProfile = useConfirmDeleteProfileDialog();

  return async function ({ profileIds }: { profileIds: string[] }) {
    try {
      const [error] = await withError(
        deleteProfile({
          variables: {
            profileIds,
          },
          update(cache) {
            for (const id of profileIds) {
              cache.evict({ id });
            }
            cache.gc();
          },
        })
      );

      if (isDefined(error)) {
        if (isApolloError(error, "PROFILE_HAS_REPLIES_ERROR")) {
          await showConfirmDeleteProfile({
            profileCount: profileIds.length,
            profileFieldsCount: error.graphQLErrors[0].extensions.count as number,
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
        } else {
          throw error;
        }
      }
    } catch {}
  };
}

useDeleteProfile.mutations = [
  gql`
    mutation useDeleteProfile_deleteProfile($profileIds: [GID!]!, $force: Boolean) {
      deleteProfile(profileIds: $profileIds, force: $force)
    }
  `,
];

function useConfirmDeleteProfileDialog() {
  const showDialog = useConfirmDeleteDialog();
  return useCallback(
    async ({
      profileCount,
      profileFieldsCount,
    }: {
      profileCount: number;
      profileFieldsCount: number;
    }) => {
      return await showDialog({
        size: "lg",
        header: (
          <FormattedMessage
            id="component.use-confirm-delete-profile-dialog.header"
            defaultMessage="Delete {count, plural, =1 {profile} other {# profiles}}"
            values={{
              count: profileCount,
            }}
          />
        ),
        description: (
          <Text>
            <FormattedMessage
              id="component.use-confirm-delete-profile-dialog.description"
              defaultMessage="You are about to delete {profileCount, plural, =1 {this profile} other {the selected profiles}}. Please note that there <b>{count, plural, =1 {is 1 property} other {are # properties}}</b> responded to {profileCount, plural, =1 {on this profile} other {in these profiles}}, and if you proceed, {count, plural, =1 {this reply} other {these replies}} will be permanently deleted."
              values={{
                profileCount,
                count: profileFieldsCount,
              }}
            />
          </Text>
        ),
      });
    },
    []
  );
}
