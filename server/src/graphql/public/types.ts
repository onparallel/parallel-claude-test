import { core, enumType, objectType, unionType } from "@nexus/schema";
import { fullName } from "../../util/fullName";

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
    t.globalId("id", {
      description: "The ID of the petition.",
      prefixName: "Petition",
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
    t.field("fields", {
      type: "PublicPetitionField",
      list: [true],
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
    t.globalId("id", {
      description: "The ID of the petition field.",
      prefixName: "PetitionField",
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
    t.boolean("isReadOnly", {
      description: "Determines if the field accepts replies",
      resolve: ({ type }) => ["HEADING"].includes(type),
    });
    t.field("replies", {
      type: "PublicPetitionFieldReply",
      list: [true],
      description: "The replies to the petition field",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadRepliesForField(root.id);
      },
    });
    t.field("comments", {
      type: "PublicPetitionFieldComment",
      list: [true],
      description: "The comments for this field.",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadPetitionFieldCommentsForFieldAndAccess({
          accessId: ctx.access!.id,
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
    t.globalId("id", {
      description: "The ID of the user.",
      prefixName: "User",
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
      resolve: (o) => fullName(o.first_name, o.last_name),
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
    t.globalId("id", {
      description: "The ID of the organization.",
      prefixName: "Organization",
    });
    t.string("name", {
      description: "The name of the organization.",
    });
    t.string("identifier", {
      description: "The identifier of the organization.",
    });
    t.string("logoUrl", {
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
    t.globalId("id", {
      description: "The ID of the petition field reply.",
      prefixName: "PetitionFieldReply",
    });
    t.field("status", {
      description: "The status of the petition field reply.",
      type: "PetitionFieldReplyStatus",
    });
    t.jsonObject("content", {
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
          default:
            return {};
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
    t.globalId("id", {
      description: "The ID of the contact.",
      prefixName: "Contact",
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
      resolve: (o) => fullName(o.first_name, o.last_name),
    });
  },
});

export const PublicUserOrContact = unionType({
  name: "PublicUserOrContact",
  definition(t) {
    t.members("PublicUser", "PublicContact");
    t.resolveType((o) => {
      if (["User", "Contact"].includes(o.__type)) {
        return `Public${o.__type}` as core.AbstractResolveReturn<
          "PublicUserOrContact"
        >;
      }
      throw new Error("Missing __type on PublicUserOrContact");
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
    t.globalId("id", {
      description: "The ID of the petition field comment.",
      prefixName: "PetitionFieldComment",
    });
    t.field("author", {
      type: "PublicUserOrContact",
      description: "The author of the comment.",
      nullable: true,
      resolve: async (root, _, ctx) => {
        if (root.user_id !== null) {
          const user = await ctx.users.loadUser(root.user_id);
          return user && { __type: "User", ...user };
        } else if (root.petition_access_id !== null) {
          const access = await ctx.petitions.loadAccess(
            root.petition_access_id
          );
          const contact =
            access && (await ctx.contacts.loadContact(access.contact_id));
          return contact && { __type: "Contact", ...contact };
        }
        throw new Error(`Both "user_id" and "petition_access_id" are null`);
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
          petitionAccessId: ctx.access!.id,
          petitionId: root.petition_id,
          petitionFieldId: root.petition_field_id,
          petitionFieldCommentId: root.id,
        });
      },
    });
  },
});

export const PublicPetitionSignature = objectType({
  name: "PublicPetitionSignature",
  rootTyping: "db.PetitionSignature",
  definition(t) {
    t.globalId("id", {
      prefixName: "PetitionSignature",
    });
    t.field("petition", {
      type: "Petition",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadPetition(root.petition_id))!;
      },
    });
    t.string("signerEmail", {
      resolve: (root) => root.signer_email,
    });
    t.string("provider");
    t.string("externalId", {
      nullable: true,
      resolve: (root) => root.external_id,
    });
    t.field("status", {
      type: enumType({
        name: "PetitionSignatureStatus",
        members: [
          {
            name: "PROCESSING",
            description: "Sign request not yet sent to client API.",
          },
          {
            name: "READY_TO_SIGN",
            description:
              "Sign request response received, in this status the petition is ready to be signed by a recipient.",
          },
          {
            name: "DECLINED",
            description: "The recipient declined the signature.",
          },
          {
            name: "EXPIRED",
            description: "The signature request has expired.",
          },
          {
            name: "CANCELED",
            description:
              "The user canceled the signature request for all recipients on the petition",
          },
          { name: "SIGNED", description: "Recipient signed the petition" },
        ],
        description: "The status of the signature process for a signer.",
      }),
    });
    t.jsonObject("data", {
      nullable: true,
    });
  },
});
