import {
  arg,
  booleanArg,
  inputObjectType,
  intArg,
  mutationField,
  objectType,
  stringArg,
} from "@nexus/schema";
import { defaultFieldOptions } from "../../../db/helpers/fieldOptions";
import {
  CreatePetition,
  CreatePetitionField,
  PetitionUser,
} from "../../../db/__types";
import { calculateNextReminder } from "../../../util/reminderUtils";
import {
  and,
  authenticate,
  chain,
  ifArgDefined,
  or,
} from "../../helpers/authorize";
import { dateTimeArg } from "../../helpers/date";
import { jsonArg } from "../../helpers/json";
import { RESULT } from "../../helpers/result";
import { validateAnd, validateOr } from "../../helpers/validateArgs";
import { inRange } from "../../helpers/validators/inRange";
import { maxLength } from "../../helpers/validators/maxLength";
import { notEmptyArray } from "../../helpers/validators/notEmptyArray";
import { notEmptyString } from "../../helpers/validators/notEmptyString";
import { validBooleanValue } from "../../helpers/validators/validBooleanValue";
import { validIsDefined } from "../../helpers/validators/validIsDefined";
import { validRemindersConfig } from "../../helpers/validators/validRemindersConfig";
import { validRichTextContent } from "../../helpers/validators/validRichTextContent";
import { notEmptyObject } from "../../helpers/validators/notEmptyObject";
import {
  accessesBelongToPetition,
  accessesBelongToValidContacts,
  fieldsBelongsToPetition,
  messageBelongToPetition,
  repliesBelongsToField,
  repliesBelongsToPetition,
  userHasAccessToPetitions,
  fieldIsNotFixed,
  petitionsArePublicTemplates,
} from "../authorizers";
import {
  validateAccessesRemindersLeft,
  validateAccessesStatus,
  validatePetitionStatus,
} from "../validations";
import { ArgValidationError, WhitelistedError } from "./../../helpers/errors";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { mapSeries } from "async";
import { unMaybeArray } from "../../../util/arrays";
import { toGlobalId } from "../../../util/globalId";

export const createPetition = mutationField("createPetition", {
  description: "Create petition.",
  type: "PetitionBase",
  authorize: chain(
    authenticate(),
    ifArgDefined(
      "petitionId",
      or(
        userHasAccessToPetitions("petitionId" as never),
        petitionsArePublicTemplates("petitionId" as never)
      )
    )
  ),
  args: {
    name: stringArg(),
    locale: arg({ type: "PetitionLocale", required: true }),
    petitionId: globalIdArg("Petition", {
      description: "GID of petition to base from",
      required: false,
    }),
    type: arg({
      type: "PetitionBaseType",
      description: "Type of petition to create",
      default: "PETITION",
      required: false,
    }),
  },
  resolve: async (_, { name, locale, petitionId, type }, ctx) => {
    const isTemplate = type === "TEMPLATE";
    if (petitionId) {
      const cloned = await ctx.petitions.clonePetition(petitionId, ctx.user!, {
        is_template: isTemplate,
        status: isTemplate ? null : "DRAFT",
      });

      const originalPetition = (await ctx.petitions.loadPetition(petitionId))!;
      if (originalPetition.is_template && !isTemplate) {
        ctx.analytics.trackEvent(
          "TEMPLATE_USED",
          {
            template_id: petitionId,
            user_id: ctx.user!.id,
          },
          toGlobalId("User", ctx.user!.id)
        );
      } else if (!originalPetition.is_template) {
        ctx.analytics.trackEvent(
          "PETITION_CLONED",
          {
            from_petition_id: petitionId,
            petition_id: cloned.id,
            user_id: ctx.user!.id,
            type: cloned.is_template ? "TEMPLATE" : "PETITION",
          },
          toGlobalId("User", ctx.user!.id)
        );
      }
      return cloned;
    } else {
      const newPetition = await ctx.petitions.createPetition(
        {
          name,
          locale,
          email_subject: name,
          is_template: isTemplate,
        },
        ctx.user!
      );

      ctx.analytics.trackEvent(
        "PETITION_CREATED",
        {
          petition_id: newPetition.id,
          user_id: ctx.user!.id,
          type: isTemplate ? "TEMPLATE" : "PETITION",
        },
        toGlobalId("User", ctx.user!.id)
      );

      return newPetition;
    }
  },
});

