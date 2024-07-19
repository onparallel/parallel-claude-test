import { gql, useMutation, useQuery } from "@apollo/client";
import { Button, Center, HStack, Heading, Stack, Text } from "@chakra-ui/react";
import { AddIcon, CloseIconSmall } from "@parallel/chakra/icons";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { TableColumn } from "@parallel/components/common/Table";
import {
  ProfileRelationshipsTable_ProfileFragment,
  ProfileRelationshipsTable_ProfileRelationshipFragment,
  ProfileRelationshipsTable_createProfileRelationshipDocument,
  ProfileRelationshipsTable_profileDocument,
  ProfileRelationshipsTable_removeProfileRelationshipDocument,
  UserLocale,
} from "@parallel/graphql/__types";
import { useGoToProfile } from "@parallel/utils/goToProfile";
import { integer, useQueryState, values } from "@parallel/utils/queryState";
import { useSelection } from "@parallel/utils/useSelectionState";
import { MouseEvent, useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, noop } from "remeda";
import { assert } from "ts-essentials";
import { LocalizableUserTextRender } from "../common/LocalizableUserTextRender";
import { ProfileReference } from "../common/ProfileReference";
import { Spacer } from "../common/Spacer";
import { TablePage } from "../common/TablePage";
import { useConfirmRemoveProfileRelationshipsDialog } from "./dialogs/ConfirmRemoveProfileRelationshipsDialog";
import { useCreateProfileRelationshipsDialog } from "./dialogs/CreateProfileRelationshipsDialog";

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  items: values([10, 25, 50]).orDefault(10),
};

