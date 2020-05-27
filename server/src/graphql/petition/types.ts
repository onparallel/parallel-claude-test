import { enumType, objectType, interfaceType, core } from "@nexus/schema";
import { toGlobalId } from "../../util/globalId";

export const PetitionLocale = enumType({
  name: "PetitionLocale",
  description: "The locale used for rendering the petition to the contact.",
  members: ["en", "es"],
});

export const PetitionStatus = enumType({
  name: "PetitionStatus",
  description: "The status of a petition.",
  members: [
    { name: "DRAFT", description: "The petition has not been sent yet." },
    {
      name: "PENDING",
      description: "The petition has been sent and is awaiting completion.",
    },
    { name: "COMPLETED", description: "The petition has been completed." },
  ],
});

export const PetitionProgress = objectType({
  name: "PetitionProgress",
  description: "The progress of a petition.",
  definition(t) {
    t.int("validated", {
      description: "Number of fields validated",
    });
    t.int("replied", {
      description: "Number of fields with a reply and not validated",
    });
    t.int("optional", {
      description: "Number of optional fields not replied or validated",
    });
    t.int("total", {
      description: "Total number of fields in the petition",
    });
  },
});

export const Petition = objectType({
  name: "Petition",
  description: "An petition in the system.",
  definition(t) {
    t.implements("Timestamps");
    t.id("id", {
      description: "The ID of the petition.",
      resolve: (o) => toGlobalId("Petition", o.id),
    });
    t.string("name", {
      description: "The name of the petition.",
      nullable: true,
    });
    t.string("customRef", {
      description: "The custom ref of the petition.",
      nullable: true,
      resolve: (o) => o.custom_ref,
    });
    t.datetime("deadline", {
      description: "The deadline of the petition.",
      nullable: true,
      resolve: (o) => o.deadline,
    });
    t.field("locale", {
      type: "PetitionLocale",
      description: "The locale of the petition.",
    });
    t.field("status", {
      type: "PetitionStatus",
      description: "The status of the petition.",
      resolve: (o) => o.status!,
    });
    t.list.field("fields", {
      type: "PetitionField",
      description: "The field definition of the petition.",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadFieldsForPetition(root.id);
      },
    });
    t.string("emailSubject", {
      description: "The subject of the petition.",
      nullable: true,
      resolve: (o) => o.email_subject,
    });
    t.json("emailBody", {
      description: "The body of the petition.",
      nullable: true,
      resolve: (o) => {
        try {
          return o.email_body ? JSON.parse(o.email_body) : null;
        } catch {
          return null;
        }
      },
    });
    t.int("fieldCount", {
      description: "The number of fields in the petition.",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadFieldCountForPetition(root.id);
      },
    });
    t.field("progress", {
      type: "PetitionProgress",
      description: "The progress of the petition.",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadStatusForPetition(root.id);
      },
    });
    t.list.field("accesses", {
      type: "PetitionAccess",
      description: "The accesses for this petition",
      resolve: async (root, _, ctx) => {
        return ctx.petitions.loadAccessesForPetition(root.id);
      },
    });
    t.field("recipients", {
      type: "Contact",
      list: [false],
      description: "The recipients for this petition",
      resolve: async (root, _, ctx) => {
        const accesses = await ctx.petitions.loadAccessesForPetition(root.id);
        const contactIds = accesses
          .filter((a) => a.status === "ACTIVE")
          .map((a) => a.contact_id);
        return contactIds.length
          ? await ctx.contacts.loadContact(contactIds)
          : [];
      },
    });
    t.field("remindersConfig", {
      type: "RemindersConfig",
      description: "The reminders configuration for the petition.",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return root.reminders_config;
      },
    });
    t.paginationField("events", {
      type: "PetitionEvent",
      description: "The events for the petition.",
      resolve: async (root, { offset, limit }, ctx) => {
        return await ctx.petitions.loadEventsForPetition(root.id, {
          offset,
          limit,
        });
      },
    });
  },
});

export const PetitionFieldType = enumType({
  name: "PetitionFieldType",
  description: "Type of a petition field",
  members: [
    { name: "FILE_UPLOAD", description: "A file upload field." },
    { name: "TEXT", description: "A text field." },
  ],
});

