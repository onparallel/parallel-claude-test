import { extension } from "mime-types";
import { core, enumType, inputObjectType, objectType, unionType } from "nexus";
import { Contact } from "../../db/__types";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";

export const PublicPetitionAccess = objectType({
  name: "PublicPetitionAccess",
  sourceType: "db.PetitionAccess",
  description: "A public view of a petition access",
  definition(t) {
    t.nullable.field("petition", {
      type: "PublicPetition",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadPetition(root.petition_id);
      },
    });
    t.nullable.field("granter", {
      type: "PublicUser",
      resolve: async (root, _, ctx) => {
        return await ctx.users.loadUser(root.granter_id);
      },
    });
    t.nullable.field("contact", {
      type: "PublicContact",
      resolve: async (root, _, ctx) => {
        return await ctx.contacts.loadContact(root.contact_id);
      },
    });
    t.nullable.field("message", {
      type: "PublicPetitionMessage",
      resolve: async (root, _, ctx) => {
        const messages = await ctx.petitions.loadMessagesByPetitionAccessId(root.id);
        return messages?.[0] ?? null;
      },
    });
  },
});

export const PublicSignatureConfig = objectType({
  name: "PublicSignatureConfig",
  description: "The public signature settings of a petition",
  definition(t) {
    t.nonNull.list.nonNull.field("signers", {
      type: "PetitionSigner",
      description: "The contacts that need to sign the generated document.",
      resolve: (root) => root.signersInfo,
    });
    t.nonNull.list.nonNull.field("additionalSigners", {
      type: "PetitionSigner",
      description: "The signers assigned by the petition recipient",
      resolve: (root) => root.additionalSignersInfo ?? [],
    });
    t.boolean("review", {
      description:
        "If true, lets the user review the replies before starting the signature process",
      resolve: (o) => o.review ?? false,
    });
    t.boolean("letRecipientsChooseSigners", {
      description: "If true, allows the recipients of the petition to select additional signers",
      resolve: (o) => o.letRecipientsChooseSigners ?? false,
    });
  },
  sourceType: /* ts */ `{
    signersInfo: any[];
    review?: boolean;
    letRecipientsChooseSigners?: boolean;
    additionalSignersInfo?: any[];
  }`,
});

export const PublicPetitionSignerDataInput = inputObjectType({
  name: "PublicPetitionSignerDataInput",
  definition(t) {
    t.nonNull.string("email");
    t.nonNull.string("firstName");
    t.nonNull.string("lastName");
  },
});

