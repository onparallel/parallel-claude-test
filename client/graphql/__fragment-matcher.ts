export interface PossibleTypesResultData {
  possibleTypes: {
    [key: string]: string[];
  };
}
const result: PossibleTypesResultData = {
  possibleTypes: {
    CreatedAt: ["PetitionMessage", "PetitionReminder"],
    PetitionBase: ["Petition", "PetitionTemplate"],
    PetitionBaseAndField: ["PetitionAndField", "PetitionTemplateAndField"],
    PetitionEvent: [
      "AccessActivatedEvent",
      "AccessDeactivatedEvent",
      "AccessOpenedEvent",
      "CommentDeletedEvent",
      "CommentPublishedEvent",
      "MessageCancelledEvent",
      "MessageScheduledEvent",
      "MessageSentEvent",
      "OwnershipTransferredEvent",
      "PetitionClosedEvent",
      "PetitionClosedNotifiedEvent",
      "PetitionCompletedEvent",
      "PetitionCreatedEvent",
      "PetitionReopenedEvent",
      "ReminderSentEvent",
      "ReplyCreatedEvent",
      "ReplyDeletedEvent",
      "SignatureCancelledEvent",
      "SignatureCompletedEvent",
      "SignatureStartedEvent",
      "UserPermissionAddedEvent",
      "UserPermissionEditedEvent",
      "UserPermissionRemovedEvent",
    ],
    PublicUserOrContact: ["PublicContact", "PublicUser"],
    Timestamps: [
      "Contact",
      "Organization",
      "PetitionAccess",
      "PetitionFieldReply",
      "PetitionSignatureRequest",
      "PetitionUserPermission",
      "PublicPetition",
      "PublicPetitionFieldReply",
      "User",
    ],
    UserOrPetitionAccess: ["PetitionAccess", "User"],
  },
};
export default result;
