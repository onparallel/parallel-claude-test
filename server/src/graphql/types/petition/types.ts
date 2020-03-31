import { enumType, objectType } from "nexus";
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
    { name: "DRAFT", description: "The petition has not been sent." },
    {
      name: "PENDING",
      description: "The petition has been sent and is awaiting completion.",
    },
    { name: "COMPLETED", description: "The petition is completed" },
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
    t.list.field("sendouts", {
      type: "PetitionSendout",
      description: "The sendouts for this petition",
      resolve: async (root, _, ctx) => {
        return ctx.petitions.loadSendoutsForPetition(root.id);
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

export const PetitionSendout = objectType({
  name: "PetitionSendout",
  description: "A sendout of a petition",
  definition(t) {
    t.implements("Timestamps");
    t.id("id", {
      description: "The ID of the petition field access.",
      resolve: (o) => toGlobalId("PetitionSendout", o.id),
    });
    t.field("contact", {
      type: "Contact",
      description: "The receiver of the petition through this sendout.",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.contacts.loadOneById(root.contact_id);
      },
    });
    t.field("petition", {
      type: "Petition",
      description: "The petition for this sendout.",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadPetition(root.petition_id);
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
            const file = await ctx.files.loadOneById(
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
    t.field("sendout", {
      type: "PetitionSendout",
      description: "The sendout from where this reply was made.",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadSendoutById(root.petition_sendout_id);
      },
    });
  },
});
