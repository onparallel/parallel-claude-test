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
            name: "MessageCancelledEvent",
          },
          {
            name: "MessageProcessedEvent",
          },
          {
            name: "MessageScheduledEvent",
          },
          {
            name: "ReminderProcessedEvent",
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
    ],
  },
};
export default result;