export const clonePetitions = mutationField("clonePetitions", {
  description: "Clone petition.",
  type: "PetitionBase",
  list: [true],
  authorize: chain(
    authenticate(),
    or(
      userHasAccessToPetitions("petitionIds"),
      petitionsArePublicTemplates("petitionIds")
    )
  ),
  args: {
    petitionIds: globalIdArg("Petition", {
      list: [true],
      required: true,
    }),
  },
  validateArgs: notEmptyArray((args) => args.petitionIds, "petitionIds"),
  resolve: async (_, args, ctx) => {
    return await mapSeries(
      unMaybeArray(args.petitionIds),
      async (petitionId) => {
        const { name, locale } = (await ctx.petitions.loadPetition(
          petitionId
        ))!;
        const mark = `(${locale === "es" ? "copia" : "copy"})`;

        const cloned = await ctx.petitions.clonePetition(
          petitionId,
          ctx.user!,
          {
            name: `${name ? `${name} ` : ""}${mark}`.slice(0, 255),
          }
        );

        ctx.analytics.trackEvent(
          "PETITION_CLONED",
          {
            from_petition_id: petitionId,
            petition_id: cloned.id,
            user_id: ctx.user!.id,
            type: cloned.is_template ? "TEMPLATE" : "PETITION",
          },
          toGlobalId("User", ctx.user!.id)
        );

        return cloned;
      }
    );
  },
});

export const deletePetitions = mutationField("deletePetitions", {
  description: "Delete petitions.",
  type: "Result",
  authorize: chain(authenticate(), userHasAccessToPetitions("ids")),
  args: {
    ids: globalIdArg("Petition", { required: true, list: [true] }),
    force: booleanArg({ default: false, required: false }),
  },
  validateArgs: notEmptyArray((args) => args.ids, "ids"),
  resolve: async (_, args, ctx) => {
    const petitionIsSharedByOwner = (p: PetitionUser[]) => {
      return (
        p &&
        p.length > 1 && // the petition is being shared to another user
        p.find(
          (u) => u.permission_type === "OWNER" && u.user_id === ctx.user!.id // logged user is the owner
        )
      );
    };

    // user permissions grouped by permission_id
    const userPermissions = await ctx.petitions.loadUserPermissions(args.ids);

    // if userPermissions === [undefined], the petition is deleted
    if (userPermissions.filter((p) => !!p).length === 0) {
      throw new WhitelistedError(
        "The requested petition was not found",
        "PETITION_NOT_FOUND"
      );
    }

    if (userPermissions.some(petitionIsSharedByOwner) && !args.force) {
      throw new WhitelistedError(
        "Petition to delete is shared to another user",
        "DELETE_SHARED_PETITION_ERROR"
      );
    }

    await ctx.petitions.withTransaction(async (t) => {
      // delete all permissions to the petitions
      const ownedPetitionIds = await ctx.petitions.deleteUserPermissions(
        args.ids,
        ctx.user!,
        t
      );

      // delete only petitions OWNED by me
      await ctx.petitions.deletePetitionById(ownedPetitionIds, ctx.user!, t);
    });

    return RESULT.SUCCESS;
  },
});

export const updateFieldPositions = mutationField("updateFieldPositions", {
  description: "Updates the positions of the petition fields",
  type: "PetitionBase",
  authorize: chain(authenticate(), userHasAccessToPetitions("petitionId")),
  args: {
    petitionId: globalIdArg("Petition", { required: true }),
    fieldIds: globalIdArg("PetitionField", {
      required: true,
      list: [true],
    }),
  },
  resolve: async (_, args, ctx) => {
    try {
      return await ctx.petitions.updateFieldPositions(
        args.petitionId,
        args.fieldIds,
        ctx.user!
      );
    } catch (e) {
      if (e.message === "INVALID_PETITION_FIELD_IDS") {
        throw new WhitelistedError(
          "Invalid petition field ids",
          "INVALID_PETITION_FIELD_IDS"
        );
      } else {
        throw e;
      }
    }
  },
});

export const RemindersConfigInput = inputObjectType({
  name: "RemindersConfigInput",
  description: "The reminders settings for the petition",
  definition(t) {
    t.int("offset", {
      description: "The amount of days between reminders.",
      required: true,
    });
    t.string("time", {
      description: "The time at which the reminder should be sent.",
      required: true,
    });
    t.string("timezone", {
      description: "The timezone the time is referring to.",
      required: true,
    });
    t.boolean("weekdaysOnly", {
      description: "Whether to send reminders only from monday to friday.",
      required: true,
    });
  },
});

