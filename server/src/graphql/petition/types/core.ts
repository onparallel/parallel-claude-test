import { extension } from "mime-types";
import { arg, enumType, inputObjectType, interfaceType, objectType, unionType } from "nexus";
import { findLast, isDefined, minBy, pick } from "remeda";
import {
  ContactLocaleValues,
  PetitionAttachment,
  PetitionAttachmentType,
  PetitionAttachmentTypeValues,
} from "../../../db/__types";
import { ReplyStatusChangedEvent } from "../../../db/events/PetitionEvent";
import { defaultBrandTheme } from "../../../util/BrandTheme";
import { fullName } from "../../../util/fullName";
import { toGlobalId } from "../../../util/globalId";
import { isFileTypeField } from "../../../util/isFileTypeField";
import { safeJsonParse } from "../../../util/safeJsonParse";
import { renderSlateToHtml } from "../../../util/slate/render";
import {
  PetitionFieldMath,
  PetitionFieldVisibility,
  mapFieldLogicCondition,
  mapFieldMathOperation,
} from "../../../util/fieldLogic";
import { mapFieldOptions } from "../../../db/helpers/fieldOptions";

export const PetitionLocale = enumType({
  name: "PetitionLocale",
  description: "The locale used for rendering the petition to the contact.",
  members: ContactLocaleValues,
  sourceType: "db.ContactLocale",
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

export const PetitionFieldProgress = objectType({
  name: "PetitionFieldProgress",
  description: "The progress of the petition",
  definition(t) {
    t.int("approved", {
      description: "Number of fields approved",
    });
    t.int("replied", {
      description: "Number of fields with a reply and not approved",
    });
    t.int("optional", {
      description: "Number of optional fields not replied or approved",
    });
    t.int("total", {
      description: "Total number of fields in the petition",
    });
  },
});

export const PetitionProgress = objectType({
  name: "PetitionProgress",
  description: "The progress of a petition.",
  definition(t) {
    t.field("external", {
      type: "PetitionFieldProgress",
      description: "The progress of the petition exlude internal fields.",
    });
    t.field("internal", {
      type: "PetitionFieldProgress",
      description: "The progress of the petition include internal fields.",
    });
  },
});

export const PetitionFolder = objectType({
  name: "PetitionFolder",
  definition(t) {
    t.id("id", {
      description: "The ID of the petition folder.",
      resolve: (o) => toGlobalId<string>("PetitionFolder", o.path),
    });
    t.string("name", {
      description: "The name of the folder.",
      resolve: (o) => o.name,
    });
    t.string("path", {
      description: "The full path of the folder.",
    });
    t.int("petitionCount", {
      description: "The name petitions in the folder.",
      resolve: (o) => o.petition_count,
    });
    t.field("minimumPermissionType", {
      type: "PetitionPermissionType",
      description: "The lowest permission the user has in the petitions inside the folder.",
      resolve: (o) => o.min_permission,
    });
  },
  sourceType: /* sql */ `{
    name: string;
    petition_count: number;
    is_folder: true;
    path: string;
    min_permission: db.PetitionPermissionType;
  }`,
});

export const PetitionBaseOrFolder = unionType({
  name: "PetitionBaseOrFolder",
  definition(t) {
    t.members("PetitionFolder", "Petition", "PetitionTemplate");
  },
  resolveType: (o) => {
    if (o.is_folder) {
      return "PetitionFolder";
    } else if (o.is_template) {
      return "PetitionTemplate";
    } else {
      return "Petition";
    }
  },
  sourceType: /* ts */ `
    | ({is_folder?: false} & NexusGenRootTypes["Petition"])
    | NexusGenRootTypes["PetitionFolder"]
  `,
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
      description: "The locale of the parallel.",
      resolve: (o) => o.recipient_locale,
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
    t.list.field("effectivePermissions", {
      type: "EffectivePetitionUserPermission",
      description: "The effective permissions on the petition",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadEffectivePermissions(root.id);
      },
    });
    t.nullable.field("myEffectivePermission", {
      type: "EffectivePetitionUserPermission",
      description:
        "The effective permission of the logged user. Will return null if the user doesn't have access to the petition (e.g. on public templates).",
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
    t.nullable.json("closingEmailBody", {
      description: "The closing email body of the petition.",
      resolve: (o) => safeJsonParse(o.closing_email_body),
    });
    t.boolean("isCompletingMessageEnabled", {
      description: "Wether the completion message will be shown to the recipients or not.",
      resolve: (o) => o.is_completing_message_enabled,
    });
    t.nullable.string("completingMessageSubject", {
      description: "The subject of the optional completing message to be show to recipients",
      resolve: (o) => o.completing_message_subject,
    });
    t.nullable.json("completingMessageBody", {
      description: "The body of the optional completing message to be show to recipients",
      resolve: (o) => safeJsonParse(o.completing_message_body),
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
      resolve: (o) => o.restricted_at !== null,
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
        const res = await ctx.organizations.loadOrgBrandTheme(root.org_id);
        const theme = res?.data ?? defaultBrandTheme;

        return theme.preferredTone;
      },
    });
    t.nonNull.field("customProperties", {
      type: "JSONObject",
      description: "Custom user properties",
      resolve: (o) => o.custom_properties,
    });
    t.nonNull.field("attachmentsList", {
      description: "The attachments linked to this petition",
      type: objectType({
        name: "PetitionAttachmentsList",
        definition(t) {
          PetitionAttachmentTypeValues.map((type) => {
            t.nonNull.list.nonNull.field(type, { type: "PetitionAttachment" });
          });
        },
      }),
      resolve: async (o, _, ctx) => {
        const attachments = await ctx.petitions.loadPetitionAttachmentsByPetitionId(o.id);
        return Object.fromEntries(
          PetitionAttachmentTypeValues.map((type) => [
            type,
            attachments.filter((a) => a.type === type),
          ]),
        ) as Record<PetitionAttachmentType, PetitionAttachment[]>;
      },
    });
    t.jsonObject("metadata", {
      description: "Metadata for this petition.",
      resolve: (o) => o.metadata,
    });
    t.boolean("isAnonymized", { resolve: (o) => o.anonymized_at !== null });
    t.nullable.int("anonymizeAfterMonths", {
      description: "How many months to wait since the petition is closed to anonymize.",
      resolve: (o) => o.anonymize_after_months,
    });
    t.nullable.string("anonymizePurpose", {
      description: "Purpose of the anonymization",
      resolve: (o) => o.anonymize_purpose,
    });
    t.nonNull.field("selectedDocumentTheme", {
      type: "OrganizationTheme",
      resolve: async (o, _, ctx) => {
        return (await ctx.organizations.loadOrganizationTheme(o.document_organization_theme_id))!;
      },
    });
    t.nonNull.string("path");
    t.nullable.field("defaultOnBehalf", {
      type: "User",
      resolve: async (root, _, ctx) => {
        return root.send_on_behalf_user_id
          ? await ctx.users.loadUser(root.send_on_behalf_user_id)
          : null;
      },
    });
    t.nullable.datetime("lastActivityAt", {
      deprecation: "",
      resolve: (o) => o.last_activity_at,
    });
    t.nullable.datetime("lastRecipientActivityAt", {
      deprecation: "",
      resolve: (o) => o.last_recipient_activity_at,
    });
    t.nonNull.list.nonNull.field("variables", {
      type: "PetitionVariable",
      resolve: (o) => o.variables ?? [],
    });
    t.nonNull.list.nonNull.field("variablesResult", {
      type: "PetitionVariableResult",
      resolve: async (o, _, ctx) => await ctx.petitions.loadResolvedPetitionVariables(o.id),
    });
    t.nonNull.list.nonNull.field("customLists", {
      type: "PetitionCustomList",
      resolve: (o) => o.custom_lists ?? [],
    });
    t.nonNull.boolean("isDelegateAccessEnabled", {
      description: "Indicates whether delegate access is enabled for the recipient",
      resolve: (o) => o.enable_delegate_access,
    });
    t.nonNull.boolean("isInteractionWithRecipientsEnabled", {
      resolve: (o) => o.enable_interaction_with_recipients,
    });
    t.nonNull.boolean("isReviewFlowEnabled", {
      resolve: (o) => o.enable_review_flow,
    });
    t.nonNull.boolean("isDocumentGenerationEnabled", {
      resolve: (o) => o.enable_document_generation,
    });
    t.datetime("lastChangeAt", {
      description: "Time when the petition or any of its relations were last updated.",
      resolve: (o) => o.last_change_at,
    });
  },
  resolveType: (p) => (p.is_template ? "PetitionTemplate" : "Petition"),
  sourceType: "db.Petition",
});

export const PetitionBaseMini = objectType({
  name: "PetitionBaseMini",
  sourceType: "db.Petition",
  definition(t) {
    t.globalId("id", {
      prefixName: "Petition",
      description: "The ID of the petition or template.",
    });
    t.nullable.string("name", {
      description: "The name of the petition.",
    });
    t.nullable.boolean("isPublicTemplate", {
      description: "Whether the template is publicly available or not",
      resolve: (o) => o.is_template && o.template_public,
    });
    t.nullable.field("myEffectivePermission", {
      type: "EffectivePetitionUserPermission",
      description:
        "The effective permission of the logged user. Will return null if the user doesn't have access to the petition (e.g. on public templates).",
      resolve: async (root, _, ctx) => {
        const permissions = await ctx.petitions.loadEffectivePermissions(root.id);
        return permissions.find((p) => p.user_id === ctx.user!.id) ?? null;
      },
    });
  },
});

export const PetitionFieldMini = objectType({
  name: "PetitionFieldMini",
  sourceType: "db.PetitionField",
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
    t.jsonObject("options", {
      description: "The options of the petition field.",
      resolve: (o) => mapFieldOptions(o.options),
    });
  },
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
        const messages = await ctx.petitions.loadMessagesByPetitionId(root.id);
        const firstMessage = minBy(
          messages,
          (m) => m.scheduled_at?.valueOf() ?? m.created_at.valueOf(),
        );

        return firstMessage?.scheduled_at ?? firstMessage?.created_at ?? null;
      },
    });
    t.list.nonNull.field("accesses", {
      type: "PetitionAccess",
      description: "The accesses for this petition",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadAccessesForPetition(root.id);
      },
    });
    t.nullable.field("currentSignatureRequest", {
      type: "PetitionSignatureRequest",
      description: "The current signature request.",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadLatestPetitionSignatureByPetitionId(root.id);
      },
    });
    t.list.nonNull.field("signatureRequests", {
      type: "PetitionSignatureRequest",
      description: "The list of signature requests.",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadPetitionSignaturesByPetitionId(root.id);
      },
    });
    t.paginationField("events", {
      type: "PetitionEvent",
      description: "The events for the petition.",
      resolve: (root, { offset, limit }, ctx) => {
        return ctx.petitions.getPaginatedEventsForPetition(root.id, {
          offset,
          limit,
        });
      },
    });
    t.nullable.field("fromTemplate", {
      /**
       * minified version of PetitionBase.
       * as user may not have access to this template,
       * only expose id and name
       */
      type: "PetitionBaseMini",
      description: "The template used for this petition",
      resolve: async (root, _, ctx) => {
        const templateId = root.from_template_id;
        return templateId ? await ctx.petitions.loadPetition(templateId) : null;
      },
    });
    t.nullable.datetime("closedAt", {
      description: "Time when the petition was closed.",
      resolve: (o) => o.closed_at,
    });
    t.nonNull.list.nonNull.field("profiles", {
      type: "Profile",
      resolve: async (o, _, ctx) => {
        return await ctx.profiles.loadProfilesByPetitionId(o.id);
      },
    });
    t.nullable.datetime("lastActivityAt", {
      resolve: (o) => o.last_activity_at,
    });
    t.nullable.datetime("lastRecipientActivityAt", {
      resolve: (o) => o.last_recipient_activity_at,
    });
    t.nullable.jsonObject("summaryConfig", {
      description: "The summary configuration for the petition.",
      // don't expose config for now, just if it exists or not
      resolve: (o) => (isDefined(o.summary_config) ? {} : null),
    });
    t.nullable.field("latestSummaryRequest", {
      type: "AiCompletionLog",
      description: "The latest summary request for this petition",
      resolve: async (root, _, ctx) => {
        if (!isDefined(root.summary_ai_completion_log_id)) {
          return null;
        }
        return await ctx.petitions.loadPetitionSummaryRequest(root.summary_ai_completion_log_id);
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
    t.nullable.json("description", {
      description: "Description of the template.",
      resolve: (o) => safeJsonParse(o.template_description),
    });
    t.nullable.string("descriptionHtml", {
      description: "HTML description of the template.",
      resolve: (o) => {
        return o.template_description
          ? renderSlateToHtml(safeJsonParse(o.template_description), {
              startingHeadingLevel: 3,
            })
          : null;
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
    t.list.field("effectiveDefaultPermissions", {
      type: "EffectivePetitionUserPermission",
      description: "The default effective permissions on the template",
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadEffectiveTemplateDefaultPermissions(root.id);
      },
    });
    t.nullable.string("backgroundColor", {
      resolve: (o) => o.public_metadata?.background_color,
    });
    t.nullable.list.nonNull.string("categories", {
      resolve: (o) => o.public_metadata?.categories,
    });
    t.nullable.string("imageUrl", {
      args: {
        options: arg({ type: "ImageOptions" }),
      },
      resolve: async (root, args, ctx) => {
        if (root.public_metadata?.image_public_file_id) {
          const file = await ctx.files.loadPublicFile(root.public_metadata.image_public_file_id);
          return await ctx.images.getImageUrl(file!.path, args.options as any);
        }
        return null;
      },
    });
    t.string("defaultPath", {
      resolve: (o) => o.default_path,
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
    { name: "NUMBER", description: "A only numbers field." },
    { name: "DATE", description: "A datepicker field." },
    { name: "DATE_TIME", description: "A datepicker with time and timezone field." },
    { name: "PHONE", description: "A phone formatted field." },
    { name: "ES_TAX_DOCUMENTS", description: "A tax documents/info field." },
    { name: "DOW_JONES_KYC", description: "A saerch in Dow Jones field." },
    { name: "FIELD_GROUP", description: "A group of fields" },
    { name: "BACKGROUND_CHECK", description: "Run a background check of entities" },
  ],
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
      resolve: (o) => mapFieldOptions(o.options),
    });
    t.boolean("optional", {
      description: "Determines if this field is optional.",
      resolve: ({ optional, type }) => optional || type === "HEADING",
    });
    t.boolean("multiple", {
      description: "Determines if this field allows multiple replies.",
      resolve: ({ multiple, type }) => multiple || type === "FIELD_GROUP",
    });
    t.boolean("isFixed", {
      description: "Determines if the field can be moved or deleted.",
      resolve: (o) => o.is_fixed,
    });
    t.boolean("isInternal", {
      description: "Determines if the field is visible by the recipients.",
      resolve: (o) => ["DOW_JONES_KYC", "BACKGROUND_CHECK"].includes(o.type) || o.is_internal,
    });
    t.boolean("showInPdf", {
      description: "Determines if the field is visible in PDF export.",
      resolve: (o) => !["DOW_JONES_KYC", "BACKGROUND_CHECK"].includes(o.type) && o.show_in_pdf,
    });
    t.boolean("showActivityInPdf", {
      description: "Determines if the field last activity is visible in PDF export.",
      resolve: (o) =>
        !["DOW_JONES_KYC", "BACKGROUND_CHECK", "FIELD_GROUP"].includes(o.type) &&
        o.show_activity_in_pdf,
    });
    t.boolean("isReadOnly", {
      description: "Determines if the field accepts replies",
      resolve: ({ type }) => ["HEADING"].includes(type),
    });
    t.boolean("requireApproval", {
      description: "Determines if the field requires approval.",
      resolve: (f) => !["HEADING", "FIELD_GROUP"].includes(f.type) && f.require_approval,
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
        return await ctx.petitions.loadPetitionFieldCommentsForField({
          loadInternalComments: true,
          petitionId: root.petition_id,
          petitionFieldId: root.id,
        });
      },
    });
    t.nonNull.int("commentCount", {
      resolve: async (root, _, ctx) => {
        return (
          await ctx.petitions.loadPetitionFieldCommentsForField({
            loadInternalComments: true,
            petitionId: root.petition_id,
            petitionFieldId: root.id,
          })
        ).length;
      },
    });
    t.nonNull.int("unreadCommentCount", {
      resolve: async (root, _, ctx) => {
        return await ctx.petitions.loadPetitionFieldUnreadCommentCountForFieldAndUser({
          userId: ctx.user!.id,
          petitionId: root.petition_id,
          petitionFieldId: root.id,
        });
      },
    });
    t.int("position");
    t.nullable.jsonObject("visibility", {
      description: "A JSON object representing the conditions for the field to be visible",
      resolve: (o) => {
        if (isDefined(o.visibility)) {
          const visibility = o.visibility as PetitionFieldVisibility;
          return {
            ...visibility,
            conditions: visibility.conditions.map((c) => mapFieldLogicCondition(c)),
          };
        }

        return null;
      },
    });
    t.nullable.list.nonNull.jsonObject("math", {
      description: "A JSON object representing the math to be performed on the field",
      resolve: (o) => {
        if (isDefined(o.math)) {
          const math = o.math as PetitionFieldMath[];
          return math.map((m) => ({
            ...m,
            conditions: m.conditions.map((c) => mapFieldLogicCondition(c)),
            operations: m.operations.map((op) => mapFieldMathOperation(op)),
          }));
        }

        return null;
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
    t.nonNull.boolean("hasCommentsEnabled", {
      resolve: (o) => o.has_comments_enabled,
    });
    t.nullable.list.nonNull.field("children", {
      type: "PetitionField",
      description: "The children of this field.",
      resolve: async (o, _, ctx) => {
        if (o.type !== "FIELD_GROUP") {
          return null;
        }
        return await ctx.petitions.loadPetitionFieldChildren(o.id);
      },
    });
    t.nullable.field("parent", {
      type: "PetitionField",
      resolve: async (o, _, ctx) => {
        if (isDefined(o.parent_petition_field_id)) {
          return await ctx.petitions.loadField(o.parent_petition_field_id);
        }
        return null;
      },
    });
    t.nonNull.boolean("isChild", {
      resolve: (o) => o.parent_petition_field_id !== null,
    });
  },
  sourceType: "db.PetitionField",
});

export const RemindersConfig = objectType({
  name: "RemindersConfig",
  description: "The reminder settings of a petition",
  definition(t) {
    t.int("offset", {
      description: "The amount of days between reminders.",
    });
    t.int("limit", {
      description: "The maximum amount of reminders.",
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
    limit: number;
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
      resolve: (o) => o?.contactId ?? null,
    });
    t.string("firstName", { resolve: (o) => o?.firstName ?? "" });
    t.nullable.string("lastName", { resolve: (o) => o?.lastName ?? null });
    t.string("fullName", { resolve: (o) => fullName(o?.firstName, o?.lastName) ?? "" });
    t.string("email", { resolve: (o) => o?.email ?? "" });
    t.boolean("isPreset", {
      resolve: (o) => o.isPreset ?? false,
    });
  },
  sourceType: /* ts */ `{
    contactId?: number;
    firstName: string;
    lastName: string;
    email: string;
    isPreset?: boolean;
  }`,
});

export const SignatureConfigSigningMode = enumType({
  name: "SignatureConfigSigningMode",
  description: "The signing mode of a signature config",
  members: ["PARALLEL", "SEQUENTIAL"],
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
    t.list.nullable.field("signers", {
      type: "PetitionSigner",
      description: "The signers of the generated document.",
      resolve: (o) => o.signersInfo,
    });
    t.string("timezone", {
      description: "The timezone used to generate the document.",
    });
    t.nullable.string("title", {
      description: "Title of the signature document",
    });
    t.boolean("review", {
      description:
        "If true, lets the user review the replies before starting the signature process",
      resolve: (o) => o.review ?? false,
    });
    t.boolean("allowAdditionalSigners", {
      description:
        "If true, allows the recipients or users of the petition to select additional signers",
      resolve: (o) => o.allowAdditionalSigners ?? false,
    });
    t.int("minSigners", {
      description: "The minimum number of signers required to sign the document",
    });
    t.nullable.string("instructions", {
      description:
        "The instructions to be shown to the user or recipient before starting the signature process",
    });
    t.field("signingMode", {
      type: "SignatureConfigSigningMode",
    });
    t.nullable.string("message");
  },
  sourceType: /* ts */ `{
    orgIntegrationId: number;
    signersInfo: {
      firstName: string;
      lastName: string;
      email: string;
      isPreset?: boolean;
    }[];
    timezone: string;
    title: string | null;
    review?: boolean;
    allowAdditionalSigners?: boolean;
    minSigners: number;
    instructions?: string | null;
    message?: string;
    signingMode: "PARALLEL" | "SEQUENTIAL"
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
    t.nullable.field("delegateGranter", {
      type: "User",
      description: "The original user who granted the access as other user.",
      resolve: async (root, _, ctx) => {
        return root.delegate_granter_id ? await ctx.users.loadUser(root.delegate_granter_id) : null;
      },
    });
    t.nullable.field("contact", {
      type: "Contact",
      description: "The contact of this access.",
      resolve: async (root, _, ctx) => {
        return root.contact_id ? await ctx.contacts.loadContact(root.contact_id) : null;
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
    t.nullable.string("recipientUrl", {
      resolve: async (root, _, ctx) => {
        const hasFeatureFlag = await ctx.featureFlags.userHasFeatureFlag(
          ctx.user!.id,
          "PETITION_ACCESS_RECIPIENT_URL_FIELD",
        );

        if (hasFeatureFlag || root.contact_id === null) {
          const { recipient_locale: locale } = (await ctx.petitions.loadPetition(
            root.petition_id,
          ))!;
          return `${ctx.config.misc.parallelUrl}/${locale}/petition/${root.keycode}`;
        }

        return null;
      },
    });
    t.boolean("isContactless", {
      description: "It will be true if doesn't have contact assigned",
      resolve: (root) => {
        return root.contact_id === null;
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
        if (isFileTypeField(root.type)) {
          const file = isDefined(root.content.file_upload_id)
            ? await ctx.files.loadFileUpload(root.content.file_upload_id)
            : null;
          return file
            ? {
                id: toGlobalId("FileUpload", file.id),
                filename: file.filename,
                size: file.size,
                contentType: file.content_type,
                extension: extension(file.content_type) || null,
                uploadComplete: file.upload_complete,
                ...(root.type === "DOW_JONES_KYC" ? { entity: root.content.entity } : {}),
                ...(root.type === "ES_TAX_DOCUMENTS" ? { warning: root.content.warning } : {}),
              }
            : root.anonymized_at
              ? {}
              : {
                  ...(root.type === "ES_TAX_DOCUMENTS"
                    ? // file_upload_id is null but reply is not anonymized: there was an error when requesting documents
                      pick(root.content, ["type", "request", "error"])
                    : {}),
                };
        } else if (root.type === "BACKGROUND_CHECK") {
          return {
            query: isDefined(root.content.query)
              ? pick(root.content.query, ["name", "date", "type"])
              : null,
            search: isDefined(root.content.search)
              ? pick(root.content.search, ["totalCount"])
              : null,
            entity: isDefined(root.content.entity)
              ? {
                  ...pick(root.content.entity, ["id", "type", "name"]),
                  properties: pick(root.content.entity.properties, ["topics"]),
                }
              : null,
          };
        } else {
          return root.content ?? {};
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
    t.nullable.field("repliedBy", {
      type: "UserOrPetitionAccess",
      description: "The person that created the reply or the last person that edited the reply.",
      resolve: async (root, _, ctx) => {
        const event = findLast(
          await ctx.petitions.loadPetitionFieldReplyEvents(root.id),
          (e) => e.type === "REPLY_CREATED" || e.type === "REPLY_UPDATED",
        );

        if (!event) {
          return null;
        }

        if (isDefined(event.data.user_id)) {
          const user = await ctx.users.loadUser(event.data.user_id);
          return user && { __type: "User", ...user };
        } else {
          const access = await ctx.petitions.loadAccess(event.data.petition_access_id!);
          return access && { __type: "PetitionAccess", ...access };
        }
      },
    });
    t.nullable.datetime("repliedAt", {
      description: "When the reply was created or last updated",
      resolve: async (root, _, ctx) => {
        const event = findLast(
          await ctx.petitions.loadPetitionFieldReplyEvents(root.id),
          (e) => e.type === "REPLY_CREATED" || e.type === "REPLY_UPDATED",
        );

        if (!event) {
          return null;
        }
        return event.created_at;
      },
    });
    t.nullable.field("lastReviewedBy", {
      type: "User",
      description: "The person that reviewed the reply.",
      resolve: async (root, _, ctx) => {
        if (root.status === "PENDING") {
          return null;
        }
        const event = findLast(
          await ctx.petitions.loadPetitionFieldReplyEvents(root.id),
          (e) => e.type === "REPLY_STATUS_CHANGED",
        ) as ReplyStatusChangedEvent;
        if (!isDefined(event)) {
          return null;
        }

        return ctx.users.loadUser(event.data.user_id!);
      },
    });
    t.nullable.datetime("lastReviewedAt", {
      description: "When the reply was reviewed.",
      resolve: async (root, _, ctx) => {
        if (root.status === "PENDING") {
          return null;
        }
        const event = findLast(
          await ctx.petitions.loadPetitionFieldReplyEvents(root.id),
          (e) => e.type === "REPLY_STATUS_CHANGED",
        ) as ReplyStatusChangedEvent;
        if (!isDefined(event)) {
          return null;
        }
        return event.created_at;
      },
    });
    t.boolean("isAnonymized", { resolve: (o) => o.anonymized_at !== null });
    t.nullable.field("parent", {
      type: "PetitionFieldReply",
      resolve: async (o, _, ctx) => {
        if (isDefined(o.parent_petition_field_reply_id)) {
          return await ctx.petitions.loadFieldReply(o.parent_petition_field_reply_id);
        }
        return null;
      },
    });
    t.nullable.list.nonNull.field("children", {
      type: "PetitionFieldGroupChildReply",
      resolve: async (o, _, ctx) => {
        if (o.type !== "FIELD_GROUP") {
          return null;
        }

        const childrenFields = await ctx.petitions.loadPetitionFieldChildren(o.petition_field_id);
        return childrenFields.map((field) => ({
          petition_field_id: field.id,
          parent_petition_field_reply_id: o.id,
        }));
      },
    });
  },
});

export const PetitionFieldGroupChildReply = objectType({
  name: "PetitionFieldGroupChildReply",
  description: "References the replies of a FIELD_GROUP field on a specific field and group",
  definition(t) {
    t.nonNull.field("field", {
      type: "PetitionField",
      resolve: async (o, _, ctx) => {
        return (await ctx.petitions.loadField(o.petition_field_id))!;
      },
    });
    t.nonNull.list.nonNull.field("replies", {
      type: "PetitionFieldReply",
      resolve: async (o, _, ctx) => {
        return await ctx.petitions.loadPetitionFieldGroupChildReplies({
          parentPetitionFieldReplyId: o.parent_petition_field_reply_id,
          petitionFieldId: o.petition_field_id,
        });
      },
    });
  },
  sourceType: /* ts */ `{
    parent_petition_field_reply_id: number;
    petition_field_id: number;
  }`,
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
    t.nonNull.field("permissionType", { type: "PetitionPermissionType" });
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
        return `${prefix}/${template.recipient_locale}/pp/${root.slug}`;
      },
    });
    t.field("owner", {
      type: "User",
      resolve: async (root, _, ctx) => {
        const owner = await ctx.petitions.loadTemplateDefaultOwner(root.template_id);
        return owner!.user;
      },
    });
    t.nonNull.field("template", {
      type: "PetitionTemplate",
      resolve: async (o, _, ctx) => (await ctx.petitions.loadPetition(o.template_id))!,
    });
    t.nullable.string("prefillSecret", {
      resolve: (o) => o.prefill_secret,
    });
    t.nonNull.boolean("allowMultiplePetitions", {
      resolve: (o) => o.allow_multiple_petitions,
    });
    t.nullable.string("petitionNamePattern", {
      resolve: (o) => o.petition_name_pattern,
    });
  },
});

export const FoldersInput = inputObjectType({
  name: "FoldersInput",
  definition(t) {
    t.nonNull.field("type", { type: "PetitionBaseType" });
    t.nonNull.list.nonNull.id("folderIds");
  },
});

export const PetitionVariable = objectType({
  name: "PetitionVariable",
  definition(t) {
    t.nonNull.string("name");
    t.nonNull.float("defaultValue", { resolve: (o) => o.default_value });
  },
  sourceType: /* ts */ `{
    name: string;
    default_value: number;
  }`,
});

export const PetitionVariableResult = objectType({
  name: "PetitionVariableResult",
  definition(t) {
    t.nonNull.string("name");
    t.nullable.float("value", { resolve: (o) => o.value });
  },
  sourceType: /* ts */ `{
    name: string;
    value: number | null;
  }`,
});

export const PetitionCustomList = objectType({
  name: "PetitionCustomList",
  definition(t) {
    t.nonNull.string("name");
    t.nonNull.list.string("values", { resolve: (o) => o.values });
  },
  sourceType: /* ts */ `{
    name: string;
    values: string[];
  }`,
});
