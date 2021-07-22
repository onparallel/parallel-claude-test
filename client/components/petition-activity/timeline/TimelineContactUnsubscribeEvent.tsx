import { gql } from "@apollo/client";
import { Box, Text } from "@chakra-ui/react";
import { BellOffIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineContactUnsubscribeEvent_ContactUnsubscribeEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import {
  UnsubscribeAnswersKey,
  useUnsubscribeAnswers,
} from "@parallel/utils/useUnsubscribeAnswers";
import { FormattedMessage } from "react-intl";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineContactUnsubscribeEventProps = {
  event: TimelineContactUnsubscribeEvent_ContactUnsubscribeEventFragment;
};

export function TimelineContactUnsubscribeEvent({
  event,
}: TimelineContactUnsubscribeEventProps) {
  const answers = useUnsubscribeAnswers();
  const { otherReason, access, createdAt } = event;
  const reason = event.reason as UnsubscribeAnswersKey;

  return (
    <TimelineItem
      icon={
        <TimelineIcon
          icon={<BellOffIcon />}
          color="white"
          backgroundColor="red.600"
        />
      }
    >
      <FormattedMessage
        id="timeline.contact-unsubscribe-description"
        defaultMessage="{contact} has disabled the automatic reminders {timeAgo}"
        values={{
          contact: <ContactLink contact={access.contact} />,
          timeAgo: (
            <DateTime
              value={createdAt}
              format={FORMATS.LLL}
              useRelativeTime="always"
            />
          ),
        }}
      />
      <Box paddingTop={1}>
        {reason === "OTHER" ? (
          <Text as="cite">{`"${answers[reason]}: ${otherReason}"`}</Text>
        ) : (
          <Text as="cite">{`"${answers[reason]}"`}</Text>
        )}
      </Box>
    </TimelineItem>
  );
}

TimelineContactUnsubscribeEvent.fragments = {
  ContactUnsubscribeEvent: gql`
    fragment TimelineContactUnsubscribeEvent_ContactUnsubscribeEvent on ContactUnsubscribeEvent {
      access {
        contact {
          ...ContactLink_Contact
        }
      }
      createdAt
      reason
      otherReason
    }
    ${ContactLink.fragments.Contact}
  `,
};
