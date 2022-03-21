import { gql } from "@apollo/client";
import { Flex, IconButton, Text } from "@chakra-ui/react";
import { BellSettingsIcon } from "@parallel/chakra/icons";
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
import {
  PetitionBaseType,
  usePetitionsTableColumns_PetitionBaseFragment,
  usePetitionsTableColumns_PetitionBase_PetitionTemplate_Fragment,
  usePetitionsTableColumns_PetitionBase_Petition_Fragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { MouseEvent, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, maxBy, minBy } from "remeda";
import { EnumerateList } from "./EnumerateList";
import { useGoToContact } from "./goToContact";
import { useGoToPetition } from "./goToPetition";

type PetitionBaseTableColumn = TableColumn<usePetitionsTableColumns_PetitionBaseFragment, any>;

type PetitionTableColumn = TableColumn<
  usePetitionsTableColumns_PetitionBase_Petition_Fragment,
  any
>;

type PetitionTemplateTableColumn = TableColumn<
  usePetitionsTableColumns_PetitionBase_PetitionTemplate_Fragment,
  any
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
          },
          CellContent: ({ row }) => (
            <OverflownText textStyle={row.name ? undefined : "hint"}>
              {row.name
                ? row.name
                : type === "PETITION"
                ? intl.formatMessage({
                    id: "generic.unnamed-petition",
                    defaultMessage: "Unnamed petition",
                  })
                : intl.formatMessage({
                    id: "generic.unnamed-template",
                    defaultMessage: "Unnamed template",
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
                isFilterable: true,
                Filter: PetitionListStatusFilter,
                headerProps: {
                  minWidth: "180px",
                },
                align: "center",
                cellProps: (row) => ({
                  "data-section": "petition-progress",
                  "data-petition-status": row.status,
                }),
                CellContent: ({ row }) => <PetitionStatusCellContent petition={row} />,
              },
              {
                key: "signature",
                align: "center",
                headerProps: { padding: 0, width: 8 },
                cellProps: { padding: 0 },
                CellContent: ({ row, context }) => (
                  <Flex alignItems="center" paddingRight="2">
                    <PetitionSignatureCellContent petition={row} />
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
                  return <>{row.descriptionExcerpt}</>;
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
        ...(type === "PETITION"
          ? ([
              {
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
                      whiteSpace="nowrap"
                    />
                  ) : (
                    <Text as="span" textStyle="hint">
                      <FormattedMessage id="generic.not-sent" defaultMessage="Not sent" />
                    </Text>
                  ),
              },
              {
                key: "lastReminder",
                isSortable: false,
                header: intl.formatMessage({
                  id: "petitions.header.last-reminder",
                  defaultMessage: "Last reminder",
                }),

                CellContent: ({ row }) => {
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
                },
              },
            ] as PetitionTableColumn[])
          : ([
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
            ] as PetitionTemplateTableColumn[])),
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
          isFilterable: true,
          Filter: PetitionListTagFilter,
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
      }
    }
    ${UserAvatarList.fragments.User}
    ${UserAvatarList.fragments.UserGroup}
    ${PetitionTagListCellContent.fragments.PetitionBase}
    ${ContactReference.fragments.Contact}
    ${PetitionStatusCellContent.fragments.Petition}
    ${PetitionSignatureCellContent.fragments.Petition}
  `,
};
