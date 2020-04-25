import {
  arg,
  booleanArg,
  idArg,
  inputObjectType,
  mutationField,
  objectType,
  stringArg,
} from "@nexus/schema";
import { pick } from "remeda";
import { CreatePetition, CreatePetitionField } from "../../../db/__types";
import { fromGlobalId, fromGlobalIds } from "../../../util/globalId";
import { random } from "../../../util/token";
import {
  authenticate,
  authorizeAnd,
  authorizeAndP,
} from "../../helpers/authorize";
import { dateTimeArg } from "../../helpers/date";
import { RESULT } from "../../helpers/result";
import {
  fieldBelongsToPetition,
  fieldsBelongsToPetition,
  replyBelongsToPetition,
  sendoutsBelongToPetition,
  userHasAccessToPetition,
  userHasAccessToPetitions,
} from "./authorizers";
import { findTimeZone } from "timezone-support";
import { calculateNextReminder } from "../../../util/calculateNextReminder";

export const createPetition = mutationField("createPetition", {
  description: "Create petition.",
  type: "Petition",
  authorize: authenticate(),
  args: {
    name: stringArg({ required: true }),
    locale: arg({ type: "PetitionLocale", required: true }),
  },
  resolve: async (_, { name, locale }, ctx) => {
    return await ctx.petitions.createPetition(
      { name, locale, email_subject: name },
      ctx.user!
    );
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
    name: stringArg({ required: false }),
  },
  resolve: async (_, args, ctx) => {
    const { id: petitionId } = fromGlobalId(args.petitionId, "Petition");
    const petition = await ctx.petitions.clonePetition(petitionId, ctx.user!);
    if (args.name !== undefined && args.name !== petition.name) {
      return await ctx.petitions.updatePetition(
        petition.id,
        { name: args.name ?? null },
        ctx.user!
      );
    } else {
      return petition;
    }
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

export const ReminderSettingsInput = inputObjectType({
  name: "ReminderSettingsInput",
  description: "The reminder settings of a petition",
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
        t.field("reminderSettings", {
          type: "ReminderSettingsInput",
          nullable: true,
        });
      },
    }).asArg({ required: true }),
  },
  resolve: async (_, args, ctx) => {
    const { id: petitionId } = fromGlobalId(args.petitionId, "Petition");
    const {
      name,
      locale,
      deadline,
      emailSubject,
      emailBody,
      reminderSettings,
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
    if (reminderSettings !== undefined) {
      if (reminderSettings === null) {
        data.reminders_active = false;
        data.reminders_offset = null;
        data.reminders_time = null;
        data.reminders_timezone = null;
        data.reminders_weekdays_only = null;
      } else {
        if (!/(2[0-3]|[01][0-9]):([0-5][0-9])/.test(reminderSettings.time)) {
          throw new Error(
            `Invalid reminderSettings.time ${JSON.stringify(
              reminderSettings.time
            )}`
          );
        }
        try {
          findTimeZone(reminderSettings.timezone);
        } catch {
          throw new Error(
            `Invalid reminderSettings.timezone ${JSON.stringify(
              reminderSettings.timezone
            )}`
          );
        }
        data.reminders_active = true;
        data.reminders_offset = reminderSettings.offset;
        data.reminders_time = reminderSettings.time;
        data.reminders_timezone = reminderSettings.timezone;
        data.reminders_weekdays_only = reminderSettings.weekdaysOnly;
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
            file!.filename
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
  description: "Sends the petition and creates the corresponding sendouts.",
  type: objectType({
    name: "SendPetitionResult",
    definition(t) {
      t.field("result", { type: "Result" });
      t.field("petition", { type: "Petition", nullable: true });
      t.field("sendouts", {
        type: "PetitionSendout",
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
    recipients: idArg({
      list: [true],
      required: true,
    }),
    scheduledAt: dateTimeArg({}),
  },
  resolve: async (_, args, ctx) => {
    try {
      // Create necessary contacts
      if (args.recipients.length === 0) {
        throw new Error("Empty recipients");
      }
      const { ids: recipientIds } = fromGlobalIds(args.recipients, "Contact");
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
      const [sendouts] = await Promise.all([
        ctx.petitions.createSendouts(
          recipientIds.map((id) => ({
            petition_id: petitionId,
            keycode: random(16),
            status: args.scheduledAt ? "SCHEDULED" : "PROCESSING",
            scheduled_at: args.scheduledAt ?? null,
            contact_id: id,
            sender_id: ctx.user!.id,
            next_reminder_at: petition.reminders_active
              ? calculateNextReminder(
                  args.scheduledAt ?? new Date(),
                  petition.reminders_offset!,
                  petition.reminders_time!,
                  petition.reminders_timezone!,
                  petition.reminders_weekdays_only!
                )
              : null,
            ...pick(petition, [
              "email_body",
              "email_subject",
              "locale",
              "deadline",
              "reminders_active",
              "reminders_offset",
              "reminders_time",
              "reminders_timezone",
              "reminders_weekdays_only",
            ]),
          })),
          ctx.user!
        ),
        petition.status === "DRAFT"
          ? ctx.petitions.updatePetition(
              petitionId,
              { status: "PENDING" },
              ctx.user!
            )
          : null,
      ]);
      if (!args.scheduledAt) {
        await ctx.aws.enqueueSendouts(sendouts.map((s) => s.id));
      }
      return {
        petition: await ctx.petitions.loadPetition(petitionId, {
          refresh: true,
        }),
        sendouts,
        result: RESULT.SUCCESS,
      };
    } catch (error) {
      return {
        result: RESULT.FAILURE,
      };
    }
  },
});

export const sendReminder = mutationField("sendReminders", {
  description: "Sends a reminder for the corresponding sendouts.",
  type: objectType({
    name: "SendReminderResult",
    definition(t) {
      t.field("result", { type: "Result" });
      t.field("sendouts", {
        type: "PetitionSendout",
        list: [false],
        nullable: true,
      });
    },
  }),
  authorize: authorizeAnd(
    authenticate(),
    authorizeAndP(
      userHasAccessToPetition("petitionId"),
      sendoutsBelongToPetition("petitionId", "sendoutIds")
    )
  ),
  args: {
    petitionId: idArg({ required: true }),
    sendoutIds: idArg({ list: [true], required: true }),
  },
  resolve: async (_, args, ctx) => {
    const { ids: sendoutIds } = fromGlobalIds(
      args.sendoutIds,
      "PetitionSendout"
    );
    try {
      const sendouts = await ctx.petitions.loadSendout(sendoutIds);
      for (const sendout of sendouts) {
        if (!sendout || sendout.status !== "ACTIVE") {
          throw new Error("Invalid sendout");
        }
      }
      const reminders = await ctx.reminders.createReminders(
        sendoutIds.map((id) => ({
          type: "MANUAL",
          status: "PROCESSING",
          petition_sendout_id: id,
          created_by: `User:${ctx.user!.id}`,
        }))
      );
      await ctx.aws.enqueueReminders(reminders.map((r) => r.id));
      return {
        sendouts,
        result: RESULT.SUCCESS,
      };
    } catch (error) {
      return {
        sendouts: await ctx.petitions.loadSendout(sendoutIds, {
          refresh: true,
        }),
        result: RESULT.FAILURE,
      };
    }
  },
});
