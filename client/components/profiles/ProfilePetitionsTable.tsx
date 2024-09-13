import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Button,
  ButtonGroup,
  Center,
  Flex,
  HStack,
  Heading,
  MenuItem,
  MenuList,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ChevronDownIcon, CloseIconSmall } from "@parallel/chakra/icons";
import { ContactListPopover } from "@parallel/components/common/ContactListPopover";
import { DateTime } from "@parallel/components/common/DateTime";
import { Link, NormalLink } from "@parallel/components/common/Link";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { TableColumn } from "@parallel/components/common/Table";
import {
  ProfilePetitionsTable_PetitionFragment,
  ProfilePetitionsTable_ProfileFragment,
  ProfilePetitionsTable_associateProfileToPetitionDocument,
  ProfilePetitionsTable_disassociatePetitionFromProfileDocument,
  ProfilePetitionsTable_petitionsDocument,
} from "@parallel/graphql/__types";
import { EnumerateList } from "@parallel/utils/EnumerateList";
import { FORMATS } from "@parallel/utils/dates";
import { useGoToContact } from "@parallel/utils/goToContact";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { integer, useQueryState, values } from "@parallel/utils/queryState";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { useSelection } from "@parallel/utils/useSelectionState";
import { MouseEvent, useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, noop } from "remeda";
import { ContactReference } from "../common/ContactReference";
import { Divider } from "../common/Divider";
import { MoreOptionsMenuButton } from "../common/MoreOptionsMenuButton";
import { PetitionSignatureCellContent } from "../common/PetitionSignatureCellContent";
import { PetitionStatusCellContent } from "../common/PetitionStatusCellContent";
import { ProfileReference } from "../common/ProfileReference";
import { RestrictedFeaturePopover } from "../common/RestrictedFeaturePopover";
import { Spacer } from "../common/Spacer";
import { TablePage } from "../common/TablePage";
import { useConfirmDisassociateProfileDialog } from "../petition-activity/dialogs/ConfirmDisassociateProfileDialog";
import { useAssociateNewPetitionToProfileDialog } from "./dialogs/AssociateNewPetitionToProfileDialog";
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
    fetchPolicy: "cache-and-network",
  });
  const profile = data?.profile;
  const petitions = profile?.petitions;
  const profileIsDeleted = profile?.status === "DELETION_SCHEDULED";

  const { selectedRows, selectedIds, onChangeSelectedIds } = useSelection(petitions?.items, "id");

  const [associateProfileToPetition] = useMutation(
    ProfilePetitionsTable_associateProfileToPetitionDocument,
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
  const showConfirmDisassociateProfileDialog = useConfirmDisassociateProfileDialog();
  const [disassociatePetitionFromProfile] = useMutation(
    ProfilePetitionsTable_disassociatePetitionFromProfileDocument,
  );
  const columns = useProfilePetitionsTableColumns();

  const handleRemovePetition = async () => {
    try {
      await showConfirmDisassociateProfileDialog({
        petitionName: selectedRows[0].name,
        profileName: isNonNullish(profile) ? <ProfileReference profile={profile} /> : undefined,
        selectedPetitions: selectedRows.length,
      });

      await disassociatePetitionFromProfile({
        variables: { profileId, petitionIds: selectedIds },
      });
      await refetch();
    } catch {}
  };

  const goToPetition = useGoToPetition();
  const handleRowClick = useCallback(function (
    row: ProfilePetitionsTable_PetitionFragment,
    event: MouseEvent,
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
      { event },
    );
  }, []);

  const actions = useProfilePetitionsActions({
    profile,
    onRemoveClick: () => handleRemovePetition(),
  });

  const showAssociateNewPetitionToProfileDialog = useAssociateNewPetitionToProfileDialog();
  const handleCreateNewPetition = async () => {
    try {
      if (isNonNullish(profile)) {
        await showAssociateNewPetitionToProfileDialog({
          profile,
        });
      }
    } catch {}
  };

  const userCanCreatePetition = useHasPermission("PETITIONS:CREATE_PETITIONS");

  return (
    <TablePage
      flex="1 1 auto"
      minHeight={0}
      rowKeyProp="id"
      isSelectable={!profileIsDeleted}
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
            <FormattedMessage
              id="component.profile-petitions-table.header"
              defaultMessage="Associated parallels"
            />
          </Heading>
          <Spacer />

          <ButtonGroup isAttached>
            <RestrictedFeaturePopover isRestricted={!userCanCreatePetition}>
              <Button
                flex="1"
                onClick={handleCreateNewPetition}
                isDisabled={!userCanCreatePetition || profileIsDeleted}
                borderEndRadius={0}
              >
                <FormattedMessage
                  id="component.profile-petitions-table.new-parallel"
                  defaultMessage="New parallel"
                />
              </Button>
            </RestrictedFeaturePopover>
            <Divider isVertical />
            <MoreOptionsMenuButton
              icon={<ChevronDownIcon />}
              borderStartRadius={0}
              minWidth={"auto"}
              padding={2}
              options={
                <MenuList>
                  <MenuItem onClick={handleAddPetition} isDisabled={profileIsDeleted}>
                    <FormattedMessage
                      id="component.profile-petitions-table.add-petition"
                      defaultMessage="Associate existing parallel"
                    />
                  </MenuItem>
                </MenuList>
              }
            />
          </ButtonGroup>
        </HStack>
      }
      body={
        petitions?.totalCount === 0 && !loading ? (
          <Center minHeight="150px" height="full">
            <Stack spacing={1} align="center">
              <Text color="gray.400">
                <FormattedMessage
                  id="component.profile-petitions-table.no-petitions"
                  defaultMessage="There are no parallels associated to this profile yet."
                />
              </Text>
              {profile?.status !== "DELETION_SCHEDULED" ? (
                <Text>
                  {userCanCreatePetition ? (
                    <FormattedMessage
                      id="component.profile-petitions-table.create-or-associate-petition"
                      defaultMessage="<create>Create a new parallel</create> or <associate>Associate existing parallel</associate>"
                      values={{
                        create: (chunks: any[]) => {
                          return (
                            <NormalLink onClick={handleCreateNewPetition}>{chunks}</NormalLink>
                          );
                        },
                        associate: (chunks: any[]) => {
                          return <NormalLink onClick={handleAddPetition}>{chunks}</NormalLink>;
                        },
                      }}
                    />
                  ) : (
                    <NormalLink onClick={handleAddPetition}>
                      <FormattedMessage
                        id="component.profile-petitions-table.add-petition"
                        defaultMessage="Associate existing parallel"
                      />
                    </NormalLink>
                  )}
                </Text>
              ) : null}
            </Stack>
          </Center>
        ) : null
      }
    />
  );
}