export function ProfileRelationshipsTable({ profileId }: { profileId: string }) {
  const [state, setQueryState] = useQueryState(QUERY_STATE, { prefix: "r_" });

  const { data, loading, refetch } = useQuery(ProfileRelationshipsTable_profileDocument, {
    variables: {
      profileId,
    },
  });

  const profile = data?.profile;

  const columns = useProfileRelationshipsTableColumns({ profileId });
  const rows = data?.profile.relationships.filter((r) => {
    // filter out "deleted" profiles
    const otherProfile =
      r.leftSideProfile.id === profileId ? r.rightSideProfile : r.leftSideProfile;
    return otherProfile.status !== "DELETION_SCHEDULED";
  });
  const { page, items } = state;

  const [tableRows, totalCount] = useMemo(() => {
    if (!rows) {
      return [[], 0];
    }
    return [rows.slice((page - 1) * items, page * items), rows.length];
  }, [rows, page, items]);

  const { selectedRows, selectedIds, onChangeSelectedIds } = useSelection(tableRows, "id");

  const [createProfileRelationship] = useMutation(
    ProfileRelationshipsTable_createProfileRelationshipDocument,
  );
  const showCreateProfileRelationshipDialog = useCreateProfileRelationshipsDialog();
  const handleCreateProfileRelationship = async () => {
    try {
      assert(isDefined(profile));

      const relationships = await showCreateProfileRelationshipDialog({ profile });
      await createProfileRelationship({
        variables: {
          profileId: profile.id,
          relationships: relationships.map((r) => ({
            ...r,
            // swap directions as the mutation's perspective is from profile.id
            direction: r.direction === "LEFT_RIGHT" ? "RIGHT_LEFT" : "LEFT_RIGHT",
          })),
        },
      });
    } catch {}
  };

  const [removeProfileRelationship] = useMutation(
    ProfileRelationshipsTable_removeProfileRelationshipDocument,
  );
  const showConfirmRemoveProfileRelationshipsDialog = useConfirmRemoveProfileRelationshipsDialog();
  const handleRemoveRelationships = async () => {
    try {
      if (!profile || selectedRows.length === 0) return;

      const selectedProfile =
        selectedRows[0].leftSideProfile.id === profileId
          ? selectedRows[0].rightSideProfile
          : selectedRows[0].leftSideProfile;

      await showConfirmRemoveProfileRelationshipsDialog({
        relatedProfileName: <ProfileReference profile={selectedProfile} />,
        profileName: <ProfileReference profile={profile} />,
        selectedProfiles: selectedIds.length,
      });

      await removeProfileRelationship({
        variables: { profileId: profile.id, profileRelationshipIds: selectedIds },
      });

      await refetch();
    } catch {}
  };

  const goToProfile = useGoToProfile();
  const handleRowClick = useCallback(
    function (row: ProfileRelationshipsTable_ProfileRelationshipFragment, event: MouseEvent) {
      const { rightSideProfile, leftSideProfile } = row;
      const profile = leftSideProfile.id === profileId ? rightSideProfile : leftSideProfile;
      goToProfile(profile.id, event);
    },
    [profileId],
  );

  const actions = useProfileRelationshipsActions({
    profile,
    onRemoveClick: () => handleRemoveRelationships(),
  });

  return (
    <TablePage
      flex="1 1 auto"
      minHeight={0}
      rowKeyProp="id"
      isSelectable={profile?.status !== "DELETION_SCHEDULED"}
      isHighlightable
      loading={loading}
      columns={columns}
      rows={tableRows}
      onRowClick={handleRowClick}
      page={page}
      pageSize={items}
      totalCount={totalCount}
      onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
      onPageSizeChange={(items) => setQueryState((s) => ({ ...s, items: items as any, page: 1 }))}
      onSortChange={noop}
      actions={actions}
      onSelectionChange={onChangeSelectedIds}
      header={
        <HStack paddingX={4} paddingY={2} height={14}>
          <Heading size="md">
            <FormattedMessage
              id="component.profile-relationships-table.header"
              defaultMessage="Associated profiles"
            />
          </Heading>
          <Spacer />
          <Button
            leftIcon={<AddIcon />}
            onClick={handleCreateProfileRelationship}
            isDisabled={
              !profile || profile?.status === "DELETION_SCHEDULED" || (rows && rows.length >= 100)
            }
          >
            <FormattedMessage
              id="component.profile-relationships-table.add-relationship"
              defaultMessage="Add profile"
            />
          </Button>
        </HStack>
      }
      body={
        !loading && rows?.length === 0 ? (
          <Center minHeight="150px" height="full">
            <Stack>
              <Text color="gray.400">
                <FormattedMessage
                  id="component.profile-relationships-table.no-relationships"
                  defaultMessage="There are no profiles associated to this profile yet."
                />
              </Text>
              <Button
                variant="link"
                onClick={handleCreateProfileRelationship}
                isDisabled={!profile || profile?.status === "DELETION_SCHEDULED"}
              >
                <FormattedMessage
                  id="component.profile-relationships-table.add-relationship"
                  defaultMessage="Add profile"
                />
              </Button>
            </Stack>
          </Center>
        ) : null
      }
    />
  );
}
function useProfileRelationshipsTableColumns({
  profileId,
}: {
  profileId: string;
}): TableColumn<ProfileRelationshipsTable_ProfileRelationshipFragment>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "name",
        label: intl.formatMessage({
          id: "generic.name",
          defaultMessage: "Name",
        }),
        cellProps: {
          width: "40%",
          minWidth: "240px",
        },
        CellContent: ({ row: { rightSideProfile, leftSideProfile } }) => {
          const profile = leftSideProfile.id === profileId ? rightSideProfile : leftSideProfile;
          return (
            <OverflownText>
              <ProfileReference profile={profile} />
            </OverflownText>
          );
        },
      },
      {
        key: "type",
        label: intl.formatMessage({
          id: "component.profile-table-columns.profile-type",
          defaultMessage: "Profile type",
        }),
        cellProps: {
          width: "30%",
          minWidth: "240px",
        },
        CellContent: ({ row: { rightSideProfile, leftSideProfile } }) => {
          const profile = leftSideProfile.id === profileId ? rightSideProfile : leftSideProfile;
          return (
            <Text as="span">
              <LocalizableUserTextRender
                value={profile.profileType.name}
                default={intl.formatMessage({
                  id: "generic.unnamed-profile-type",
                  defaultMessage: "Unnamed profile type",
                })}
              />
            </Text>
          );
        },
      },
      {
        key: "relationship",
        label: intl.formatMessage({
          id: "component.profile-table-columns.relationship",
          defaultMessage: "Relationship",
        }),
        cellProps: {
          width: "30%",
          minWidth: "240px",
        },
        CellContent: ({ row: { leftSideProfile, relationshipType } }) => {
          const relationshipName =
            relationshipType[leftSideProfile.id === profileId ? "rightLeftName" : "leftRightName"];
          return <Text as="span">{relationshipName[intl.locale as UserLocale]}</Text>;
        },
      },
    ],
    [intl.locale, profileId],
  );
}

