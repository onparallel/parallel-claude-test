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
import { FormattedMessage, useIntl } from "react-intl";
import { ButtonDropdown } from "../common/ButtonDropdown";
import { Card, CardProps } from "../common/Card";
import { ContactLink } from "../common/ContactLink";
import { DateTime } from "../common/DateTime";
import { DeletedContact } from "../common/DeletedContact";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { Spacer } from "../common/Spacer";
import { Table, TableColumn } from "../common/Table";
import { useConfirmActivateAccessDialog } from "./ConfirmActivateAccessDialog";
import { useConfirmDeactivateAccessDialog } from "./ConfirmDeactivateAccessDialog";
import { useConfirmSendReminderDialog } from "./ConfirmSendReminderDialog";

type PetitionAccessSelection = PetitionAccessTable_PetitionAccessFragment;

export function PetitionAccessesTable({
  petition,
  onSendReminder,
  onActivateAccess,
  onDeactivateAccess,
  ...props
}: {
  petition: PetitionAccessTable_PetitionFragment;
  onSendReminder: (accessIds: string[]) => void;
  onActivateAccess: (accessId: string) => void;
  onDeactivateAccess: (accessId: string) => void;
} & CardProps) {
  const [selection, setSelection] = useState<string[]>([]);
  const selected = useMemo(
    () => selection.map((id) => petition.accesses.find((a) => a.id === id)!),
    [selection, petition.accesses]
  );

  const confirmSendReminder = useConfirmSendReminderDialog();
  const handleSendreminder = useCallback(async () => {
    try {
      await confirmSendReminder({});
    } catch {
      return;
    }
    onSendReminder(selection);
  }, [selection]);
  const confirmActivateAccess = useConfirmActivateAccessDialog();
  const confirmDeactivateAccess = useConfirmDeactivateAccessDialog();
  const columns = usePetitionAccessesColumns({
    onActivateAccess: useCallback(async (accessId: string) => {
      const { contact } = petition.accesses.find((a) => a.id === accessId)!;
      try {
        await confirmActivateAccess({
          nameOrEmail: contact?.fullName ?? contact?.email ?? "",
        });
      } catch {
        return;
      }
      onActivateAccess(accessId);
    }, []),
    onDeactivateAccess: useCallback(async (accessId) => {
      const { contact } = petition.accesses.find((a) => a.id === accessId)!;
      try {
        await confirmDeactivateAccess({
          nameOrEmail: contact?.fullName ?? contact?.email ?? "",
        });
      } catch {
        return;
      }
      onDeactivateAccess(accessId);
    }, []),
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
                onClick={handleSendreminder}
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
        <Button size="sm" variantColor="purple" leftIcon={"user-plus" as any}>
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
  onActivateAccess,
  onDeactivateAccess,
}: {
  onActivateAccess: (accessId: string) => void;
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
                  : onActivateAccess(id)
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
    [onActivateAccess, onDeactivateAccess]
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
      createdAt
    }
    ${ContactLink.fragments.Contact}
  `,
};
