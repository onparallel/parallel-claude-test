import { Box, Heading, Icon, Text } from "@chakra-ui/core";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage, useIntl } from "react-intl";
import { DateTime } from "../common/DateTime";
import { SmallPopover } from "../common/SmallPopover";

export type DoubleCheckProps = {
  sent: boolean;
  bounced: boolean;
  deliveredAt: string | null;
  openedAt: string | null;
};

function rountToNearestSecond(value: Date | string | number) {
  const date = new Date(value);
  date.setMilliseconds(0);
  return date;
}

export function DoubleCheck({
  sent,
  bounced,
  deliveredAt,
  openedAt,
}: DoubleCheckProps) {
  const intl = useIntl();
  if (sent) {
    if (bounced) {
      return (
        <SmallPopover
          content={
            <>
              <Heading size="xs">
                <FormattedMessage
                  id="petition-message.message-bounced"
                  defaultMessage="The email bounced."
                />
              </Heading>
              <Text fontSize="sm">
                <FormattedMessage
                  id="petition-message.message-bounced-explanation"
                  defaultMessage="We couldn't deliver the email to the specified recipient. Please make sure the email is valid."
                />
              </Text>
            </>
          }
        >
          <Box
            display="flex"
            aria-label={intl.formatMessage({
              id: "petition-message.message-bounced-explanation",
              defaultMessage:
                "We couldn't deliver the email to the specified recipient. Please make sure the email is valid.",
            })}
          >
            <Icon name="check" color="red.500" />
            <Icon marginLeft="-7px" name="check-short" color="gray.300" />
          </Box>
        </SmallPopover>
      );
    }
    return (
      <Box display="flex">
        <SmallPopover
          content={
            deliveredAt ? (
              <Text fontSize="sm">
                <FormattedMessage
                  id="petition-message.message-delivered-explanation"
                  defaultMessage="The email is confirmed to have been delivered on {date}"
                  values={{
                    date: (
                      <DateTime
                        value={rountToNearestSecond(deliveredAt)}
                        format={FORMATS.FULL}
                      />
                    ),
                  }}
                />
              </Text>
            ) : (
              <Text fontSize="sm">
                <FormattedMessage
                  id="petition-message.message-not-delivered-explanation"
                  defaultMessage="We haven't received confirmation of the delivery of the email yet."
                />
              </Text>
            )
          }
        >
          <Icon
            name="check"
            color={deliveredAt ? "green.500" : "gray.300"}
            aria-label={
              deliveredAt
                ? intl.formatMessage(
                    {
                      id: "petition-message.message-delivered-explanation",
                      defaultMessage:
                        "The email is confirmed to have been delivered on {date}",
                    },
                    {
                      date: intl.formatDate(
                        rountToNearestSecond(deliveredAt),
                        FORMATS.FULL
                      ),
                    }
                  )
                : intl.formatMessage({
                    id: "petition-message.message-not-delivered-explanation",
                    defaultMessage:
                      "We haven't received confirmation of the delivery of the email yet.",
                  })
            }
          />
        </SmallPopover>
        <SmallPopover
          content={
            openedAt ? (
              <Text fontSize="sm">
                <FormattedMessage
                  id="petition-message.message-opened-explanation"
                  defaultMessage="The email was opened on {date}"
                  values={{
                    date: (
                      <DateTime
                        value={rountToNearestSecond(openedAt)}
                        format={FORMATS.FULL}
                      />
                    ),
                  }}
                />
              </Text>
            ) : (
              <Text fontSize="sm">
                <FormattedMessage
                  id="petition-message.message-not-opened-explanation"
                  defaultMessage="We haven't received confirmation of the email being opened yet."
                />
              </Text>
            )
          }
        >
          <Icon
            marginLeft="-7px"
            name="check-short"
            color={openedAt ? "green.500" : "gray.300"}
            aria-label={
              openedAt
                ? intl.formatMessage(
                    {
                      id: "petition-message.message-opened-explanation",
                      defaultMessage: "The email was opened on {date}",
                    },
                    {
                      date: intl.formatDate(
                        rountToNearestSecond(openedAt),
                        FORMATS.FULL
                      ),
                    }
                  )
                : intl.formatMessage({
                    id: "petition-message.message-not-opened-explanation",
                    defaultMessage:
                      "We haven't received confirmation of the email being opened yet.",
                  })
            }
          />
        </SmallPopover>
      </Box>
    );
  }
  return null;
}
