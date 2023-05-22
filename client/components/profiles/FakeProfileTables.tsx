import { Box, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { DateTime } from "@parallel/components/common/DateTime";
import { localizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { PetitionSignatureCellContent } from "@parallel/components/common/PetitionSignatureCellContent";
import { PetitionStatusCellContent } from "@parallel/components/common/PetitionStatusCellContent";
import { TableColumn } from "@parallel/components/common/Table";
import { UserAvatarList } from "@parallel/components/common/UserAvatarList";
import { FakeProfileTables_PetitionFragment, ProfileType } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { noop } from "remeda";
import { TablePage } from "../common/TablePage";
import { gql } from "@apollo/client";
import { ContactListPopover } from "@parallel/components/common/ContactListPopover";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { Link } from "@parallel/components/common/Link";
import { EnumerateList } from "@parallel/utils/EnumerateList";
import { useGoToContact } from "@parallel/utils/goToContact";
import { MouseEvent } from "react";
import { isDefined } from "remeda";
type FakeProfilesType = {
  id: string;
  name: string;
  createdAt: string;
  relationship: string;
  profileType: ProfileType;
};

const fakeProfilesItems = [
  {
    id: "1",
    name: "Susana Martínez",
    createdAt: "2023-05-18",
    relationship: "Representante legal",
    profileType: {
      id: "1",
      name: {
        en: "Individual",
        es: "Persona física",
      },
    },
  },
  {
    id: "2",
    name: "Contrato de prestación de servicios - BeWing, S.L.",
    createdAt: "2023-05-19",
    relationship: "Contrato",
    profileType: {
      id: "2",
      name: {
        en: "Contract",
        es: "Contrato",
      },
    },
  },
  {
    id: "3",
    name: "Non-disclosure agreement - BeWing, S.L.",
    createdAt: "2023-05-19",
    relationship: "Contrato",
    profileType: {
      id: "2",
      name: {
        en: "Contract",
        es: "Contrato",
      },
    },
  },
] as FakeProfilesType[];

const fakeParallelsItems = [
  {
    id: "1",
    name: "Know your customer - BeWing, S.L.",
    createdAt: "2022-05-11",
    sentAt: "2022-05-15",
    status: "CLOSED",
    permissions: [
      {
        __typename: "PetitionUserPermission",
        permissionType: "READ",
        user: {
          __typename: "User",
          id: "102",
          fullName: "Daniela Lopez",
          avatarUrl: "https://example.com/avatar/janesmith.png",
          initials: "DL",
        },
      },
    ],
    accesses: [
      {
        id: "302",
        status: "ACTIVE",
        nextReminderAt: null,
        contact: {
          id: "202",
          fullName: "Susana Martínez",
          email: "susana.martinez@bewing.com",
        },
        reminders: [],
      },
    ],
    progress: {
      external: {
        approved: 26,
        replied: 0,
        optional: 0,
        total: 26,
      },
      internal: {
        approved: 2,
        replied: 0,
        optional: 0,
        total: 2,
      },
    },
    currentSignatureRequest: {
      status: "COMPLETED",
      cancelReason: null,
      environment: "PRODUCTION",
    },
  },
] as FakeProfileTables_PetitionFragment[];

export function FakeProfileTables({ me }: { me: any }) {
  const columnsProfiles = useFakeProfileTableColumns();
  const columnsParallels = useFakePetitionColumns();
  return (
    <Stack spacing={6} padding={4}>
      <TablePage
        flex="0 1 auto"
        minHeight="200px"
        columns={columnsProfiles}
        rows={fakeProfilesItems}
        rowKeyProp="id"
        context={me}
        isHighlightable
        loading={false}
        onRowClick={noop}
        page={1}
        pageSize={10}
        totalCount={fakeProfilesItems.length}
        onPageChange={noop}
        onPageSizeChange={noop}
        onSortChange={noop}
        header={
          <Box paddingX={4} paddingY={3}>
            <Heading size="md">
              <FormattedMessage
                id="component.app-layout-navbar.profiles-link"
                defaultMessage="Profiles"
              />
            </Heading>
          </Box>
        }
        body={null}
      />

      <TablePage
        flex="0 1 auto"
        minHeight="200px"
        columns={columnsParallels}
        rows={fakeParallelsItems}
        rowKeyProp="id"
        context={me}
        isHighlightable
        loading={false}
        onRowClick={noop}
        page={1}
        pageSize={10}
        totalCount={fakeParallelsItems.length}
        onPageChange={noop}
        onPageSizeChange={noop}
        onSortChange={noop}
        header={
          <Box paddingX={4} paddingY={3}>
            <Heading size="md">
              <FormattedMessage id="generic.root-petitions" defaultMessage="Parallels" />
            </Heading>
          </Box>
        }
        body={null}
      />
    </Stack>
  );
}

function useFakeProfileTableColumns(): TableColumn<FakeProfilesType>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "name",
        isSortable: true,
        header: intl.formatMessage({
          id: "generic.name",
          defaultMessage: "Name",
        }),
        cellProps: {
          width: "40%",
          minWidth: "240px",
        },
        CellContent: ({ row }) => {
          return (
            <OverflownText>
              {row.name ||
                intl.formatMessage({
                  id: "generic.unnamed-profile",
                  defaultMessage: "Unnamed profile",
                })}
            </OverflownText>
          );
        },
      },
      {
        key: "relationship",
        header: intl.formatMessage({
          id: "component.profile-table-columns.relationship",
          defaultMessage: "Relationship",
        }),
        cellProps: {
          width: "30%",
          minWidth: "240px",
        },
        CellContent: ({ row: { relationship } }) => {
          return <Text as="span">{relationship}</Text>;
        },
      },
      {
        key: "type",
        header: intl.formatMessage({
          id: "component.profile-table-columns.profile-type",
          defaultMessage: "Profile type",
        }),
        cellProps: {
          width: "30%",
          minWidth: "240px",
        },
        CellContent: ({
          row: {
            profileType: { name },
          },
        }) => {
          return (
            <Text as="span">
              {localizableUserTextRender({
                value: name,
                intl,
                default: intl.formatMessage({
                  id: "generic.unnamed-profile-type",
                  defaultMessage: "Unnamed profile type",
                }),
              })}
            </Text>
          );
        },
      },
    ],
    [intl.locale]
  );
}

