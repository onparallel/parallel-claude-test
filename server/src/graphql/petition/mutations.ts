import {
  arg,
  booleanArg,
  idArg,
  inputObjectType,
  mutationField,
  objectType,
  stringArg,
} from "@nexus/schema";
import { CreatePetition, CreatePetitionField } from "../../db/__types";
import { calculateNextReminder } from "../../util/calculateNextReminder";
import { fromGlobalId, fromGlobalIds, toGlobalId } from "../../util/globalId";
import {
  authenticate,
  authorizeAnd,
  authorizeAndP,
} from "../helpers/authorize";
import { dateTimeArg } from "../helpers/date";
import { ArgValidationError } from "../helpers/errors";
import { jsonArg } from "../helpers/json";
import { RESULT } from "../helpers/result";
import { validateAnd } from "../helpers/validateArgs";
import { maxLength } from "../helpers/validators/maxLength";
import { notEmptyString } from "../helpers/validators/notEmptyString";
import { validRemindersConfig } from "../helpers/validators/validRemindersConfig";
import { validRichTextContent } from "../helpers/validators/validRichTextContent";
import {
  accessesBelongToPetition,
  fieldBelongsToPetition,
  fieldsBelongsToPetition,
  messageBelongToPetition,
  replyBelongsToPetition,
  userHasAccessToPetition,
  userHasAccessToPetitions,
} from "./authorizers";
import { notEmptyArray } from "../helpers/validators/notEmptyArray";

export const createPetition = mutationField("createPetition", {
  description: "Create petition.",
  type: "Petition",
  authorize: authenticate(),
  args: {
    name: stringArg({ required: true }),
    locale: arg({ type: "PetitionLocale", required: true }),
    deadline: dateTimeArg({}),
  },
  resolve: async (_, { name, locale, deadline }, ctx) => {
    const petition = await ctx.petitions.createPetition(
      { name, locale, deadline: deadline ?? null, email_subject: name },
      ctx.user!
    );
    return petition;
  },
});

export const clonePetition = mutationField("clonePetition", {
  description: "Clone petition.",
  type: "Petition",
  authorize: authorizeAnd(
    authenticate(),
    userHasAccessToPetition("petitionId")
  ),
  args: {
    petitionId: idArg({ required: true }),
    name: stringArg({}),
    locale: arg({ type: "PetitionLocale", required: true }),
    deadline: dateTimeArg({}),
  },
  resolve: async (_, args, ctx) => {
    const { id: petitionId } = fromGlobalId(args.petitionId, "Petition");
    const petition = await ctx.petitions.clonePetition(petitionId, ctx.user!);
    return await ctx.petitions.updatePetition(
      petition.id,
      {
        name: args.name ?? null,
        locale: args.locale,
        email_subject:
          petition.name === petition.email_subject
            ? args.name
            : petition.email_subject,
        deadline: args.deadline ?? null,
      },
      ctx.user!
    );
  },
});

export const deletePetitions = mutationField("deletePetitions", {
  description: "Delete petitions.",
  type: "Result",
  authorize: authorizeAnd(authenticate(), userHasAccessToPetitions("ids")),
  args: {
    ids: idArg({ required: true, list: [true] }),
  },
  resolve: async (_, args, ctx) => {
    const { ids } = fromGlobalIds(args.ids, "Petition");
    await ctx.petitions.deletePetitionById(ids, ctx.user!);
    return RESULT.SUCCESS;
  },
});

