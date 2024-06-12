import { gql } from "@apollo/client";
import { Box, BoxProps } from "@chakra-ui/react";
import { PetitionActivityTimeline_PetitionEventFragment } from "@parallel/graphql/__types";
import { TimelineAccessActivatedEvent } from "./timeline/events/TimelineAccessActivatedEvent";
import { TimelineAccessActivatedFromLinkEvent } from "./timeline/events/TimelineAccessActivatedFromLinkEvent";
import { TimelineAccessDeactivatedEvent } from "./timeline/events/TimelineAccessDeactivatedEvent";
import { TimelineAccessDelegatedEvent } from "./timeline/events/TimelineAccessDelegatedEvent";
import { TimelineAccessOpenedEvent } from "./timeline/events/TimelineAccessOpenedEvent";
import { TimelineCommentDeletedEvent } from "./timeline/events/TimelineCommentDeletedEvent";
import { TimelineCommentPublishedEvent } from "./timeline/events/TimelineCommentPublishedEvent";
import { TimelineGroupPermissionAddedEvent } from "./timeline/events/TimelineGroupPermissionAddedEvent";
import { TimelineGroupPermissionEditedEvent } from "./timeline/events/TimelineGroupPermissionEditedEvent";
import { TimelineGroupPermissionRemovedEvent } from "./timeline/events/TimelineGroupPermissionRemovedEvent";
import { TimelineMessageCancelledEvent } from "./timeline/events/TimelineMessageCancelledEvent";
import { TimelineMessageScheduledEvent } from "./timeline/events/TimelineMessageScheduledEvent";
import { TimelineMessageSentEvent } from "./timeline/events/TimelineMessageSentEvent";
import { TimelineOwnershipTransferredEvent } from "./timeline/events/TimelineOwnershipTransferredEvent";
import { TimelinePetitionAnonymizedEvent } from "./timeline/events/TimelinePetitionAnonymizedEvent";
import { TimelinePetitionClonedEvent } from "./timeline/events/TimelinePetitionClonedEvent";
import { TimelinePetitionClosedEvent } from "./timeline/events/TimelinePetitionClosedEvent";
import { TimelinePetitionClosedNotifiedEvent } from "./timeline/events/TimelinePetitionClosedNotifiedEvent";
import { TimelinePetitionCompletedEvent } from "./timeline/events/TimelinePetitionCompletedEvent";
import { TimelinePetitionCreatedEvent } from "./timeline/events/TimelinePetitionCreatedEvent";
import { TimelinePetitionMessageBouncedEvent } from "./timeline/events/TimelinePetitionMessageBouncedEvent";
import { TimelinePetitionReminderBouncedEvent } from "./timeline/events/TimelinePetitionReminderBouncedEvent";
import { TimelinePetitionReopenedEvent } from "./timeline/events/TimelinePetitionReopenedEvent";
import { TimelinePetitionTaggedEvent } from "./timeline/events/TimelinePetitionTaggedEvent";
import { TimelinePetitionUntaggedEvent } from "./timeline/events/TimelinePetitionUntaggedEvent";
import { TimelineProfileAssociatedEvent } from "./timeline/events/TimelineProfileAssociatedEvent";
import { TimelineProfileDisassociatedEvent } from "./timeline/events/TimelineProfileDisassociatedEvent";
import { TimelineRecipientSignedEvent } from "./timeline/events/TimelineRecipientSignedEvent";
import { TimelineReminderSentEvent } from "./timeline/events/TimelineReminderSentEvent";
import { TimelineRemindersOptOutEvent } from "./timeline/events/TimelineRemindersOptOutEvent";
import { TimelineReplyCreatedEvent } from "./timeline/events/TimelineReplyCreatedEvent";
import { TimelineReplyDeletedEvent } from "./timeline/events/TimelineReplyDeletedEvent";
import { TimelineReplyStatusChangedEvent } from "./timeline/events/TimelineReplyStatusChangedEvent";
import { TimelineReplyUpdatedEvent } from "./timeline/events/TimelineReplyUpdatedEvent";
import { TimelineSignatureCancelledEvent } from "./timeline/events/TimelineSignatureCancelledEvent";
import { TimelineSignatureCompletedEvent } from "./timeline/events/TimelineSignatureCompletedEvent";
import { TimelineSignatureDeliveredEvent } from "./timeline/events/TimelineSignatureDeliveredEvent";
import { TimelineSignatureOpenedEvent } from "./timeline/events/TimelineSignatureOpenedEvent";
import { TimelineSignatureReminderEvent } from "./timeline/events/TimelineSignatureReminderEvent";
import { TimelineSignatureStartedEvent } from "./timeline/events/TimelineSignatureStartedEvent";
import { TimelineUserPermissionAddedEvent } from "./timeline/events/TimelineUserPermissionAddedEvent";
import { TimelineUserPermissionEditedEvent } from "./timeline/events/TimelineUserPermissionEditedEvent";
import { TimelineUserPermissionRemovedEvent } from "./timeline/events/TimelineUserPermissionRemovedEvent";
import { TimelineContactlessAccessUsedEvent } from "./timeline/events/TimelineContactlessAccessUsedEvent";

