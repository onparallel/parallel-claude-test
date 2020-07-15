import { Box, BoxProps } from "@chakra-ui/core";
import { PetitionActivityTimeline_PetitionEventFragment } from "@parallel/graphql/__types";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { gql } from "apollo-boost";
import { TimelineAccessActivatedEvent } from "./timeline/TimelineAccessActivatedEvent";
import { TimelineAccessDeactivatedEvent } from "./timeline/TimelineAccessDeactivatedEvent";
import { TimelineAccessOpenedEvent } from "./timeline/TimelineAccessOpenedEvent";
import { TimelineCommentDeletedEvent } from "./timeline/TimelineCommentDeletedEvent copy";
import { TimelineCommentPublishedEvent } from "./timeline/TimelineCommentPublishedEvent";
import { TimelineMessageCancelledEvent } from "./timeline/TimelineMessageCancelledEvent";
import { TimelineMessageScheduledEvent } from "./timeline/TimelineMessageScheduledEvent";
import { TimelineMessageSentEvent } from "./timeline/TimelineMessageSentEvent";
import { TimelinePetitionCompletedEvent } from "./timeline/TimelinePetitionCompletedEvent";
import { TimelinePetitionCreatedEvent } from "./timeline/TimelinePetitionCreatedEvent";
import { TimelineReminderSentEvent } from "./timeline/TimelineReminderSentEvent";
import { TimelineReplyCreatedEvent } from "./timeline/TimelineReplyCreatedEvent";
import { TimelineReplyDeletedEvent } from "./timeline/TimelineReplyDeletedEvent";

export type PetitionActivityTimelineProps = {
  userId: string;
  events: PetitionActivityTimeline_PetitionEventFragment[];
  onCancelScheduledMessage: (messageId: string) => void;
} & BoxProps;

export function PetitionActivityTimeline({
  userId,
  events,
  onCancelScheduledMessage,
  ...props
}: PetitionActivityTimelineProps) {
  const handleCancelScheduledMessage = useMemoFactory(
    (messageId: string) => () => onCancelScheduledMessage(messageId),
    [onCancelScheduledMessage]
  );
  return (
    <Box {...props}>
      <Box as="ol">
        {events.map((event) => (
          <Box as="li" key={event.id} listStyleType="none">
            {event.__typename === "PetitionCreatedEvent" ? (
              <TimelinePetitionCreatedEvent event={event} userId={userId} />
            ) : event.__typename === "PetitionCompletedEvent" ? (
              <TimelinePetitionCompletedEvent event={event} />
            ) : event.__typename === "AccessActivatedEvent" ? (
              <TimelineAccessActivatedEvent event={event} userId={userId} />
            ) : event.__typename === "AccessDeactivatedEvent" ? (
              <TimelineAccessDeactivatedEvent event={event} userId={userId} />
            ) : event.__typename === "AccessOpenedEvent" ? (
              <TimelineAccessOpenedEvent event={event} />
            ) : event.__typename === "MessageScheduledEvent" ? (
              <TimelineMessageScheduledEvent
                event={event}
                userId={userId}
                onCancelScheduledMessage={handleCancelScheduledMessage(
                  event.message.id
                )}
              />
            ) : event.__typename === "MessageCancelledEvent" ? (
              <TimelineMessageCancelledEvent event={event} userId={userId} />
            ) : event.__typename === "MessageSentEvent" ? (
              <TimelineMessageSentEvent event={event} userId={userId} />
            ) : event.__typename === "ReminderSentEvent" ? (
              <TimelineReminderSentEvent event={event} userId={userId} />
            ) : event.__typename === "ReplyCreatedEvent" ? (
              <TimelineReplyCreatedEvent event={event} />
            ) : event.__typename === "ReplyDeletedEvent" ? (
              <TimelineReplyDeletedEvent event={event} />
            ) : event.__typename === "CommentPublishedEvent" ? (
              <TimelineCommentPublishedEvent event={event} userId={userId} />
            ) : event.__typename === "CommentDeletedEvent" ? (
              <TimelineCommentDeletedEvent event={event} userId={userId} />
            ) : (
              <pre>{JSON.stringify(event, null, "  ")}</pre>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

PetitionActivityTimeline.fragments = {
  Petition: gql`
    fragment PetitionActivityTimeline_Petition on Petition {
      events(limit: 100) {
        items {
          ...PetitionActivityTimeline_PetitionEvent
        }
      }
    }
    fragment PetitionActivityTimeline_PetitionEvent on PetitionEvent {
      id
      ... on PetitionCreatedEvent {
        ...TimelinePetitionCreatedEvent_PetitionCreatedEvent
      }
      ... on PetitionCompletedEvent {
        ...TimelinePetitionCompletedEvent_PetitionCompletedEvent
      }
      ... on AccessActivatedEvent {
        ...TimelineAccessActivatedEvent_AccessActivatedEvent
      }
      ... on AccessDeactivatedEvent {
        ...TimelineAccessDeactivatedEvent_AccessDeactivatedEvent
      }
      ... on AccessOpenedEvent {
        ...TimelineAccessOpenedEvent_AccessOpenedEvent
      }
      ... on MessageScheduledEvent {
        message {
          id
        }
        ...TimelineMessageScheduledEvent_MessageScheduledEvent
      }
      ... on MessageCancelledEvent {
        ...TimelineMessageCancelledEvent_MessageCancelledEvent
      }
      ... on MessageSentEvent {
        ...TimelineMessageSentEvent_MessageSentEvent
      }
      ... on ReminderSentEvent {
        ...TimelineReminderSentEvent_ReminderSentEvent
      }
      ... on ReplyCreatedEvent {
        ...TimelineReplyCreatedEvent_ReplyCreatedEvent
      }
      ... on ReplyDeletedEvent {
        ...TimelineReplyDeletedEvent_ReplyDeletedEvent
      }
      ... on CommentPublishedEvent {
        ...TimelineCommentPublishedEvent_CommentPublishedEvent
      }
      ... on CommentDeletedEvent {
        ...TimelineCommentDeletedEvent_CommentDeletedEvent
      }
    }
    ${TimelinePetitionCreatedEvent.fragments.PetitionCreatedEvent}
    ${TimelinePetitionCompletedEvent.fragments.PetitionCompletedEvent}
    ${TimelineAccessActivatedEvent.fragments.AccessActivatedEvent}
    ${TimelineAccessDeactivatedEvent.fragments.AccessDeactivatedEvent}
    ${TimelineAccessOpenedEvent.fragments.AccessOpenedEvent}
    ${TimelineMessageSentEvent.fragments.MessageSentEvent}
    ${TimelineMessageScheduledEvent.fragments.MessageScheduledEvent}
    ${TimelineMessageCancelledEvent.fragments.MessageCancelledEvent}
    ${TimelineReminderSentEvent.fragments.ReminderSentEvent}
    ${TimelineReplyCreatedEvent.fragments.ReplyCreatedEvent}
    ${TimelineReplyDeletedEvent.fragments.ReplyDeletedEvent}
    ${TimelineCommentPublishedEvent.fragments.CommentPublishedEvent}
    ${TimelineCommentDeletedEvent.fragments.CommentDeletedEvent}
  `,
};
