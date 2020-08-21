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
            name: "PetitionCompletedEvent",
          },
          {
            name: "PetitionCreatedEvent",
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
            name: "Petition",
          },
          {
            name: "PetitionAccess",
          },
          {
            name: "PetitionFieldReply",
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
