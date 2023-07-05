import { gql } from "@apollo/client";
import { Button, Center, Flex, HStack, Heading, Stack, Text } from "@chakra-ui/react";
import { AddIcon, CloseIconSmall } from "@parallel/chakra/icons";
import {
  PetitionProfilesTable_PetitionFragment,
  PetitionProfilesTable_ProfileFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useHandleNavigation } from "@parallel/utils/navigation";
import { integer, useQueryState, values } from "@parallel/utils/queryState";
import { useSelection } from "@parallel/utils/useSelectionState";
import { MouseEvent, useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { noop } from "remeda";
import { DateTime } from "../common/DateTime";
import { NormalLink } from "../common/Link";
import { LocalizableUserTextRender } from "../common/LocalizableUserTextRender";
import { ProfileLink } from "../common/ProfileLink";
import { Spacer } from "../common/Spacer";
import { TableColumn } from "../common/Table";
import { TablePage } from "../common/TablePage";
import { UserAvatarList } from "../common/UserAvatarList";

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  items: values([10, 25, 50]).orDefault(10),
};

type PetitionProfilesTableSelection = PetitionProfilesTable_ProfileFragment;
export interface PetitionProfilesTable {
  petition: PetitionProfilesTable_PetitionFragment;
  onAddProfile: () => void;
  onRemoveProfile: (profileIds: string[]) => void;
}

export function PetitionProfilesTable({
  petition,
  onAddProfile,
  onRemoveProfile,
}: PetitionProfilesTable) {
  const myEffectivePermission = petition.myEffectivePermission!.permissionType;

  const columns = usePetitionProfilesColumns();

  const [state, setQueryState] = useQueryState(QUERY_STATE, { prefix: "p_" });

  const profiles = petition.__typename === "Petition" ? petition.profiles : [];

  const { selectedIds, onChangeSelectedIds } = useSelection(profiles, "id");
  const actions = usePetitionProfilesActions({
    canRemove: myEffectivePermission !== "READ",
    onRemoveClick: () => onRemoveProfile(selectedIds),
  });

  const navigate = useHandleNavigation();
  const handleRowClick = useCallback(function (
    row: PetitionProfilesTableSelection,
    event: MouseEvent
  ) {
    navigate(`/app/profiles/${row.id}`, event);
  },
  []);

  return (
    <TablePage
      id="petition-profiles"
      flex="0 1 auto"
      rowKeyProp="id"
      isSelectable
      isHighlightable
      loading={false}
      columns={columns}
      rows={profiles.slice((state.page - 1) * state.items, state.page * state.items)}
      onRowClick={handleRowClick}
      page={state.page}
      pageSize={state.items}
      totalCount={profiles.length}
      onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
      onPageSizeChange={(items) => setQueryState((s) => ({ ...s, items: items as any, page: 1 }))}
      onSortChange={noop}
      actions={actions}
      onSelectionChange={onChangeSelectedIds}
      header={
        <HStack paddingX={4} paddingY={2}>
          <Heading size="md">
            <FormattedMessage
              id="component.petition-profiles-table.profiles"
              defaultMessage="Profiles"
            />
          </Heading>
          <Spacer />
          <Button
            leftIcon={<AddIcon />}
            colorScheme="primary"
            onClick={onAddProfile}
            isDisabled={petition.isAnonymized || myEffectivePermission === "READ"}
          >
            <FormattedMessage
              id="component.petition-profiles-table.add-profile"
              defaultMessage="Add profile"
            />
          </Button>
        </HStack>
      }
      body={
        profiles.length === 0 ? (
          <Center minHeight="60px" height="full" textAlign="center" padding={4} color="gray.400">
            <Stack spacing={1}>
              <Text>
                <FormattedMessage
                  id="component.petition-profiles-table.no-profiles-associated"
                  defaultMessage="There are no profiles associated to this parallel yet."
                />
              </Text>
              {!petition.isAnonymized && myEffectivePermission !== "READ" ? (
                <Text>
                  <FormattedMessage
                    id="component.petition-profiles-table.associate-profile"
                    defaultMessage="<a>Associate a profile</a>"
                    values={{
                      a: (chunks: any) => <NormalLink onClick={onAddProfile}>{chunks}</NormalLink>,
                    }}
                  />
                </Text>
              ) : null}
            </Stack>
          </Center>
        ) : null
      }
    />
  );
}

