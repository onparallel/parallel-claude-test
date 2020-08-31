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
import { and, authenticate, chain } from "../../helpers/authorize";
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
import {
  accessesBelongToPetition,
  accessesBelongToValidContacts,
  fieldsBelongsToPetition,
  messageBelongToPetition,
  repliesBelongsToField,
  repliesBelongsToPetition,
  userHasAccessToPetitions,
  fieldIsNotFixed,
} from "../authorizers";
import {
  validateAccessesRemindersLeft,
  validateAccessesStatus,
  validatePetitionStatus,
} from "../validations";
import { WhitelistedError } from "./../../helpers/errors";
import { globalIdArg } from "../../helpers/globalIdPlugin";

export const createPetition = mutationField("createPetition", {
  description: "Create petition.",
  type: "PetitionBase",
  authorize: authenticate(),
  args: {
    name: stringArg(),
    locale: arg({ type: "PetitionLocale", required: true }),
    deadline: dateTimeArg({}),
    templateId: globalIdArg("Petition", { required: false }),
  },
  resolve: async (_, { name, locale, deadline, templateId }, ctx) => {
    if (templateId) {
      return await ctx.petitions.clonePetition(templateId, ctx.user!, {
        is_template: false,
        status: "DRAFT",
      });
    } else {
      return await ctx.petitions.createPetition(
        { name, locale, deadline: deadline ?? null, email_subject: name },
        ctx.user!
      );
    }
  },
});

export const clonePetition = mutationField("clonePetition", {
  description: "Clone petition.",
  type: "PetitionBase",
  authorize: chain(authenticate(), userHasAccessToPetitions("petitionId")),
  args: {
    petitionId: globalIdArg("Petition", { required: true }),
    name: stringArg({}),
    locale: arg({ type: "PetitionLocale", required: true }),
    deadline: dateTimeArg({}),
  },
  resolve: async (_, args, ctx) => {
    const petition = await ctx.petitions.clonePetition(
      args.petitionId,
      ctx.user!
    );
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
    return await ctx.petitions.updateFieldPositions(
      args.petitionId,
      args.fieldIds,
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
    if (description !== undefined) {
      data.template_description = description;
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
        "FIELD_HAS_REPLIES"
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
  validateArgs: maxLength((args) => args.data.title, "data.title", 255),
  resolve: async (_, args, ctx) => {
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
      await ctx.petitions.validateFieldData(args.fieldId, { options });
      data.options = options;
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
  description: "Updates the validation of a petition field.",
  type: "PetitionField",
  list: [true],
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
  },
  resolve: async (_, args, ctx) => {
    const fields = await ctx.petitions.validatePetitionFields(
      args.petitionId,
      args.fieldIds,
      args.value,
      ctx.user!
    );
    if (args.value) {
      const replies = await ctx.petitions.loadRepliesForField(args.fieldIds, {
        cache: false,
      });
      await ctx.petitions.updatePetitionFieldRepliesStatus(
        replies.flatMap((r) =>
          r.filter((r) => r.status === "PENDING").map((r) => r.id)
        ),
        "APPROVED"
      );
    }
    return fields;
  },
});

export const updatePetitionFieldRepliesStatus = mutationField(
  "updatePetitionFieldRepliesStatus",
  {
    description: "Updates the status of a petition field reply.",
    type: objectType({
      name: "PetitionFieldAndReplies",
      definition(t) {
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
          return {
            replies,
            field: (
              await ctx.petitions.validatePetitionFields(
                args.petitionId,
                [args.petitionFieldId],
                true,
                ctx.user!
              )
            )[0],
          };
        }
      }
      return {
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

      await ctx.petitions.updatePetition(
        args.petitionId,
        { name: petition.name ?? args.subject, status: "PENDING" },
        ctx.user!
      );

      if (!args.scheduledAt) {
        await ctx.emails.sendPetitionMessageEmail(messages.map((s) => s.id));
      }
      return {
        petition: await ctx.petitions.loadPetition(args.petitionId, {
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
      const replies = await ctx.petitions.loadRepliesForField(args.fieldId);
      if (!args.force && replies.length > 0) {
        throw new WhitelistedError(
          "The petition field has replies.",
          "FIELD_HAS_REPLIES"
        );
      }

      return await ctx.petitions.changePetitionFieldType(
        args.petitionId,
        args.fieldId,
        args.type,
        ctx.user!
      );
    },
  }
);
