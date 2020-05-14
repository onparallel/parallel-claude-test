import { Flex, Heading, Icon, Spinner, Text, Tooltip } from "@chakra-ui/core";
import { PetitionSendouts_PetitionSendoutFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { gql } from "apollo-boost";
import { memo, MouseEvent, useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Card, CardProps } from "../common/Card";
import { ContactLink } from "../common/ContactLink";
import { DateTime } from "../common/DateTime";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { Table, TableColumn, useTableColors } from "../common/Table";
import { DoubleCheck } from "./DoubleCheck";
import { useMemo } from "react";

type SendoutSelection = PetitionSendouts_PetitionSendoutFragment;

type SendoutAction = "SEND_REMINDER";

export function PetitionSendouts({
  sendouts,
  onSendReminder,
  ...props
}: {
  sendouts: SendoutSelection[];
  onSendReminder: (sendoutId: string) => void;
} & CardProps) {
  const handleAction = useCallback(
    function (action: SendoutAction, row: SendoutSelection) {
      switch (action) {
        case "SEND_REMINDER":
          onSendReminder?.(row.id);
          break;
      }
    },
    [onSendReminder]
  );
  const { border } = useTableColors();
  const columns = usePetitionSendoutsColumns();
  return (
    <Card {...props}>
      <Flex
        padding={4}
        alignItems="center"
        borderBottom="1px solid"
        borderBottomColor={border}
      >
        <Heading size="sm" id="sendouts">
          <FormattedMessage
            id="petition.sendouts-header"
            defaultMessage="Sendouts"
          />
        </Heading>
      </Flex>
      {sendouts?.length ? (
        <Table
          columns={columns}
          rows={sendouts ?? []}
          rowKeyProp="id"
          marginBottom={2}
          onAction={handleAction}
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

function usePetitionSendoutsColumns(): TableColumn<
  SendoutSelection,
  SendoutAction
>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "email-status",
        header: "",
        headerProps: { width: "1px" },
        align: "center",
        cellProps: { _first: { paddingLeft: 4 } },
        Cell: memo(({ row: { sentAt, bouncedAt, deliveredAt, openedAt } }) => {
          return (
            <DoubleCheck
              sent={!!sentAt}
              bounced={!!bouncedAt}
              deliveredAt={deliveredAt ?? null}
              openedAt={openedAt ?? null}
            />
          );
        }),
      },
      {
        key: "recipient",
        header: intl.formatMessage({
          id: "petitions.sendouts-header.recipient",
          defaultMessage: "Recipient",
        }),
        Cell: memo(({ row: { contact } }) => (
          <>
            {contact ? (
              <ContactLink
                contact={contact}
                onClick={(e: MouseEvent) => e.stopPropagation()}
              />
            ) : (
              <Text as="span" color="gray.400" fontStyle="italic">
                <FormattedMessage
                  id="generic.deleted-contact"
                  defaultMessage="Deleted contact"
                />
              </Text>
            )}
          </>
        )),
      },
      {
        key: "subject",
        header: intl.formatMessage({
          id: "petitions.sendouts-header.subject",
          defaultMessage: "Email subject",
        }),
        Cell: memo(({ row: { emailSubject } }) =>
          emailSubject ? (
            <>{emailSubject}</>
          ) : (
            <Text as="span" color="gray.400" fontStyle="italic">
              <FormattedMessage
                id="petitions.sendout-no-subject"
                defaultMessage="No subject"
              />
            </Text>
          )
        ),
      },
      {
        key: "status",
        header: intl.formatMessage({
          id: "petitions.sendouts-header.status",
          defaultMessage: "Status",
        }),
        Cell: memo(({ row: { status, scheduledAt } }) => {
          const intl = useIntl();
          const tooltip = scheduledAt
            ? intl.formatMessage(
                {
                  id: "petitions.sendout-status.scheduled-for",
                  defaultMessage: "Scheduled for {date}",
                },
                { date: intl.formatDate(scheduledAt, FORMATS.LLL) }
              )
            : null;
          return status === "ACTIVE" ? (
            <Flex alignItems="center" color="green.500">
              <Icon size="16px" name="check" marginRight={2} />
              <FormattedMessage
                id="petitions.sendout-status.active"
                defaultMessage="Active"
              />
            </Flex>
          ) : status === "PROCESSING" ? (
            <Flex alignItems="center" color="yellow.600">
              <Spinner size="xs" speed="1s" marginRight={2} />
              <FormattedMessage
                id="petitions.sendout-status.processing"
                defaultMessage="Processing"
              />
            </Flex>
          ) : status === "INACTIVE" ? (
            <Flex alignItems="center" color="red.500">
              <Icon size="16px" name="forbidden" marginRight={2} />
              <FormattedMessage
                id="petitions.sendout-status.inactive"
                defaultMessage="Inactive"
              />
            </Flex>
          ) : status === "SCHEDULED" ? (
            <Tooltip label={tooltip!} aria-label={tooltip!}>
              <Flex alignItems="center" color="blue.500">
                <Icon size="16px" name="time" marginRight={2} />
                <FormattedMessage
                  id="petitions.sendout-status.scheduled"
                  defaultMessage="Scheduled"
                />
              </Flex>
            </Tooltip>
          ) : status === "CANCELLED" ? (
            <Flex alignItems="center" color="red.500">
              <Icon size="14px" name="close" marginRight={2} />
              <FormattedMessage
                id="petitions.sendout-status.cancelled"
                defaultMessage="Cancelled"
              />
            </Flex>
          ) : null;
        }),
      },
      {
        key: "next-reminder",
        header: intl.formatMessage({
          id: "petitions.sendouts-header.next-reminder",
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
        key: "sent",
        header: intl.formatMessage({
          id: "petitions.sendouts-header.sent-on",
          defaultMessage: "Sent on",
        }),
        Cell: memo(({ row: { sentAt } }) =>
          sentAt ? (
            <DateTime value={sentAt} format={FORMATS.LLL} />
          ) : (
            <Text color="gray.400" fontStyle="italic">
              <FormattedMessage
                id="petitions.sendout-not-sent"
                defaultMessage="Not sent yet"
              />
            </Text>
          )
        ),
      },
      {
        key: "actions",
        header: "",
        headerProps: { width: "1px" },
        cellProps: { paddingY: 0 },
        Cell: memo(({ row: { status }, onAction }) => {
          const intl = useIntl();
          return (
            <IconButtonWithTooltip
              isDisabled={status !== "ACTIVE"}
              icon="time"
              size="sm"
              label={intl.formatMessage({
                id: "petition.sendout-send-reminder",
                defaultMessage: "Send a reminder now",
              })}
              onClick={() => onAction("SEND_REMINDER")}
            />
          );
        }),
      },
    ],
    []
  );
}

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
        ...ContactLink_Contact
      }
      emailSubject
      status
      scheduledAt
      nextReminderAt
      deliveredAt
      bouncedAt
      openedAt
      sentAt
    }
    ${ContactLink.fragments.contact}
  `,
};
