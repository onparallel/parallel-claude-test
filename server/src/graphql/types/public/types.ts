import { objectType } from "nexus";
import { toGlobalId } from "../../../util/globalId";
import { pick } from "remeda";

export const PublicPetitionSendout = objectType({
  name: "PublicPetitionSendout",
  rootTyping: "db.PetitionSendout",
  description: "A public view of a petition sendout",
  definition(t) {
    t.field("petition", {
      type: "PublicPetition",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadPetition(root.petition_id);
      },
    });
    t.field("sender", {
      type: "PublicUser",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.users.loadOneById(root.sender_id);
      },
    });
  },
});

export const PublicPetition = objectType({
  name: "PublicPetition",
  rootTyping: "db.Petition",
  description: "A public view of the petition",
  definition(t) {
    t.implements("Timestamps");
    t.id("id", {
      description: "The ID of the petition.",
      resolve: (o) => toGlobalId("Petition", o.id),
    });
    t.datetime("deadline", {
      description: "The deadline of the petition.",
      nullable: true,
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
      type: "PublicPetitionField",
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
  },
});

export const PublicPetitionField = objectType({
  name: "PublicPetitionField",
  rootTyping: "db.PetitionField",
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
      type: "PublicPetitionFieldReply",
      description: "The replies to the petition field",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadRepliesForField(root.id);
      },
    });
  },
});

export const PublicUser = objectType({
  name: "PublicUser",
  rootTyping: "db.User",
  description: "A public view of a user",
  definition(t) {
    t.id("id", {
      description: "The ID of the user.",
      resolve: (o) => toGlobalId("User", o.id),
    });
    t.string("firstName", {
      description: "The first name of the user.",
      nullable: true,
      resolve: (o) => o.first_name,
    });
    t.string("lastName", {
      description: "The last name of the user.",
      nullable: true,
      resolve: (o) => o.last_name,
    });
    t.string("fullName", {
      description: "The full name of the user.",
      nullable: true,
      resolve: (o) => {
        if (o.first_name) {
          return o.last_name ? `${o.first_name} ${o.last_name}` : o.first_name;
        } else {
          return null;
        }
      },
    });
  },
});

export const PublicPetitionFieldReply = objectType({
  name: "PublicPetitionFieldReply",
  rootTyping: "db.PetitionFieldReply",
  description: "A reply to a petition field",
  definition(t) {
    t.implements("Timestamps");
    t.id("id", {
      description: "The ID of the petition field reply.",
      resolve: (o) => toGlobalId("PetitionFieldReply", o.id),
    });
    t.jsonObject("publicContent", {
      description: "The public content of the reply",
      resolve: async (root, _, ctx) => {
        switch (root.type) {
          case "TEXT": {
            return {};
          }
          case "FILE_UPLOAD": {
            const file = await ctx.files.loadOneById(
              root.content["file_upload_id"]
            );
            return file
              ? {
                  filename: file.filename,
                  size: file.size,
                }
              : {};
          }
        }
      },
    });
  },
});
