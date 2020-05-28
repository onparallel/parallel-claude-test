import {
  Button,
  Flex,
  Heading,
  Icon,
  MenuItem,
  MenuList,
  Stack,
  Text,
} from "@chakra-ui/core";
import {
  PetitionAccessTable_PetitionAccessFragment,
  PetitionAccessTable_PetitionFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { gql } from "apollo-boost";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl, FormattedNumber } from "react-intl";
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
  onSendMessage,
  onSendReminders,
  onAddPetitionAccess,
  onReactivateAccess,
  onDeactivateAccess,
  ...props
}: {
  petition: PetitionAccessTable_PetitionFragment;
  onSendMessage: (accessIds: string[]) => void;
  onSendReminders: (accessIds: string[]) => void;
  onAddPetitionAccess: () => void;
  onReactivateAccess: (accessId: string) => void;
  onDeactivateAccess: (accessId: string) => void;
} & CardProps) {
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
    onReactivateAccess,
    onDeactivateAccess,
  });
  return (
    <Card {...props}>
      <Stack
        direction="row"
        paddingX={4}
        paddingY={2}
        alignItems="center"
        borderBottom="1px solid"
        borderBottomColor="gray.200"
      >
        <Heading fontSize="md">
          <FormattedMessage
            id="petition-access.header"
            defaultMessage="Petition access control"
          />
        </Heading>
        <Spacer />
        <ButtonDropdown
          size="sm"
          rightIcon="chevron-down"
          isDisabled={selection.length === 0}
          dropdown={
            <MenuList minWidth="160px">
              <MenuItem
                isDisabled={
                  petition.status !== "PENDING" ||
                  selected.some((a) => a.status === "INACTIVE")
                }
                onClick={handleSendMessage}
              >
                <Icon name="email" marginRight={2} />
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
                <Icon name="bell" marginRight={2} />
                <FormattedMessage
                  id="petition-accesses.send-reminder"
                  defaultMessage="Send reminder"
                />
              </MenuItem>
            </MenuList>
          }
        >
          <FormattedMessage
            id="generic.actions-button"
            defaultMessage="Actions"
          ></FormattedMessage>
        </ButtonDropdown>
        <Button
          size="sm"
          variantColor="purple"
          leftIcon={"user-plus" as any}
          onClick={onAddPetitionAccess}
        >
          Add contact
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
  onReactivateAccess,
  onDeactivateAccess,
}: {
  onReactivateAccess: (accessId: string) => void;
  onDeactivateAccess: (accessId: string) => void;
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
        CellContent: ({ row: { nextReminderAt } }) =>
          nextReminderAt ? (
            <DateTime value={nextReminderAt} format={FORMATS.LLL} />
          ) : (
            <Text color="gray.400" fontStyle="italic">
              <FormattedMessage
                id="petitions.reminders-not-set"
                defaultMessage="Not set"
              />
            </Text>
          ),
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
        CellContent: ({ row: { id, status }, onAction }) => {
          const intl = useIntl();
          return (
            <IconButtonWithTooltip
              label={
                status === "ACTIVE"
                  ? intl.formatMessage({
                      id: "petition-accesses.deactivate-access",
                      defaultMessage: "Remove access",
                    })
                  : intl.formatMessage({
                      id: "petition-accesses.activate-access",
                      defaultMessage: "Reactivate access",
                    })
              }
              onClick={() =>
                status === "ACTIVE"
                  ? onDeactivateAccess(id)
                  : onReactivateAccess(id)
              }
              placement="left"
              icon={(status === "ACTIVE" ? "user-x" : "user-check") as any}
              size="sm"
              showDelay={300}
            />
          );
        },
      },
    ],
    [onReactivateAccess, onDeactivateAccess]
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
    fragment PetitionAccessTable_PetitionAccess on PetitionAccess {
      id
      contact {
        ...ContactLink_Contact
      }
      status
      nextReminderAt
      reminderCount
      createdAt
    }
    ${ContactLink.fragments.Contact}
  `,
};