export const updateFieldPositions = mutationField("updateFieldPositions", {
  description: "Updates the positions of the petition fields",
  type: "Petition",
  authorize: authorizeAnd(
    authenticate(),
    userHasAccessToPetition("petitionId")
  ),
  args: {
    petitionId: idArg({ required: true }),
    fieldIds: idArg({
      required: true,
      list: [true],
    }),
  },
  resolve: async (_, args, ctx) => {
    const { id: petitionId } = fromGlobalId(args.petitionId, "Petition");
    const { ids: fieldIds } = fromGlobalIds(args.fieldIds, "PetitionField");
    return await ctx.petitions.updateFieldPositions(
      petitionId,
      fieldIds,
      ctx.user!
    );
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
  type: "Petition",
  authorize: authorizeAnd(
    authenticate(),
    userHasAccessToPetition("petitionId")
  ),
  args: {
    petitionId: idArg({ required: true }),
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
      },
    }).asArg({ required: true }),
  },
  validateArgs: validateAnd(
    maxLength((args) => args.data.name, "data.name", 255),
    maxLength((args) => args.data.emailSubject, "data.emailSubject", 255),
    validRichTextContent((args) => args.data.emailBody, "data.emailBody"),
    validRemindersConfig(
      (args) => args.data.remindersConfig,
      "data.remindersConfig"
    )
  ),
  resolve: async (_, args, ctx) => {
    const { id: petitionId } = fromGlobalId(args.petitionId, "Petition");
    const {
      name,
      locale,
      deadline,
      emailSubject,
      emailBody,
      remindersConfig,
    } = args.data;
    const data: Partial<CreatePetition> = {};
    if (name !== undefined) {
      data.name = name;
    }
    if (locale !== undefined && locale !== null) {
      data.locale = locale;
    }
    if (deadline !== undefined) {
      data.deadline = deadline;
    }
    if (emailSubject !== undefined) {
      data.email_subject = emailSubject;
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
    return await ctx.petitions.updatePetition(petitionId, data, ctx.user!);
  },
});

export const createPetitionField = mutationField("createPetitionField", {
  description: "Creates a petition field",
  type: "PetitionAndField",
  authorize: authorizeAnd(
    authenticate(),
    userHasAccessToPetition("petitionId")
  ),
  args: {
    petitionId: idArg({ required: true }),
    type: arg({ type: "PetitionFieldType", required: true }),
  },
  resolve: async (_, args, ctx) => {
    const { id: petitionId } = fromGlobalId(args.petitionId, "Petition");
    return await ctx.petitions.createPetitionField(
      petitionId,
      args.type,
      ctx.user!
    );
  },
});

export const deletePetitionField = mutationField("deletePetitionField", {
  description: "Delete petitions fields.",
  type: "Petition",
  authorize: authorizeAnd(
    authenticate(),
    authorizeAndP(
      userHasAccessToPetition("petitionId"),
      fieldBelongsToPetition("petitionId", "fieldId")
    )
  ),
  args: {
    petitionId: idArg({ required: true }),
    fieldId: idArg({ required: true }),
  },
  resolve: async (_, args, ctx) => {
    const { id: petitionId } = fromGlobalId(args.petitionId, "Petition");
    const { id: fieldId } = fromGlobalId(args.fieldId, "PetitionField");
    return await ctx.petitions.deletePetitionField(
      petitionId,
      fieldId,
      ctx.user!
    );
  },
});

