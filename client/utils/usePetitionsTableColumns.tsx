import { gql } from "@apollo/client";
import { Box, Flex, Text } from "@chakra-ui/react";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { DeletedContact } from "@parallel/components/common/DeletedContact";
import { Link } from "@parallel/components/common/Link";
import { PetitionStatusCellContent } from "@parallel/components/common/PetitionStatusCellContent";
import { PetitionSignatureCellContent } from "@parallel/components/common/PetitionSignatureCellContent";
import { TableColumn } from "@parallel/components/common/Table";
import { UserAvatarList } from "@parallel/components/common/UserAvatarList";
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

export type PetitionsTableColumnsSelection = usePetitionsTableColumns_PetitionBaseFragment;
export type PetitionsTableColumnsContext = {
  user: usePetitionsTableColumns_UserFragment;
};

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
          CellContent: ({ row }) => (
            <>
              {row.name ? (
                ellipsis(row.name!, 50)
              ) : (
                <Text as="span" textStyle="hint" whiteSpace="nowrap">
                  {type === "PETITION" ? (
                    <FormattedMessage
                      id="generic.untitled-petition"
                      defaultMessage="Untitled petition"
                    />
                  ) : (
                    <FormattedMessage
                      id="generic.untitled-template"
                      defaultMessage="Untitled template"
                    />
                  )}
                </Text>
              )}
            </>
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
                CellContent: ({ row }) => {
                  const recipients = row.accesses
                    .filter((a) => a.status === "ACTIVE")
                    .map((a) => a.contact);
                  if (recipients.length === 0) {
                    return null;
                  }
                  const [contact, ...rest] = recipients;
                  if (contact) {
                    return rest.length ? (
                      <FormattedMessage
                        id="petitions.recipients"
                        defaultMessage="{contact} and <a>{more} more</a>"
                        values={{
                          contact: (
                            <ContactLink
                              contact={contact}
                              onClick={(e: MouseEvent) => e.stopPropagation()}
                            />
                          ),
                          more: rest.length,
                          a: (chunks: any[]) => (
                            <Link
                              href={`/app/petitions/${row.id}/activity`}
                              onClick={(e: MouseEvent) => e.stopPropagation()}
                            >
                              {chunks}
                            </Link>
                          ),
                        }}
                      />
                    ) : (
                      <ContactLink
                        contact={contact}
                        onClick={(e: MouseEvent) => e.stopPropagation()}
                      />
                    );
                  } else {
                    return <DeletedContact />;
                  }
                },
              },
              {
                key: "status",
                header: intl.formatMessage({
                  id: "petitions.header.status",
                  defaultMessage: "Status",
                }),
                align: "center",
                CellContent: ({ row }) => (
                  <PetitionStatusCellContent petition={row} />
                ),
              },
              {
                key: "signature",
                align: "center",
                Header: () => <Box as="th" width="1px" />,
                cellProps: { paddingLeft: 0, width: "1px" },
                CellContent: ({ row, context }) => (
                  <Flex alignItems="center">
                    <PetitionSignatureCellContent
                      petition={row}
                      user={context!.user}
                    />
                  </Flex>
                ),
              },
            ] as TableColumn<
              usePetitionsTableColumns_PetitionBase_Petition_Fragment,
              PetitionsTableColumnsContext
            >[])
          : ([
              {
                key: "description",
                header: intl.formatMessage({
                  id: "petitions.header.description",
                  defaultMessage: "Description",
                }),
                align: "left",
                CellContent: ({ row }) => {
                  return (
                    <>{row.description && ellipsis(row.description!, 80)}</>
                  );
                },
              },
            ] as TableColumn<
              usePetitionsTableColumns_PetitionBase_PetitionTemplate_Fragment,
              PetitionsTableColumnsContext
            >[])),
        {
          key: "sharedWith",
          header: intl.formatMessage({
            id: "petitions.header.shared-with",
            defaultMessage: "Shared with",
          }),
          align: "center",
          cellProps: { width: "1%" },
          CellContent: ({ row: { userPermissions }, column }) => (
            <Flex justifyContent={column.align}>
              <UserAvatarList users={userPermissions.map((p) => p.user)} />
            </Flex>
          ),
        },
        {
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
              whiteSpace="nowrap"
            />
          ),
        },
      ] as TableColumn<
        PetitionsTableColumnsSelection,
        PetitionsTableColumnsContext
      >[],
    [intl.locale, type]
  );
}

usePetitionsTableColumns.fragments = {
  PetitionBase: gql`
    fragment usePetitionsTableColumns_PetitionBase on PetitionBase {
      id
      name
      createdAt
      userPermissions {
        permissionType
        user {
          id
          ...UserAvatarList_User
        }
      }
      ... on Petition {
        accesses {
          status
          contact {
            ...ContactLink_Contact
          }
        }
        ...PetitionStatusCellContent_Petition
        ...PetitionSignatureCellContent_Petition
      }
      ... on PetitionTemplate {
        description
      }
    }
    ${UserAvatarList.fragments.User}
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
