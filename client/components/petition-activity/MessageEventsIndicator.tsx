import { gql } from "@apollo/client";
import { Box, BoxProps } from "@chakra-ui/react";
import { CheckIcon, CheckShortIcon } from "@parallel/chakra/icons";
import { MessageEventsIndicator_PetitionMessageFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useIntl } from "react-intl";

export interface MessageEventsIndicatorProps extends BoxProps {
  message: MessageEventsIndicator_PetitionMessageFragment;
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
        <CheckIcon color="red.500" position="relative" top="-1px" />
        <CheckShortIcon marginLeft="-7px" color="red.500" position="relative" top="-1px" />
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
                    id: "component.message-events-indicator.delivered-explanation",
                    defaultMessage: "The email was delivered on {date}",
                  },
                  {
                    date: intl.formatDate(deliveredAt, FORMATS.FULL),
                  }
                )
              : intl.formatMessage({
                  id: "component.message-events-indicator.not-delivered-explanation",
                  defaultMessage: "We haven't confirmed the delivery of the email.",
                })
          }
        >
          <CheckIcon
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
                    date: intl.formatDate(openedAt, FORMATS.FULL),
                  }
                )
              : intl.formatMessage({
                  id: "component.message-events-indicator.not-opened-explanation",
                  defaultMessage: "We haven't confirmed that the email has been opened yet.",
                })
          }
        >
          <CheckShortIcon
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