export type PetitionActivityTimelineProps = {
  userId: string;
  events: PetitionActivityTimeline_PetitionEventFragment[];
} & BoxProps;

export function PetitionActivityTimeline({
  userId,
  events,
  ...props
}: PetitionActivityTimelineProps) {
  return (
    <Box as="ol" {...props}>
      {events.map((event) => (
        <Box as="li" key={event.id} listStyleType="none">
          {event.__typename === "PetitionCreatedEvent" ? (
            <TimelinePetitionCreatedEvent event={event} userId={userId} />
          ) : event.__typename === "PetitionCompletedEvent" ? (
            <TimelinePetitionCompletedEvent event={event} userId={userId} />
          ) : event.__typename === "AccessActivatedEvent" ? (
            <TimelineAccessActivatedEvent event={event} userId={userId} />
          ) : event.__typename === "AccessDeactivatedEvent" ? (
            <TimelineAccessDeactivatedEvent event={event} userId={userId} />
          ) : event.__typename === "AccessOpenedEvent" ? (
            <TimelineAccessOpenedEvent event={event} />
          ) : event.__typename === "MessageScheduledEvent" ? (
            <TimelineMessageScheduledEvent event={event} userId={userId} />
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
          ) : event.__typename === "SignatureDeliveredEvent" ? (
            <TimelineSignatureDeliveredEvent event={event} />
          ) : event.__typename === "SignatureOpenedEvent" ? (
            <TimelineSignatureOpenedEvent event={event} />
          ) : event.__typename === "SignatureStartedEvent" ? (
            <TimelineSignatureStartedEvent event={event} />
          ) : event.__typename === "SignatureCompletedEvent" ? (
            <TimelineSignatureCompletedEvent event={event} />
          ) : event.__typename === "SignatureCancelledEvent" ? (
            <TimelineSignatureCancelledEvent event={event} userId={userId} />
          ) : event.__typename === "SignatureReminderEvent" ? (
            <TimelineSignatureReminderEvent event={event} userId={userId} />
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
          ) : event.__typename === "RecipientSignedEvent" ? (
            <TimelineRecipientSignedEvent event={event} />
          ) : event.__typename === "PetitionMessageBouncedEvent" ? (
            <TimelinePetitionMessageBouncedEvent event={event} />
          ) : event.__typename === "PetitionReminderBouncedEvent" ? (
            <TimelinePetitionReminderBouncedEvent event={event} />
          ) : event.__typename === "PetitionAnonymizedEvent" ? (
            <TimelinePetitionAnonymizedEvent event={event} />
          ) : event.__typename === "ReplyStatusChangedEvent" ? (
            <TimelineReplyStatusChangedEvent event={event} userId={userId} />
          ) : event.__typename === "ProfileAssociatedEvent" ? (
            <TimelineProfileAssociatedEvent event={event} />
          ) : event.__typename === "ProfileDisassociatedEvent" ? (
            <TimelineProfileDisassociatedEvent event={event} />
          ) : event.__typename === "PetitionTaggedEvent" ? (
            <TimelinePetitionTaggedEvent event={event} userId={userId} />
          ) : event.__typename === "PetitionUntaggedEvent" ? (
            <TimelinePetitionUntaggedEvent event={event} userId={userId} />
          ) : event.__typename === "ContactlessAccessUsedEvent" ? (
            <TimelineContactlessAccessUsedEvent event={event} />
          ) : null}
        </Box>
      ))}
    </Box>
  );
}

