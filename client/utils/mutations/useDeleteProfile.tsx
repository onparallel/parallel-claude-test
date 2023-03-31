import { Text } from "@chakra-ui/react";
import { useConfirmDeleteDialog } from "@parallel/components/common/dialogs/ConfirmDeleteDialog";
import { useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { isApolloError } from "../apollo/isApolloError";

export function useDeleteProfile() {
  // const [deleteProfile] = useMutation(useDeleteProfile_deleteProfileDocument);

  const showConfirmDeleteProfile = useConfirmDeleteProfileDialog();
  //TODO delete profile

  return async function ({ id }: { id: string }) {
    try {
      // const { data } = await deleteProfile({
      //   variables: { id },
      //   update(cache) {
      //     cache.evict({ id });
      //     cache.gc();
      //   },
      // });
      // return data!.deleteProfile;

      await showConfirmDeleteProfile({
        propertiesCount: 5,
      });
    } catch (e) {
      if (isApolloError(e, "PROFILE_IS_USED")) {
        await showConfirmDeleteProfile({
          propertiesCount: (e.graphQLErrors[0].extensions as any)?.data?.propertiesInUsee ?? 0,
        });
        // const { data } = await deleteProfile({
        //   variables: { id, force: true },
        //   update(cache) {
        //     cache.evict({ id });
        //     cache.gc();
        //   },
        // });

        // return data!.deleteProfile;
      }
    }
  };
}

// useDeleteProfile.mutations = [
//   gql`
//     mutation useDeleteProfile_deleteProfile($id: GID!, $force: Boolean) {
//       deleteProfile(id: $id, force: $force)
//     }
//   `,
// ];

function useConfirmDeleteProfileDialog() {
  const showDialog = useConfirmDeleteDialog();
  return useCallback(async ({ propertiesCount }: { propertiesCount: number }) => {
    return await showDialog({
      size: "lg",
      header: (
        <FormattedMessage
          id="component.use-delete-profile.confirm-profile-header"
          defaultMessage="Delete profile"
        />
      ),
      description: (
        <Text>
          <FormattedMessage
            id="component.use-delete-profile.properties-in-use"
            defaultMessage="You are about to delete this profile. Please note that there <b>{count, plural, =1 {is 1 property} other {are # properties}}</b> responded to on this profile, and if you proceed, {count, plural, =1 {this reply} other {these replies}} will be permanently deleted."
            values={{
              count: propertiesCount,
            }}
          />
        </Text>
      ),
    });
  }, []);
}
