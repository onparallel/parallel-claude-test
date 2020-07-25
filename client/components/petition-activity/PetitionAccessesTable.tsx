import { gql } from "@apollo/client";
import {
  Button,
  Flex,
  Heading,
  MenuItem,
  MenuList,
  Stack,
  Text,
} from "@chakra-ui/core";
import {
  BellIcon,
  ChevronDownIcon,
  EmailIcon,
  SettingsIcon,
  UserCheckIcon,
  UserPlusIcon,
  UserXIcon,
} from "@parallel/chakra/icons";
import {
  PetitionAccessTable_PetitionAccessFragment,
  PetitionAccessTable_PetitionFragment,
  PetitionStatus,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage, FormattedNumber, useIntl } from "react-intl";
import { ButtonDropdown } from "../common/ButtonDropdown";
import { Card, CardProps } from "../common/Card";
import { ContactLink } from "../common/ContactLink";
import { DateTime } from "../common/DateTime";
import { DeletedContact } from "../common/DeletedContact";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { Spacer } from "../common/Spacer";
import { Table, TableColumn } from "../common/Table";

type PetitionAccessSelection = PetitionAccessTable_PetitionAccessFragment;

export function PetitionAccessesTable({
  petition,
  onAddPetitionAccess,
  onSendMessage,
  onSendReminders,
  onReactivateAccess,
  onDeactivateAccess,
  onConfigureReminders,
  ...props
}: {
  petition: PetitionAccessTable_PetitionFragment;
  onAddPetitionAccess: () => void;
  onSendMessage: (accessIds: string[]) => void;
  onSendReminders: (accessIds: string[]) => void;
  onReactivateAccess: (accessId: string) => void;
  onDeactivateAccess: (accessId: string) => void;
  onConfigureReminders: (accessIds: string[]) => void;
} & CardProps) {
  const intl = useIntl();
  const [selection, setSelection] = useState<string[]>([]);
  const selected = useMemo(
    () => selection.map((id) => petition.accesses.find((a) => a.id === id)!),
    [selection, petition.accesses]
  );

  const handleSendMessage = useCallback(async () => {
    onSendMessage(selection);
  }, [selection]);
  const handleSendReminders = useCallback(async () => {
    onSendReminders(selection);
  }, [selection]);
  const columns = usePetitionAccessesColumns({
    petitionStatus: petition.status,
    onSendMessage,
    onSendReminders,
    onReactivateAccess,
    onDeactivateAccess,
  });

  const handleConfigureReminders = useCallback(async () => {
    onConfigureReminders(selection);
  }, [selection]);

  const showActions =
    selection.length > 0 && selected.every((a) => a.status === "ACTIVE");

  return (
    <Card {...props}>
      <Stack
        direction="row"
        padding={2}
        paddingLeft={4}
        alignItems="center"
        borderBottom="1px solid"
        borderBottomColor="gray.200"
      >
        <Heading fontSize="lg">
          <FormattedMessage
            id="petition-access.header"
            defaultMessage="Petition access control"
          />
        </Heading>
        <Spacer />
        {showActions ? (
          <ButtonDropdown
            rightIcon={<ChevronDownIcon />}
            dropdown={
              <MenuList minWidth="160px">
                <MenuItem
                  isDisabled={selected.some((a) => a.status === "INACTIVE")}
                  onClick={handleSendMessage}
                >
                  <EmailIcon marginRight={2} />
                  <FormattedMessage
                    id="petition-accesses.send-message"
                    defaultMessage="Send message"
                  />
                </MenuItem>
                <MenuItem
                  isDisabled={
                    petition.status !== "PENDING" ||
                    selected.some((a) => a.status === "INACTIVE")
                  }
                  onClick={handleSendReminders}
                >
                  <BellIcon marginRight={2} />
                  <FormattedMessage
                    id="petition-accesses.send-reminder"
                    defaultMessage="Send reminder"
                  />
                </MenuItem>
                <MenuItem
                  isDisabled={
                    petition.status !== "PENDING" ||
                    selected.some((a) => a.status === "INACTIVE")
                  }
                  onClick={handleConfigureReminders}
                >
                  <SettingsIcon marginRight={2} />
                  <FormattedMessage
                    id="petition-accesses.reminder-settings"
                    defaultMessage="Reminder settings"
                  />
                </MenuItem>
              </MenuList>
            }
          >
            <FormattedMessage
              id="generic.actions-button"
              defaultMessage="Actions"
            />
          </ButtonDropdown>
        ) : null}
        <Button
          colorScheme="purple"
          leftIcon={<UserPlusIcon />}
          onClick={onAddPetitionAccess}
        >
          {intl.formatMessage({
            id: "petition.add-contact-button",
            defaultMessage: "Add contact",
          })}
        </Button>
      </Stack>
      <Table
        columns={columns}
        rows={petition.accesses ?? []}
        rowKeyProp="id"
        isSelectable
        onSelectionChange={setSelection}
        marginBottom={2}
      />
    </Card>
  );
}

