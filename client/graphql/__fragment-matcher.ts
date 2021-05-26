export interface PossibleTypesResultData {
  possibleTypes: {
    [key: string]: string[];
  };
}
const result: PossibleTypesResultData = {
  possibleTypes: {
    CreatedAt: [
      "PetitionMessage",
      "PetitionReminder",
      "UserAuthenticationToken",
    ],
    PetitionBase: ["Petition", "PetitionTemplate"],
    PetitionBaseAndField: ["PetitionAndField", "PetitionTemplateAndField"],
    PetitionEvent: [
      "AccessActivatedEvent",
      "AccessDeactivatedEvent",
      "AccessDelegatedEvent",
      "AccessOpenedEvent",
      "CommentDeletedEvent",
      "CommentPublishedEvent",
      "GroupPermissionAddedEvent",
      "GroupPermissionEditedEvent",
      "GroupPermissionRemovedEvent",
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
      "ReplyUpdatedEvent",
      "SignatureCancelledEvent",
      "SignatureCompletedEvent",
      "SignatureStartedEvent",
      "UserPermissionAddedEvent",
      "UserPermissionEditedEvent",
      "UserPermissionRemovedEvent",
    ],
    PetitionPermission: [
      "PetitionUserGroupPermission",
      "PetitionUserPermission",
    ],
    PublicUserOrContact: ["PublicContact", "PublicUser"],
    Timestamps: [
      "Contact",
      "Organization",
      "PetitionAccess",
      "PetitionFieldReply",
      "PetitionSignatureRequest",
      "PetitionUserGroupPermission",
      "PetitionUserPermission",
      "PublicPetition",
      "PublicPetitionFieldReply",
      "Subscription",
      "User",
      "UserGroup",
    ],
    UserOrPetitionAccess: ["PetitionAccess", "User"],
    UserOrUserGroup: ["User", "UserGroup"],
  },
};
export default result;
