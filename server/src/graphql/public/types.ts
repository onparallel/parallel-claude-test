import { objectType, unionType } from "@nexus/schema";
import { toGlobalId } from "../../util/globalId";

export const PublicPetitionAccess = objectType({
  name: "PublicPetitionAccess",
  rootTyping: "db.PetitionAccess",
  description: "A public view of a petition access",
  definition(t) {
    t.field("petition", {
      type: "PublicPetition",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadPetition(root.petition_id);
      },
    });
    t.field("granter", {
      type: "PublicUser",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.users.loadUser(root.granter_id);
      },
    });
    t.field("contact", {
      type: "PublicContact",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.contacts.loadContact(root.contact_id);
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
    t.list.field("comments", {
      type: "PublicPetitionFieldComment",
      description: "The comments for this field.",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadPetitionFieldCommentsForFieldAndContact({
          contactId: ctx.contact!.id,
          petitionId: root.petition_id,
          petitionFieldId: root.id,
        });
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
    t.string("email", {
      description: "The email of the user.",
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
    t.field("organization", {
      description: "The organization of the user.",
      type: "PublicOrganization",
      resolve: async (root, _, ctx) => {
        return (await ctx.organizations.loadOrg(root.org_id))!;
      },
    });
  },
});

export const PublicOrganization = objectType({
  name: "PublicOrganization",
  rootTyping: "db.Organization",
  description: "A public view of an organization",
  definition(t) {
    t.id("id", {
      description: "The ID of the organization.",
      resolve: (o) => toGlobalId("Organization", o.id),
    });
    t.string("name", {
      description: "The name of the organization.",
    });
    t.string("identifier", {
      description: "The identifier of the organization.",
    });
    t.field("logoUrl", {
      type: "String",
      description: "The logo of the organization.",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return await ctx.organizations.getOrgLogoUrl(root.id);
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
            const file = await ctx.files.loadFileUpload(
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

export const PublicContact = objectType({
  name: "PublicContact",
  rootTyping: "db.Contact",
  description: "A public view of a contact",
  definition(t) {
    t.id("id", {
      description: "The ID of the contact.",
      resolve: (o) => toGlobalId("Contact", o.id),
    });
    t.string("email", {
      description: "The email of the user.",
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

export const PublicContactOrUser = unionType({
  name: "PublicContactOrUser",
  definition(t) {
    t.members("PublicContact", "PublicUser");
    t.resolveType((o) => {
      if (o.__type === "Contact") {
        return "PublicContact";
      } else if (o.__type === "User") {
        return "PublicUser";
      }
      throw new Error("Missing __type on PublicContactOrUser");
    });
  },
  rootTyping: /* ts */ `
    | ({__type: "Contact"} & NexusGenRootTypes["Contact"])
    | ({__type: "User"} & NexusGenRootTypes["User"])
  `,
});

export const PublicPetitionFieldComment = objectType({
  name: "PublicPetitionFieldComment",
  rootTyping: "db.PetitionFieldComment",
  description: "A comment on a petition field",
  definition(t) {
    t.id("id", {
      description: "The ID of the petition field comment.",
      resolve: (o) => toGlobalId("PetitionFieldComment", o.id),
    });
    t.field("author", {
      type: "PublicContactOrUser",
      description: "The author of the comment.",
      nullable: true,
      resolve: async (root, _, ctx) => {
        if (root.contact_id !== null) {
          const contact = await ctx.contacts.loadContact(root.contact_id);
          return contact && { __type: "Contact", ...contact };
        } else if (root.user_id !== null) {
          const user = await ctx.users.loadUser(root.user_id);
          return user && { __type: "User", ...user };
        }
        throw new Error(`Both "contact_id" and "user_id" are null`);
      },
    });
    t.string("content", {
      description: "The content of the comment.",
    });
    t.field("reply", {
      description: "The reply the comment is refering to.",
      type: "PublicPetitionFieldReply",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return root.petition_field_reply_id !== null
          ? await ctx.petitions.loadFieldReply(root.petition_field_reply_id)
          : null;
      },
    });
    t.datetime("publishedAt", {
      description: "Time when the comment was published.",
      nullable: true,
      resolve: (o) => o.published_at,
    });
    t.boolean("isUnread", {
      description: "Whether the comment has been read or not.",
      resolve: async (root, _, ctx) => {
        return ctx.petitions.getPetitionFieldCommentIsUnreadForContact({
          contactId: ctx.contact!.id,
          petitionId: root.petition_id,
          petitionFieldId: root.petition_field_id,
          petitionFieldCommentId: root.id,
        });
      },
    });
  },
});
