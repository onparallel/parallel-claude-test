import { gql } from "@apollo/client";
import { Box, Button, Flex } from "@chakra-ui/react";
import { ThumbUpIcon } from "@parallel/chakra/icons";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionClosedNotifiedEvent_PetitionClosedNotifiedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../../../common/UserReference";
import { useSentPetitionMessageDialog } from "../../dialogs/SentPetitionMessageDialog";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelinePetitionClosedNotifiedEventProps {
  event: TimelinePetitionClosedNotifiedEvent_PetitionClosedNotifiedEventFragment;
}

export function TimelinePetitionClosedNotifiedEvent({
  event,
}: TimelinePetitionClosedNotifiedEventProps) {
  const showSendPetitionMessage = useSentPetitionMessageDialog();
  async function handleSeeMessageClick() {
    try {
      await showSendPetitionMessage({
        message: {
          access: event.access,
          emailBody: event.emailBody!,
          sentAt: event.createdAt,
        },
      });
    } catch {}
  }

  return (
    <TimelineItem
      icon={<TimelineIcon icon={ThumbUpIcon} color="white" backgroundColor="blue.500" />}
    >
      <Flex align="center">
        <Box>
          {event.access.delegateGranter ? (
            <FormattedMessage
              id="component.timeline-petition-closed-notified-delegated.description"
              defaultMessage="{user} as {sender} notified {contact} that the parallel is correct {timeAgo}"
              values={{
                user: <UserReference user={event.user} />,
                sender: <UserReference user={event.access.granter} />,
                contact: <ContactReference contact={event.access.contact} />,
                timeAgo: (
                  <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
                ),
              }}
            />
          ) : (
            <FormattedMessage
              id="component.timeline-petition-closed-notified.description"
              defaultMessage="{user} notified {contact} that the parallel is correct {timeAgo}"
              values={{
                user: <UserReference user={event.user} />,
                contact: <ContactReference contact={event.access.contact} />,
                timeAgo: (
                  <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
                ),
              }}
            />
          )}
        </Box>
        {event.emailBody ? (
          <Button
            onClick={handleSeeMessageClick}
            size="sm"
            variant="outline"
            marginStart={2}
            background="white"
          >
            <FormattedMessage
              id="generic.timeline-see-message-button"
              defaultMessage="See message"
            />
          </Button>
        ) : null}
      </Flex>
    </TimelineItem>
  );
}

TimelinePetitionClosedNotifiedEvent.fragments = {
  PetitionClosedNotifiedEvent: gql`
    fragment TimelinePetitionClosedNotifiedEvent_PetitionClosedNotifiedEvent on PetitionClosedNotifiedEvent {
      user {
        ...UserReference_User
      }
      access {
        delegateGranter {
          id
        }
        granter {
          ...UserReference_User
        }
        contact {
          ...ContactReference_Contact
        }
      }
      emailBody
      createdAt
    }
    ${UserReference.fragments.User}
    ${ContactReference.fragments.Contact}
  `,
};
