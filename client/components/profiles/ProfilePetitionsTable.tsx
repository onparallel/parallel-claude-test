import { gql, useMutation, useQuery } from "@apollo/client";
import { Button, Center, Flex, HStack, Heading, Stack, Text } from "@chakra-ui/react";
import { AddIcon, CloseIconSmall } from "@parallel/chakra/icons";
import { ContactListPopover } from "@parallel/components/common/ContactListPopover";
import { DateTime } from "@parallel/components/common/DateTime";
import { Link, NormalLink } from "@parallel/components/common/Link";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { TableColumn } from "@parallel/components/common/Table";
import {
  ProfilePetitionsTable_PetitionFragment,
  ProfilePetitionsTable_associateProfileToPetitionDocument,
  ProfilePetitionsTable_deassociatePetitionFromProfileDocument,
  ProfilePetitionsTable_petitionsDocument,
} from "@parallel/graphql/__types";
import { EnumerateList } from "@parallel/utils/EnumerateList";
import { FORMATS } from "@parallel/utils/dates";
import { useGoToContact } from "@parallel/utils/goToContact";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { integer, useQueryState, values } from "@parallel/utils/queryState";
import { useSelection } from "@parallel/utils/useSelectionState";
import { MouseEvent, useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, noop } from "remeda";
import { ContactReference } from "../common/ContactReference";
import { PetitionSignatureCellContent } from "../common/PetitionSignatureCellContent";
import { PetitionStatusCellContent } from "../common/PetitionStatusCellContent";
import { Spacer } from "../common/Spacer";
import { TablePage } from "../common/TablePage";
import { UserAvatarList } from "../common/UserAvatarList";
import { useConfirmDeassociateProfileDialog } from "../petition-activity/dialogs/ConfirmDeassociateProfileDialog";
import { useAssociatePetitionToProfileDialog } from "./dialogs/AssociatePetitionToProfileDialog";

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  items: values([10, 25, 50]).orDefault(10),
};

export function ProfilePetitionsTable({ profileId }: { profileId: string }) {
  const [state, setQueryState] = useQueryState(QUERY_STATE, { prefix: "p_" });
  const { data, loading, refetch } = useQuery(ProfilePetitionsTable_petitionsDocument, {
    variables: {
      profileId,
      offset: state.items * (state.page - 1),
      limit: state.items,
    },
  });
  const profile = data?.profile;
  const petitions = profile?.petitions;

  const { selectedRows, onChangeSelectedIds } = useSelection(petitions?.items, "id");

  const [associateProfileToPetition] = useMutation(
    ProfilePetitionsTable_associateProfileToPetitionDocument
  );
  const showAssociatePetitionToProfileDialog = useAssociatePetitionToProfileDialog();
  const handleAddPetition = async () => {
    try {
      const petitionId = await showAssociatePetitionToProfileDialog({
        excludePetitions: petitions?.items?.map((p) => p.id),
      });

      await associateProfileToPetition({
        variables: { petitionId, profileId },
      });
      await refetch();
    } catch {}
  };
  const showConfirmDeassociateProfileDialog = useConfirmDeassociateProfileDialog();
  const [deassociatePetitionFromProfile] = useMutation(
    ProfilePetitionsTable_deassociatePetitionFromProfileDocument
  );
  const columns = useProfilePetitionsTableColumns();

  const handleRemovePetition = async () => {
    try {
      await showConfirmDeassociateProfileDialog({
        petitionName: selectedRows[0].name,
        profileName: profile?.name,
        selectedPetitions: selectedRows.length,
      });

      await deassociatePetitionFromProfile({
        variables: { profileId, petitionIds: selectedRows.map((row) => row.id) },
      });
      await refetch();
    } catch {}
  };

  const goToPetition = useGoToPetition();
  const handleRowClick = useCallback(function (
    row: ProfilePetitionsTable_PetitionFragment,
    event: MouseEvent
  ) {
    goToPetition(
      row.id,
      (
        {
          DRAFT: "preview",
          PENDING: "replies",
          COMPLETED: "replies",
          CLOSED: "replies",
        } as const
      )[row.status],
      { event }
    );
  },
  []);

  const actions = useProfilePetitionsActions({
    onRemoveClick: () => handleRemovePetition(),
  });

  return (
    <TablePage
      flex="0 1 auto"
      minHeight="305px"
      rowKeyProp="id"
      isSelectable
      isHighlightable
      loading={loading}
      columns={columns}
      rows={petitions?.items}
      onRowClick={handleRowClick}
      page={state.page}
      pageSize={state.items}
      totalCount={petitions?.totalCount}
      onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
      onPageSizeChange={(items) => setQueryState((s) => ({ ...s, items: items as any, page: 1 }))}
      onSortChange={noop}
      actions={actions}
      onSelectionChange={onChangeSelectedIds}
      header={
        <HStack paddingX={4} paddingY={2}>
          <Heading size="md">
            <FormattedMessage id="generic.root-petitions" defaultMessage="Parallels" />
          </Heading>
          <Spacer />
          <Button leftIcon={<AddIcon />} colorScheme="primary" onClick={handleAddPetition}>
            <FormattedMessage
              id="component.profile-petitions-table.add-petition"
              defaultMessage="Add parallel"
            />
          </Button>
        </HStack>
      }
      body={
        petitions?.totalCount === 0 && !loading ? (
          <Center minHeight="60px" height="full" textAlign="center" padding={4} color="gray.400">
            <Stack spacing={1}>
              <Text>
                <FormattedMessage
                  id="component.profile-petitions-table.no-parallels-associated"
                  defaultMessage="There are no parallels associated to this profile yet."
                />
              </Text>
              <Text>
                <NormalLink onClick={handleAddPetition}>
                  <FormattedMessage
                    id="component.profile-petitions-table.add-petition"
                    defaultMessage="Add parallel"
                  />
                </NormalLink>
              </Text>
            </Stack>
          </Center>
        ) : null
      }
    />
  );
}