export const PublicPetition = objectType({
  name: "PublicPetition",
  sourceType: "db.Petition",
  description: "A public view of the petition",
  definition(t) {
    t.implements("Timestamps");
    t.globalId("id", {
      description: "The ID of the petition.",
      prefixName: "Petition",
    });
    t.nullable.datetime("deadline", {
      description: "The deadline of the petition.",
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
    t.list.field("recipients", {
      type: "PublicContact",
      description: "The recipients of the petition",
      resolve: async (root, _, ctx) => {
        const accesses = await ctx.petitions.loadAccessesForPetition(root.id);
        const contactIds = accesses.filter((a) => a.status === "ACTIVE").map((a) => a.contact_id);
        return (await ctx.contacts.loadContact(contactIds)) as Contact[];
      },
    });
    t.boolean("isRecipientViewContentsHidden", {
      description: "Whether the contents card is hidden in the recipient view.",
      deprecation: "Don't use this",
      resolve: (o) => o.hide_recipient_view_contents,
    });
    t.list.nonNull.field("fields", {
      type: "PublicPetitionField",
      description: "The field definition of the petition.",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadFieldsForPetition(root.id);
      },
    });
    t.nullable.field("signatureConfig", {
      type: "PublicSignatureConfig",
      description: "The signature config of the petition",
      resolve: (o) => o.signature_config,
    });
    t.nullable.field("signatureStatus", {
      type: enumType({
        name: "PublicSignatureStatus",
        members: ["STARTED", "COMPLETED"],
      }),
      resolve: async (root, _, ctx) => {
        const signature = await ctx.petitions.loadLatestPetitionSignatureByPetitionId(root.id);

        return signature ? (signature.status === "COMPLETED" ? "COMPLETED" : "STARTED") : null;
      },
    });
    t.nonNull.field("tone", {
      type: "Tone",
      description: "The preferred tone of organization.",
      resolve: async (root, _, ctx) => {
        const org = (await ctx.organizations.loadOrg(root.org_id))!;

        return org.preferred_tone;
      },
    });
  },
});

export const PublicPetitionMessage = objectType({
  name: "PublicPetitionMessage",
  sourceType: "db.PetitionMessage",
  description: "A public message in a petition",
  definition(t) {
    t.globalId("id", {
      description: "The ID of the message.",
      prefixName: "Message",
    });
    t.nullable.string("subject", {
      description: "Subject of a email.",
      resolve: (m) => m.email_subject,
    });
  },
});

export const PublicPetitionField = objectType({
  name: "PublicPetitionField",
  sourceType: "db.PetitionField",
  description: "A field within a petition.",
  definition(t) {
    t.globalId("id", {
      description: "The ID of the petition field.",
      prefixName: "PetitionField",
    });
    t.field("petition", {
      type: "PublicPetition",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadPetition(root.petition_id))!;
      },
    });
    t.field("type", {
      type: "PetitionFieldType",
      description: "The type of the petition field.",
    });
    t.nullable.string("title", {
      description: "The title of the petition field.",
    });
    t.nullable.string("description", {
      description: "The description of the petition field.",
    });
    t.jsonObject("options", {
      description: "The options of the petition field.",
      resolve: (o) => o.options,
    });
    t.boolean("optional", {
      description: "Determines if this field is optional.",
    });
    t.boolean("multiple", {
      description: "Determines if this field allows multiple replies.",
    });
    t.boolean("isInternal", {
      description: "Determines if the field is visible by the recipients.",
      resolve: (o) => o.is_internal,
    });
    t.boolean("isReadOnly", {
      description: "Determines if the field accepts replies",
      resolve: ({ type }) => ["HEADING"].includes(type),
    });
    t.list.nonNull.field("replies", {
      type: "PublicPetitionFieldReply",
      description: "The replies to the petition field",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadRepliesForField(root.id);
      },
    });
    t.list.nonNull.field("comments", {
      type: "PublicPetitionFieldComment",
      description: "The comments for this field.",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadPetitionFieldCommentsForField({
          petitionId: root.petition_id,
          petitionFieldId: root.id,
        });
      },
    });
    t.nonNull.int("commentCount", {
      resolve: async (root, _, ctx) => {
        return (
          await ctx.petitions.loadPetitionFieldCommentsForField({
            petitionId: root.petition_id,
            petitionFieldId: root.id,
          })
        ).length;
      },
    });
    t.nonNull.int("unreadCommentCount", {
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadPetitionFieldUnreadCommentCountForFieldAndAccess({
          accessId: ctx.access!.id,
          petitionId: root.petition_id,
          petitionFieldId: root.id,
        });
      },
    });
    t.nullable.jsonObject("visibility", {
      description: "A JSON object representing the conditions for the field to be visible",
      resolve: (o) => {
        return (
          o.visibility && {
            ...o.visibility,
            conditions: o.visibility.conditions.map((c: any) => ({
              ...c,
              fieldId: toGlobalId("PetitionField", c.fieldId),
            })),
          }
        );
      },
    });
    t.nonNull.list.nonNull.field("attachments", {
      type: "PetitionFieldAttachment",
      description: "A list of files attached to this field.",
      resolve: async (o, _, ctx) => {
        return await ctx.petitions.loadFieldAttachmentsByFieldId(o.id);
      },
    });
  },
});

export const PublicUser = objectType({
  name: "PublicUser",
  sourceType: "db.User",
  description: "A public view of a user",
  definition(t) {
    t.globalId("id", {
      description: "The ID of the user.",
      prefixName: "User",
    });
    t.string("email", {
      description: "The email of the user.",
    });
    t.nullable.string("firstName", {
      description: "The first name of the user.",
      resolve: (o) => o.first_name,
    });
    t.nullable.string("lastName", {
      description: "The last name of the user.",
      resolve: (o) => o.last_name,
    });
    t.string("fullName", {
      description: "The full name of the user.",
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
  sourceType: "db.Organization",
  description: "A public view of an organization",
  definition(t) {
    t.globalId("id", {
      description: "The ID of the organization.",
      prefixName: "Organization",
    });
    t.string("name", {
      description: "The name of the organization.",
    });
    t.nullable.string("logoUrl", {
      description: "The logo of the organization.",
      resolve: async (root, _, ctx) => {
        return await ctx.organizations.getOrgLogoUrl(root.id);
      },
    });
  },
});

export const PublicPetitionFieldReply = objectType({
  name: "PublicPetitionFieldReply",
  sourceType: "db.PetitionFieldReply",
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
          case "TEXT":
          case "SHORT_TEXT":
          case "SELECT":
          case "DYNAMIC_SELECT":
          case "NUMBER":
          case "CHECKBOX": {
            return root.content;
          }
          case "FILE_UPLOAD": {
            const file = await ctx.files.loadFileUpload(root.content["file_upload_id"]);
            return file
              ? {
                  filename: file.filename,
                  size: file.size,
                  contentType: file.content_type,
                  extension: extension(file.content_type) || null,
                  uploadComplete: file.upload_complete,
                }
              : {};
          }
          default:
            return {};
        }
      },
    });
    t.field("field", {
      type: "PublicPetitionField",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadField(root.petition_field_id))!;
      },
    });
  },
});

