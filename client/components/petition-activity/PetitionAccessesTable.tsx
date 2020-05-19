import {
  Flex,
  Heading,
  Icon,
  MenuDivider,
  MenuItem,
  MenuList,
  Text,
} from "@chakra-ui/core";
import { PetitionAccessTable_PetitionAccessFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { gql } from "apollo-boost";
import { memo, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ButtonDropdown } from "../common/ButtonDropdown";
import { Card, CardProps } from "../common/Card";
import { ContactLink } from "../common/ContactLink";
import { DateTime } from "../common/DateTime";
import { DeletedContact } from "../common/DeletedContact";
import { Spacer } from "../common/Spacer";
import { Table, TableColumn } from "../common/Table";

type PetitionAccessSelection = PetitionAccessTable_PetitionAccessFragment;

type PetitionAccessAction = "SEND_REMINDER";

export function PetitionAccessesTable({
  accesses,
  onSendReminder,
  ...props
}: {
  accesses: PetitionAccessSelection[];
  onSendReminder: (accessId: string) => void;
} & CardProps) {
  const columns = usePetitionAccessesColumns();
  const [selection, setSelection] = useState<string[]>([]);
  return (
    <Card {...props}>
      <Flex
        paddingX={4}
        paddingY={2}
        alignItems="center"
        borderBottom="1px solid"
        borderBottomColor="gray.200"
      >
        <Heading fontSize="md">Recipients</Heading>
        <Spacer />
        <ButtonDropdown
          size="sm"
          rightIcon="chevron-down"
          isDisabled={selection.length === 0}
          dropdown={
            <MenuList minWidth="160px">
              <MenuItem>
                <Icon name="copy" marginRight={2} />
                <FormattedMessage
                  id="component.petition-list-header.clone-label"
                  defaultMessage="Clone petition"
                />
              </MenuItem>
              <MenuDivider />
              <MenuItem>
                <Icon name="delete" marginRight={2} />
                <FormattedMessage
                  id="component.petition-list-header.delete-label"
                  defaultMessage="Delete selected"
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
      </Flex>
      <Table
        columns={columns}
        rows={accesses ?? []}
        rowKeyProp="id"
        selectable
        onSelectionChange={setSelection}
        marginBottom={2}
      />
    </Card>
  );
}

function usePetitionAccessesColumns(): TableColumn<
  PetitionAccessSelection,
  PetitionAccessAction
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
        Cell: memo(({ row: { contact } }) => (
          <>
            {contact ? <ContactLink contact={contact} /> : <DeletedContact />}
          </>
        )),
      },
      {
        key: "status",
        header: intl.formatMessage({
          id: "petition-accesses.status-header",
          defaultMessage: "Status",
        }),
        Cell: memo(({ row: { status } }) => {
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
        }),
      },
      {
        key: "next-reminder",
        header: intl.formatMessage({
          id: "petition-accesses.next-reminder-header",
          defaultMessage: "Next reminder",
        }),
        Cell: memo(({ row: { nextReminderAt } }) =>
          nextReminderAt ? (
            <DateTime value={nextReminderAt} format={FORMATS.LLL} />
          ) : (
            <Text color="gray.400" fontStyle="italic">
              <FormattedMessage
                id="petitions.reminders-not-set"
                defaultMessage="Not set"
              />
            </Text>
          )
        ),
      },
      {
        key: "createdAt",
        header: intl.formatMessage({
          id: "petition-accesses.created-at-header",
          defaultMessage: "Created at",
        }),
        Cell: memo(({ row: { createdAt } }) => (
          <DateTime value={createdAt} format={FORMATS.LLL} />
        )),
      },
    ],
    []
  );
}

PetitionAccessesTable.fragments = {
  petition: gql`
    fragment PetitionAccessTable_Petition on Petition {
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
    ${ContactLink.fragments.contact}
  `,
};
