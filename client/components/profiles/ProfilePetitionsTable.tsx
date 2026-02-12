import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { ButtonGroup, Center, Heading, MenuItem, MenuList } from "@chakra-ui/react";
import { ChevronDownIcon, CloseIconSmall, LockClosedIcon } from "@parallel/chakra/icons";
import { ContactListPopover } from "@parallel/components/common/ContactListPopover";
import { DateTime } from "@parallel/components/common/DateTime";
import { Link, NormalLink } from "@parallel/components/common/Link";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { TableColumn } from "@parallel/components/common/Table";
import { Button, Flex, HStack, Stack, Text } from "@parallel/components/ui";
import {
  ProfilePetitionsTable_associateProfileToPetitionDocument,
  ProfilePetitionsTable_disassociateProfilesFromPetitionsDocument,
  ProfilePetitionsTable_PetitionFragment,
  ProfilePetitionsTable_petitionsDocument,
  ProfilePetitionsTable_ProfileFragment,
} from "@parallel/graphql/__types";
import { EnumerateList } from "@parallel/utils/EnumerateList";
import { FORMATS } from "@parallel/utils/dates";
import { useGoToContact } from "@parallel/utils/goToContact";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { integer, string, useQueryState, values } from "@parallel/utils/queryState";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { useSelection } from "@parallel/utils/useSelectionState";
import { MouseEvent, useCallback, useMemo, useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish, pick } from "remeda";
import { ContactReference } from "../common/ContactReference";
import { Divider } from "../common/Divider";
import { MoreOptionsMenuButton } from "../common/MoreOptionsMenuButton";
import { PetitionSignatureCellContent } from "../common/PetitionSignatureCellContent";
import { PetitionStatusCellContent } from "../common/PetitionStatusCellContent";
import { ProfileReference } from "../common/ProfileReference";
import { RestrictedFeaturePopover } from "../common/RestrictedFeaturePopover";
import { SmallPopover } from "../common/SmallPopover";
import { Spacer } from "../common/Spacer";
import { TablePage } from "../common/TablePage";
import { isDialogError } from "../common/dialogs/DialogProvider";
import { useConfirmDisassociateProfileDialog } from "../petition-activity/dialogs/ConfirmDisassociateProfileDialog";
import { PetitionTemplateFilter } from "../petition-list/filters/PetitionTemplateFilter";
import { useAssociateNewPetitionToProfileDialog } from "./dialogs/AssociateNewPetitionToProfileDialog";
import { useAssociatePetitionToProfileDialog } from "./dialogs/AssociatePetitionToProfileDialog";

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  items: values([10, 25, 50]).orDefault(10),
  fromTemplateId: string().list(),
};

