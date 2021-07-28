import { gql } from "@apollo/client";
import {
  Box,
  BoxProps,
  Button,
  Flex,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import {
  BellIcon,
  BellOffIcon,
  BellSettingsIcon,
  ChevronDownIcon,
  SettingsIcon,
  UserCheckIcon,
  UserPlusIcon,
  UserXIcon,
} from "@parallel/chakra/icons";
import {
  PetitionAccessTable_PetitionAccessFragment,
  PetitionAccessTable_PetitionFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage, FormattedNumber, useIntl } from "react-intl";
import { Card, GenericCardHeader } from "../common/Card";
import { ContactLink } from "../common/ContactLink";
import { DateTime } from "../common/DateTime";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { Table, TableColumn } from "../common/Table";

export interface PetitionAccessesTable extends BoxProps {
  petition: PetitionAccessTable_PetitionFragment;
  onAddPetitionAccess: () => void;
  onSendReminders: (
    selected: PetitionAccessTable_PetitionAccessFragment[]
  ) => void;
  onReactivateAccess: (accessId: string) => void;
  onDeactivateAccess: (accessId: string) => void;
  onConfigureReminders: (
    selected: PetitionAccessTable_PetitionAccessFragment[]
  ) => void;
}

export function PetitionAccessesTable({
  petition,
  onAddPetitionAccess,
  onSendReminders,
  onReactivateAccess,
  onDeactivateAccess,
  onConfigureReminders,
  ...props
}: PetitionAccessesTable) {
  const intl = useIntl();
  const [selection, setSelection] = useState<string[]>([]);
  const selected = useMemo(
    () => selection.map((id) => petition.accesses.find((a) => a.id === id)!),
    [selection, petition.accesses]
  );

  const handleSendReminders = useCallback(async () => {
    onSendReminders(selected);
  }, [selected]);
  const handleConfigureReminders = useCallback(async () => {
    onConfigureReminders(selected);
  }, [selected]);

  const showActions =
    selection.length > 0 && selected.every((a) => a.status === "ACTIVE");

  const columns = usePetitionAccessesColumns();
  const context = useMemo(
    () => ({
      petition,
      onSendReminders,
      onReactivateAccess,
      onDeactivateAccess,
      onConfigureReminders,
    }),
    [petition]
  );

  const optedOut = selected.filter((selected) => selected.remindersOptOut);

  return (
    <Card {...props}>
      <GenericCardHeader
        omitDivider
        rightAction={
          <Stack direction="row">
            {showActions ? (
              <Menu>
                <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                  <FormattedMessage
                    id="generic.actions-button"
                    defaultMessage="Actions"
                  />
                </MenuButton>
                <Portal>
                  <MenuList minWidth="160px">
                    <MenuItem
                      isDisabled={
                        petition.status !== "PENDING" ||
                        selected.some((a) => a.status === "INACTIVE")
                      }
                      onClick={handleSendReminders}
                      icon={<BellIcon display="block" boxSize={4} />}
                    >
                      <FormattedMessage
                        id="petition-accesses.send-reminder"
                        defaultMessage="Send reminder"
                      />
                    </MenuItem>
                    <MenuItem
                      isDisabled={
                        petition.status !== "PENDING" ||
                        selected.some((a) => a.status === "INACTIVE") ||
                        optedOut.length === selected.length
                      }
                      onClick={handleConfigureReminders}
                      icon={<SettingsIcon display="block" boxSize={4} />}
                    >
                      <FormattedMessage
                        id="petition-accesses.reminder-settings"
                        defaultMessage="Reminder settings"
                      />
                    </MenuItem>
                  </MenuList>
                </Portal>
              </Menu>
            ) : null}
            <Button
              leftIcon={<UserPlusIcon fontSize="18px" />}
              onClick={onAddPetitionAccess}
            >
              {intl.formatMessage({
                id: "petition.add-contact-button",
                defaultMessage: "Add access",
              })}
            </Button>
          </Stack>
        }
      >
        <FormattedMessage
          id="petition-access.header"
          defaultMessage="Petition access control"
        />
      </GenericCardHeader>
      <Box overflowX="auto">
        <Table
          columns={columns}
          context={context}
          rows={petition.accesses ?? []}
          rowKeyProp="id"
          isSelectable
          onSelectionChange={setSelection}
          marginBottom={2}
        />
      </Box>
    </Card>
  );
}

function usePetitionAccessesColumns(): TableColumn<
  PetitionAccessTable_PetitionAccessFragment,
  {
    petition: PetitionAccessTable_PetitionFragment;
    onReactivateAccess: (accessId: string) => void;
    onDeactivateAccess: (accessId: string) => void;
    onSendReminders: (
      selected: PetitionAccessTable_PetitionAccessFragment[]
    ) => void;
    onConfigureReminders: (
      selected: PetitionAccessTable_PetitionAccessFragment[]
    ) => void;
  }
>[] {
  const intl = useIntl();

  return useMemo(
    () => [
      {
        key: "contact",
        header: intl.formatMessage({
          id: "petition-accesses.contact-header",
          defaultMessage: "Contact",
        }),
        CellContent: ({ row: { contact, remindersOptOut } }) => (
          <HStack>
            <ContactLink contact={contact} />
            {remindersOptOut ? (
              <Tooltip
                label={intl.formatMessage({
                  id: "petition-accesses.reminders-opt-out-popover",
                  defaultMessage: "Opted out from receiving reminders",
                })}
              >
                <BellOffIcon
                  alt={intl.formatMessage({
                    id: "petition-accesses.reminders-opt-out-popover",
                    defaultMessage: "Opted out from receiving reminders",
                  })}
                  marginLeft={1}
                  fontSize="16px"
                  color="gray.500"
                  _hover={{ color: "gray.600" }}
                />
              </Tooltip>
            ) : null}
          </HStack>
        ),
      },
      {
        key: "status",
        header: intl.formatMessage({
          id: "petition-accesses.status-header",
          defaultMessage: "Status",
        }),
        CellContent: ({ row: { status } }) => {
          return status === "ACTIVE" ? (
            <Text color="green.500">
              <FormattedMessage
                id="petition-access.status-active"
                defaultMessage="Active"
              />
            </Text>
          ) : status === "INACTIVE" ? (
            <Flex alignItems="center" color="red.500">
              <FormattedMessage
                id="petition-access.status-inactive"
                defaultMessage="Inactive"
              />
            </Flex>
          ) : null;
        },
      },
      {
        key: "next-reminder",
        header: intl.formatMessage({
          id: "petition-accesses.next-reminder-header",
          defaultMessage: "Next reminder",
        }),
        CellContent: ({
          row: { nextReminderAt, remindersLeft, remindersActive },
        }) => {
          return remindersActive && nextReminderAt ? (
            <DateTime
              value={nextReminderAt}
              format={FORMATS.LLL}
              whiteSpace="nowrap"
            />
          ) : (
            <Text textStyle="hint" whiteSpace="nowrap">
              {remindersLeft ? (
                <FormattedMessage
                  id="petitions.reminders-not-set"
                  defaultMessage="Not set"
                />
              ) : (
                <FormattedMessage
                  id="petitions.no-reminders-left"
                  defaultMessage="No reminders left"
                />
              )}
            </Text>
          );
        },
      },
      {
        key: "reminders-sent",
        header: intl.formatMessage({
          id: "petition-accesses.reminders-sent-header",
          defaultMessage: "Reminders sent",
        }),
        CellContent: ({ row: { reminderCount } }) => {
          return reminderCount ? (
            <FormattedNumber value={reminderCount} />
          ) : (
            <Text textStyle="hint" whiteSpace="nowrap">
              <FormattedMessage
                id="petition-accesses.no-reminders-sent"
                defaultMessage="No reminders sent"
              />
            </Text>
          );
        },
      },
      {
        key: "createdAt",
        header: intl.formatMessage({
          id: "generic.created-at",
          defaultMessage: "Created at",
        }),
        CellContent: ({ row: { createdAt } }) => (
          <DateTime
            value={createdAt}
            format={FORMATS.LLL}
            whiteSpace="nowrap"
          />
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
          const {
            petition,
            onSendReminders,
            onConfigureReminders,
            onDeactivateAccess,
            onReactivateAccess,
          } = context!;
          const { id, status, contact, remindersOptOut } = row;
          const intl = useIntl();

          return contact ? (
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              {status === "ACTIVE" ? (
                <>
                  <IconButtonWithTooltip
                    isDisabled={petition.status !== "PENDING"}
                    label={intl.formatMessage({
                      id: "petition-accesses.send-reminder",
                      defaultMessage: "Send reminder",
                    })}
                    onClick={() => onSendReminders([row])}
                    placement="bottom"
                    icon={<BellIcon fontSize="16px" />}
                    size="sm"
                  />
                  <IconButtonWithTooltip
                    isDisabled={
                      petition.status !== "PENDING" || remindersOptOut
                    }
                    label={intl.formatMessage({
                      id: "petition-accesses.reminder-settings",
                      defaultMessage: "Reminder settings",
                    })}
                    onClick={() => onConfigureReminders([row])}
                    placement="bottom"
                    icon={<BellSettingsIcon fontSize="16px" />}
                    size="sm"
                  />
                  <IconButtonWithTooltip
                    label={intl.formatMessage({
                      id: "petition-accesses.deactivate-access",
                      defaultMessage: "Remove access",
                    })}
                    onClick={() => onDeactivateAccess(id)}
                    placement="bottom"
                    icon={<UserXIcon fontSize="16px" />}
                    size="sm"
                  />
                </>
              ) : (
                <IconButtonWithTooltip
                  label={intl.formatMessage({
                    id: "petition-accesses.activate-access",
                    defaultMessage: "Reactivate access",
                  })}
                  onClick={() => onReactivateAccess(id)}
                  placement="left"
                  icon={<UserCheckIcon fontSize="16px" />}
                  size="sm"
                />
              )}
            </Stack>
          ) : null;
        },
      },
    ],
    [intl.locale]
  );
}

PetitionAccessesTable.fragments = {
  Petition: gql`
    fragment PetitionAccessTable_Petition on Petition {
      status
      accesses {
        ...PetitionAccessTable_PetitionAccess
      }
    }
    fragment PetitionAccessTable_PetitionAccessRemindersConfig on RemindersConfig {
      offset
      time
      timezone
      weekdaysOnly
    }
    fragment PetitionAccessTable_PetitionAccess on PetitionAccess {
      id
      contact {
        ...ContactLink_Contact
      }
      status
      nextReminderAt
      remindersLeft
      reminderCount
      remindersActive
      remindersOptOut
      remindersConfig {
        ...PetitionAccessTable_PetitionAccessRemindersConfig
      }
      createdAt
    }
    ${ContactLink.fragments.Contact}
  `,
};
