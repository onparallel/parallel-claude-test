import { gql } from "@apollo/client";
import {
  Box,
  BoxProps,
  Button,
  Center,
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
  PaperclipIcon,
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
import { isDefined } from "remeda";
import { Card, CardHeader } from "../common/Card";
import { ContactReference } from "../common/ContactReference";
import { CopyToClipboardButton } from "../common/CopyToClipboardButton";
import { DateTime } from "../common/DateTime";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { NormalLink } from "../common/Link";
import { Table, TableColumn } from "../common/Table";

export interface PetitionAccessesTable extends BoxProps {
  petition: PetitionAccessTable_PetitionFragment;
  onAddPetitionAccess: () => void;
  onSendReminders: (selected: PetitionAccessTable_PetitionAccessFragment[]) => void;
  onReactivateAccess: (accessId: string) => void;
  onDeactivateAccess: (accessId: string) => void;
  onConfigureReminders: (selected: PetitionAccessTable_PetitionAccessFragment[]) => void;
  onPetitionSend: () => void;
}

export function PetitionAccessesTable({
  petition,
  onAddPetitionAccess,
  onSendReminders,
  onReactivateAccess,
  onDeactivateAccess,
  onConfigureReminders,
  onPetitionSend,
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

  const myEffectivePermission = petition.myEffectivePermission!.permissionType;

  const showActions =
    myEffectivePermission !== "READ" &&
    !petition.isAnonymized &&
    selection.length > 0 &&
    selected.every((a) => a.status === "ACTIVE");

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
    <Card {...props} data-section="petition-accesses-table">
      <CardHeader
        omitDivider={petition.accesses.length > 0}
        rightAction={
          <Stack direction="row">
            {showActions ? (
              <Menu>
                <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                  <FormattedMessage id="generic.actions-button" defaultMessage="Actions" />
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
                        id="component.petition-accesses-table.send-reminder"
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
                        id="component.petition-accesses-table.reminder-settings"
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
              isDisabled={petition.isAnonymized || myEffectivePermission === "READ"}
            >
              {intl.formatMessage({
                id: "petition.add-recipient-button",
                defaultMessage: "Add recipient",
              })}
            </Button>
          </Stack>
        }
      >
        <FormattedMessage id="petition-access.header" defaultMessage="Recipients" />
      </CardHeader>
      <Box overflowX="auto">
        {petition.accesses.length ? (
          <Table
            columns={columns}
            context={context}
            rows={petition.accesses}
            rowKeyProp="id"
            isSelectable
            onSelectionChange={setSelection}
            marginBottom={2}
          />
        ) : (
          <Center minHeight="60px" textAlign="center" padding={4} color="gray.400">
            <Stack spacing={1}>
              <Text>
                <FormattedMessage
                  id="petition-access.havent-sent-parallel"
                  defaultMessage="You haven't sent this parallel yet."
                />
              </Text>
              {!petition.isAnonymized && myEffectivePermission !== "READ" ? (
                <Text>
                  <FormattedMessage
                    id="petition-access.click-here-to-send"
                    defaultMessage="Click <a>here</a> to send it."
                    values={{
                      a: (chunks: any) => (
                        <NormalLink onClick={onPetitionSend}>{chunks}</NormalLink>
                      ),
                    }}
                  />
                </Text>
              ) : null}
            </Stack>
          </Center>
        )}
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
    onSendReminders: (selected: PetitionAccessTable_PetitionAccessFragment[]) => void;
    onConfigureReminders: (selected: PetitionAccessTable_PetitionAccessFragment[]) => void;
  }
>[] {
  const intl = useIntl();

  return useMemo(
    () => [
      {
        key: "contact",
        header: intl.formatMessage({
          id: "component.petition-accesses-table.contact-header",
          defaultMessage: "Contact",
        }),
        CellContent: ({ row: { contact, remindersOptOut, isContactless } }) => (
          <HStack>
            {isContactless ? (
              <Text as="span" textStyle="hint">
                <FormattedMessage
                  id="component.petition-accesses-table.contactless-access-contact"
                  defaultMessage="No contact"
                />
              </Text>
            ) : (
              <ContactReference contact={contact} />
            )}
            {remindersOptOut ? (
              <Tooltip
                label={intl.formatMessage({
                  id: "component.petition-accesses-table.reminders-opt-out-popover",
                  defaultMessage: "Opted out from receiving reminders",
                })}
              >
                <BellOffIcon
                  aria-label={intl.formatMessage({
                    id: "component.petition-accesses-table.reminders-opt-out-popover",
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
          id: "component.petition-accesses-table.status-header",
          defaultMessage: "Status",
        }),
        CellContent: ({ row: { status, isContactless } }) => {
          if (isContactless && status === "ACTIVE") {
            return (
              <Text color="yellow.500">
                <FormattedMessage id="petition-access.status-pending" defaultMessage="Pending" />
              </Text>
            );
          }

          return status === "ACTIVE" ? (
            <Text color="green.500">
              <FormattedMessage id="petition-access.status-active" defaultMessage="Active" />
            </Text>
          ) : status === "INACTIVE" ? (
            <Flex alignItems="center" color="red.500">
              <FormattedMessage id="petition-access.status-inactive" defaultMessage="Inactive" />
            </Flex>
          ) : null;
        },
      },
      {
        key: "next-reminder",
        header: intl.formatMessage({
          id: "component.petition-accesses-table.next-reminder-header",
          defaultMessage: "Next reminder",
        }),
        CellContent: ({ row: { nextReminderAt, remindersLeft, remindersActive } }) => {
          return remindersActive && nextReminderAt ? (
            <DateTime value={nextReminderAt} format={FORMATS.LLL} whiteSpace="nowrap" />
          ) : (
            <Text textStyle="hint" whiteSpace="nowrap">
              {remindersLeft ? (
                <FormattedMessage id="petitions.reminders-not-set" defaultMessage="Not set" />
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
          id: "component.petition-accesses-table.reminders-sent-header",
          defaultMessage: "Reminders sent",
        }),
        CellContent: ({ row: { reminderCount } }) => {
          return reminderCount ? (
            <FormattedNumber value={reminderCount} />
          ) : (
            <Text textStyle="hint" whiteSpace="nowrap">
              <FormattedMessage
                id="component.petition-accesses-table.no-reminders-sent"
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
          <DateTime value={createdAt} format={FORMATS.LLL} whiteSpace="nowrap" />
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
          const { id, status, contact, remindersOptOut, isContactless, recipientUrl } = row;
          const intl = useIntl();

          const myEffectivePermission = petition.myEffectivePermission!.permissionType;

          // if the contact is deleted have no actions
          if (!isContactless && !isDefined(contact)) return null;

          if (status === "INACTIVE") {
            const contactHasActiveAccess = petition.accesses.some(
              (access) => access.contact?.id === contact?.id && access.status === "ACTIVE"
            );

            return (
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <IconButtonWithTooltip
                  label={intl.formatMessage({
                    id: "component.petition-accesses-table.activate-access",
                    defaultMessage: "Reactivate access",
                  })}
                  onClick={() => onReactivateAccess(id)}
                  placement="left"
                  icon={<UserCheckIcon fontSize="16px" />}
                  size="sm"
                  isDisabled={petition.isAnonymized || contactHasActiveAccess}
                />
              </Stack>
            );
          }

          return (
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              {isContactless ? (
                <CopyToClipboardButton
                  copyLabel={intl.formatMessage({
                    id: "generic.copy-link",
                    defaultMessage: "Copy link",
                  })}
                  icon={<PaperclipIcon fontSize="16px" />}
                  size="sm"
                  placement="bottom"
                  text={recipientUrl}
                  isDisabled={petition.isAnonymized}
                />
              ) : (
                <>
                  <IconButtonWithTooltip
                    isDisabled={
                      petition.status !== "PENDING" ||
                      petition.isAnonymized ||
                      myEffectivePermission === "READ"
                    }
                    label={intl.formatMessage({
                      id: "component.petition-accesses-table.send-reminder",
                      defaultMessage: "Send reminder",
                    })}
                    onClick={() => onSendReminders([row])}
                    placement="bottom"
                    icon={<BellIcon fontSize="16px" />}
                    size="sm"
                  />
                  <IconButtonWithTooltip
                    isDisabled={
                      petition.status !== "PENDING" ||
                      remindersOptOut ||
                      petition.isAnonymized ||
                      myEffectivePermission === "READ"
                    }
                    label={intl.formatMessage({
                      id: "component.petition-accesses-table.reminder-settings",
                      defaultMessage: "Reminder settings",
                    })}
                    onClick={() => onConfigureReminders([row])}
                    placement="bottom"
                    icon={<BellSettingsIcon fontSize="16px" />}
                    size="sm"
                  />
                </>
              )}
              <IconButtonWithTooltip
                label={intl.formatMessage({
                  id: "component.petition-accesses-table.deactivate-access",
                  defaultMessage: "Remove access",
                })}
                onClick={() => onDeactivateAccess(id)}
                placement="bottom"
                icon={<UserXIcon fontSize="16px" />}
                size="sm"
                isDisabled={petition.isAnonymized || myEffectivePermission === "READ"}
              />
            </Stack>
          );
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
      isAnonymized
      myEffectivePermission {
        permissionType
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
        ...ContactReference_Contact
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
      isContactless
      recipientUrl
      createdAt
    }
    ${ContactReference.fragments.Contact}
  `,
};
