import { Alert, AlertDescription, AlertIcon, Button, Stack, Text } from "@chakra-ui/react";
import { useConfirmDeleteDialog } from "@parallel/components/common/dialogs/ConfirmDeleteDialog";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { isApolloError } from "../apollo/isApolloError";

export function useDeleteProfileType() {
  // const [deleteProfileType] = useMutation(useDeleteProfileType_deleteProfileDocument);

  const showConfirmDelete = useDialog(ConfirmDeleteProfileTypeDialog);
  const showConfirmDeleteWithProfiles = useConfirmDeleteProfileTypeDialog();
  //TODO delete profile types

  return async function ({ profileTypes }: { profileTypes: any[] }) {
    try {
      // const { data } = await deleteProfileType({
      //   variables: { id },
      //   update(cache) {
      //     cache.evict({ id });
      //     cache.gc();
      //   },
      // });
      // return data!.deleteProfileType;
      const random = Math.floor(Math.random() * 10) + 1;
      if (random % 2 === 0) {
        await showConfirmDelete({
          profileTypes,
        });
      } else {
        await showConfirmDeleteWithProfiles({
          profilesCount: random,
          profileTypes,
        });
      }

      return;
    } catch (e) {
      if (isApolloError(e, "PROFILE_TYPE_IS_USED")) {
        await showConfirmDeleteWithProfiles({
          profilesCount: (e.graphQLErrors[0].extensions as any)?.data?.propertiesInUsee ?? 0,
          profileTypes,
        });
        // const { data } = await deleteProfileType({
        //   variables: { id, force: true },
        //   update(cache) {
        //     cache.evict({ id });
        //     cache.gc();
        //   },
        // });

        // return data!.deleteProfileType;
      }
    }
  };
}

// useDeleteProfileType.mutations = [
//   gql`
//     mutation useDeleteProfileType_deleteProfileType($id: GID!, $force: Boolean) {
//       deleteProfileType(id: $id, force: $force)
//     }
//   `,
// ];

function useConfirmDeleteProfileTypeDialog() {
  const showDialog = useConfirmDeleteDialog();
  return useCallback(
    async ({ profilesCount, profileTypes }: { profilesCount: number; profileTypes: any[] }) => {
      return await showDialog({
        size: "lg",
        header: (
          <FormattedMessage
            id="component.use-delete-profile-type.confirm-delete-header"
            defaultMessage="Delete {count, plural, =1 {profile type} other {# profile types}}"
            values={{
              count: profileTypes.length,
            }}
          />
        ),
        description: (
          <Stack>
            <Alert status="warning">
              <AlertIcon color="yellow.500" />
              <AlertDescription>
                {profileTypes.length > 1 ? (
                  <FormattedMessage
                    id="component.use-delete-profile-type.found-profiles-in-use"
                    defaultMessage="We have found profiles created from one of these profile types."
                  />
                ) : (
                  <FormattedMessage
                    id="component.use-delete-profile-type.profiles-in-use"
                    defaultMessage="There are <b>{count, plural, =1 {1 profile} other {# profiles}}</b> created using this profile type."
                    values={{
                      count: profilesCount,
                    }}
                  />
                )}
              </AlertDescription>
            </Alert>
            <Text>
              <FormattedMessage
                id="component.use-delete-profile-type.if-proceed-delete-profiles"
                defaultMessage="If you proceed, the profiles will be deleted and the information they contain will be lost."
              />
            </Text>
            <Text>
              <FormattedMessage
                id="component.use-delete-profile-type.want-delete-profile-types"
                defaultMessage="Are you sure you want to delete {count, plural, =1{<b>{name}</b>} other {these profile types}}?"
                values={{
                  count: profileTypes.length,
                  name: profileTypes[0].name,
                }}
              />
            </Text>
          </Stack>
        ),
      });
    },
    []
  );
}

function ConfirmDeleteProfileTypeDialog({
  profileTypes,
  ...props
}: DialogProps<{
  profileTypes: any[];
}>) {
  return (
    <ConfirmDialog
      {...props}
      header={
        <FormattedMessage
          id="component.confirm-delete-profile-type.confirm-delete-header"
          defaultMessage="Delete {count, plural, =1 {profile type} other {profile types}}"
          values={{
            count: profileTypes.length,
          }}
        />
      }
      body={
        <Text>
          <FormattedMessage
            id="component.confirm-delete-profile-type.want-delete-profile-types"
            defaultMessage="Are you sure you want to delete <b>{count, plural, =1 {{name}} other {# selected profile types}}</b>?"
            values={{
              count: profileTypes.length,
              name: profileTypes[0].name,
            }}
          />
        </Text>
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.confirm-delete-button" defaultMessage="Yes, delete" />
        </Button>
      }
    />
  );
}