export const updatePetition = mutationField("updatePetition", {
  description: "Updates a petition.",
  type: "PetitionBase",
  authorize: chain(authenticate(), userHasAccessToPetitions("petitionId")),
  args: {
    petitionId: globalIdArg("Petition", { required: true }),
    data: inputObjectType({
      name: "UpdatePetitionInput",
      definition(t) {
        t.string("name", { nullable: true });
        t.field("locale", { type: "PetitionLocale", nullable: true });
        t.datetime("deadline", { nullable: true });
        t.string("emailSubject", { nullable: true });
        t.json("emailBody", { nullable: true });
        t.field("remindersConfig", {
          type: "RemindersConfigInput",
          nullable: true,
        });
        t.string("description", { nullable: true });
      },
    }).asArg({ required: true }),
  },
  validateArgs: validateAnd(
    notEmptyObject((args) => args.data, "data"),
    maxLength((args) => args.data.name, "data.name", 255),
    maxLength((args) => args.data.emailSubject, "data.emailSubject", 255),
    maxLength((args) => args.data.description, "data.description", 1000),
    validRichTextContent((args) => args.data.emailBody, "data.emailBody"),
    validRemindersConfig(
      (args) => args.data.remindersConfig,
      "data.remindersConfig"
    )
  ),
  resolve: async (_, args, ctx) => {
    const {
      name,
      locale,
      deadline,
      emailSubject,
      emailBody,
      remindersConfig,
      description,
    } = args.data;
    const data: Partial<CreatePetition> = {};
    if (name !== undefined) {
      data.name = name?.trim() || null;
    }
    if (locale !== undefined && locale !== null) {
      data.locale = locale;
    }
    if (deadline !== undefined) {
      data.deadline = deadline;
    }
    if (emailSubject !== undefined) {
      data.email_subject = emailSubject?.trim() || null;
    }
    if (emailBody !== undefined) {
      data.email_body = emailBody === null ? null : JSON.stringify(emailBody);
    }
    if (remindersConfig !== undefined) {
      if (remindersConfig === null) {
        data.reminders_config = null;
        data.reminders_active = false;
      } else {
        data.reminders_config = remindersConfig;
        data.reminders_active = true;
      }
    }
    if (description !== undefined) {
      data.template_description = description?.trim() || null;
    }
    return await ctx.petitions.updatePetition(args.petitionId, data, ctx.user!);
  },
});

export const createPetitionField = mutationField("createPetitionField", {
  description: "Creates a petition field",
  type: "PetitionBaseAndField",
  authorize: chain(authenticate(), userHasAccessToPetitions("petitionId")),
  args: {
    petitionId: globalIdArg("Petition", { required: true }),
    type: arg({ type: "PetitionFieldType", required: true }),
    position: intArg({ required: false }),
  },
  validateArgs: inRange((args) => args.position, "position", 0),
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.createPetitionFieldAtPosition(
      args.petitionId,
      {
        type: args.type,
        ...defaultFieldOptions(args.type),
      },
      args.position ?? -1,
      ctx.user!
    );
  },
});

export const clonePetitionField = mutationField("clonePetitionField", {
  description: "Clones a petition field",
  type: "PetitionBaseAndField",
  authorize: chain(
    authenticate(),
    and(
      userHasAccessToPetitions("petitionId"),
      fieldsBelongsToPetition("petitionId", "fieldId")
    )
  ),
  args: {
    petitionId: globalIdArg("Petition", { required: true }),
    fieldId: globalIdArg("PetitionField", { required: true }),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.clonePetitionField(
      args.petitionId,
      args.fieldId,
      ctx.user!
    );
  },
});

export const deletePetitionField = mutationField("deletePetitionField", {
  description: "Deletes a petition field.",
  type: "PetitionBase",
  authorize: chain(
    authenticate(),
    and(
      userHasAccessToPetitions("petitionId"),
      fieldsBelongsToPetition("petitionId", "fieldId"),
      fieldIsNotFixed("fieldId")
    )
  ),
  args: {
    petitionId: globalIdArg("Petition", { required: true }),
    fieldId: globalIdArg("PetitionField", { required: true }),
    force: booleanArg({ default: false, required: false }),
  },
  resolve: async (_, args, ctx) => {
    const replies = await ctx.petitions.loadRepliesForField(args.fieldId);
    if (!args.force && replies.length > 0) {
      throw new WhitelistedError(
        "The petition field has replies.",
        "FIELD_HAS_REPLIES_ERROR"
      );
    }

    return await ctx.petitions.deletePetitionField(
      args.petitionId,
      args.fieldId,
      ctx.user!
    );
  },
});