function useProfilePetitionsActions({ onRemoveClick }: { onRemoveClick: () => void }) {
  return [
    {
      key: "remove",
      onClick: onRemoveClick,
      leftIcon: <CloseIconSmall />,
      children: (
        <FormattedMessage
          id="component.profile-petitions-table.remove-profile-button"
          defaultMessage="Remove association"
        />
      ),
      colorScheme: "red",
    },
  ];
}

function useProfilePetitionsTableColumns(): TableColumn<ProfilePetitionsTable_PetitionFragment>[] {
  const intl = useIntl();

  return useMemo(
    () => [
      {
        key: "name",
        header: intl.formatMessage({
          id: "generic.parallel-name",
          defaultMessage: "Parallel name",
        }),
        cellProps: {
          width: "35%",
          minWidth: "220px",
        },
        CellContent: ({ row: { name } }) => (
          <OverflownText textStyle={name ? undefined : "hint"}>
            {name
              ? name
              : intl.formatMessage({
                  id: "generic.unnamed-parallel",
                  defaultMessage: "Unnamed parallel",
                })}
          </OverflownText>
        ),
      },
      {
        key: "recipient",
        header: intl.formatMessage({
          id: "petitions.header.recipient",
          defaultMessage: "Recipient",
        }),
        cellProps: {
          width: "25%",
          minWidth: "220px",
          whiteSpace: "nowrap",
        },
        CellContent: ({ row }) => {
          const recipients = row.accesses
            .filter((a) => a.status === "ACTIVE" && isDefined(a.contact))
            .map((a) => a.contact!);
          if (recipients.length === 0) {
            return null;
          }
          const goToContact = useGoToContact();

          return (
            <EnumerateList
              values={recipients}
              maxItems={1}
              renderItem={({ value }, index) => (
                <ContactReference
                  key={index}
                  contact={value}
                  onClick={(e: MouseEvent) => e.stopPropagation()}
                />
              )}
              renderOther={({ children, remaining }) => (
                <ContactListPopover key="other" contacts={remaining} onContactClick={goToContact}>
                  <Link
                    href={`/app/petitions/${row.id}/activity`}
                    onClick={(e: MouseEvent) => e.stopPropagation()}
                  >
                    {children}
                  </Link>
                </ContactListPopover>
              )}
            />
          );
        },
      },
      {
        key: "status",
        header: intl.formatMessage({
          id: "petitions.header.status",
          defaultMessage: "Status",
        }),
        cellProps: {
          width: "10%",
          minWidth: "130px",
        },
        align: "center",
        CellContent: ({ row }) => <PetitionStatusCellContent petition={row!} />,
      },
      {
        key: "signature",
        header: "",
        align: "center",
        headerProps: { padding: 0, width: 8 },
        cellProps: { padding: 0 },
        CellContent: ({ row }) => (
          <Flex alignItems="center" paddingRight="2">
            <PetitionSignatureCellContent petition={row!} />
          </Flex>
        ),
      },
      {
        key: "shared",
        header: intl.formatMessage({
          id: "petitions.header.shared",
          defaultMessage: "Shared",
        }),
        align: "left",
        cellProps: {
          width: "20%",
          minWidth: "140px",
        },
        CellContent: ({ row: { permissions }, column }) => (
          <Flex justifyContent={column.align}>
            <UserAvatarList
              usersOrGroups={permissions.map((p) =>
                p.__typename === "PetitionUserPermission"
                  ? p.user
                  : p.__typename === "PetitionUserGroupPermission"
                  ? p.group
                  : (null as never)
              )}
            />
          </Flex>
        ),
      },
      {
        key: "sentAt",
        header: intl.formatMessage({
          id: "generic.sent-at",
          defaultMessage: "Sent at",
        }),
        cellProps: {
          width: "10%",
          minWidth: "160px",
        },
        CellContent: ({ row: { sentAt } }) =>
          sentAt ? (
            <DateTime value={sentAt} format={FORMATS.LLL} useRelativeTime whiteSpace="nowrap" />
          ) : (
            <Text as="span" textStyle="hint" whiteSpace="nowrap">
              <FormattedMessage id="generic.not-sent" defaultMessage="Not sent" />
            </Text>
          ),
      },
    ],
    [intl.locale]
  );
}