export const PetitionField = objectType({
  name: "PetitionField",
  description: "A field within a petition.",
  definition(t) {
    t.id("id", {
      description: "The ID of the petition field.",
      resolve: (o) => toGlobalId("PetitionField", o.id),
    });
    t.field("type", {
      type: "PetitionFieldType",
      description: "The type of the petition field.",
    });
    t.string("title", {
      nullable: true,
      description: "The title of the petition field.",
    });
    t.string("description", {
      nullable: true,
      description: "The description of the petition field.",
    });
    t.jsonObject("options", {
      description: "The options of the petition.",
      nullable: true,
    });
    t.boolean("optional", {
      description: "Determines if this field is optional.",
    });
    t.boolean("multiple", {
      description: "Determines if this field allows multiple replies.",
    });
    t.boolean("validated", {
      description:
        "Determines if the content of this field has been validated.",
    });

    t.list.field("replies", {
      type: "PetitionFieldReply",
      description: "The replies to the petition field",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadRepliesForField(root.id);
      },
    });
  },
});

export const RemindersConfig = objectType({
  name: "RemindersConfig",
  description: "The reminder settings of a petition",
  definition(t) {
    t.int("offset", {
      description: "The amount of days between reminders.",
    });
    t.string("time", {
      description: "The time at which the reminder should be sent.",
    });
    t.string("timezone", {
      description: "The timezone the time is referring to.",
    });
    t.boolean("weekdaysOnly", {
      description: "Wether to send reminders only from monday to friday.",
    });
  },
});

export const PetitionAccessStatus = enumType({
  name: "PetitionAccessStatus",
  description: "The status of a petition access.",
  members: [
    {
      name: "ACTIVE",
      description: "The petition is accessible by the contact.",
    },
    {
      name: "INACTIVE",
      description: "The petition is not accessible by the contact.",
    },
  ],
});

export const PetitionAccess = objectType({
  name: "PetitionAccess",
  description: "A petition access",
  definition(t) {
    t.implements("Timestamps");
    t.id("id", {
      description: "The ID of the petition access.",
      resolve: (o) => toGlobalId("PetitionAccess", o.id),
    });
    t.field("petition", {
      type: "Petition",
      description: "The petition for this message access.",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadPetition(root.petition_id);
      },
    });
    t.field("granter", {
      type: "User",
      description: "The user who granted the access.",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return (await ctx.users.loadUser(root.granter_id))!;
      },
    });
    t.field("contact", {
      type: "Contact",
      description: "The contact of this access.",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.contacts.loadContact(root.contact_id);
      },
    });
    t.field("status", {
      type: "PetitionAccessStatus",
      description: "The status of the petition access",
    });
    t.datetime("nextReminderAt", {
      description: "When the next reminder will be sent.",
      nullable: true,
      resolve: (o) => o.next_reminder_at,
    });
    t.field("remindersConfig", {
      type: "RemindersConfig",
      description: "The reminder settings of the petition.",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return root.reminders_active ? root.reminders_config : null;
      },
    });
  },
});

export const PetitionMessageStatus = enumType({
  name: "PetitionMessageStatus",
  description: "The status of a petition message.",
  members: [
    {
      name: "SCHEDULED",
      description:
        "The message has been scheduled to be sent at a specific time.",
    },
    {
      name: "CANCELLED",
      description: "The message was scheduled but has been cancelled.",
    },
    { name: "PROCESSING", description: "The message is being processed." },
    { name: "PROCESSED", description: "The message has been processed." },
  ],
});