PetitionActivityTimeline.fragments = {
  PetitionEvent: gql`
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
      ... on SignatureDeliveredEvent {
        ...TimelineSignatureDeliveredEvent_SignatureDeliveredEvent
      }
      ... on SignatureOpenedEvent {
        ...TimelineSignatureOpenedEvent_SignatureOpenedEvent
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
      ... on SignatureReminderEvent {
        ...TimelineSignatureReminderEvent_SignatureReminderEvent
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
      ... on RecipientSignedEvent {
        ...TimelineRecipientSignedEvent_RecipientSignedEvent
      }
      ... on PetitionMessageBouncedEvent {
        ...TimelinePetitionMessageBouncedEvent_PetitionMessageBouncedEvent
      }
      ... on PetitionReminderBouncedEvent {
        ...TimelinePetitionReminderBouncedEvent_PetitionReminderBouncedEvent
      }
      ... on PetitionAnonymizedEvent {
        ...TimelinePetitionAnonymizedEvent_PetitionAnonymizedEvent
      }
      ... on ReplyStatusChangedEvent {
        ...TimelineReplyStatusChangedEvent_ReplyStatusChangedEvent
      }
      ... on ProfileAssociatedEvent {
        ...TimelineProfileAssociatedEvent_ProfileAssociatedEvent
      }
      ... on ProfileDisassociatedEvent {
        ...TimelineProfileDisassociatedEvent_ProfileDisassociatedEvent
      }
      ... on PetitionTaggedEvent {
        ...TimelinePetitionTaggedEvent_PetitionTaggedEvent
      }
      ... on PetitionUntaggedEvent {
        ...TimelinePetitionUntaggedEvent_PetitionUntaggedEvent
      }
      ... on ContactlessAccessUsedEvent {
        ...TimelineContactlessAccessUsedEvent_ContactlessAccessUsedEvent
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
    ${TimelineSignatureDeliveredEvent.fragments.SignatureDeliveredEvent}
    ${TimelineSignatureOpenedEvent.fragments.SignatureOpenedEvent}
    ${TimelineSignatureStartedEvent.fragments.SignatureStartedEvent}
    ${TimelineSignatureCompletedEvent.fragments.SignatureCompletedEvent}
    ${TimelineSignatureCancelledEvent.fragments.SignatureCancelledEvent}
    ${TimelineSignatureReminderEvent.fragments.SignatureReminderEvent}
    ${TimelineAccessDelegatedEvent.fragments.AccessDelegatedEvent}
    ${TimelineGroupPermissionAddedEvent.fragments.GroupPermissionAddedEvent}
    ${TimelineGroupPermissionEditedEvent.fragments.GroupPermissionEditedEvent}
    ${TimelineGroupPermissionRemovedEvent.fragments.GroupPermissionRemovedEvent}
    ${TimelinePetitionClonedEvent.fragments.PetitionClonedEvent}
    ${TimelineRemindersOptOutEvent.fragments.RemindersOptOutEvent}
    ${TimelineAccessActivatedFromLinkEvent.fragments.AccessActivatedFromPublicPetitionLinkEvent}
    ${TimelineRecipientSignedEvent.fragments.RecipientSignedEvent}
    ${TimelinePetitionMessageBouncedEvent.fragments.PetitionMessageBouncedEvent}
    ${TimelinePetitionReminderBouncedEvent.fragments.PetitionReminderBouncedEvent}
    ${TimelinePetitionAnonymizedEvent.fragments.PetitionAnonymizedEvent}
    ${TimelineReplyStatusChangedEvent.fragments.ReplyStatusChangedEvent}
    ${TimelineProfileAssociatedEvent.fragments.ProfileAssociatedEvent}
    ${TimelineProfileDisassociatedEvent.fragments.ProfileDisassociatedEvent}
    ${TimelinePetitionTaggedEvent.fragments.PetitionTaggedEvent}
    ${TimelinePetitionUntaggedEvent.fragments.PetitionUntaggedEvent}
    ${TimelineContactlessAccessUsedEvent.fragments.ContactlessAccessUsedEvent}
  `,
};