export const updatePetitionField = mutationField("updatePetitionField", {
  description: "Updates a petition field.",
  type: objectType({
    name: "PetitionAndField",
    definition(t) {
      t.field("petition", { type: "Petition" });
      t.field("field", { type: "PetitionField" });
    },
  }),
  authorize: authorizeAnd(
    authenticate(),
    authorizeAndP(
      userHasAccessToPetition("petitionId"),
      fieldBelongsToPetition("petitionId", "fieldId")
    )
  ),
  args: {
    petitionId: idArg({ required: true }),
    fieldId: idArg({ required: true }),
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
  validateArgs: maxLength((args) => args.data.title, "data.title", 255),
  resolve: async (_, args, ctx) => {
    const { id: petitionId } = fromGlobalId(args.petitionId, "Petition");
    const { id: fieldId } = fromGlobalId(args.fieldId, "PetitionField");
    const { title, description, optional, multiple, options } = args.data;
    const data: Partial<CreatePetitionField> = {};
    if (title !== undefined) {
      data.title = title;
    }
    if (description !== undefined) {
      data.description = description;
    }
    if (optional !== undefined && optional !== null) {
      data.optional = optional;
    }
    if (multiple !== undefined && multiple !== null) {
      data.multiple = multiple;
    }
    if (options !== undefined && options !== null) {
      await ctx.petitions.validateFieldData(fieldId, { options });
      data.options = options;
    }
    return await ctx.petitions.updatePetitionField(
      petitionId,
      fieldId,
      data,
      ctx.user!
    );
  },
});

export const validatePetitionFields = mutationField("validatePetitionFields", {
  description: "Updates the validation of a petition field.",
  type: objectType({
    name: "PetitionAndFields",
    definition(t) {
      t.field("petition", { type: "Petition" });
      t.field("fields", { type: "PetitionField", list: [true] });
    },
  }),
  authorize: authorizeAnd(
    authenticate(),
    authorizeAndP(
      userHasAccessToPetition("petitionId"),
      fieldsBelongsToPetition("petitionId", "fieldIds")
    )
  ),
  args: {
    petitionId: idArg({ required: true }),
    fieldIds: idArg({ required: true, list: [true] }),
    value: booleanArg({ required: true }),
  },
  resolve: async (_, args, ctx) => {
    const { id: petitionId } = fromGlobalId(args.petitionId, "Petition");
    const { ids: fieldIds } = fromGlobalIds(args.fieldIds, "PetitionField");
    const { value } = args;
    return await ctx.petitions.validatePetitionFields(
      petitionId,
      fieldIds,
      value,
      ctx.user!
    );
  },
});

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
    authorize: authorizeAnd(
      authenticate(),
      authorizeAndP(
        userHasAccessToPetition("petitionId"),
        replyBelongsToPetition("petitionId", "replyId")
      )
    ),
    args: {
      petitionId: idArg({ required: true }),
      replyId: idArg({ required: true }),
      preview: booleanArg({
        description:
          "If true will use content-disposition inline instead of attachment",
      }),
    },
    resolve: async (_, args, ctx) => {
      try {
        const { id: replyId } = fromGlobalId(
          args.replyId,
          "PetitionFieldReply"
        );
        const reply = await ctx.petitions.loadFieldReply(replyId);
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
  authorize: authorizeAnd(
    authenticate(),
    authorizeAndP(userHasAccessToPetition("petitionId"))
  ),
  args: {
    petitionId: idArg({ required: true }),
    contactIds: idArg({ list: [true], required: true }),
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
      const { ids: recipientIds } = fromGlobalIds(args.contactIds, "Contact");
      const { id: petitionId } = fromGlobalId(args.petitionId, "Petition");
      const [hasAccess, petition] = await Promise.all([
        ctx.contacts.userHasAccessToContacts(ctx.user!.id, recipientIds),
        ctx.petitions.loadPetition(petitionId),
      ]);
      if (!hasAccess) {
        throw new Error("No access to contacts");
      }
      if (!petition) {
        throw new Error("Petition not available");
      }
      const accesses = await ctx.petitions.createAccesses(
        petitionId,
        recipientIds.map((id) => ({
          petition_id: petitionId,
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
        petitionId,
        args.scheduledAt ?? null,
        accesses.map((access) => ({
          petition_access_id: access.id,
          status: args.scheduledAt ? "SCHEDULED" : "PROCESSING",
          email_subject: args.subject,
          email_body: JSON.stringify(args.body),
        })),
        ctx.user!
      );

      if (petition.status === "DRAFT") {
        await ctx.petitions.updatePetition(
          petitionId,
          { status: "PENDING" },
          ctx.user!
        );
      }

      if (!args.scheduledAt) {
        await ctx.aws.enqueuePetitionMessages(messages.map((s) => s.id));
      }
      return {
        petition: await ctx.petitions.loadPetition(petitionId, {
          refresh: true,
        }),
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
  authorize: authorizeAnd(
    authenticate(),
    authorizeAndP(
      userHasAccessToPetition("petitionId"),
      accessesBelongToPetition("petitionId", "accessIds")
    )
  ),
  args: {
    petitionId: idArg({ required: true }),
    accessIds: idArg({ list: [true], required: true }),
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
      const { ids: accessIds } = fromGlobalIds(
        args.accessIds,
        "PetitionAccess"
      );
      const { id: petitionId } = fromGlobalId(args.petitionId, "Petition");
      const messages = await ctx.petitions.createMessages(
        petitionId,
        args.scheduledAt ?? null,
        accessIds.map((accessId) => ({
          petition_access_id: accessId,
          status: args.scheduledAt ? "SCHEDULED" : "PROCESSING",
          email_subject: args.subject,
          email_body: JSON.stringify(args.body),
        })),
        ctx.user!
      );

      if (!args.scheduledAt) {
        await ctx.aws.enqueuePetitionMessages(messages.map((s) => s.id));
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
  authorize: authorizeAnd(
    authenticate(),
    authorizeAndP(
      userHasAccessToPetition("petitionId"),
      accessesBelongToPetition("petitionId", "accessIds")
    )
  ),
  args: {
    petitionId: idArg({ required: true }),
    accessIds: idArg({ list: [true], required: true }),
  },
  resolve: async (_, args, ctx, info) => {
    const { id: petitionId } = fromGlobalId(args.petitionId, "Petition");
    const { ids: accessIds } = fromGlobalIds(args.accessIds, "PetitionAccess");

    const [petition, accesses] = await Promise.all([
      ctx.petitions.loadPetition(petitionId),
      ctx.petitions.loadAccess(accessIds),
    ]);
    if (!petition || petition.status !== "PENDING") {
      throw new ArgValidationError(
        info,
        "petitionId",
        `Petition must have status "PENDING".`
      );
    }
    for (const access of accesses) {
      if (!access || access.status !== "ACTIVE") {
        throw new ArgValidationError(
          info,
          "accessIds",
          `Petition accesses must have status "ACTIVE".`
        );
      }
      if (access.reminders_left === 0) {
        throw new ArgValidationError(
          info,
          `accessIds[${accesses.indexOf(access)}]`,
          `No reminders left.`,
          {
            errorCode: "NO_REMINDERS_LEFT",
            petitionAccessId: toGlobalId("PetitionAccess", access.id),
          }
        );
      }
    }
    try {
      const reminders = await ctx.petitions.createReminders(
        petitionId,
        accessIds.map((accessId) => ({
          type: "MANUAL",
          status: "PROCESSING",
          petition_access_id: accessId,
          sender_id: ctx.user!.id,
          created_by: `User:${ctx.user!.id}`,
        }))
      );
      await ctx.aws.enqueueReminders(reminders.map((r) => r.id));
      return RESULT.SUCCESS;
    } catch (error) {
      return RESULT.FAILURE;
    }
  },
});

export const deactivateAccesses = mutationField("deactivateAccesses", {
  description: "Deactivates the specified active petition accesses.",
  type: "PetitionAccess",
  list: [true],
  authorize: authorizeAnd(
    authenticate(),
    authorizeAndP(
      userHasAccessToPetition("petitionId"),
      accessesBelongToPetition("petitionId", "accessIds")
    )
  ),
  args: {
    petitionId: idArg({ required: true }),
    accessIds: idArg({ list: [true], required: true }),
  },
  resolve: async (_, args, ctx, info) => {
    const { id: petitionId } = fromGlobalId(args.petitionId, "Petition");
    const { ids: accessIds } = fromGlobalIds(args.accessIds, "PetitionAccess");
    return await ctx.petitions.deactivateAccesses(
      petitionId,
      accessIds,
      ctx.user!
    );
  },
});

export const reactivateAccesses = mutationField("reactivateAccesses", {
  description: "Reactivates the specified inactive petition accesses.",
  type: "PetitionAccess",
  list: [true],
  authorize: authorizeAnd(
    authenticate(),
    authorizeAndP(
      userHasAccessToPetition("petitionId"),
      accessesBelongToPetition("petitionId", "accessIds")
    )
  ),
  args: {
    petitionId: idArg({ required: true }),
    accessIds: idArg({ list: [true], required: true }),
  },
  resolve: async (_, args, ctx, info) => {
    const { id: petitionId } = fromGlobalId(args.petitionId, "Petition");
    const { ids: accessIds } = fromGlobalIds(args.accessIds, "PetitionAccess");
    return await ctx.petitions.reactivateAccesses(
      petitionId,
      accessIds,
      ctx.user!
    );
  },
});

export const cancelScheduledMessage = mutationField("cancelScheduledMessage", {
  description: "Cancels a scheduled petition message.",
  type: "PetitionMessage",
  nullable: true,
  authorize: authorizeAnd(
    authenticate(),
    authorizeAndP(
      userHasAccessToPetition("petitionId"),
      messageBelongToPetition("petitionId", "messageId")
    )
  ),
  args: {
    petitionId: idArg({ required: true }),
    messageId: idArg({ required: true }),
  },
  resolve: async (_, args, ctx) => {
    const { id: petitionId } = fromGlobalId(args.petitionId, "Petition");
    const { id: messageId } = fromGlobalId(args.messageId, "PetitionMessage");
    return await ctx.petitions.cancelScheduledMessage(
      petitionId,
      messageId,
      ctx.user!
    );
  },
});
