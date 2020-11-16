import { enumType, objectType, interfaceType } from "@nexus/schema";
import { safeJsonParse } from "../../../util/safeJsonParse";
import { userHasFeatureFlag } from "../authorizers";

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
    {
      name: "CLOSED",
      description: "The petition has been closed by a user.",
    },
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

export const PetitionBase = interfaceType({
  name: "PetitionBase",
  definition(t) {
    t.resolveType((p) => (p.is_template ? "PetitionTemplate" : "Petition"));
    t.globalId("id", {
      prefixName: "Petition",
      description: "The ID of the petition or template.",
    });
    t.string("name", {
      description: "The name of the petition.",
      nullable: true,
    });
    t.field("organization", {
      type: "Organization",
      resolve: async (root, _, ctx) => {
        return (await ctx.organizations.loadOrg(root.org_id))!;
      },
    });
    t.field("locale", {
      type: "PetitionLocale",
      description: "The locale of the petition.",
    });
    t.field("owner", {
      type: "User",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadPetitionOwners(root.id))!;
      },
    });
    t.field("userPermissions", {
      type: "PetitionUserPermission",
      list: [true],
      description: "The permissions linked to the petition",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadUserPermissions(root.id);
      },
    });
    t.field("fields", {
      type: "PetitionField",
      description: "The definition of the petition fields.",
      list: [true],
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadFieldsForPetition(root.id);
      },
    });
    t.int("fieldCount", {
      description: "The number of fields in the petition.",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadFieldCountForPetition(root.id);
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
      resolve: (o) => safeJsonParse(o.email_body),
    });
    // Until nexus allows interfaces to extend other interfaces
    t.datetime("createdAt", {
      description: "Time when the resource was created.",
      resolve: (o) => o.created_at,
    });
    t.datetime("updatedAt", {
      description: "Time when the resource was last updated.",
      resolve: (o) => o.updated_at,
    });
  },
  rootTyping: "db.Petition",
});

