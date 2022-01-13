import { extension } from "mime-types";
import { enumType, inputObjectType, interfaceType, objectType } from "nexus";
import { minBy } from "remeda";
import { fullName } from "../../../util/fullName";
import { toGlobalId } from "../../../util/globalId";
import { safeJsonParse } from "../../../util/safeJsonParse";
import { toHtml, toPlainText } from "../../../util/slate";

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

export const PetitionBaseType = enumType({
  name: "PetitionBaseType",
  members: ["PETITION", "TEMPLATE"],
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
    t.globalId("id", {
      prefixName: "Petition",
      description: "The ID of the petition or template.",
    });
    t.nullable.string("name", {
      description: "The name of the petition.",
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
        return (await ctx.petitions.loadPetitionOwner(root.id))!;
      },
    });
    t.list.nonNull.field("permissions", {
      type: "PetitionPermission",
      description: "The permissions linked to the petition",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadUserAndUserGroupPermissionsByPetitionId(root.id);
      },
    });
    t.nullable.field("myEffectivePermission", {
      type: "EffectivePetitionUserPermission",
      description:
        "The effective permission of the logged user. Will return Null if the user doesn't have access to the petition (e.g. on public templates).",
      resolve: async (root, _, ctx) => {
        const permissions = await ctx.petitions.loadEffectivePermissions(root.id);
        return permissions.find((p) => p.user_id === ctx.user!.id) ?? null;
      },
    });
    t.list.nonNull.field("fields", {
      type: "PetitionField",
      description: "The definition of the petition fields.",
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
    t.nullable.string("emailSubject", {
      description: "The subject of the petition.",
      resolve: (o) => o.email_subject,
    });
    t.nullable.json("emailBody", {
      description: "The body of the petition.",
      resolve: (o) => safeJsonParse(o.email_body),
    });
    t.nullable.field("remindersConfig", {
      type: "RemindersConfig",
      description: "The reminders configuration for the petition.",
      resolve: (o) => {
        return o.reminders_config;
      },
    });
    t.boolean("skipForwardSecurity", {
      description: "Whether to skip the forward security check on the recipient view.",
      resolve: (o) => o.skip_forward_security,
    });
    t.boolean("isRecipientViewContentsHidden", {
      description: "Whether the contents card is hidden in the recipient view.",
      deprecation: "Don't use this",
      resolve: (o) => o.hide_recipient_view_contents,
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
    t.nonNull.list.field("tags", {
      type: "Tag",
      description: "The tags linked to the petition",
      resolve: async (root, _, ctx) => {
        return await ctx.tags.loadTagsByPetitionId(root.id);
      },
    });
    t.nonNull.boolean("isRestricted", {
      resolve: (o) => o.restricted_by_user_id !== null,
    });
    t.nonNull.boolean("isRestrictedWithPassword", {
      resolve: (o) => o.restricted_password_hash !== null,
    });
    t.nullable.field("signatureConfig", {
      type: "SignatureConfig",
      description: "The signature configuration for the petition.",
      resolve: async (root, _, ctx) => {
        return root.signature_config;
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
    t.nonNull.field("customProperties", {
      type: "JSONObject",
      description: "Custom user properties",
      resolve: (o) => o.custom_properties,
    });
    t.nonNull.list.field("attachments", {
      type: "PetitionAttachment",
      description: "The attachments linked to this petition",
      resolve: async (o, _, ctx) => await ctx.petitions.loadPetitionAttachmentsByPetitionId(o.id),
    });
  },
  resolveType: (p) => (p.is_template ? "PetitionTemplate" : "Petition"),
  sourceType: "db.Petition",
});

export const Petition = objectType({
  name: "Petition",
  description: "A petition",
  definition(t) {
    t.implements("PetitionBase");
    t.nullable.datetime("deadline", {
      description: "The deadline of the petition.",
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
        return await ctx.petitions.loadPetitionProgress(root.id);
      },
    });
    t.nullable.datetime("sentAt", {
      description: "Date when the petition was first sent",
      resolve: async (root, _, ctx) => {
        const accesses = await ctx.petitions.loadAccessesForPetition(root.id);
        return minBy(accesses, (a) => a.created_at.valueOf())?.created_at ?? null;
      },
    });
    t.list.nonNull.field("accesses", {
      type: "PetitionAccess",
      description: "The accesses for this petition",
      resolve: async (root, _, ctx) => {
        return ctx.petitions.loadAccessesForPetition(root.id);
      },
    });
    t.nullable.field("currentSignatureRequest", {
      type: "PetitionSignatureRequest",
      description: "The current signature request.",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadLatestPetitionSignatureByPetitionId(root.id);
      },
    });
    t.nullable.list.nonNull.field("signatureRequests", {
      type: "PetitionSignatureRequest",
      description: "The list of signature requests.",
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
    t.nullable.globalId("fromTemplateId", {
      description: "The template GID used for this petition",
      resolve: (root) => root.from_template_id,
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
    t.nullable.json("description", {
      description: "Description of the template.",
      resolve: (o) => safeJsonParse(o.template_description),
    });
    t.nullable.string("descriptionHtml", {
      description: "HTML description of the template.",
      resolve: (o) => {
        return o.template_description
          ? toHtml(safeJsonParse(o.template_description), {}, { startingHeadingLevel: 3 })
          : null;
      },
    });
    t.nullable.string("descriptionExcerpt", {
      description: "HTML excerpt of the template description.",
      resolve: (o) => {
        if (o.template_description) {
          const content = safeJsonParse(o.template_description);
          return toPlainText([content[0]]).slice(0, 200);
        }
        return null;
      },
    });
    t.nullable.field("publicLink", {
      type: "PublicPetitionLink",
      description: "The public link linked to this template",
      resolve: async (root, _, ctx) => {
        // for now we just expose only the first created
        const [publicLink] = await ctx.petitions.loadPublicPetitionLinksByTemplateId(root.id);
        return publicLink;
      },
    });
    t.list.field("defaultPermissions", {
      type: "TemplateDefaultPermission",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadTemplateDefaultPermissions(root.id);
      },
    });
  },
  sourceType: "db.Petition",
});

export const PetitionFieldType = enumType({
  name: "PetitionFieldType",
  description: "Type of a petition field",
  members: [
    { name: "FILE_UPLOAD", description: "A file upload field." },
    { name: "TEXT", description: "A text field." },
    { name: "SHORT_TEXT", description: "A short text field." },
    { name: "HEADING", description: "A heading field." },
    { name: "SELECT", description: "A select field." },
    { name: "DYNAMIC_SELECT", description: "A dynamic select field." },
    { name: "CHECKBOX", description: "A options list." },
  ],
});

export const PetitionBaseAndField = interfaceType({
  name: "PetitionBaseAndField",
  definition(t) {
    t.field("petition", { type: "PetitionBase" });
    t.field("field", { type: "PetitionField" });
  },
  resolveType: (o) => (o.petition.is_template ? "PetitionTemplateAndField" : "PetitionAndField"),
  sourceType: `{
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
      description: "Determines if the content of this field has been validated.",
    });
    t.list.nonNull.field("replies", {
      type: "PetitionFieldReply",
      description: "The replies to the petition field",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadRepliesForField(root.id);
      },
    });
    t.list.nonNull.field("comments", {
      type: "PetitionFieldComment",
      description: "The comments for this field.",
      resolve: async (root, _, ctx) => {
        const loadInternalComments = await ctx.featureFlags.userHasFeatureFlag(
          ctx.user!.id,
          "INTERNAL_COMMENTS"
        );
        return await ctx.petitions.loadPetitionFieldCommentsForField({
          loadInternalComments,
          petitionId: root.petition_id,
          petitionFieldId: root.id,
        });
      },
    });
    t.int("position");
    t.nullable.jsonObject("visibility", {
      description: "A JSON object representing the conditions for the field to be visible",
      resolve: (o) =>
        o.visibility && {
          ...o.visibility,
          conditions: o.visibility.conditions.map((c: any) => ({
            ...c,
            fieldId: toGlobalId("PetitionField", c.fieldId),
          })),
        },
    });
    t.nonNull.list.nonNull.field("attachments", {
      type: "PetitionFieldAttachment",
      description: "A list of files attached to this field.",
      resolve: async (o, _, ctx) => {
        return await ctx.petitions.loadFieldAttachmentsByFieldId(o.id);
      },
    });
    t.nullable.globalId("fromPetitionFieldId", {
      description: "The field GID used from which this field was cloned",
      resolve: (root) => root.from_petition_field_id,
    });
    t.nullable.string("alias", {
      description: "The alias of the petition field.",
      resolve: (o) => o.alias,
    });
    t.field("petition", {
      type: "PetitionBase",
      resolve: async (o, _, ctx) => (await ctx.petitions.loadPetition(o.petition_id))!,
    });
  },
  sourceType: "db.PetitionField",
});

export const PetitionAndUpdatedFields = objectType({
  name: "PetitionAndPartialFields",
  description: "The petition and a subset of some of its fields.",
  definition(t) {
    t.field("petition", { type: "Petition" });
    t.list.nonNull.field("fields", { type: "PetitionField" });
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
  sourceType: /* ts */ `{
    offset: number;
    time: string;
    timezone: string;
    weekdaysOnly: boolean;
  }`,
});

export const PetitionSigner = objectType({
  name: "PetitionSigner",
  description: "Information about a signer of the petition",
  definition(t) {
    t.nullable.globalId("contactId", {
      prefixName: "Contact",
      resolve: (root) => root.contactId ?? null,
    });
    t.string("firstName");
    t.string("lastName");
    t.string("fullName", { resolve: (o) => fullName(o.firstName, o.lastName) });
    t.string("email");
  },
  sourceType: /* ts */ `{
    contactId?: number;
    firstName: string;
    lastName: string;
    email: string;
  }`,
});

export const SignatureConfig = objectType({
  name: "SignatureConfig",
  description: "The signature settings of a petition",
  definition(t) {
    t.nullable.field("integration", {
      type: "SignatureOrgIntegration",
      description: "The signature integration selected for this signature config.",
      resolve: async (o, _, ctx) => {
        return await ctx.integrations.loadIntegration(o.orgIntegrationId);
      },
    });
    t.list.field("signers", {
      type: "PetitionSigner",
      description: "The signers of the generated document.",
      resolve: (o) => o.signersInfo,
    });
    t.string("timezone", {
      description: "The timezone used to generate the document.",
    });
    t.string("title", {
      description: "Title of the signature document",
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
    orgIntegrationId: number;
    signersInfo: {
      firstName: string;
      lastName: string;
      email: string;
    }[];
    timezone: string;
    title: string;
    review?: boolean;
    letRecipientsChooseSigners?: boolean;
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
    t.nullable.field("petition", {
      type: "Petition",
      description: "The petition for this message access.",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadPetition(root.petition_id);
      },
    });
    t.nullable.field("granter", {
      type: "User",
      description: "The user who granted the original access.",
      resolve: async (root, _, ctx) => {
        return (await ctx.users.loadUser(root.granter_id))!;
      },
    });
    t.nullable.field("contact", {
      type: "Contact",
      description: "The contact of this access.",
      resolve: async (root, _, ctx) => {
        return await ctx.contacts.loadContact(root.contact_id);
      },
    });
    t.field("status", {
      type: "PetitionAccessStatus",
      description: "The status of the petition access",
    });
    t.nullable.datetime("nextReminderAt", {
      description: "When the next reminder will be sent.",
      resolve: (o) => (o.status === "ACTIVE" && o.reminders_active ? o.next_reminder_at : null),
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
    t.nullable.field("remindersConfig", {
      type: "RemindersConfig",
      description: "The reminder settings of the petition.",
      resolve: async (root, _, ctx) => {
        return root.reminders_config;
      },
    });
    t.boolean("remindersActive", {
      description: "Whether automatic reminders are active or not for this petition access",
      resolve: (root) => {
        return root.reminders_active;
      },
    });
    t.boolean("remindersOptOut", {
      description: "Whether contact has opted out from receiving reminders for this petition",
      resolve: (root) => {
        return root.reminders_opt_out;
      },
    });
    t.nonNull.list.nonNull.field("reminders", {
      type: "PetitionReminder",
      resolve: async (root, _, ctx) => ctx.petitions.loadRemindersByAccessId(root.id),
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
          case "TEXT":
          case "SHORT_TEXT":
          case "SELECT":
          case "DYNAMIC_SELECT":
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
    t.nullable.field("field", {
      type: "PetitionField",
      description: "The petition field for this reply.",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadField(root.petition_field_id);
      },
    });
    t.jsonObject("metadata", {
      description: "Metadata for this reply.",
      resolve: (o) => o.metadata,
    });
    t.nullable.field("updatedBy", {
      type: "UserOrPetitionAccess",
      description: "The last updater of the field reply.",
      resolve: async (root, _, ctx) => {
        const userId = root.user_id;
        if (userId) {
          const user = await ctx.users.loadUser(userId);
          return user && { __type: "User", ...user };
        } else {
          const access = await ctx.petitions.loadAccess(root.petition_access_id!);
          return access && { __type: "PetitionAccess", ...access };
        }
      },
    });
  },
});

export const FileUploadDownloadLinkResult = objectType({
  name: "FileUploadDownloadLinkResult",
  definition(t) {
    t.field("result", { type: "Result" });
    t.nullable.field("file", { type: "FileUpload" });
    t.nullable.string("url");
  },
});

export const SendPetitionResult = objectType({
  name: "SendPetitionResult",
  definition(t) {
    t.field("result", { type: "Result" });
    t.nullable.field("petition", { type: "Petition" });
    t.nullable.list.nonNull.field("accesses", { type: "PetitionAccess" });
  },
});

export const FileUpload = objectType({
  name: "FileUpload",
  definition(t) {
    t.string("filename");
    t.string("contentType", {
      resolve: (o) => o.content_type,
    });
    t.int("size", {
      resolve: (o) => parseInt(o.size, 10),
    });
    t.boolean("isComplete", {
      resolve: (o) => o.upload_complete,
    });
  },
});

export const FileUploadInput = inputObjectType({
  name: "FileUploadInput",
  definition(t) {
    t.nonNull.string("filename");
    t.nonNull.int("size");
    t.nonNull.string("contentType");
  },
});

export const AWSPresignedPostData = objectType({
  name: "AWSPresignedPostData",
  description: "JSON with AWS S3 url and required form data to make a POST request",
  definition(t) {
    t.string("url");
    t.jsonObject("fields");
  },
});

export const UserOrUserGroupPermissionInput = inputObjectType({
  name: "UserOrUserGroupPermissionInput",
  definition(t) {
    t.globalId("userId", { prefixName: "User" });
    t.globalId("userGroupId", { prefixName: "UserGroup" });
    t.nonNull.field("permissionType", { type: "PetitionPermissionTypeRW" });
    t.nonNull.boolean("isSubscribed");
  },
});

export const PublicPetitionLink = objectType({
  name: "PublicPetitionLink",
  definition(t) {
    t.globalId("id");
    t.nonNull.string("title");
    t.nonNull.string("description");
    t.nonNull.string("slug");
    t.nonNull.boolean("isActive", {
      resolve: (o) => o.is_active,
    });
    t.nonNull.string("url", {
      resolve: async (root, _, ctx) => {
        const template = (await ctx.petitions.loadPetition(root.template_id))!;
        const org = (await ctx.organizations.loadOrg(template.org_id))!;
        const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
        const prefix = org.custom_host
          ? `${protocol}://${org.custom_host}`
          : ctx.config.misc.parallelUrl;
        return `${prefix}/${template.locale}/pp/${root.slug}`;
      },
    });
    t.nonNull.field("owner", {
      type: "User",
      resolve: async (root, _, ctx) => {
        return (await ctx.users.loadUser(root.owner_id))!;
      },
    });
  },
});
