import { gql } from "@apollo/client";
import {
  Button,
  Flex,
  Heading,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/core";
import {
  BellIcon,
  BellSettingsIcon,
  ChevronDownIcon,
  EmailIcon,
  SettingsIcon,
  UserCheckIcon,
  UserPlusIcon,
  UserXIcon,
} from "@parallel/chakra/icons";
import { ExtendChakra } from "@parallel/chakra/utils";
import {
  PetitionAccessTable_PetitionAccessFragment,
  PetitionAccessTable_PetitionFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage, FormattedNumber, useIntl } from "react-intl";
import { Card } from "../common/Card";
import { ContactLink } from "../common/ContactLink";
import { DateTime } from "../common/DateTime";
import { DeletedContact } from "../common/DeletedContact";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { Spacer } from "../common/Spacer";
import { Table, TableColumn } from "../common/Table";

export function PetitionAccessesTable({
  petition,
  onAddPetitionAccess,
  onSendMessage,
  onSendReminders,
  onReactivateAccess,
  onDeactivateAccess,
  onConfigureReminders,
  ...props
}: ExtendChakra<{
  petition: PetitionAccessTable_PetitionFragment;
  onAddPetitionAccess: () => void;
  onSendMessage: (accessIds: string[]) => void;
  onSendReminders: (accessIds: string[]) => void;
  onReactivateAccess: (accessId: string) => void;
  onDeactivateAccess: (accessId: string) => void;
  onConfigureReminders: (accessIds: string[]) => void;
}>) {
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
  const handleConfigureReminders = useCallback(async () => {
    onConfigureReminders(selection);
  }, [selection]);

  const showActions =
    selection.length > 0 && selected.every((a) => a.status === "ACTIVE");

  const columns = usePetitionAccessesColumns();
  const context = useMemo(
    () => ({
      petition,
      onSendMessage,
      onSendReminders,
      onReactivateAccess,
      onDeactivateAccess,
      onConfigureReminders,
    }),
    []
  );

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
      <Table
        columns={columns}
        context={context}
        rows={petition.accesses ?? []}
        rowKeyProp="id"
        isSelectable
        onSelectionChange={setSelection}
        marginBottom={2}
      />
    </Card>
  );
}

function usePetitionAccessesColumns(): TableColumn<
  PetitionAccessTable_PetitionAccessFragment,
  {
    petition: PetitionAccessTable_PetitionFragment;
    onReactivateAccess: (accessId: string) => void;
    onDeactivateAccess: (accessId: string) => void;
    onSendMessage: (accessIds: string[]) => void;
    onSendReminders: (accessIds: string[]) => void;
    onConfigureReminders: (accessIds: string[]) => void;
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
            <Text textStyle="hint">
              <FormattedMessage
                id="petitions.reminders-not-set"
                defaultMessage="Not set"
              />
            </Text>
          ) : (
            <Text textStyle="hint">
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
            <Text textStyle="hint">
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
        CellContent: ({ row: { id, status, contact }, context }) => {
          const {
            petition,
            onSendMessage,
            onSendReminders,
            onConfigureReminders,
            onDeactivateAccess,
            onReactivateAccess,
          } = context!;
          const intl = useIntl();
          return contact ? (
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              {status === "ACTIVE" ? (
                <>
                  <IconButtonWithTooltip
                    label={intl.formatMessage({
                      id: "petition-accesses.send-message",
                      defaultMessage: "Send message",
                    })}
                    onClick={() => onSendMessage([id])}
                    placement="bottom"
                    icon={<EmailIcon fontSize="16px" />}
                    size="sm"
                  />
                  <IconButtonWithTooltip
                    isDisabled={petition.status !== "PENDING"}
                    label={intl.formatMessage({
                      id: "petition-accesses.send-reminder",
                      defaultMessage: "Send reminder",
                    })}
                    onClick={() => onSendReminders([id])}
                    placement="bottom"
                    icon={<BellIcon fontSize="16px" />}
                    size="sm"
                  />
                  <IconButtonWithTooltip
                    isDisabled={petition.status !== "PENDING"}
                    label={intl.formatMessage({
                      id: "petition-accesses.reminder-settings",
                      defaultMessage: "Reminder settings",
                    })}
                    onClick={() => onConfigureReminders([id])}
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
      remindersConfig {
        ...PetitionAccessTable_PetitionAccessRemindersConfig
      }
      createdAt
    }
    ${ContactLink.fragments.Contact}
  `,
};
