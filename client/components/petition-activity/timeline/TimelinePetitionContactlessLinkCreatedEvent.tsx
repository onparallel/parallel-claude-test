import { gql } from "@apollo/client";
import { PaperclipIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionContactlessLinkCreatedEvent_PetitionContactlessLinkCreatedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelinePetitionContactlessLinkCreatedEventProps = {
  userId: string;
  event: TimelinePetitionContactlessLinkCreatedEvent_PetitionContactlessLinkCreatedEventFragment;
};

export function TimelinePetitionContactlessLinkCreatedEvent({
  event: { user, createdAt },
  userId,
}: TimelinePetitionContactlessLinkCreatedEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={<PaperclipIcon />} color="white" backgroundColor="blue.500" />}
    >
      <FormattedMessage
        id="timeline.petition-contactless-link-created-description"
        defaultMessage="{userIsYou, select, true {You} other {{user}}} created a link access {timeAgo}"
        values={{
          userIsYou: userId === user?.id,
          user: <UserReference user={user} />,
          timeAgo: <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime="always" />,
        }}
      />
    </TimelineItem>
  );
}

TimelinePetitionContactlessLinkCreatedEvent.fragments = {
  PetitionContactlessLinkCreatedEvent: gql`
    fragment TimelinePetitionContactlessLinkCreatedEvent_PetitionContactlessLinkCreatedEvent on PetitionContactlessLinkCreatedEvent {
      user {
        ...UserReference_User
      }
      createdAt
    }
    ${UserReference.fragments.User}
  `,
};