function useFakePetitionColumns() {
  const intl = useIntl();

  return useMemo(
    () =>
      [
        {
          key: "name",
          header: intl.formatMessage({
            id: "generic.parallel-name",
            defaultMessage: "Parallel name",
          }),
          headerProps: {
            width: "30%",
            minWidth: "240px",
          },
          cellProps: {
            maxWidth: 0,
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
            minWidth: "200px",
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
          align: "center",
          CellContent: ({ row }) => <PetitionStatusCellContent petition={row!} />,
        },
        {
          key: "signature",
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
          cellProps: { width: "1%" },
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
          cellProps: { width: "1%" },
          CellContent: ({ row: { sentAt } }) => (
            <DateTime
              fontSize="sm"
              value={sentAt!}
              format={FORMATS.LLL}
              useRelativeTime
              whiteSpace="nowrap"
            />
          ),
        },
      ] as TableColumn<FakeProfileTables_PetitionFragment>[],
    [intl.locale]
  );
}

FakeProfileTables.fragments = {
  Petition: gql`
    fragment FakeProfileTables_Petition on Petition {
      id
      name
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
    }
    ${UserAvatarList.fragments.User}
    ${UserAvatarList.fragments.UserGroup}
    ${ContactReference.fragments.Contact}
    ${PetitionStatusCellContent.fragments.Petition}
    ${PetitionSignatureCellContent.fragments.Petition}
  `,
};
