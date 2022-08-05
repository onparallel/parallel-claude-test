import { gql } from "@apollo/client";
import { Flex, HStack, IconButton, Text } from "@chakra-ui/react";
import { BellSettingsIcon, FolderIcon } from "@parallel/chakra/icons";
import { ContactListPopover } from "@parallel/components/common/ContactListPopover";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { DateTime } from "@parallel/components/common/DateTime";
import { Link } from "@parallel/components/common/Link";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { PetitionSignatureCellContent } from "@parallel/components/common/PetitionSignatureCellContent";
import { PetitionStatusCellContent } from "@parallel/components/common/PetitionStatusCellContent";
import { PetitionTagListCellContent } from "@parallel/components/common/PetitionTagListCellContent";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import { TableColumn } from "@parallel/components/common/Table";
import { UserAvatarList } from "@parallel/components/common/UserAvatarList";
import { PetitionListSharedWithFilter } from "@parallel/components/petition-list/filters/shared-with/PetitionListSharedWithFilter";
import { PetitionListStatusFilter } from "@parallel/components/petition-list/filters/status/PetitionListStatusFilter";
import { PetitionListTagFilter } from "@parallel/components/petition-list/tags/PetitionListTagFilter";
import { TemplateActiveSettingsIcons } from "@parallel/components/petition-new/TemplateActiveSettingsIcons";
import {
  PetitionBaseType,
  usePetitionsTableColumns_PetitionBaseFragment,
  usePetitionsTableColumns_PetitionBase_PetitionTemplate_Fragment,
  usePetitionsTableColumns_PetitionBase_Petition_Fragment,
  usePetitionsTableColumns_PetitionFolderFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { MouseEvent, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, maxBy, minBy } from "remeda";
import { EnumerateList } from "./EnumerateList";
import { useGoToContact } from "./goToContact";
import { useGoToPetition } from "./goToPetition";

type PetitionBase = usePetitionsTableColumns_PetitionBaseFragment;
type Petition = usePetitionsTableColumns_PetitionBase_Petition_Fragment;
type Template = usePetitionsTableColumns_PetitionBase_PetitionTemplate_Fragment;
type PetitionFolder = usePetitionsTableColumns_PetitionFolderFragment;

type PetitionsTableColumns_PetitionBaseOrFolder = TableColumn<PetitionBase | PetitionFolder, any>;
type PetitionsTableColumns_PetitionOrFolder = TableColumn<Petition | PetitionFolder, any>;
type PetitionsTableColumns_PetitionTemplateOrFolder = TableColumn<Template | PetitionFolder, any>;

export function usePetitionsTableColumns(type: PetitionBaseType) {
  const intl = useIntl();
  return useMemo(
    () =>
      [
        {
          key: "name",
          isSortable: true,
          header: intl.formatMessage({
            id: "petitions.header.name",
            defaultMessage: "Name",
          }),
          cellProps: {
            maxWidth: 0,
            width: "30%",
            minWidth: "240px",
          },
          CellContent: ({ row }) =>
            row.__typename === "PetitionFolder" ? (
              <HStack>
                <FolderIcon />
                <OverflownText>{row.folderName}</OverflownText>
              </HStack>
            ) : row.__typename === "Petition" ? (
              <OverflownText textStyle={row.name ? undefined : "hint"}>
                {row.name ||
                  intl.formatMessage({
                    id: "generic.unnamed-parallel",
                    defaultMessage: "Unnamed parallel",
                  })}
              </OverflownText>
            ) : row.__typename === "PetitionTemplate" ? (
              <OverflownText textStyle={row.name ? undefined : "hint"}>
                {row.name ||
                  intl.formatMessage({
                    id: "generic.unnamed-template",
                    defaultMessage: "Unnamed template",
                  })}
              </OverflownText>
            ) : null,
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
                },
                CellContent: ({ row }) => {
                  if (row.__typename === "Petition") {
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
                  } else {
                    return null;
                  }
                },
              },
              {
                key: "status",
                header: intl.formatMessage({
                  id: "petitions.header.status",
                  defaultMessage: "Status",
                }),
                isFilterable: true,
                Filter: PetitionListStatusFilter,
                align: "center",
                cellProps: (row) =>
                  row.__typename === "Petition"
                    ? {
                        minWidth: "180px",
                        "data-section": "petition-progress",
                        "data-petition-status": row.status,
                      }
                    : {},
                CellContent: ({ row }) =>
                  row.__typename === "Petition" ? (
                    <PetitionStatusCellContent petition={row} />
                  ) : (
                    <></>
                  ),
              },
              {
                key: "signature",
                align: "center",
                headerProps: { padding: 0 },
                cellProps: { padding: 0, width: 8 },
                CellContent: ({ row }) =>
                  row.__typename === "Petition" ? (
                    <Flex alignItems="center" paddingRight="2">
                      <PetitionSignatureCellContent petition={row} />
                    </Flex>
                  ) : (
                    <></>
                  ),
              },
            ] as PetitionsTableColumns_PetitionOrFolder[])
          : ([
              {
                key: "settings",
                header: intl.formatMessage({
                  id: "petitions.header.settings",
                  defaultMessage: "Settings",
                }),
                align: "left",
                cellProps: {
                  minWidth: "205px",
                },
                CellContent: ({ row }) =>
                  row.__typename === "PetitionTemplate" ? (
                    <TemplateActiveSettingsIcons template={row} spacing={4} />
                  ) : (
                    <></>
                  ),
              },
            ] as PetitionsTableColumns_PetitionTemplateOrFolder[])),
        {
          key: "sharedWith",
          header: intl.formatMessage({
            id: "petitions.header.shared",
            defaultMessage: "Shared",
          }),
          isFilterable: true,
          Filter: PetitionListSharedWithFilter,
          align: "left",
          cellProps: { minWidth: "132px" },
          CellContent: ({ row, column }) => {
            if (row.__typename === "Petition" || row.__typename === "PetitionTemplate") {
              const { permissions } = row;
              return (
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
              );
            } else {
              return null;
            }
          },
        },
        ...(type === "PETITION"
          ? ([
              {
                key: "sentAt",
                isSortable: true,
                header: intl.formatMessage({
                  id: "generic.sent-at",
                  defaultMessage: "Sent at",
                }),
                cellProps: { width: "1%", minWidth: "160px" },
                CellContent: ({ row }) => {
                  if (row.__typename === "Petition") {
                    const { sentAt } = row;
                    return sentAt ? (
                      <DateTime
                        value={sentAt}
                        format={FORMATS.LLL}
                        useRelativeTime
                        whiteSpace="nowrap"
                      />
                    ) : (
                      <Text as="span" textStyle="hint" whiteSpace="nowrap">
                        <FormattedMessage id="generic.not-sent" defaultMessage="Not sent" />
                      </Text>
                    );
                  } else {
                    return null;
                  }
                },
              },
              {
                key: "reminders",
                isSortable: false,
                header: intl.formatMessage({
                  id: "petitions.header.reminders",
                  defaultMessage: "Reminders",
                }),

                CellContent: ({ row }) => {
                  if (row.__typename === "Petition") {
                    const lastReminderDate = maxBy(
                      row.accesses.map((a) => a.reminders[0]?.createdAt),
                      (date) => new Date(date).valueOf()
                    );

                    const nextReminderAt = minBy(
                      row.accesses.filter((a) => !!a.nextReminderAt),
                      (a) => new Date(a.nextReminderAt!).valueOf()
                    )?.nextReminderAt;

                    const redirect = useGoToPetition();

                    return (
                      <Flex
                        alignItems="center"
                        onClick={(e) => {
                          e.stopPropagation();
                          redirect(row.id, row.status === "DRAFT" ? "compose" : "activity");
                        }}
                        whiteSpace="nowrap"
                      >
                        {lastReminderDate ? (
                          <DateTime
                            value={lastReminderDate}
                            format={FORMATS.MMMdd}
                            whiteSpace="nowrap"
                          />
                        ) : (
                          <Text as="span" textStyle="hint">
                            <FormattedMessage
                              id="petitions.header.reminders-disabled"
                              defaultMessage="No reminders"
                            />
                          </Text>
                        )}
                        {nextReminderAt ? (
                          <SmallPopover
                            content={
                              <Text color="gray.800" fontSize="sm">
                                <FormattedMessage
                                  id="petitions.header.reminders-next-reminder-at.popover"
                                  defaultMessage="Next reminder configured for {date}"
                                  values={{
                                    date: <DateTime format={FORMATS.LLL} value={nextReminderAt} />,
                                  }}
                                />
                              </Text>
                            }
                            placement="bottom-end"
                          >
                            <IconButton
                              marginLeft={1}
                              variant="ghost"
                              aria-label={intl.formatMessage({
                                id: "petitions.header.reminders-next-reminder-at",
                                defaultMessage: "Next reminder configured",
                              })}
                              size="xs"
                              icon={<BellSettingsIcon fontSize="16px" color="gray.500" />}
                            />
                          </SmallPopover>
                        ) : null}
                      </Flex>
                    );
                  } else {
                    return null;
                  }
                },
              },
            ] as PetitionsTableColumns_PetitionOrFolder[])
          : ([
              {
                key: "createdAt",
                isSortable: true,
                header: intl.formatMessage({
                  id: "generic.created-at",
                  defaultMessage: "Created at",
                }),
                cellProps: { width: "1%" },
                CellContent: ({ row }) => {
                  if (row.__typename === "PetitionTemplate") {
                    const { createdAt } = row;
                    return (
                      <DateTime
                        value={createdAt}
                        format={FORMATS.LLL}
                        useRelativeTime
                        whiteSpace="nowrap"
                      />
                    );
                  } else {
                    return null;
                  }
                },
              },
            ] as PetitionsTableColumns_PetitionTemplateOrFolder[])),
        {
          key: "tags",
          header: intl.formatMessage({
            id: "petitions.header.tags",
            defaultMessage: "Tags",
          }),
          cellProps: {
            width: "30%",
            minWidth: "300px",
            padding: 0,
            _last: { paddingRight: 0 },
          },
          isFilterable: true,
          Filter: PetitionListTagFilter,
          CellContent: ({ row }) => {
            if (row.__typename === "Petition" || row.__typename === "PetitionTemplate") {
              return <PetitionTagListCellContent petition={row} />;
            } else {
              return null;
            }
          },
        },
      ] as PetitionsTableColumns_PetitionBaseOrFolder[],
    [intl.locale, type]
  );
}

usePetitionsTableColumns.fragments = {
  PetitionFolder: gql`
    fragment usePetitionsTableColumns_PetitionFolder on PetitionFolder {
      folderId: id
      folderName: name
    }
  `,
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
      ... on PetitionTemplate {
        descriptionExcerpt
        ...TemplateActiveSettingsIcons_PetitionTemplate
      }
    }
    ${UserAvatarList.fragments.User}
    ${UserAvatarList.fragments.UserGroup}
    ${PetitionTagListCellContent.fragments.PetitionBase}
    ${ContactReference.fragments.Contact}
    ${PetitionStatusCellContent.fragments.Petition}
    ${PetitionSignatureCellContent.fragments.Petition}
    ${TemplateActiveSettingsIcons.fragments.PetitionTemplate}
  `,
};