export const PetitionMessage = objectType({
  name: "PetitionMessage",
  description: "A petition message",
  definition(t) {
    t.implements("CreatedAt");
    t.id("id", {
      description: "The ID of the petition message.",
      resolve: (o) => toGlobalId("PetitionMessage", o.id),
    });
    t.field("access", {
      type: "PetitionAccess",
      description: "The access of this petition message.",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadAccess(root.petition_access_id))!;
      },
    });
    t.field("sender", {
      type: "User",
      description: "The sender of this petition message.",
      resolve: async (root, _, ctx) => {
        return (await ctx.users.loadUser(root.sender_id))!;
      },
    });
    t.json("emailSubject", {
      description: "The subject of the petition message.",
      nullable: true,
      resolve: (o) => o.email_subject,
    });
    t.json("emailBody", {
      description: "The body of the petition message.",
      nullable: true,
      resolve: (o) => {
        try {
          return o.email_body ? JSON.parse(o.email_body) : null;
        } catch {
          return null;
        }
      },
    });
    t.field("status", {
      type: "PetitionMessageStatus",
      description: "The status of the petition message",
    });
    t.datetime("scheduledAt", {
      description: "Time at which the message will be sent.",
      nullable: true,
      resolve: (o) => o.scheduled_at,
    });
    t.datetime("sentAt", {
      description: "If already sent, the date at which the email was sent.",
      nullable: true,
      resolve: async (root, _, ctx) => {
        if (root.email_log_id) {
          const email = await ctx.emails.loadEmailLog(root.email_log_id);
          return email!.sent_at;
        } else {
          return null;
        }
      },
    });
    t.datetime("deliveredAt", {
      description: "Tells when the email was delivered.",
      nullable: true,
      resolve: async (root, _, ctx) => {
        if (!root.email_log_id) {
          return null;
        }
        const events = await ctx.emails.loadEmailEvents(root.email_log_id);
        return events.find((e) => e.event === "delivery")?.created_at ?? null;
      },
    });
    t.datetime("bouncedAt", {
      description: "Tells when the email bounced.",
      nullable: true,
      resolve: async (root, _, ctx) => {
        if (!root.email_log_id) {
          return null;
        }
        const events = await ctx.emails.loadEmailEvents(root.email_log_id);
        return events.find((e) => e.event === "bounce")?.created_at ?? null;
      },
    });
    t.datetime("openedAt", {
      description: "Tells when the email was opened for the first time.",
      nullable: true,
      resolve: async (root, _, ctx) => {
        if (!root.email_log_id) {
          return null;
        }
        const events = await ctx.emails.loadEmailEvents(root.email_log_id);
        return events.find((e) => e.event === "open")?.created_at ?? null;
      },
    });
  },
});

export const PetitionFieldReply = objectType({
  name: "PetitionFieldReply",
  description: "A reply to a petition field",
  definition(t) {
    t.implements("Timestamps");
    t.id("id", {
      description: "The ID of the petition field reply.",
      resolve: (o) => toGlobalId("PetitionFieldReply", o.id),
    });
    t.jsonObject("content", {
      description: "The content of the reply",
      resolve: async (root, _, ctx) => {
        switch (root.type) {
          case "TEXT": {
            return root.content;
          }
          case "FILE_UPLOAD": {
            const file = await ctx.files.loadFileUpload(
              root.content["file_upload_id"]
            );
            return file
              ? {
                  filename: file.filename,
                  size: file.size,
                  contentType: file.content_type,
                }
              : {};
          }
        }
      },
    });
    t.field("access", {
      type: "PetitionAccess",
      description: "The access from where this reply was made.",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadAccess(root.petition_access_id);
      },
    });
  },
});

export const PetitionReminderType = enumType({
  name: "PetitionReminderType",
  description: "The type of a petition reminder.",
  members: [
    {
      name: "MANUAL",
      description: "The reminder has been sent manually by a user.",
    },
    {
      name: "AUTOMATIC",
      description:
        "The reminder has been sent by the system according to the reminders configuration.",
    },
  ],
});

export const PetitionReminder = objectType({
  name: "PetitionReminder",
  definition(t) {
    t.implements("CreatedAt");
    t.id("id", {
      resolve: (o) => toGlobalId("PetitionReminder", o.id),
    });
    t.field("type", {
      type: "PetitionReminderType",
      description: "The type of the reminder.",
    });
    t.field("access", {
      type: "PetitionAccess",
      description: "The access of this petition message.",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadAccess(root.petition_access_id))!;
      },
    });
    t.field("sender", {
      type: "User",
      nullable: true,
      description: "The sender of this petition message.",
      resolve: async (root, _, ctx) => {
        console.log(root);
        return root.sender_id
          ? (await ctx.users.loadUser(root.sender_id))!
          : null;
      },
    });
  },
});

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