function usePetitionProfilesActions({
  canRemove,
  onRemoveClick,
}: {
  canRemove: boolean;
  onRemoveClick: () => void;
}) {
  return [
    {
      key: "remove",
      onClick: onRemoveClick,
      leftIcon: <CloseIconSmall />,
      children: (
        <FormattedMessage
          id="component.petition-profiles-table.remove-profile-button"
          defaultMessage="Remove association"
        />
      ),
      colorScheme: "red",
      isDisabled: !canRemove,
    },
  ];
}

function usePetitionProfilesColumns(): TableColumn<PetitionProfilesTableSelection>[] {
  const intl = useIntl();

  return useMemo(
    () => [
      {
        key: "name",
        header: intl.formatMessage({
          id: "component.petition-profiles-table.name-header",
          defaultMessage: "Name",
        }),
        cellProps: {
          width: "35%",
          minWidth: "220px",
        },
        CellContent: ({ row }) => (
          <>
            {row.name || (
              <Text textStyle="hint" as="span">
                <FormattedMessage id="generic.unnamed-profile" defaultMessage="Unnamed profile" />
              </Text>
            )}
          </>
        ),
      },
      {
        key: "type",
        header: intl.formatMessage({
          id: "component.petition-profiles-table.profile-type-header",
          defaultMessage: "Type",
        }),
        cellProps: {
          width: "25%",
          minWidth: "220px",
        },
        CellContent: ({ row: { profileType } }) => {
          return (
            <LocalizableUserTextRender
              value={profileType.name}
              default={intl.formatMessage({
                id: "generic.unnamed-profile-type",
                defaultMessage: "Unnamed profile type",
              })}
            />
          );
        },
      },
      {
        key: "subscribed",
        header: intl.formatMessage({
          id: "component.petition-profiles-table.subscribers-header",
          defaultMessage: "Subscribers",
        }),
        cellProps: {
          width: "20%",
          minWidth: "220px",
        },
        CellContent: ({ row: { subscribers }, column }) => {
          if (!subscribers.length)
            return (
              <Text textStyle="hint">
                <FormattedMessage
                  id="component.petition-profiles-table.no-subscribers-profile"
                  defaultMessage="No subscribers to this profile"
                />
              </Text>
            );
          return (
            <Flex justifyContent={column.align}>
              <UserAvatarList usersOrGroups={subscribers.map((s) => s.user)} />
            </Flex>
          );
        },
      },
      {
        key: "createdAt",
        header: intl.formatMessage({
          id: "generic.created-at",
          defaultMessage: "Created at",
        }),
        cellProps: {
          width: "20%",
          minWidth: "220px",
        },
        CellContent: ({ row: { createdAt } }) => (
          <DateTime value={createdAt} format={FORMATS.LLL} whiteSpace="nowrap" />
        ),
      },
    ],
    [intl.locale]
  );
}

PetitionProfilesTable.fragments = {
  get Profile() {
    return gql`
      fragment PetitionProfilesTable_Profile on Profile {
        id
        name
        profileType {
          id
          name
        }
        subscribers {
          id
          user {
            ...UserAvatarList_User
          }
        }
        createdAt
        ...ProfileLink_Profile
      }
      ${UserAvatarList.fragments.User}
      ${ProfileLink.fragments.Profile}
    `;
  },
  get Petition() {
    return gql`
      fragment PetitionProfilesTable_Petition on Petition {
        id
        isAnonymized
        myEffectivePermission {
          permissionType
        }
        profiles {
          ...PetitionProfilesTable_Profile
        }
      }
      ${this.Profile}
    `;
  },
};