export const PublicContact = objectType({
  name: "PublicContact",
  sourceType: "db.Contact",
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
      resolve: (o) => o.first_name,
    });
    t.nullable.string("lastName", {
      description: "The last name of the user.",
      resolve: (o) => o.last_name,
    });
    t.string("fullName", {
      description: "The full name of the user.",
      resolve: (o) => fullName(o.first_name, o.last_name),
    });
  },
});

export const PublicUserOrContact = unionType({
  name: "PublicUserOrContact",
  definition(t) {
    t.members("PublicUser", "PublicContact");
  },
  resolveType: (o) => {
    if (["User", "Contact"].includes(o.__type)) {
      return `Public${o.__type}` as core.AbstractResolveReturn<"PublicUserOrContact">;
    }
    throw new Error("Missing __type on PublicUserOrContact");
  },
  sourceType: /* ts */ `
    | ({__type: "Contact"} & NexusGenRootTypes["Contact"])
    | ({__type: "User"} & NexusGenRootTypes["User"])
  `,
});

export const PublicPetitionFieldComment = objectType({
  name: "PublicPetitionFieldComment",
  sourceType: "db.PetitionFieldComment",
  description: "A comment on a petition field",
  definition(t) {
    t.globalId("id", {
      description: "The ID of the petition field comment.",
      prefixName: "PetitionFieldComment",
    });
    t.nullable.field("author", {
      type: "PublicUserOrContact",
      description: "The author of the comment.",
      resolve: async (root, _, ctx) => {
        if (root.user_id !== null) {
          const user = await ctx.users.loadUser(root.user_id);
          return user && { __type: "User", ...user };
        } else if (root.petition_access_id !== null) {
          const access = await ctx.petitions.loadAccess(root.petition_access_id);
          const contact = access && (await ctx.contacts.loadContact(access.contact_id));
          return contact && { __type: "Contact", ...contact };
        }
        throw new Error(`Both "user_id" and "petition_access_id" are null`);
      },
    });
    t.string("content", {
      description: "The content of the comment.",
    });
    t.datetime("createdAt", {
      description: "Time when the comment was created.",
      resolve: (o) => o.created_at,
    });
    t.boolean("isUnread", {
      description: "Whether the comment has been read or not.",
      resolve: async (root, _, ctx) => {
        return ctx.petitions.loadPetitionFieldCommentIsUnreadForContact({
          petitionAccessId: ctx.access!.id,
          petitionId: root.petition_id,
          petitionFieldId: root.petition_field_id,
          petitionFieldCommentId: root.id,
        });
      },
    });
    t.field("field", {
      type: "PublicPetitionField",
      resolve: async (o, _, ctx) => (await ctx.petitions.loadField(o.petition_field_id))!,
    });
  },
});

export const PublicPublicPetitionLink = objectType({
  name: "PublicPublicPetitionLink",
  sourceType: "db.PublicPetitionLink",
  definition(t) {
    t.nonNull.string("title");
    t.nonNull.string("description");
    t.nonNull.string("slug");
    t.nonNull.boolean("isActive", {
      resolve: (o) => o.is_active,
    });
    t.nonNull.field("owner", {
      type: "PublicUser",
      resolve: async (root, _, ctx) => {
        return (await ctx.users.loadUser(root.owner_id))!;
      },
    });

    t.nonNull.field("organization", {
      type: "PublicOrganization",
      resolve: async (root, _, ctx) => {
        const owner = await ctx.users.loadUser(root.owner_id);
        if (!owner) {
          throw new Error(`Can't find owner of PublicPetitionLink:${root.id}`);
        }
        const organization = await ctx.organizations.loadOrg(owner.org_id);
        if (!organization) {
          throw new Error(`Can't find organization of User:${owner.id}`);
        }
        return organization;
      },
    });
    t.nonNull.boolean("isAvailable", {
      description:
        "If the organization has enough credits to send a petition with this public link or not",
      resolve: async (o, _, ctx) => {
        const owner = await ctx.users.loadUser(o.owner_id);
        const orgLimits = await ctx.organizations.getOrganizationCurrentUsageLimit(
          owner!.org_id,
          "PETITION_SEND"
        );
        if (!orgLimits || orgLimits.used >= orgLimits.limit) {
          return false;
        }
        return true;
      },
    });
  },
});
