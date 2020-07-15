import { enumType, objectType } from "@nexus/schema";
import { toGlobalId } from "../../../util/globalId";

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

    t.list.field("comments", {
      type: "PetitionFieldComment",
      description: "The comments for this field.",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadPetitionFieldCommentsForFieldAndUser({
          userId: ctx.user!.id,
          petitionId: root.petition_id,
          petitionFieldId: root.id,
        });
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
      resolve: (o) => (o.reminders_left === 0 ? null : o.next_reminder_at),
    });
    t.int("remindersLeft", {
      description: "Number of reminders left.",
      resolve: (o) => o.reminders_left,
    });
    t.int("reminderCount", {
      description: "Number of reminders sent.",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadReminderCountForAccess(root.id);
      },
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

export const PetitionFieldReplyStatus = enumType({
  name: "PetitionFieldReplyStatus",
  description: "The status of a petition.",
  members: [
    {
      name: "PENDING",
      description: "The reply has not been approved or rejected.",
    },
    { name: "REJECTED", description: "The reply has been rejected." },
    { name: "APPROVED", description: "The reply has been approved." },
  ],
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
    t.field("status", {
      type: "PetitionFieldReplyStatus",
      description: "The status of the reply.",
    });
    t.jsonObject("content", {
      description: "The content of the reply.",
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
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadAccess(root.petition_access_id))!;
      },
    });
    t.field("field", {
      type: "PetitionField",
      description: "The petition field for this reply.",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadField(root.petition_field_id);
      },
    });
  },
});