export const Petition = objectType({
  name: "Petition",
  description: "A petition",
  definition(t) {
    t.implements("PetitionBase");
    t.datetime("deadline", {
      description: "The deadline of the petition.",
      nullable: true,
      resolve: (o) => o.deadline,
    });
    t.field("status", {
      type: "PetitionStatus",
      description: "The status of the petition.",
      resolve: (o) => o.status!,
    });
    t.field("progress", {
      type: "PetitionProgress",
      description: "The progress of the petition.",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadStatusForPetition(root.id);
      },
    });
    t.field("accesses", {
      type: "PetitionAccess",
      description: "The accesses for this petition",
      list: [true],
      resolve: async (root, _, ctx) => {
        return ctx.petitions.loadAccessesForPetition(root.id);
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
    t.field("signatureConfig", {
      type: "SignatureConfig",
      description: "The signature configuration for the petition.",
      nullable: true,
      resolve: async (root, _, ctx) => {
        return root.signature_config;
      },
    });
    t.field("currentSignatureRequest", {
      type: "PetitionSignatureRequest",
      nullable: true,
      description: "The current signature request.",
      authorize: userHasFeatureFlag("PETITION_SIGNATURE"),
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadLatestPetitionSignatureByPetitionId(
          root.id
        );
      },
    });
    t.field("signatureRequests", {
      type: "PetitionSignatureRequest",
      list: [true],
      nullable: true,
      description: "The list of signature requests.",
      authorize: userHasFeatureFlag("PETITION_SIGNATURE"),
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadPetitionSignaturesByPetitionId(root.id);
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

export const PetitionTemplate = objectType({
  name: "PetitionTemplate",
  description: "A petition template",
  definition(t) {
    t.implements("PetitionBase");
    t.boolean("isPublic", {
      description: "Whether the template is publicly available or not",
      resolve: (o) => o.template_public,
    });
    t.string("description", {
      description: "Description of the template.",
      nullable: true,
      resolve: (o) => o.template_description,
    });
  },
  rootTyping: "db.Petition",
});

export const PetitionFieldType = enumType({
  name: "PetitionFieldType",
  description: "Type of a petition field",
  members: [
    { name: "FILE_UPLOAD", description: "A file upload field." },
    { name: "TEXT", description: "A text field." },
    { name: "HEADING", description: "A heading field." },
  ],
});

export const PetitionBaseAndField = interfaceType({
  name: "PetitionBaseAndField",
  definition(t) {
    t.resolveType((o) =>
      o.petition.is_template ? "PetitionTemplateAndField" : "PetitionAndField"
    );
    t.field("petition", { type: "PetitionBase" });
    t.field("field", { type: "PetitionField" });
  },
  rootTyping: `{
    petition: db.Petition;
    field: db.PetitionField;
  }`,
});

export const PetitionAndField = objectType({
  name: "PetitionAndField",
  definition(t) {
    t.implements("PetitionBaseAndField");
    t.field("petition", { type: "Petition" });
    t.field("field", { type: "PetitionField" });
  },
});

export const PetitionTemplateAndField = objectType({
  name: "PetitionTemplateAndField",
  definition(t) {
    t.implements("PetitionBaseAndField");
    t.field("petition", { type: "PetitionTemplate" });
    t.field("field", { type: "PetitionField" });
  },
});

export const PetitionField = objectType({
  name: "PetitionField",
  description: "A field within a petition.",
  definition(t) {
    t.globalId("id", {
      prefixName: "PetitionField",
      description: "The ID of the petition field.",
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
      resolve: ({ optional, type }) => optional || type === "HEADING",
    });
    t.boolean("multiple", {
      description: "Determines if this field allows multiple replies.",
    });
    t.boolean("isFixed", {
      description: "Determines if the field can be moved or deleted.",
      resolve: (o) => o.is_fixed,
    });
    t.boolean("isReadOnly", {
      description: "Determines if the field accepts replies",
      resolve: ({ type }) => ["HEADING"].includes(type),
    });
    t.boolean("validated", {
      description:
        "Determines if the content of this field has been validated.",
    });
    t.field("replies", {
      type: "PetitionFieldReply",
      list: [true],
      description: "The replies to the petition field",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadRepliesForField(root.id);
      },
    });
    t.field("comments", {
      type: "PetitionFieldComment",
      list: [true],
      description: "The comments for this field.",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadPetitionFieldCommentsForFieldAndUser({
          userId: ctx.user!.id,
          petitionId: root.petition_id,
          petitionFieldId: root.id,
        });
      },
    });
    t.int("position");
  },
  rootTyping: "db.PetitionField",
});

export const PetitionAndUpdatedFields = objectType({
  name: "PetitionAndPartialFields",
  description: "The petition and a subset of some of its fields.",
  definition(t) {
    t.field("petition", { type: "Petition" });
    t.field("fields", { type: "PetitionField", list: [true] });
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
      description: "Whether to send reminders only from monday to friday.",
    });
  },
  rootTyping: /* ts */ `{
    offset: number;
    time: string;
    timezone: string;
    weekdaysOnly: boolean;
  }`,
});

export const SignatureConfig = objectType({
  name: "SignatureConfig",
  description: "The signature settings of a petition",
  definition(t) {
    t.string("provider", {
      description: "The selected provider for the signature.",
    });
    t.field("contacts", {
      type: "Contact",
      list: [false],
      description: "The contacts that need to sign the generated document.",
      resolve: async (root, _, ctx) => {
        return await ctx.contacts.loadContact(root.contactIds);
      },
    });
    t.string("timezone", {
      description: "The timezone used to generate the document.",
    });
  },
  rootTyping: /* ts */ `{
    provider: string;
    contactIds: number[];
    timezone: string;
  }`,
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
    t.globalId("id", {
      description: "The ID of the petition access.",
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
      resolve: (o) =>
        o.status === "ACTIVE" && o.reminders_active ? o.next_reminder_at : null,
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
        return root.reminders_config;
      },
    });
    t.boolean("remindersActive", {
      description:
        "Whether automatic reminders are active or not for this petition access",
      resolve: (root) => {
        return root.reminders_active;
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
    t.globalId("id", {
      description: "The ID of the petition field reply.",
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
          default:
            return {};
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

export const FileUploadReplyDownloadLinkResult = objectType({
  name: "FileUploadReplyDownloadLinkResult",
  definition(t) {
    t.field("result", { type: "Result" });
    t.string("url", { nullable: true });
  },
});
