import { Box, Icon, BoxProps } from "@chakra-ui/core";
import { MessageEventsIndicator_PetitionMessageFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { gql } from "apollo-boost";
import { useIntl } from "react-intl";

export type MessageEventsIndicatorProps = BoxProps & {
  message: MessageEventsIndicator_PetitionMessageFragment;
};

function rountToNearestSecond(value: Date | string | number) {
  const date = new Date(value);
  date.setMilliseconds(0);
  return date;
}

export function MessageEventsIndicator({
  message: { bouncedAt, deliveredAt, openedAt },
  ...props
}: MessageEventsIndicatorProps) {
  const intl = useIntl();
  if (bouncedAt) {
    return (
      <Box
        display="inline-flex"
        title={intl.formatMessage({
          id: "component.message-events-indicator.bounced-explanation",
          defaultMessage:
            "We couldn't deliver the email to the specified recipient. Please make sure the email is valid.",
        })}
        {...props}
      >
        <Icon name="check" color="red.500" position="relative" top="-1px" />
        <Icon
          marginLeft="-7px"
          name="check-short"
          color="red.500"
          position="relative"
          top="-1px"
        />
      </Box>
    );
  } else {
    return (
      <Box display="inline-flex" {...props}>
        <Box
          title={
            deliveredAt
              ? intl.formatMessage(
                  {
                    id:
                      "component.message-events-indicator.delivered-explanation",
                    defaultMessage: "The email was delivered on {date}",
                  },
                  {
                    date: intl.formatDate(
                      rountToNearestSecond(deliveredAt),
                      FORMATS.FULL
                    ),
                  }
                )
              : intl.formatMessage({
                  id:
                    "component.message-events-indicator.not-delivered-explanation",
                  defaultMessage:
                    "We haven't confirmed the delivery of the email.",
                })
          }
        >
          <Icon
            name="check"
            color={deliveredAt ? "green.500" : "gray.300"}
            position="relative"
            top="-1px"
          />
        </Box>
        <Box
          marginLeft="-7px"
          title={
            openedAt
              ? intl.formatMessage(
                  {
                    id: "component.message-events-indicator.opened-explanation",
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
                  id:
                    "component.message-events-indicator.not-opened-explanation",
                  defaultMessage:
                    "We haven't confirmed that the email has been opened yet.",
                })
          }
        >
          <Icon
            name="check-short"
            color={openedAt ? "green.500" : "gray.300"}
            position="relative"
            top="-1px"
          />
        </Box>
      </Box>
    );
  }
}

MessageEventsIndicator.fragments = {
  PetitionMessage: gql`
    fragment MessageEventsIndicator_PetitionMessage on PetitionMessage {
      bouncedAt
      deliveredAt
      openedAt
    }
  `,
};