function usePetitionAccessesColumns({
  petitionStatus,
  onReactivateAccess,
  onDeactivateAccess,
  onSendMessage,
  onSendReminders,
}: {
  petitionStatus: PetitionStatus;
  onReactivateAccess: (accessId: string) => void;
  onDeactivateAccess: (accessId: string) => void;
  onSendMessage: (accessIds: string[]) => void;
  onSendReminders: (accessIds: string[]) => void;
}): TableColumn<PetitionAccessSelection>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "contact",
        header: intl.formatMessage({
          id: "petition-accesses.contact-header",
          defaultMessage: "Contact",
        }),
        CellContent: ({ row: { contact } }) =>
          contact ? <ContactLink contact={contact} /> : <DeletedContact />,
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
            <DateTime value={nextReminderAt} format={FORMATS.LLL} />
          ) : remindersLeft ? (
            <Text color="gray.400" fontStyle="italic">
              <FormattedMessage
                id="petitions.reminders-not-set"
                defaultMessage="Not set"
              />
            </Text>
          ) : (
            <Text color="gray.400" fontStyle="italic">
              <FormattedMessage
                id="petitions.no-reminders-left"
                defaultMessage="No reminders left"
              />
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
        CellContent: ({ row: { reminderCount, nextReminderAt } }) => {
          return reminderCount ? (
            <FormattedNumber value={reminderCount} />
          ) : (
            <Text color="gray.400" fontStyle="italic">
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
          id: "petition-accesses.created-at-header",
          defaultMessage: "Created at",
        }),
        CellContent: ({ row: { createdAt } }) => (
          <DateTime value={createdAt} format={FORMATS.LLL} />
        ),
      },
      {
        key: "actions",
        header: "",
        cellProps: {
          paddingY: 1,
          width: "1px",
        },
        CellContent: ({ row: { id, status, contact } }) => {
          const intl = useIntl();
          return contact ? (
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              {status === "ACTIVE" ? (
                <IconButtonWithTooltip
                  label={intl.formatMessage({
                    id: "petition-accesses.send-message",
                    defaultMessage: "Send message",
                  })}
                  onClick={() => onSendMessage([id])}
                  placement="bottom"
                  icon={<EmailIcon />}
                  size="sm"
                />
              ) : null}
              {status === "ACTIVE" ? (
                <IconButtonWithTooltip
                  isDisabled={petitionStatus !== "PENDING"}
                  label={intl.formatMessage({
                    id: "petition-accesses.send-reminder",
                    defaultMessage: "Send reminder",
                  })}
                  onClick={() => onSendReminders([id])}
                  placement="bottom"
                  icon={<BellIcon />}
                  size="sm"
                />
              ) : null}
              {status === "ACTIVE" ? (
                <IconButtonWithTooltip
                  label={intl.formatMessage({
                    id: "petition-accesses.deactivate-access",
                    defaultMessage: "Remove access",
                  })}
                  onClick={() => onDeactivateAccess(id)}
                  placement="bottom"
                  icon={<UserXIcon />}
                  size="sm"
                />
              ) : (
                <IconButtonWithTooltip
                  label={intl.formatMessage({
                    id: "petition-accesses.activate-access",
                    defaultMessage: "Reactivate access",
                  })}
                  onClick={() => onReactivateAccess(id)}
                  placement="left"
                  icon={<UserCheckIcon />}
                  size="sm"
                />
              )}
            </Stack>
          ) : null;
        },
      },
    ],
    [
      intl.locale,
      petitionStatus,
      onReactivateAccess,
      onDeactivateAccess,
      onSendMessage,
      onSendReminders,
    ]
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
      remindersConfig {
        ...PetitionAccessTable_PetitionAccessRemindersConfig
      }
      createdAt
    }
    ${ContactLink.fragments.Contact}
  `,
};