export const updatePetitionField = mutationField("updatePetitionField", {
  description: "Updates a petition field.",
  type: "PetitionBaseAndField",
  authorize: chain(
    authenticate(),
    and(
      userHasAccessToPetitions("petitionId"),
      fieldsBelongsToPetition("petitionId", "fieldId")
    )
  ),
  args: {
    petitionId: globalIdArg("Petition", { required: true }),
    fieldId: globalIdArg("PetitionField", { required: true }),
    data: inputObjectType({
      name: "UpdatePetitionFieldInput",
      definition(t) {
        t.string("title", { nullable: true });
        t.string("description", { nullable: true });
        t.field("options", { type: "JSONObject", nullable: true });
        t.boolean("optional", { nullable: true });
        t.boolean("multiple", { nullable: true });
      },
    }).asArg({ required: true }),
  },
  validateArgs: validateAnd(
    notEmptyObject((args) => args.data, "data"),
    maxLength((args) => args.data.title, "data.title", 255)
  ),
  resolve: async (_, args, ctx, info) => {
    const { title, description, optional, multiple, options } = args.data;
    const data: Partial<CreatePetitionField> = {};
    if (title !== undefined) {
      data.title = title?.trim() || null;
    }
    if (description !== undefined) {
      data.description = description?.trim() || null;
    }
    if (optional !== undefined && optional !== null) {
      data.optional = optional;
    }
    if (multiple !== undefined && multiple !== null) {
      data.multiple = multiple;
    }
    if (options !== undefined && options !== null) {
      try {
        await ctx.petitions.validateFieldData(args.fieldId, { options });
        data.options = options;
      } catch (e) {
        throw new ArgValidationError(info, "data.options", e.toString());
      }
    }
    return await ctx.petitions.updatePetitionField(
      args.petitionId,
      args.fieldId,
      data,
      ctx.user!
    );
  },
});

export const validatePetitionFields = mutationField("validatePetitionFields", {
  description:
    "Updates the validation of a field and sets the petition as closed if all fields are validated.",
  type: "PetitionAndPartialFields",
  authorize: chain(
    authenticate(),
    and(
      userHasAccessToPetitions("petitionId"),
      fieldsBelongsToPetition("petitionId", "fieldIds")
    )
  ),
  args: {
    petitionId: globalIdArg("Petition", { required: true }),
    fieldIds: globalIdArg("PetitionField", { required: true, list: [true] }),
    value: booleanArg({ required: true }),
    validateRepliesWith: arg({
      type: "PetitionFieldReplyStatus",
      required: false,
    }),
  },
  validateArgs: notEmptyArray((args) => args.fieldIds, "fieldIds"),
  resolve: async (_, args, ctx) => {
    const fields = await ctx.petitions.validatePetitionFields(
      args.petitionId,
      args.fieldIds,
      args.value,
      ctx.user!
    );
    if (args.value || args.validateRepliesWith) {
      const replies = await ctx.petitions.loadRepliesForField(args.fieldIds, {
        cache: false,
      });
      await ctx.petitions.updatePetitionFieldRepliesStatus(
        replies.flatMap((r) =>
          r.filter((r) => r.status === "PENDING").map((r) => r.id)
        ),
        args.validateRepliesWith || "APPROVED"
      );
    }

    const petition = (await ctx.petitions.loadPetition(args.petitionId, {
      cache: false,
    }))!;

    if (
      args.validateRepliesWith &&
      args.validateRepliesWith !== "PENDING" &&
      petition.status === "CLOSED"
    ) {
      await ctx.petitions.createEvent({
        type: "PETITION_CLOSED",
        petitionId: petition.id,
        data: {
          user_id: ctx.user!.id,
        },
      });
      ctx.analytics.trackEvent(
        "PETITION_CLOSED",
        {
          petition_id: petition.id,
          user_id: ctx.user!.id,
        },
        toGlobalId("User", ctx.user!.id)
      );
    }
    return { petition, fields };
  },
});

