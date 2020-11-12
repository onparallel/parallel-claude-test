export interface IntrospectionResultData {
  __schema: {
    types: {
      kind: string;
      name: string;
      possibleTypes: {
        name: string;
      }[];
    }[];
  };
}
const result: IntrospectionResultData = {
  __schema: {
    types: [
      {
        kind: "INTERFACE",
        name: "CreatedAt",
        possibleTypes: [
          {
            name: "PetitionMessage",
          },
          {
            name: "PetitionReminder",
          },
        ],
      },
      {
        kind: "INTERFACE",
        name: "PetitionBase",
        possibleTypes: [
          {
            name: "Petition",
          },
          {
            name: "PetitionTemplate",
          },
        ],
      },
      {
        kind: "INTERFACE",
        name: "PetitionBaseAndField",
        possibleTypes: [
          {
            name: "PetitionAndField",
          },
          {
            name: "PetitionTemplateAndField",
          },
        ],
      },
      {
        kind: "INTERFACE",
        name: "PetitionEvent",
        possibleTypes: [
          {
            name: "AccessActivatedEvent",
          },
          {
            name: "AccessDeactivatedEvent",
          },
          {
            name: "AccessOpenedEvent",
          },
          {
            name: "CommentDeletedEvent",
          },
          {
            name: "CommentPublishedEvent",
          },
          {
            name: "MessageCancelledEvent",
          },
          {
            name: "MessageScheduledEvent",
          },
          {
            name: "MessageSentEvent",
          },
          {
            name: "OwnershipTransferredEvent",
          },
          {
            name: "PetitionClosedEvent",
          },
          {
            name: "PetitionClosedNotifiedEvent",
          },
          {
            name: "PetitionCompletedEvent",
          },
          {
            name: "PetitionCreatedEvent",
          },
          {
            name: "PetitionReopenedEvent",
          },
          {
            name: "ReminderSentEvent",
          },
          {
            name: "ReplyCreatedEvent",
          },
          {
            name: "ReplyDeletedEvent",
          },
          {
            name: "SignatureCancelledEvent",
          },
          {
            name: "SignatureCompletedEvent",
          },
          {
            name: "SignatureStartedEvent",
          },
          {
            name: "UserPermissionAddedEvent",
          },
          {
            name: "UserPermissionEditedEvent",
          },
          {
            name: "UserPermissionRemovedEvent",
          },
        ],
      },
      {
        kind: "UNION",
        name: "PublicUserOrContact",
        possibleTypes: [
          {
            name: "PublicContact",
          },
          {
            name: "PublicUser",
          },
        ],
      },
      {
        kind: "INTERFACE",
        name: "Timestamps",
        possibleTypes: [
          {
            name: "Contact",
          },
          {
            name: "Organization",
          },
          {
            name: "PetitionAccess",
          },
          {
            name: "PetitionFieldReply",
          },
          {
            name: "PetitionSignatureRequest",
          },
          {
            name: "PetitionUserPermission",
          },
          {
            name: "PublicPetition",
          },
          {
            name: "PublicPetitionFieldReply",
          },
          {
            name: "User",
          },
        ],
      },
      {
        kind: "UNION",
        name: "UserOrPetitionAccess",
        possibleTypes: [
          {
            name: "PetitionAccess",
          },
          {
            name: "User",
          },
        ],
      },
    ],
  },
};
export default result;
