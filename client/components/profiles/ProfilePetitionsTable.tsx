import { gql } from "@apollo/client";
import { Box, Button, Center, Flex, Stack, Text } from "@chakra-ui/react";
import { AddIcon, CloseIconSmall } from "@parallel/chakra/icons";
import { ContactListPopover } from "@parallel/components/common/ContactListPopover";
import { DateTime } from "@parallel/components/common/DateTime";
import { Link, NormalLink } from "@parallel/components/common/Link";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { Table, TableColumn } from "@parallel/components/common/Table";
import { ProfilePetitionsTable_PetitionFragment } from "@parallel/graphql/__types";
import { EnumerateList } from "@parallel/utils/EnumerateList";
import { FORMATS } from "@parallel/utils/dates";
import { useGoToContact } from "@parallel/utils/goToContact";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { MouseEvent, useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import { Card, CardHeader } from "../common/Card";
import { ContactReference } from "../common/ContactReference";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { PetitionSignatureCellContent } from "../common/PetitionSignatureCellContent";
import { PetitionStatusCellContent } from "../common/PetitionStatusCellContent";
import { UserAvatarList } from "../common/UserAvatarList";

export function ProfilePetitionsTable({
  onAddPetition,
  onRemovePetition,
  petitions,
}: {
  onAddPetition: () => {};
  onRemovePetition: (arg: { petitionId: string; petitionName: string }) => {};
  petitions: ProfilePetitionsTable_PetitionFragment[];
}) {
  const columns = useProfilePetitionsTableColumns();

  const context = useMemo(
    () => ({
      onRemovePetition,
    }),
    []
  );

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

  return (
    <Card data-section="profile-petitions-table">
      <CardHeader
        omitDivider={petitions.length > 0}
        headingSize="md"
        rightAction={
          <Box>
            <Button leftIcon={<AddIcon />} colorScheme="primary" onClick={onAddPetition}>
              <FormattedMessage
                id="component.profile-petitions-table.add-petition"
                defaultMessage="Add parallel"
              />
            </Button>
          </Box>
        }
      >
        <FormattedMessage id="generic.root-petitions" defaultMessage="Parallels" />
      </CardHeader>
      <Box overflowX="auto">
        {petitions.length ? (
          <Table
            columns={columns}
            context={context}
            rows={petitions}
            rowKeyProp="id"
            marginBottom={2}
            onRowClick={handleRowClick}
          />
        ) : (
          <Center minHeight="60px" textAlign="center" padding={4} color="gray.400">
            <Stack spacing={1}>
              <Text>
                <FormattedMessage
                  id="component.profile-petitions-table.no-parallels-associated"
                  defaultMessage="There are no parallels associated to this profile yet."
                />
              </Text>
              <Text>
                <NormalLink onClick={onAddPetition}>
                  <FormattedMessage
                    id="component.profile-petitions-table.add-petition"
                    defaultMessage="Add parallel"
                  />
                </NormalLink>
              </Text>
            </Stack>
          </Center>
        )}
      </Box>
    </Card>
  );
}

function useProfilePetitionsTableColumns(): TableColumn<
  ProfilePetitionsTable_PetitionFragment,
  {
    onRemovePetition: (arg: { petitionId: string; petitionName: string }) => {};
  }
>[] {
  const intl = useIntl();

  return useMemo(
    () => [
      {
        key: "name",
        header: intl.formatMessage({
          id: "generic.parallel-name",
          defaultMessage: "Parallel name",
        }),
        headerProps: {
          width: "30%",
          minWidth: "220px",
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
          minWidth: "180px",
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
        CellContent: ({ row: { sentAt } }) =>
          sentAt ? (
            <DateTime
              fontSize="sm"
              value={sentAt}
              format={FORMATS.LLL}
              useRelativeTime
              whiteSpace="nowrap"
            />
          ) : (
            <Text as="span" textStyle="hint" whiteSpace="nowrap">
              <FormattedMessage id="generic.not-sent" defaultMessage="Not sent" />
            </Text>
          ),
      },
      {
        key: "actions",
        header: "",
        cellProps: {
          paddingY: 1,
          width: "1px",
        },
        CellContent: ({ row, context }) => {
          const intl = useIntl();
          const { onRemovePetition } = context!;

          return (
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <IconButtonWithTooltip
                label={intl.formatMessage({
                  id: "component.profile-petitions-table.remove-profile-button",
                  defaultMessage: "Remove association",
                })}
                isDisabled={row.isAnonymized}
                onClick={(event) => {
                  event.stopPropagation();
                  onRemovePetition({
                    petitionId: row.id,
                    petitionName:
                      row.name ??
                      intl.formatMessage({
                        id: "generic.unnamed-parallel",
                        defaultMessage: "Unnamed parallel",
                      }),
                  });
                }}
                placement="bottom"
                icon={<CloseIconSmall fontSize="16px" />}
                size="sm"
              />
            </Stack>
          );
        },
      },
    ],
    [intl.locale]
  );
}

ProfilePetitionsTable.fragments = {
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