export const updatePetitionFieldRepliesStatus = mutationField(
  "updatePetitionFieldRepliesStatus",
  {
    description:
      "Updates the status of a petition field reply and sets the petition as closed if all fields are validated.",
    type: objectType({
      name: "PetitionWithFieldAndReplies",
      definition(t) {
        t.field("petition", { type: "Petition" });
        t.field("field", { type: "PetitionField" });
        t.field("replies", { type: "PetitionFieldReply", list: [true] });
      },
    }),
    authorize: chain(
      authenticate(),
      and(
        userHasAccessToPetitions("petitionId"),
        fieldsBelongsToPetition("petitionId", "petitionFieldId"),
        repliesBelongsToField("petitionFieldId", "petitionFieldReplyIds")
      )
    ),
    args: {
      petitionId: globalIdArg("Petition", { required: true }),
      petitionFieldId: globalIdArg("PetitionField", { required: true }),
      petitionFieldReplyIds: globalIdArg("PetitionFieldReply", {
        required: true,
        list: [true],
      }),
      status: arg({ type: "PetitionFieldReplyStatus", required: true }),
    },
    validateArgs: notEmptyArray(
      (args) => args.petitionFieldReplyIds,
      "petitionFieldReplyIds"
    ),
    resolve: async (_, args, ctx) => {
      const replies = await ctx.petitions.updatePetitionFieldRepliesStatus(
        args.petitionFieldReplyIds,
        args.status
      );
      if (args.status === "APPROVED") {
        const allReplies = await ctx.petitions.loadRepliesForField(
          args.petitionFieldId
        );
        if (
          allReplies.every((r) => ["APPROVED", "REJECTED"].includes(r.status))
        ) {
          const field = (
            await ctx.petitions.validatePetitionFields(
              args.petitionId,
              [args.petitionFieldId],
              true,
              ctx.user!
            )
          )[0];
          return {
            petition: (await ctx.petitions.loadPetition(args.petitionId, {
              cache: false,
            }))!,
            replies,
            field,
          };
        }
      }
      return {
        petition: (await ctx.petitions.loadPetition(args.petitionId))!,
        replies,
        field: (await ctx.petitions.loadField(args.petitionFieldId))!,
      };
    },
  }
);

export const fileUploadReplyDownloadLink = mutationField(
  "fileUploadReplyDownloadLink",
  {
    description: "Generates a download link for a file reply.",
    type: objectType({
      name: "FileUploadReplyDownloadLinkResult",
      definition(t) {
        t.field("result", { type: "Result" });
        t.string("url", { nullable: true });
      },
    }),
    authorize: chain(
      authenticate(),
      and(
        userHasAccessToPetitions("petitionId"),
        repliesBelongsToPetition("petitionId", "replyId")
      )
    ),
    args: {
      petitionId: globalIdArg("Petition", { required: true }),
      replyId: globalIdArg("PetitionFieldReply", { required: true }),
      preview: booleanArg({
        description:
          "If true will use content-disposition inline instead of attachment",
      }),
    },
    resolve: async (_, args, ctx) => {
      try {
        const reply = await ctx.petitions.loadFieldReply(args.replyId);
        if (reply!.type !== "FILE_UPLOAD") {
          throw new Error("Invalid field type");
        }
        const file = await ctx.files.loadFileUpload(
          reply!.content["file_upload_id"]
        );
        if (file && !file.upload_complete) {
          await ctx.aws.getFileMetadata(file!.path);
          await ctx.files.markFileUploadComplete(file.id);
        }
        return {
          result: RESULT.SUCCESS,
          url: await ctx.aws.getSignedDownloadEndpoint(
            file!.path,
            file!.filename,
            args.preview ? "inline" : "attachment"
          ),
        };
      } catch {
        return {
          result: RESULT.FAILURE,
        };
      }
    },
  }
);