const _fragments = {
  Profile: gql`
    fragment ProfilePetitionsTable_Profile on Profile {
      id
      name
    }
  `,
  Petition: gql`
    fragment ProfilePetitionsTable_Petition on Petition {
      id
      name
      status
      createdAt
      permissions {
        permissionType
        ... on PetitionUserPermission {
          user {
            ...UserAvatarList_User
          }
        }
        ... on PetitionUserGroupPermission {
          group {
            ...UserAvatarList_UserGroup
          }
        }
      }
      accesses {
        id
        status
        contact {
          ...ContactReference_Contact
        }
        nextReminderAt
        reminders {
          createdAt
        }
      }
      sentAt
      ...PetitionStatusCellContent_Petition
      ...PetitionSignatureCellContent_Petition
      isAnonymized
    }
    ${UserAvatarList.fragments.User}
    ${UserAvatarList.fragments.UserGroup}
    ${ContactReference.fragments.Contact}
    ${PetitionStatusCellContent.fragments.Petition}
    ${PetitionSignatureCellContent.fragments.Petition}
  `,
};

const _mutations = [
  gql`
    mutation ProfilePetitionsTable_associateProfileToPetition($petitionId: GID!, $profileId: GID!) {
      associateProfileToPetition(petitionId: $petitionId, profileId: $profileId) {
        profile {
          id
        }
      }
    }
  `,
  gql`
    mutation ProfilePetitionsTable_deassociatePetitionFromProfile(
      $profileId: GID!
      $petitionIds: [GID!]!
    ) {
      deassociatePetitionFromProfile(profileId: $profileId, petitionIds: $petitionIds)
    }
  `,
];

const _queries = [
  gql`
    query ProfilePetitionsTable_petitions($profileId: GID!, $offset: Int!, $limit: Int!) {
      profile(profileId: $profileId) {
        id
        name
        petitions(offset: $offset, limit: $limit) {
          items {
            ...ProfilePetitionsTable_Petition
          }
          totalCount
        }
      }
    }
    ${_fragments.Petition}
  `,
];
