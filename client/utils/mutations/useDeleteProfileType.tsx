import { gql, useLazyQuery, useMutation } from "@apollo/client";
import { Alert, AlertDescription, AlertIcon, Button, Stack, Text } from "@chakra-ui/react";
import { useConfirmDeleteDialog } from "@parallel/components/common/dialogs/ConfirmDeleteDialog";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { localizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import {
  useDeleteProfileType_deleteProfileTypeDocument,
  useDeleteProfileType_profilesDocument,
  useDeleteProfileType_ProfileTypeFragment,
} from "@parallel/graphql/__types";
import { useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";

export function useDeleteProfileType() {
  const [deleteProfileType] = useMutation(useDeleteProfileType_deleteProfileTypeDocument);

  const [getProfile] = useLazyQuery(useDeleteProfileType_profilesDocument, {
    fetchPolicy: "network-only",
  });

  const showConfirmDelete = useDialog(ConfirmDeleteProfileTypeDialog);
  const showConfirmDeleteWithProfiles = useConfirmDeleteProfileTypeDialog();

  return async function ({
    profileTypes,
  }: {
    profileTypes: useDeleteProfileType_ProfileTypeFragment[];
  }) {
    try {
      const { data } = await getProfile({
        variables: {
          filter: {
            profileTypeId: profileTypes.map((pt) => pt.id),
          },
        },
      });

      const profilesCount = data?.profiles.totalCount;

      if (profilesCount) {
        await showConfirmDeleteWithProfiles({
          profilesCount,
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
  const intl = useIntl();
  return useCallback(
    async ({
      profilesCount,
      profileTypes,
    }: {
      profilesCount: number;
      profileTypes: useDeleteProfileType_ProfileTypeFragment[];
    }) => {
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
                  name: localizableUserTextRender({
                    value: profileTypes[0].name,
                    intl,
                    default: intl.formatMessage({
                      id: "generic.unamed-profile-type",
                      defaultMessage: "Unnamed profile type",
                    }),
                  }),
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
  profileTypes: useDeleteProfileType_ProfileTypeFragment[];
}>) {
  const intl = useIntl();

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
              name: localizableUserTextRender({
                value: profileTypes[0].name,
                intl,
                default: intl.formatMessage({
                  id: "generic.unamed-profile-type",
                  defaultMessage: "Unnamed profile type",
                }),
              }),
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