function useProfilePetitionsActions({
  profile,
  onRemoveClick,
}: {
  profile?: ProfilePetitionsTable_ProfileFragment;
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
          id="component.profile-petitions-table.remove-petition"
          defaultMessage="Remove association"
        />
      ),
      colorScheme: "red",
    },
  ];
}

function useProfilePetitionsTableColumns(): TableColumn<ProfilePetitionsTable_PetitionFragment>[] {
  const intl = useIntl();
  const goToContact = useGoToContact();
  return useMemo(
    () => [
      {
        key: "name",
        label: intl.formatMessage({
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
        label: intl.formatMessage({
          id: "petitions.header.recipient",
          defaultMessage: "Recipient",
        }),
        cellProps: {
          minWidth: "200px",
          whiteSpace: "nowrap",
        },
        CellContent: ({ row }) => {
          const recipients = row.accesses
            .filter((a) => a.status === "ACTIVE" && isNonNullish(a.contact))
            .map((a) => a.contact!);
          if (recipients.length === 0) {
            return null;
          }

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
                <ContactListPopover contacts={remaining} onContactClick={goToContact}>
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
        label: intl.formatMessage({
          id: "petitions.header.status",
          defaultMessage: "Status",
        }),
        cellProps: {
          minWidth: "130px",
        },
        align: "center",
        CellContent: ({ row }) => <PetitionStatusCellContent petition={row!} />,
      },
      {
        key: "signature",
        label: "",
        align: "center",
        headerProps: { padding: 0, width: 8 },
        cellProps: { padding: 0 },
        CellContent: ({ row }) => (
          <Flex alignItems="center" paddingEnd="2">
            <PetitionSignatureCellContent petition={row!} />
          </Flex>
        ),
      },
      {
        key: "sentAt",
        label: intl.formatMessage({
          id: "generic.sent-at",
          defaultMessage: "Sent at",
        }),
        cellProps: {
          width: "1%",
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
    [intl.locale],
  );
}

const _fragments = {
  Profile: gql`
    fragment ProfilePetitionsTable_Profile on Profile {
      id
      localizableName
      status
      ...ProfileReference_Profile
      ...useAssociateNewPetitionToProfileDialog_Profile
    }
    ${ProfileReference.fragments.Profile}
    ${useAssociateNewPetitionToProfileDialog.fragments.Profile}
  `,
  Petition: gql`
    fragment ProfilePetitionsTable_Petition on Petition {
      id
      name
      status
      createdAt
      myEffectivePermission {
        permissionType
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
          ...ProfilePetitionsTable_Profile
          petitionsTotalCount: petitions {
            totalCount
          }
        }
      }
    }
    ${_fragments.Profile}
  `,
  gql`
    mutation ProfilePetitionsTable_disassociatePetitionFromProfile(
      $profileId: GID!
      $petitionIds: [GID!]!
    ) {
      disassociatePetitionFromProfile(profileId: $profileId, petitionIds: $petitionIds)
    }
  `,
];

const _queries = [
  gql`
    query ProfilePetitionsTable_petitions($profileId: GID!, $offset: Int!, $limit: Int!) {
      profile(profileId: $profileId) {
        ...ProfilePetitionsTable_Profile
        petitions(offset: $offset, limit: $limit) {
          items {
            ...ProfilePetitionsTable_Petition
          }
          totalCount
        }
        petitionsTotalCount: petitions {
          totalCount
        }
      }
    }
    ${_fragments.Profile}
    ${_fragments.Petition}
  `,
];