export const sendPetition = mutationField("sendPetition", {
  description:
    "Sends the petition and creates the corresponding accesses and messages.",
  type: objectType({
    name: "SendPetitionResult",
    definition(t) {
      t.field("result", { type: "Result" });
      t.field("petition", { type: "Petition", nullable: true });
      t.field("accesses", {
        type: "PetitionAccess",
        list: [true],
        nullable: true,
      });
    },
  }),
  authorize: chain(authenticate(), and(userHasAccessToPetitions("petitionId"))),
  args: {
    petitionId: globalIdArg("Petition", { required: true }),
    contactIds: globalIdArg("Contact", { list: [true], required: true }),
    subject: stringArg({ required: true }),
    body: jsonArg({ required: true }),
    scheduledAt: dateTimeArg({}),
    remindersConfig: arg({ type: "RemindersConfigInput" }),
  },
  validateArgs: validateAnd(
    notEmptyArray((args) => args.contactIds, "contactIds"),
    maxLength((args) => args.subject, "subject", 255),
    notEmptyString((args) => args.subject, "subject"),
    validRichTextContent((args) => args.body, "body"),
    validRemindersConfig((args) => args.remindersConfig, "remindersConfig")
  ),
  resolve: async (_, args, ctx) => {
    try {
      // Create necessary contacts
      const [hasAccess, petition, fields] = await Promise.all([
        ctx.contacts.userHasAccessToContacts(ctx.user!, args.contactIds),
        ctx.petitions.loadPetition(args.petitionId),
        ctx.petitions.loadFieldsForPetition(args.petitionId),
      ]);
      if (!hasAccess) {
        throw new Error("No access to contacts");
      }
      if (!petition) {
        throw new Error("Petition not available");
      }
      if (fields.filter((f) => f.type !== "HEADING").length === 0) {
        throw new Error("Petition has no repliable fields");
      }
      const accesses = await ctx.petitions.createAccesses(
        args.petitionId,
        args.contactIds.map((id) => ({
          petition_id: args.petitionId,
          contact_id: id,
          reminders_left: 10,
          reminders_active: Boolean(args.remindersConfig),
          reminders_config: args.remindersConfig,
          next_reminder_at: args.remindersConfig
            ? calculateNextReminder(
                args.scheduledAt ?? new Date(),
                args.remindersConfig
              )
            : null,
        })),
        ctx.user!
      );
      const messages = await ctx.petitions.createMessages(
        args.petitionId,
        args.scheduledAt ?? null,
        accesses.map((access) => ({
          petition_access_id: access.id,
          status: args.scheduledAt ? "SCHEDULED" : "PROCESSING",
          email_subject: args.subject,
          email_body: JSON.stringify(args.body),
        })),
        ctx.user!
      );

      const updatedPetition = await ctx.petitions.updatePetition(
        args.petitionId,
        { name: petition.name ?? args.subject, status: "PENDING" },
        ctx.user!
      );

      if (!args.scheduledAt) {
        await ctx.emails.sendPetitionMessageEmail(messages.map((s) => s.id));
      }

      ctx.analytics.trackEvent(
        "PETITION_SENT",
        {
          petition_id: args.petitionId,
          user_id: ctx.user!.id,
          access_ids: accesses.map((a) => a.id),
        },
        toGlobalId("User", ctx.user!.id)
      );

      return {
        petition: updatedPetition,
        accesses,
        result: RESULT.SUCCESS,
      };
    } catch (error) {
      ctx.logger.error(error);
      return {
        result: RESULT.FAILURE,
      };
    }
  },
});

export const sendMessages = mutationField("sendMessages", {
  description: "Sends a petition message to the speicified contacts.",
  type: "Result",
  authorize: chain(
    authenticate(),
    and(
      userHasAccessToPetitions("petitionId"),
      accessesBelongToPetition("petitionId", "accessIds")
    )
  ),
  args: {
    petitionId: globalIdArg("Petition", { required: true }),
    accessIds: globalIdArg("PetitionAccess", { list: [true], required: true }),
    subject: stringArg({ required: true }),
    body: jsonArg({ required: true }),
    scheduledAt: dateTimeArg({}),
  },
  validateArgs: validateAnd(
    notEmptyArray((args) => args.accessIds, "accessIds"),
    maxLength((args) => args.subject, "subject", 255),
    notEmptyString((args) => args.subject, "subject"),
    validRichTextContent((args) => args.body, "body")
  ),
  resolve: async (_, args, ctx) => {
    try {
      // Create necessary contacts
      const messages = await ctx.petitions.createMessages(
        args.petitionId,
        args.scheduledAt ?? null,
        args.accessIds.map((accessId) => ({
          petition_access_id: accessId,
          status: args.scheduledAt ? "SCHEDULED" : "PROCESSING",
          email_subject: args.subject,
          email_body: JSON.stringify(args.body),
        })),
        ctx.user!
      );

      if (!args.scheduledAt) {
        await ctx.emails.sendPetitionMessageEmail(messages.map((s) => s.id));
      }
      return RESULT.SUCCESS;
    } catch (error) {
      ctx.logger.error(error);
      return RESULT.FAILURE;
    }
  },
});

export const sendReminders = mutationField("sendReminders", {
  description: "Sends a reminder for the specified petition accesses.",
  type: "Result",
  authorize: chain(
    authenticate(),
    and(
      userHasAccessToPetitions("petitionId"),
      accessesBelongToPetition("petitionId", "accessIds")
    )
  ),
  args: {
    petitionId: globalIdArg("Petition", { required: true }),
    accessIds: globalIdArg("PetitionAccess", { list: [true], required: true }),
  },
  resolve: async (_, args, ctx, info) => {
    const [petition, accesses] = await Promise.all([
      ctx.petitions.loadPetition(args.petitionId),
      ctx.petitions.loadAccess(args.accessIds),
    ]);

    validatePetitionStatus(petition, "PENDING", info);
    validateAccessesStatus(accesses, "ACTIVE", info);
    validateAccessesRemindersLeft(accesses, info);

    try {
      const reminders = await ctx.petitions.createReminders(
        args.petitionId,
        args.accessIds.map((accessId) => ({
          type: "MANUAL",
          status: "PROCESSING",
          petition_access_id: accessId,
          sender_id: ctx.user!.id,
          created_by: `User:${ctx.user!.id}`,
        }))
      );
      await ctx.emails.sendPetitionReminderEmail(reminders.map((r) => r.id));

      accesses.forEach((access) => {
        if (access) {
          ctx.analytics.trackEvent(
            "REMINDER_EMAIL_SENT",
            {
              petition_id: args.petitionId,
              user_id: ctx.user!.id,
              access_id: access.id,
              sent_count: 10 - access.reminders_left + 1,
              type: "MANUAL",
            },
            toGlobalId("User", ctx.user!.id)
          );
        }
      });
      return RESULT.SUCCESS;
    } catch (error) {
      return RESULT.FAILURE;
    }
  },
});

