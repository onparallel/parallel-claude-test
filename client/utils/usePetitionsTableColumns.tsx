import { gql } from "@apollo/client";
import { Flex, Text } from "@chakra-ui/react";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { ContactListPopover } from "@parallel/components/common/ContactListPopover";
import { DateTime } from "@parallel/components/common/DateTime";
import { Link } from "@parallel/components/common/Link";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { PetitionSignatureCellContent } from "@parallel/components/common/PetitionSignatureCellContent";
import { PetitionStatusCellContent } from "@parallel/components/common/PetitionStatusCellContent";
import { PetitionTagListCellContent } from "@parallel/components/common/PetitionTagListCellContent";
import { TableColumn } from "@parallel/components/common/Table";
import { UserAvatarList } from "@parallel/components/common/UserAvatarList";
import { PetitionListSharedWithFilter } from "@parallel/components/petition-list/filters/shared-with/PetitionListSharedWithFilter";
import {
  PetitionBaseType,
  usePetitionsTableColumns_PetitionBaseFragment,
  usePetitionsTableColumns_PetitionBase_PetitionTemplate_Fragment,
  usePetitionsTableColumns_PetitionBase_Petition_Fragment,
  usePetitionsTableColumns_UserFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { ellipsis } from "@parallel/utils/ellipsis";
import { MouseEvent, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { EnumerateList } from "./EnumerateList";
import { useGoToContact } from "./goToContact";

export type PetitionsTableColumnsContext = {
  user: usePetitionsTableColumns_UserFragment;
};

type PetitionBaseTableColumn = TableColumn<
  usePetitionsTableColumns_PetitionBaseFragment,
  PetitionsTableColumnsContext
>;

type PetitionTableColumn = TableColumn<
  usePetitionsTableColumns_PetitionBase_Petition_Fragment,
  PetitionsTableColumnsContext
>;

type PetitionTemplateTableColumn = TableColumn<
  usePetitionsTableColumns_PetitionBase_PetitionTemplate_Fragment,
  PetitionsTableColumnsContext
>;

export function usePetitionsTableColumns(type: PetitionBaseType) {
  const intl = useIntl();
  return useMemo(
    () =>
      [
        {
          key: "name",
          isSortable: true,
          header:
            type === "PETITION"
              ? intl.formatMessage({
                  id: "petitions.header.name",
                  defaultMessage: "Petition name",
                })
              : intl.formatMessage({
                  id: "petitions.header.template-name",
                  defaultMessage: "Template name",
                }),
          headerProps: {
            width: "30%",
            minWidth: "240px",
          },
          cellProps: {
            maxWidth: 0,
            fontSize: "14px",
          },
          CellContent: ({ row }) => (
            <OverflownText textStyle={row.name ? undefined : "hint"}>
              {row.name
                ? row.name
                : type === "PETITION"
                ? intl.formatMessage({
                    id: "generic.untitled-petition",
                    defaultMessage: "Untitled petition",
                  })
                : intl.formatMessage({
                    id: "generic.untitled-template",
                    defaultMessage: "Untitled template",
                  })}
            </OverflownText>
          ),
        },
        ...(type === "PETITION"
          ? ([
              {
                key: "recipient",
                header: intl.formatMessage({
                  id: "petitions.header.recipient",
                  defaultMessage: "Recipient",
                }),
                cellProps: {
                  minWidth: "200px",
                  whiteSpace: "nowrap",
                  fontSize: "14px",
                },
                CellContent: ({ row }) => {
                  const recipients = row.accesses
                    .filter((a) => a.status === "ACTIVE")
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
                        <ContactLink
                          key={index}
                          contact={value}
                          onClick={(e: MouseEvent) => e.stopPropagation()}
                        />
                      )}
                      renderOther={({ children, remaining }) => (
                        <ContactListPopover
                          key="other"
                          contacts={remaining}
                          onContactClick={goToContact}
                        >
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
                headerProps: {
                  minWidth: "180px",
                },
                align: "center",
                CellContent: ({ row }) => (
                  <PetitionStatusCellContent petition={row} />
                ),
              },
              {
                key: "signature",
                align: "center",
                headerProps: { padding: 0, width: 8 },
                cellProps: { padding: 0 },
                CellContent: ({ row, context }) => (
                  <Flex alignItems="center" paddingRight="2">
                    <PetitionSignatureCellContent
                      petition={row}
                      user={context!.user}
                    />
                  </Flex>
                ),
              },
            ] as PetitionTableColumn[])
          : ([
              {
                key: "description",
                header: intl.formatMessage({
                  id: "petitions.header.description",
                  defaultMessage: "Description",
                }),
                align: "left",
                cellProps: {
                  isTruncated: true,
                  maxWidth: 0,
                },
                CellContent: ({ row }) => {
                  return (
                    <>{row.description && ellipsis(row.description!, 80)}</>
                  );
                },
              },
            ] as PetitionTemplateTableColumn[])),
        {
          key: "sharedWith",
          header: intl.formatMessage({
            id: "petitions.header.shared-with",
            defaultMessage: "Shared with",
          }),
          isFilterable: true,
          Filter: PetitionListSharedWithFilter,
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
        type === "PETITION"
          ? ({
              key: "sentAt",
              isSortable: true,
              header: intl.formatMessage({
                id: "generic.sent-at",
                defaultMessage: "Sent at",
              }),
              cellProps: { width: "1%" },
              CellContent: ({ row: { sentAt } }) =>
                sentAt ? (
                  <DateTime
                    value={sentAt}
                    format={FORMATS.LLL}
                    useRelativeTime
                    fontSize="sm"
                    whiteSpace="nowrap"
                  />
                ) : (
                  <Text as="span" textStyle="hint" fontSize="sm">
                    <FormattedMessage
                      id="generic.not-sent"
                      defaultMessage="Not sent"
                    />
                  </Text>
                ),
            } as PetitionTableColumn)
          : {
              key: "createdAt",
              isSortable: true,
              header: intl.formatMessage({
                id: "generic.created-at",
                defaultMessage: "Created at",
              }),
              cellProps: { width: "1%" },
              CellContent: ({ row: { createdAt } }) => (
                <DateTime
                  value={createdAt}
                  format={FORMATS.LLL}
                  useRelativeTime
                  fontSize="sm"
                  whiteSpace="nowrap"
                />
              ),
            },
        {
          key: "tags",
          header: intl.formatMessage({
            id: "petitions.header.tags",
            defaultMessage: "Tags",
          }),
          cellProps: {
            padding: 0,
            minWidth: "min-content",
            _last: { paddingRight: 0 },
          },
          headerProps: {
            width: "30%",
            minWidth: "300px",
          },
          CellContent: ({ row }) => {
            return <PetitionTagListCellContent petition={row} />;
          },
        },
      ] as PetitionBaseTableColumn[],
    [intl.locale, type]
  );
}

usePetitionsTableColumns.fragments = {
  PetitionBase: gql`
    fragment usePetitionsTableColumns_PetitionBase on PetitionBase {
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
      ...PetitionTagListCellContent_PetitionBase
      ... on Petition {
        accesses {
          status
          contact {
            ...ContactLink_Contact
          }
        }
        sentAt
        ...PetitionStatusCellContent_Petition
        ...PetitionSignatureCellContent_Petition
      }
      ... on PetitionTemplate {
        description
      }
    }
    ${UserAvatarList.fragments.User}
    ${UserAvatarList.fragments.UserGroup}
    ${PetitionTagListCellContent.fragments.PetitionBase}
    ${ContactLink.fragments.Contact}
    ${PetitionStatusCellContent.fragments.Petition}
    ${PetitionSignatureCellContent.fragments.Petition}
  `,
  User: gql`
    fragment usePetitionsTableColumns_User on User {
      ...PetitionSignatureCellContent_User
    }
    ${PetitionSignatureCellContent.fragments.User}
  `,
};
