import { core, interfaceType, objectType } from "@nexus/schema";
import { toGlobalId } from "../../../util/globalId";

export const PetitionEvent = interfaceType({
  name: "PetitionEvent",
  definition(t) {
    t.id("id", {
      resolve: (o) => toGlobalId("PetitionEvent", o.id),
    });
    t.datetime("createdAt", {
      resolve: (o) => o.created_at,
    });
    t.resolveType((p) => {
      switch (p.type) {
        case "PETITION_CREATED":
          return "PetitionCreatedEvent";
        case "PETITION_COMPLETED":
          return "PetitionCompletedEvent";
        case "ACCESS_ACTIVATED":
          return "AccessActivatedEvent";
        case "ACCESS_DEACTIVATED":
          return "AccessDeactivatedEvent";
        case "ACCESS_OPENED":
          return "AccessOpenedEvent";
        case "MESSAGE_SCHEDULED":
          return "MessageScheduledEvent";
        case "MESSAGE_CANCELLED":
          return "MessageCancelledEvent";
        case "MESSAGE_SENT":
          return "MessageSentEvent";
        case "REMINDER_SENT":
          return "ReminderSentEvent";
        case "REPLY_CREATED":
          return "ReplyCreatedEvent";
        case "REPLY_DELETED":
          return "ReplyDeletedEvent";
      }
    });
  },
  rootTyping: "events.PetitionEvent",
});

function createPetitionEvent<TypeName extends string>(
  name: TypeName,
  definition: (t: core.ObjectDefinitionBlock<TypeName>) => void
) {
  return objectType({
    name,
    definition(t) {
      t.implements("PetitionEvent");
      definition(t);
    },
    rootTyping: `events.${name}`,
  });
}

export const PetitionCreatedEvent = createPetitionEvent(
  "PetitionCreatedEvent",
  (t) => {
    t.field("user", {
      type: "User",
      resolve: async (root, _, ctx) => {
        return (await ctx.users.loadUser(root.data.user_id))!;
      },
    });
  }
);

export const PetitionCompletedEvent = createPetitionEvent(
  "PetitionCompletedEvent",
  (t) => {
    t.field("access", {
      type: "PetitionAccess",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadAccess(root.data.petition_access_id))!;
      },
    });
  }
);

export const AccessActivatedEvent = createPetitionEvent(
  "AccessActivatedEvent",
  (t) => {
    t.field("access", {
      type: "PetitionAccess",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadAccess(root.data.petition_access_id))!;
      },
    });
    t.field("user", {
      type: "User",
      resolve: async (root, _, ctx) => {
        return (await ctx.users.loadUser(root.data.user_id))!;
      },
    });
  }
);

export const AccessDeactivatedEvent = createPetitionEvent(
  "AccessDeactivatedEvent",
  (t) => {
    t.field("access", {
      type: "PetitionAccess",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadAccess(root.data.petition_access_id))!;
      },
    });
    t.field("user", {
      type: "User",
      resolve: async (root, _, ctx) => {
        return (await ctx.users.loadUser(root.data.user_id))!;
      },
    });
  }
);

export const AccessOpenedEvent = createPetitionEvent(
  "AccessOpenedEvent",
  (t) => {
    t.field("access", {
      type: "PetitionAccess",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadAccess(root.data.petition_access_id))!;
      },
    });
  }
);

export const MessageScheduledEvent = createPetitionEvent(
  "MessageScheduledEvent",
  (t) => {
    t.field("message", {
      type: "PetitionMessage",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadMessage(
          root.data.petition_message_id
        ))!;
      },
    });
  }
);

export const MessagesCancelledEvent = createPetitionEvent(
  "MessageCancelledEvent",
  (t) => {
    t.field("message", {
      type: "PetitionMessage",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadMessage(
          root.data.petition_message_id
        ))!;
      },
    });
    t.field("user", {
      type: "User",
      resolve: async (root, _, ctx) => {
        return (await ctx.users.loadUser(root.data.user_id))!;
      },
    });
  }
);

export const MessageSentEvent = createPetitionEvent("MessageSentEvent", (t) => {
  t.field("message", {
    type: "PetitionMessage",
    resolve: async (root, _, ctx) => {
      return (await ctx.petitions.loadMessage(root.data.petition_message_id))!;
    },
  });
});

export const ReminderSentEvent = createPetitionEvent(
  "ReminderSentEvent",
  (t) => {
    t.field("reminder", {
      type: "PetitionReminder",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadReminder(
          root.data.petition_reminder_id
        ))!;
      },
    });
  }
);

export const ReplyCreatedEvent = createPetitionEvent(
  "ReplyCreatedEvent",
  (t) => {
    t.field("access", {
      type: "PetitionAccess",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadAccess(root.data.petition_access_id))!;
      },
    });
    t.field("field", {
      type: "PetitionField",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadField(root.data.petition_field_id);
      },
    });
    t.field("reply", {
      type: "PetitionFieldReply",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadFieldReply(
          root.data.petition_field_reply_id
        );
      },
    });
  }
);

export const ReplyDeletedEvent = createPetitionEvent(
  "ReplyDeletedEvent",
  (t) => {
    t.field("access", {
      type: "PetitionAccess",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadAccess(root.data.petition_access_id))!;
      },
    });
    t.field("field", {
      type: "PetitionField",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadField(root.data.petition_field_id);
      },
    });
    t.field("reply", {
      type: "PetitionFieldReply",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadFieldReply(
          root.data.petition_field_reply_id
        );
      },
    });
  }
);