ProfileRelationshipsTable.fragments = {
  RelatedProfile: gql`
    fragment ProfileRelationshipsTable_RelatedProfile on Profile {
      id
      ...ProfileReference_Profile
      profileType {
        id
        name
      }
      ...useCreateProfileRelationshipsDialog_Profile
    }
    ${ProfileReference.fragments.Profile}
    ${useCreateProfileRelationshipsDialog.fragments.Profile}
  `,
  ProfileRelationship: gql`
    fragment ProfileRelationshipsTable_ProfileRelationship on ProfileRelationship {
      id
      leftSideProfile {
        ...ProfileRelationshipsTable_RelatedProfile
      }
      rightSideProfile {
        ...ProfileRelationshipsTable_RelatedProfile
      }
      relationshipType {
        alias
        id
        leftRightName
        rightLeftName
      }
    }
  `,
  Profile: gql`
    fragment ProfileRelationshipsTable_Profile on Profile {
      id
      ...ProfileReference_Profile
      status
      relationships {
        ...ProfileRelationshipsTable_ProfileRelationship
      }
      ...useCreateProfileRelationshipsDialog_Profile
    }
    ${ProfileReference.fragments.Profile}
    ${useCreateProfileRelationshipsDialog.fragments.Profile}
  `,
};

const _mutations = [
  gql`
    mutation ProfileRelationshipsTable_createProfileRelationship(
      $profileId: GID!
      $relationships: [CreateProfileRelationshipInput!]!
    ) {
      createProfileRelationship(profileId: $profileId, relationships: $relationships) {
        ...ProfileRelationshipsTable_Profile
      }
    }
    ${ProfileRelationshipsTable.fragments.Profile}
  `,
  gql`
    mutation ProfileRelationshipsTable_removeProfileRelationship(
      $profileId: GID!
      $profileRelationshipIds: [GID!]!
    ) {
      removeProfileRelationship(
        profileId: $profileId
        profileRelationshipIds: $profileRelationshipIds
      )
    }
  `,
];

const _queries = [
  gql`
    query ProfileRelationshipsTable_profile($profileId: GID!) {
      profile(profileId: $profileId) {
        id
        ...ProfileRelationshipsTable_Profile
      }
    }
    ${ProfileRelationshipsTable.fragments.Profile}
  `,
];

function useProfileRelationshipsActions({
  profile,
  onRemoveClick,
}: {
  profile?: ProfileRelationshipsTable_ProfileFragment;
  onRemoveClick: () => void;
}) {
  return [
    {
      key: "remove",
      onClick: onRemoveClick,
      isDisabled: profile?.status === "DELETION_SCHEDULED",
      leftIcon: <CloseIconSmall />,
      children: (
        <FormattedMessage
          id="component.profile-relationships-table.remove-relationship"
          defaultMessage="Remove association"
        />
      ),
      colorScheme: "red",
    },
  ];
}
