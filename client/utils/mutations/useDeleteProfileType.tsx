import { gql } from "@apollo/client";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { Alert, AlertDescription, AlertIcon, Button, Stack, Text } from "@chakra-ui/react";
import { useConfirmDeleteDialog } from "@parallel/components/common/dialogs/ConfirmDeleteDialog";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import {
  useDeleteProfileType_deleteProfileTypeDocument,
  useDeleteProfileType_profilesSimpleDocument,
  useDeleteProfileType_ProfileTypeFragment,
} from "@parallel/graphql/__types";
import Link from "next/link";
import { useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { isApolloError } from "../apollo/isApolloError";

export function useDeleteProfileType() {
  const [deleteProfileType] = useMutation(useDeleteProfileType_deleteProfileTypeDocument);
  const client = useApolloClient();
  const showConfirmDeleteWithProfiles = useDialog(ConfirmDeleteProfileTypeDialog);
  const showConfirmDeleteWithSubscriptions = useConfirmDeleteProfileTypeWithSubscriptionsDialog();

  const showConfirmDelete = useConfirmDeleteProfileTypeDialog();

  return async function ({
    profileTypes,
  }: {
    profileTypes: useDeleteProfileType_ProfileTypeFragment[];
  }) {
    try {
      const { data } = await client.query({
        query: useDeleteProfileType_profilesSimpleDocument,
        variables: {
          profileTypeId: profileTypes.map((pt) => pt.id),
        },
        fetchPolicy: "network-only",
      });

      if (data!.profilesSimple.totalCount > 0) {
        await showConfirmDeleteWithProfiles({
          profileCount: data!.profilesSimple.totalCount,
          profileTypes,
        });
      } else {
        await deleteProfileType({
          variables: {
            profileTypeIds: profileTypes.map((profileType) => profileType.id),
            dryRun: true,
          },
        });
        // if dryrun succeeds, show the generic confirm delete dialog
        await showConfirmDelete({
          profileTypes,
        });
      }

      const { data: res } = await deleteProfileType({
        variables: { profileTypeIds: profileTypes.map((profileType) => profileType.id) },
        update(cache) {
          for (const profile of profileTypes) {
            cache.evict({ id: profile.id });
          }
          cache.gc();
        },
      });

      return res!.deleteProfileType;
    } catch (error) {
      // dryrun failed, show the confirm delete with subscriptions dialog
      if (isApolloError(error, "EVENT_SUBSCRIPTION_EXISTS_ERROR")) {
        try {
          await showConfirmDeleteWithSubscriptions({
            profileTypes,
            subscriptionCount: error.errors[0].extensions?.count as number,
          });
          const { data: res } = await deleteProfileType({
            variables: {
              profileTypeIds: profileTypes.map((profileType) => profileType.id),
              force: true,
            },
          });
          return res!.deleteProfileType;
        } catch {}
      }
      return "FAILURE";
    }
  };
}

useDeleteProfileType.fragments = {
  get ProfileType() {
    return gql`
      fragment useDeleteProfileType_ProfileType on ProfileType {
        id
        name
      }
    `;
  },
};

useDeleteProfileType.queries = [
  gql`
    query useDeleteProfileType_profilesSimple($profileTypeId: [GID!]!) {
      profilesSimple(profileTypeId: $profileTypeId) {
        totalCount
      }
    }
  `,
];

useDeleteProfileType.mutations = [
  gql`
    mutation useDeleteProfileType_deleteProfileType(
      $profileTypeIds: [GID!]!
      $dryRun: Boolean
      $force: Boolean
    ) {
      deleteProfileType(profileTypeIds: $profileTypeIds, dryRun: $dryRun, force: $force)
    }
  `,
];

function useConfirmDeleteProfileTypeDialog() {
  const showDialog = useConfirmDeleteDialog();
  return useCallback(
    async ({ profileTypes }: { profileTypes: useDeleteProfileType_ProfileTypeFragment[] }) => {
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
            <Text>
              <FormattedMessage
                id="component.use-delete-profile-type.want-delete-profile-types"
                defaultMessage="Are you sure you want to delete {count, plural, =1{{name}} other {these profile types}}? You won't be able to create profiles using {count, plural, =1{this type} other {any of these types}}."
                values={{
                  count: profileTypes.length,
                  name: (
                    <Text as="strong">
                      <LocalizableUserTextRender
                        value={profileTypes[0].name}
                        default={
                          <FormattedMessage
                            id="generic.unnamed-profile-type"
                            defaultMessage="Unnamed profile type"
                          />
                        }
                      />
                    </Text>
                  ),
                }}
              />
            </Text>
          </Stack>
        ),
      });
    },
    [],
  );
}

function ConfirmDeleteProfileTypeDialog({
  profileCount,
  profileTypes,
  ...props
}: DialogProps<{
  profileCount: number;
  profileTypes: useDeleteProfileType_ProfileTypeFragment[];
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
        <Stack>
          <Alert status="warning">
            <AlertIcon />
            <AlertDescription>
              <FormattedMessage
                id="component.use-delete-profile-type.profiles-in-use"
                defaultMessage="There {count, plural, =1 {is <a>1 profile</a>} other {are <a># profiles</a>}} using {profileTypeCount, plural, =1 {this profile type} other {these profile types}}."
                values={{
                  count: profileCount,
                  profileTypeCount: profileTypes.length,
                  a: (chunks) => (
                    <Link
                      href={`/app/profiles?${new URLSearchParams({
                        type: profileTypes.map((pt) => pt.id).join(","),
                      })}`}
                    >
                      <Text as="span" fontWeight={600} color="purple.500">
                        {chunks}
                      </Text>
                    </Link>
                  ),
                }}
              />
            </AlertDescription>
          </Alert>
          <Text>
            <FormattedMessage
              id="component.confirm-delete-profile-type.want-delete-profile-types"
              defaultMessage="To be able to delete {count, plural, =1 {this profile type} other {these profile types}}, first delete all profiles using {count, plural, =1 {this type} other {these types}}."
              values={{
                count: profileTypes.length,
              }}
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button colorScheme="primary" onClick={() => props.onReject("CANCEL")}>
          <FormattedMessage id="generic.accept" defaultMessage="Accept" />
        </Button>
      }
    />
  );
}

function useConfirmDeleteProfileTypeWithSubscriptionsDialog() {
  const showDialog = useConfirmDeleteDialog();
  return async ({
    profileTypes,
    subscriptionCount,
  }: {
    profileTypes: useDeleteProfileType_ProfileTypeFragment[];
    subscriptionCount: number;
  }) => {
    return await showDialog({
      header: (
        <FormattedMessage
          id="component.confirm-delete-profile-type-with-subscriptions.confirm-delete-header"
          defaultMessage="Delete {count, plural, =1 {profile type} other {profile types}}"
          values={{
            count: profileTypes.length,
          }}
        />
      ),
      description: (
        <Stack>
          <FormattedMessage
            id="component.confirm-delete-profile-type-with-subscriptions.subscriptions-in-use"
            defaultMessage="There {count, plural, =1 {is 1 event subscription} other {are # event subscriptions}} using {profileTypeCount, plural, =1 {this profile type} other {these profile types}}."
            values={{
              count: subscriptionCount,
              profileTypeCount: profileTypes.length,
            }}
          />

          <Text>
            <FormattedMessage
              id="component.confirm-delete-profile-type-with-subscriptions.want-delete-profile-types"
              defaultMessage="If you continue, any applications or scripts using these event subscriptions will no longer receive event notifications from Parallel."
            />
          </Text>
        </Stack>
      ),
    });
  };
}