export function ProfilePetitionsTable({ profileId }: { profileId: string }) {
  const showErrorToast = useGenericErrorToast();
  const [state, setQueryState] = useQueryState(QUERY_STATE, { prefix: "p_" });
  const { data, loading, refetch } = useQuery(ProfilePetitionsTable_petitionsDocument, {
    variables: {
      profileId,
      offset: state.items * (state.page - 1),
      limit: state.items,
      filters: {
        fromTemplateId: state.fromTemplateId,
      },
    },
    fetchPolicy: "cache-and-network",
  });
  const profile = data?.profile;
  const petitions = profile?.petitions;
  const profileIsDeleted = profile?.status === "DELETION_SCHEDULED";

  const { selectedRows, selectedIds, onChangeSelectedIds } = useSelection(petitions?.items, "id");

  const moreOptionsButtonRef = useRef<HTMLButtonElement>(null);

  const [associateProfileToPetition] = useMutation(
    ProfilePetitionsTable_associateProfileToPetitionDocument,
  );
  const showAssociatePetitionToProfileDialog = useAssociatePetitionToProfileDialog();
  const handleAddPetition = async () => {
    try {
      const petitionId = await showAssociatePetitionToProfileDialog({
        excludePetitions: petitions?.items?.map((p) => p.id),
        modalProps: { finalFocusRef: moreOptionsButtonRef },
      });

      await associateProfileToPetition({
        variables: { petitionId, profileId },
      });
      await refetch();
    } catch {}
  };
  const showConfirmDisassociateProfileDialog = useConfirmDisassociateProfileDialog();
  const [disassociateProfilesFromPetitions] = useMutation(
    ProfilePetitionsTable_disassociateProfilesFromPetitionsDocument,
  );
  const columns = useProfilePetitionsTableColumns();

  const handleRemovePetition = async () => {
    try {
      await showConfirmDisassociateProfileDialog({
        petitionName: selectedRows[0].name,
        profileName: isNonNullish(profile) ? <ProfileReference profile={profile} /> : undefined,
        selectedPetitions: selectedRows.length,
      });

      await disassociateProfilesFromPetitions({
        variables: { profileIds: [profileId], petitionIds: selectedIds },
      });
      await refetch();
    } catch {}
  };

  const goToPetition = useGoToPetition();
  const handleRowClick = useCallback(function (
    row: ProfilePetitionsTable_PetitionFragment,
    event: MouseEvent,
  ) {
    if (isNonNullish(row.myEffectivePermission)) {
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
    }
  }, []);

  const actions = useProfilePetitionsActions({
    profile,
    onRemoveClick: () => handleRemovePetition(),
  });

  const showAssociateNewPetitionToProfileDialog = useAssociateNewPetitionToProfileDialog();
  const handleCreateNewPetition = async () => {
    try {
      if (isNonNullish(profile)) {
        const petitionId = await showAssociateNewPetitionToProfileDialog({
          profile,
        });
        goToPetition(petitionId, "preview");
      }
    } catch (error) {
      if (isDialogError(error) && error.message === "ERROR") {
        showErrorToast();
      }
    }
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
      rowProps={(row) => {
        if (isNullish(row.myEffectivePermission)) {
          return {
            cursor: "not-allowed",
          };
        } else {
          return {};
        }
      }}
      onRowClick={handleRowClick}
      page={state.page}
      pageSize={state.items}
      totalCount={petitions?.totalCount}
      filter={pick(state, ["fromTemplateId"])}
      onFilterChange={(key, value) => {
        setQueryState((current) => ({ ...current, [key]: value, page: 1 }));
      }}
      onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
      onPageSizeChange={(items) => setQueryState((s) => ({ ...s, items: items as any, page: 1 }))}
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
                disabled={!userCanCreatePetition || profileIsDeleted}
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
              ref={moreOptionsButtonRef}
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
            <Stack gap={1} align="center">
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

function useProfilePetitionsTableColumns(): TableColumn<
  ProfilePetitionsTable_PetitionFragment,
  any,
  any
>[] {
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
          maxWidth: 0,
          minWidth: "200px",
        },
        CellContent: ({ row: { name, myEffectivePermission } }) => {
          if (isNullish(myEffectivePermission)) {
            return (
              <HStack>
                <SmallPopover
                  content={
                    <FormattedMessage
                      id="component.profile-petitions-table.no-access-to-petition"
                      defaultMessage="You do not have access to this parallel. Contact an administrator in your organization if you need access."
                    />
                  }
                >
                  <LockClosedIcon />
                </SmallPopover>
                <OverflownText textStyle={name ? undefined : "hint"}>
                  {name
                    ? name
                    : intl.formatMessage({
                        id: "generic.unnamed-parallel",
                        defaultMessage: "Unnamed parallel",
                      })}
                </OverflownText>
              </HStack>
            );
          } else {
            return (
              <OverflownText textStyle={name ? undefined : "hint"}>
                {name
                  ? name
                  : intl.formatMessage({
                      id: "generic.unnamed-parallel",
                      defaultMessage: "Unnamed parallel",
                    })}
              </OverflownText>
            );
          }
        },
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
      {
        key: "fromTemplateId",
        label: (intl) =>
          intl.formatMessage({
            id: "generic.template",
            defaultMessage: "Template",
          }),
        cellProps: {
          maxWidth: 0,
          minWidth: "200px",
          whiteSpace: "nowrap",
        },
        Filter: PetitionTemplateFilter as any,
        CellContent: ({ row }) => {
          if (row.__typename === "Petition") {
            return isNonNullish(row.fromTemplate) ? (
              isNonNullish(row.fromTemplate.myEffectivePermission) ||
              row.fromTemplate.isPublicTemplate ? (
                <OverflownText
                  display="block"
                  as={Link}
                  href={`/app/petitions/new?${new URLSearchParams({
                    template: row.fromTemplate.id,
                    ...(row.fromTemplate.isPublicTemplate &&
                    row.fromTemplate.myEffectivePermission === null
                      ? { public: "true" }
                      : {}),
                  })}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {row.fromTemplate.name ? (
                    row.fromTemplate.name
                  ) : (
                    <Text as="span" fontStyle="italic">
                      <FormattedMessage
                        id="generic.unnamed-template"
                        defaultMessage="Unnamed template"
                      />
                    </Text>
                  )}
                </OverflownText>
              ) : row.fromTemplate.name ? (
                <OverflownText>{row.fromTemplate.name}</OverflownText>
              ) : (
                <Text as="span" textStyle="hint">
                  <FormattedMessage
                    id="generic.unnamed-template"
                    defaultMessage="Unnamed template"
                  />
                </Text>
              )
            ) : null;
          } else {
            return null;
          }
        },
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
      fromTemplate {
        id
        name
        myEffectivePermission {
          permissionType
        }
        isPublicTemplate
      }
    }
  `,
};

const _mutations = [
  gql`
    mutation ProfilePetitionsTable_associateProfileToPetition($petitionId: GID!, $profileId: GID!) {
      associateProfileToPetition(petitionId: $petitionId, profileId: $profileId) {
        profile {
          ...ProfilePetitionsTable_Profile
        }
      }
    }
  `,
  gql`
    mutation ProfilePetitionsTable_disassociateProfilesFromPetitions(
      $profileIds: [GID!]!
      $petitionIds: [GID!]!
    ) {
      disassociateProfilesFromPetitions(profileIds: $profileIds, petitionIds: $petitionIds)
    }
  `,
];

const _queries = [
  gql`
    query ProfilePetitionsTable_petitions(
      $profileId: GID!
      $offset: Int!
      $limit: Int!
      $filters: ProfileAssociatedPetitionFilter
    ) {
      profile(profileId: $profileId) {
        ...ProfilePetitionsTable_Profile
        petitions: associatedPetitions(offset: $offset, limit: $limit, filters: $filters) {
          items {
            ...ProfilePetitionsTable_Petition
          }
          totalCount
        }
      }
    }
  `,
];
