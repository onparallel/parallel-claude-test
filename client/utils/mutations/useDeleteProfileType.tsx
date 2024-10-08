import { gql, useApolloClient, useMutation } from "@apollo/client";
import { Alert, AlertDescription, AlertIcon, Button, Stack, Text } from "@chakra-ui/react";
import { useConfirmDeleteDialog } from "@parallel/components/common/dialogs/ConfirmDeleteDialog";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import {
  useDeleteProfileType_deleteProfileTypeDocument,
  useDeleteProfileType_profilesDocument,
  useDeleteProfileType_ProfileTypeFragment,
} from "@parallel/graphql/__types";
import Link from "next/link";
import { useCallback } from "react";
import { FormattedMessage } from "react-intl";

export function useDeleteProfileType() {
  const [deleteProfileType] = useMutation(useDeleteProfileType_deleteProfileTypeDocument);
  const client = useApolloClient();
  const showConfirmDeleteWithProfiles = useDialog(ConfirmDeleteProfileTypeDialog);
  const showConfirmDelete = useConfirmDeleteProfileTypeDialog();

  return async function ({
    profileTypes,
  }: {
    profileTypes: useDeleteProfileType_ProfileTypeFragment[];
  }) {
    try {
      const { data } = await client.query({
        query: useDeleteProfileType_profilesDocument,
        variables: {
          filter: {
            profileTypeId: profileTypes.map((pt) => pt.id),
          },
        },
        fetchPolicy: "network-only",
      });

      if (data!.profiles.totalCount > 0) {
        await showConfirmDeleteWithProfiles({
          profileCount: data!.profiles.totalCount,
          profileTypes,
        });
      } else {
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

      return res?.deleteProfileType;
    } catch {}
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
    query useDeleteProfileType_profiles($filter: ProfileFilter) {
      profiles(filter: $filter) {
        totalCount
      }
    }
  `,
];

useDeleteProfileType.mutations = [
  gql`
    mutation useDeleteProfileType_deleteProfileType($profileTypeIds: [GID!]!) {
      deleteProfileType(profileTypeIds: $profileTypeIds)
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
  profileCount: profilesCount,
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
                  count: profilesCount,
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
