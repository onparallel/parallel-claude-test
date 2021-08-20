import { gql } from "@apollo/client";
import { Box, BoxProps } from "@chakra-ui/react";
import { PetitionActivityTimeline_PetitionEventFragment } from "@parallel/graphql/__types";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { TimelineAccessActivatedEvent } from "./timeline/TimelineAccessActivatedEvent";
import { TimelineAccessDeactivatedEvent } from "./timeline/TimelineAccessDeactivatedEvent";
import { TimelineAccessDelegatedEvent } from "./timeline/TimelineAccessDelegatedEvent";
import { TimelineAccessOpenedEvent } from "./timeline/TimelineAccessOpenedEvent";
import { TimelineCommentDeletedEvent } from "./timeline/TimelineCommentDeletedEvent";
import { TimelineCommentPublishedEvent } from "./timeline/TimelineCommentPublishedEvent";
import { TimelineRemindersOptOutEvent } from "./timeline/TimelineRemindersOptOutEvent";
import { TimelineGroupPermissionAddedEvent } from "./timeline/TimelineGroupPermissionAddedEvent";
import { TimelineGroupPermissionEditedEvent } from "./timeline/TimelineGroupPermissionEditedEvent";
import { TimelineGroupPermissionRemovedEvent } from "./timeline/TimelineGroupPermissionRemovedEvent";
import { TimelineMessageCancelledEvent } from "./timeline/TimelineMessageCancelledEvent";
import { TimelineMessageScheduledEvent } from "./timeline/TimelineMessageScheduledEvent";
import { TimelineMessageSentEvent } from "./timeline/TimelineMessageSentEvent";
import { TimelineOwnershipTransferredEvent } from "./timeline/TimelineOwnershipTransferredEvent";
import { TimelinePetitionClonedEvent } from "./timeline/TimelinePetitionClonedEvent";
import { TimelinePetitionClosedEvent } from "./timeline/TimelinePetitionClosedEvent";
import { TimelinePetitionClosedNotifiedEvent } from "./timeline/TimelinePetitionClosedNotifiedEvent";
import { TimelinePetitionCompletedEvent } from "./timeline/TimelinePetitionCompletedEvent";
import { TimelinePetitionCreatedEvent } from "./timeline/TimelinePetitionCreatedEvent";
import { TimelinePetitionReopenedEvent } from "./timeline/TimelinePetitionReopenedEvent";
import { TimelineReminderSentEvent } from "./timeline/TimelineReminderSentEvent";
import { TimelineReplyCreatedEvent } from "./timeline/TimelineReplyCreatedEvent";
import { TimelineReplyDeletedEvent } from "./timeline/TimelineReplyDeletedEvent";
import { TimelineReplyUpdatedEvent } from "./timeline/TimelineReplyUpdatedEvent";
import { TimelineSignatureCancelledEvent } from "./timeline/TimelineSignatureCancelledEvent";
import { TimelineSignatureCompletedEvent } from "./timeline/TimelineSignatureCompletedEvent";
import { TimelineSignatureStartedEvent } from "./timeline/TimelineSignatureStartedEvent";
import { TimelineUserPermissionAddedEvent } from "./timeline/TimelineUserPermissionAddedEvent";
import { TimelineUserPermissionEditedEvent } from "./timeline/TimelineUserPermissionEditedEvent";
import { TimelineUserPermissionRemovedEvent } from "./timeline/TimelineUserPermissionRemovedEvent";
import { TimelineAccessActivatedFromLinkEvent } from "./timeline/TimelineAccessActivatedFromLinkEvent";

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
                onCancelScheduledMessage={handleCancelScheduledMessage(event.message.id)}
              />
            ) : event.__typename === "MessageCancelledEvent" ? (
              <TimelineMessageCancelledEvent event={event} userId={userId} />
            ) : event.__typename === "MessageSentEvent" ? (
              <TimelineMessageSentEvent event={event} userId={userId} />
            ) : event.__typename === "ReminderSentEvent" ? (
              <TimelineReminderSentEvent event={event} userId={userId} />
            ) : event.__typename === "ReplyCreatedEvent" ? (
              <TimelineReplyCreatedEvent event={event} userId={userId} />
            ) : event.__typename === "ReplyUpdatedEvent" ? (
              <TimelineReplyUpdatedEvent event={event} userId={userId} />
            ) : event.__typename === "ReplyDeletedEvent" ? (
              <TimelineReplyDeletedEvent event={event} userId={userId} />
            ) : event.__typename === "CommentPublishedEvent" ? (
              <TimelineCommentPublishedEvent event={event} userId={userId} />
            ) : event.__typename === "CommentDeletedEvent" ? (
              <TimelineCommentDeletedEvent event={event} userId={userId} />
            ) : event.__typename === "UserPermissionAddedEvent" ? (
              <TimelineUserPermissionAddedEvent event={event} userId={userId} />
            ) : event.__typename === "UserPermissionRemovedEvent" ? (
              <TimelineUserPermissionRemovedEvent event={event} userId={userId} />
            ) : event.__typename === "UserPermissionEditedEvent" ? (
              <TimelineUserPermissionEditedEvent event={event} userId={userId} />
            ) : event.__typename === "OwnershipTransferredEvent" ? (
              <TimelineOwnershipTransferredEvent event={event} userId={userId} />
            ) : event.__typename === "PetitionClosedEvent" ? (
              <TimelinePetitionClosedEvent event={event} userId={userId} />
            ) : event.__typename === "PetitionClosedNotifiedEvent" ? (
              <TimelinePetitionClosedNotifiedEvent event={event} userId={userId} />
            ) : event.__typename === "PetitionReopenedEvent" ? (
              <TimelinePetitionReopenedEvent event={event} userId={userId} />
            ) : event.__typename === "SignatureStartedEvent" ? (
              <TimelineSignatureStartedEvent event={event} />
            ) : event.__typename === "SignatureCompletedEvent" ? (
              <TimelineSignatureCompletedEvent event={event} />
            ) : event.__typename === "SignatureCancelledEvent" ? (
              <TimelineSignatureCancelledEvent event={event} userId={userId} />
            ) : event.__typename === "AccessDelegatedEvent" ? (
              <TimelineAccessDelegatedEvent event={event} />
            ) : event.__typename === "GroupPermissionAddedEvent" ? (
              <TimelineGroupPermissionAddedEvent event={event} userId={userId} />
            ) : event.__typename === "GroupPermissionEditedEvent" ? (
              <TimelineGroupPermissionEditedEvent event={event} userId={userId} />
            ) : event.__typename === "GroupPermissionRemovedEvent" ? (
              <TimelineGroupPermissionRemovedEvent event={event} userId={userId} />
            ) : event.__typename === "PetitionClonedEvent" ? (
              <TimelinePetitionClonedEvent event={event} userId={userId} />
            ) : event.__typename === "RemindersOptOutEvent" ? (
              <TimelineRemindersOptOutEvent event={event} />
            ) : event.__typename === "AccessActivatedFromPublicPetitionLinkEvent" ? (
              <TimelineAccessActivatedFromLinkEvent event={event} />
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
      events(limit: 1000) {
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
      ... on ReplyUpdatedEvent {
        ...TimelineReplyUpdatedEvent_ReplyUpdatedEvent
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
      ... on UserPermissionAddedEvent {
        ...TimelineUserPermissionAddedEvent_UserPermissionAddedEvent
      }
      ... on UserPermissionRemovedEvent {
        ...TimelineUserPermissionRemovedEvent_UserPermissionRemovedEvent
      }
      ... on UserPermissionEditedEvent {
        ...TimelineUserPermissionEditedEvent_UserPermissionEditedEvent
      }
      ... on OwnershipTransferredEvent {
        ...TimelineOwnershipTransferredEvent_OwnershipTransferredEvent
      }
      ... on PetitionClosedEvent {
        ...TimelinePetitionClosedEvent_PetitionClosedEvent
      }
      ... on PetitionClosedNotifiedEvent {
        ...TimelinePetitionClosedNotifiedEvent_PetitionClosedNotifiedEvent
      }
      ... on PetitionReopenedEvent {
        ...TimelinePetitionReopenedEvent_PetitionReopenedEvent
      }
      ... on SignatureStartedEvent {
        ...TimelineSignatureStartedEvent_SignatureStartedEvent
      }
      ... on SignatureCompletedEvent {
        ...TimelineSignatureCompletedEvent_SignatureCompletedEvent
      }
      ... on SignatureCancelledEvent {
        ...TimelineSignatureCancelledEvent_SignatureCancelledEvent
      }
      ... on AccessDelegatedEvent {
        ...TimelineAccessDelegatedEvent_AccessDelegatedEvent
      }
      ... on GroupPermissionAddedEvent {
        ...TimelineGroupPermissionAddedEvent_GroupPermissionAddedEvent
      }
      ... on GroupPermissionEditedEvent {
        ...TimelineGroupPermissionEditedEvent_GroupPermissionEditedEvent
      }
      ... on GroupPermissionRemovedEvent {
        ...TimelineGroupPermissionRemovedEvent_GroupPermissionRemovedEvent
      }
      ... on PetitionClonedEvent {
        ...TimelinePetitionClonedEvent_PetitionClonedEvent
      }
      ... on RemindersOptOutEvent {
        ...TimelineRemindersOptOutEvent_RemindersOptOutEvent
      }

      ... on AccessActivatedFromPublicPetitionLinkEvent {
        ...TimelineAccessActivatedFromLinkEvent_AccessActivatedFromPublicPetitionLinkEvent
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
    ${TimelineReplyUpdatedEvent.fragments.ReplyUpdatedEvent}
    ${TimelineReplyDeletedEvent.fragments.ReplyDeletedEvent}
    ${TimelineCommentPublishedEvent.fragments.CommentPublishedEvent}
    ${TimelineCommentDeletedEvent.fragments.CommentDeletedEvent}
    ${TimelineUserPermissionAddedEvent.fragments.UserPermissionAddedEvent}
    ${TimelineUserPermissionRemovedEvent.fragments.UserPermissionRemovedEvent}
    ${TimelineUserPermissionEditedEvent.fragments.UserPermissionEditedEvent}
    ${TimelineOwnershipTransferredEvent.fragments.OwnershipTransferredEvent}
    ${TimelinePetitionClosedEvent.fragments.PetitionClosedEvent}
    ${TimelinePetitionClosedNotifiedEvent.fragments.PetitionClosedNotifiedEvent}
    ${TimelinePetitionReopenedEvent.fragments.PetitionReopenedEvent}
    ${TimelineSignatureStartedEvent.fragments.SignatureStartedEvent}
    ${TimelineSignatureCompletedEvent.fragments.SignatureCompletedEvent}
    ${TimelineSignatureCancelledEvent.fragments.SignatureCancelledEvent}
    ${TimelineAccessDelegatedEvent.fragments.AccessDelegatedEvent}
    ${TimelineGroupPermissionAddedEvent.fragments.GroupPermissionAddedEvent}
    ${TimelineGroupPermissionEditedEvent.fragments.GroupPermissionEditedEvent}
    ${TimelineGroupPermissionRemovedEvent.fragments.GroupPermissionRemovedEvent}
    ${TimelinePetitionClonedEvent.fragments.PetitionClonedEvent}
    ${TimelineRemindersOptOutEvent.fragments.RemindersOptOutEvent}
    ${TimelineAccessActivatedFromLinkEvent.fragments.AccessActivatedFromPublicPetitionLinkEvent}
  `,
};