export const switchAutomaticReminders = mutationField(
  "switchAutomaticReminders",
  {
    description:
      "Switches automatic reminders for the specified petition accesses.",
    type: "PetitionAccess",
    list: [true],
    authorize: chain(
      authenticate(),
      and(
        userHasAccessToPetitions("petitionId"),
        accessesBelongToPetition("petitionId", "accessIds")
      )
    ),
    args: {
      start: booleanArg({ required: true }),
      petitionId: globalIdArg("Petition", { required: true }),
      accessIds: globalIdArg("PetitionAccess", {
        list: [true],
        required: true,
      }),
      remindersConfig: arg({ type: "RemindersConfigInput", required: false }),
    },
    validateArgs: validateOr(
      validBooleanValue((args) => args.start, "start", false),
      validateAnd(
        validIsDefined((args) => args.remindersConfig, "remindersConfig"),
        validRemindersConfig((args) => args.remindersConfig, "remindersConfig")
      )
    ),
    resolve: async (_, args, ctx, info) => {
      const [petition, accesses] = await Promise.all([
        ctx.petitions.loadPetition(args.petitionId),
        ctx.petitions.loadAccess(args.accessIds),
      ]);

      validatePetitionStatus(petition, "PENDING", info);
      validateAccessesStatus(accesses, "ACTIVE", info);

      if (args.start) {
        validateAccessesRemindersLeft(accesses, info);
        const validAccessIds: number[] = accesses
          .filter((a) => a !== null)
          .map((a) => a!.id);

        return await ctx.petitions.startAccessReminders(
          validAccessIds,
          args.remindersConfig!
        );
      } else {
        return await ctx.petitions.stopAccessReminders(args.accessIds);
      }
    },
  }
);

export const deactivateAccesses = mutationField("deactivateAccesses", {
  description: "Deactivates the specified active petition accesses.",
  type: "PetitionAccess",
  list: [true],
  authorize: chain(
    authenticate(),
    and(
      userHasAccessToPetitions("petitionId"),
      accessesBelongToPetition("petitionId", "accessIds")
    )
  ),
  args: {
    petitionId: globalIdArg("Petition", { required: true }),
    accessIds: globalIdArg("PetitionAccess", { list: [true], required: true }),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.deactivateAccesses(
      args.petitionId,
      args.accessIds,
      ctx.user!
    );
  },
});

export const reactivateAccesses = mutationField("reactivateAccesses", {
  description: "Reactivates the specified inactive petition accesses.",
  type: "PetitionAccess",
  list: [true],
  authorize: chain(
    authenticate(),
    and(
      userHasAccessToPetitions("petitionId"),
      accessesBelongToPetition("petitionId", "accessIds"),
      accessesBelongToValidContacts("accessIds")
    )
  ),
  args: {
    petitionId: globalIdArg("Petition", { required: true }),
    accessIds: globalIdArg("PetitionAccess", { list: [true], required: true }),
  },
  resolve: async (_, args, ctx, info) => {
    return await ctx.petitions.reactivateAccesses(
      args.petitionId,
      args.accessIds,
      ctx.user!
    );
  },
});

export const cancelScheduledMessage = mutationField("cancelScheduledMessage", {
  description: "Cancels a scheduled petition message.",
  type: "PetitionMessage",
  nullable: true,
  authorize: chain(
    authenticate(),
    and(
      userHasAccessToPetitions("petitionId"),
      messageBelongToPetition("petitionId", "messageId")
    )
  ),
  args: {
    petitionId: globalIdArg("Petition", { required: true }),
    messageId: globalIdArg("PetitionMessage", { required: true }),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.cancelScheduledMessage(
      args.petitionId,
      args.messageId,
      ctx.user!
    );
  },
});

