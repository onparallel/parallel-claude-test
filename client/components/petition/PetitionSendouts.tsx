import { Box, Flex, Heading, Text } from "@chakra-ui/core";
import { PetitionSendouts_PetitionSendoutFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { gql } from "apollo-boost";
import { memo } from "react";
import { FormattedMessage } from "react-intl";
import { Card, CardProps } from "../common/Card";
import { DateTime } from "../common/DateTime";
import { Table, TableColumn, useTableColors } from "../common/Table";

type SendoutSelection = PetitionSendouts_PetitionSendoutFragment;

export function PetitionSendouts({
  sendouts,
  ...props
}: {
  sendouts: SendoutSelection[];
} & CardProps) {
  const { border } = useTableColors();
  return (
    <Card {...props}>
      <Box padding={4} borderBottom="1px solid" borderBottomColor={border}>
        <Heading size="sm">
          <FormattedMessage
            id="petition.sendouts-header"
            defaultMessage="Sendouts"
          />
        </Heading>
      </Box>
      {sendouts?.length ? (
        <Table
          columns={SENDOUT_COLUMNS}
          rows={sendouts ?? []}
          rowKeyProp="id"
          marginBottom={2}
        />
      ) : (
        <Flex height="100px" alignItems="center" justifyContent="center">
          <Text color="gray.300" fontSize="lg">
            <FormattedMessage
              id="petition.no-sendouts"
              defaultMessage="You haven't send this petition to anyone yet"
            />
          </Text>
        </Flex>
      )}
    </Card>
  );
}

const SENDOUT_COLUMNS: TableColumn<SendoutSelection>[] = [
  {
    key: "recipient",
    Header: memo(() => (
      <FormattedMessage
        id="petitions.sendouts-header.recipient"
        defaultMessage="Recipient"
      />
    )),
    Cell: memo(({ row: { contact } }) => (
      <>
        {contact ? (
          <Text>
            {contact.fullName
              ? `${contact.fullName} (${contact.email})`
              : contact.email}
          </Text>
        ) : null}
      </>
    )),
  },
  {
    key: "sent",
    Header: memo(() => (
      <FormattedMessage
        id="petitions.sendouts-header.sent-on"
        defaultMessage="Sent on"
      />
    )),
    Cell: memo(({ row: { createdAt } }) => (
      <DateTime value={createdAt} format={FORMATS.LLL} />
    )),
  },
  {
    key: "status",
    Header: memo(() => (
      <FormattedMessage
        id="petitions.sendouts-header.status"
        defaultMessage="Status"
      />
    )),
    Cell: memo(({ row: { createdAt } }) => (
      <Text color="green.500">
        <FormattedMessage
          id="petitions.sendout-status.active"
          defaultMessage="Active"
        />
      </Text>
    )),
  },
];

PetitionSendouts.fragments = {
  petition: gql`
    fragment PetitionSendouts_Petition on Petition {
      sendouts {
        ...PetitionSendouts_PetitionSendout
      }
    }
    fragment PetitionSendouts_PetitionSendout on PetitionSendout {
      id
      contact {
        id
        fullName
        email
      }
      createdAt
    }
  `,
};