export const changePetitionFieldType = mutationField(
  "changePetitionFieldType",
  {
    description: "Changes the type of a petition Field",
    type: "PetitionBaseAndField",
    authorize: chain(
      authenticate(),
      and(
        userHasAccessToPetitions("petitionId"),
        fieldsBelongsToPetition("petitionId", "fieldId")
      )
    ),
    args: {
      petitionId: globalIdArg("Petition", { required: true }),
      fieldId: globalIdArg("PetitionField", { required: true }),
      type: arg({
        type: "PetitionFieldType",
        required: true,
      }),
      force: booleanArg({ default: false, required: false }),
    },
    resolve: async (_, args, ctx) => {
      const replies = await ctx.petitions.loadRepliesForField(args.fieldId, {
        cache: false,
      });
      if (!args.force && replies.length > 0) {
        throw new WhitelistedError(
          "The petition field has replies.",
          "FIELD_HAS_REPLIES_ERROR"
        );
      }
      try {
        return await ctx.petitions.changePetitionFieldType(
          args.petitionId,
          args.fieldId,
          args.type,
          ctx.user!
        );
      } catch (e) {
        if (e.message === "UPDATE_FIXED_FIELD_ERROR") {
          throw new WhitelistedError(
            "Can't change type of a fixed field",
            "UPDATE_FIXED_FIELD_ERROR"
          );
        } else {
          throw e;
        }
      }
    },
  }
);

export const presendPetitionClosedNotification = mutationField(
  "presendPetitionClosedNotification",
  {
    description:
      "Checks if a PetitionClosedNotification was already sent or not",
    type: "Result",
    args: {
      petitionId: globalIdArg("Petition", { required: true }),
    },
    authorize: chain(authenticate(), userHasAccessToPetitions("petitionId")),
    resolve: async (_, args, ctx) => {
      const shouldSendNotification = await ctx.petitions.shouldNotifyPetitionClosed(
        args.petitionId
      );
      if (shouldSendNotification) {
        return RESULT.SUCCESS;
      } else {
        throw new WhitelistedError(
          "You already notified the contacts",
          "ALREADY_NOTIFIED_PETITION_CLOSED_ERROR"
        );
      }
    },
  }
);

export const sendPetitionClosedNotification = mutationField(
  "sendPetitionClosedNotification",
  {
    description:
      "Sends an email to all contacts of the petition confirming the replies are ok",
    type: "Petition",
    args: {
      petitionId: globalIdArg("Petition", { required: true }),
      emailBody: jsonArg({ required: true }),
      force: booleanArg({ default: false, required: false }),
    },
    authorize: chain(authenticate(), userHasAccessToPetitions("petitionId")),
    validateArgs: validRichTextContent((args) => args.emailBody, "emailBody"),
    resolve: async (_, args, ctx) => {
      const shouldSendNotification = await ctx.petitions.shouldNotifyPetitionClosed(
        args.petitionId
      );
      if (!shouldSendNotification && !args.force) {
        throw new WhitelistedError(
          "You already notified the contacts",
          "ALREADY_NOTIFIED_PETITION_CLOSED_ERROR"
        );
      }

      const accesses = await ctx.petitions.loadAccessesForPetition(
        args.petitionId
      );

      const activeAccesses = accesses.filter((a) => a.status === "ACTIVE");

      await ctx.emails.sendPetitionClosedEmail(
        args.petitionId,
        ctx.user!.id,
        activeAccesses.map((a) => a.id),
        args.emailBody
      );

      await Promise.all(
        activeAccesses.map((access) =>
          ctx.petitions.createEvent({
            type: "PETITION_CLOSED_NOTIFIED",
            petitionId: args.petitionId,
            data: {
              user_id: ctx.user!.id,
              petition_access_id: access.id,
            },
          })
        )
      );
      return (await ctx.petitions.loadPetition(args.petitionId))!;
    },
  }
);

export const reopenPetition = mutationField("reopenPetition", {
  description: "Reopens the petition",
  type: "Petition",
  authorize: chain(authenticate(), userHasAccessToPetitions("petitionId")),
  args: {
    petitionId: globalIdArg("Petition", { required: true }),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.withTransaction(async (t) => {
      await ctx.petitions.createEvent(
        {
          type: "PETITION_REOPENED",
          data: { user_id: ctx.user!.id },
          petitionId: args.petitionId,
        },
        t
      );
      return await ctx.petitions.updatePetition(
        args.petitionId,
        { status: "PENDING" },
        ctx.user!,
        t
      );
    });
  },
});
