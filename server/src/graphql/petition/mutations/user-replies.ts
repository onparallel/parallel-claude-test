import { list, mutationField, nonNull, stringArg } from "nexus";
import { random } from "../../../util/token";
import { Maybe } from "../../../util/types";
import { authenticateAnd } from "../../helpers/authorize";
import { InvalidOptionError } from "../../helpers/errors";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { RESULT } from "../../helpers/result";
import { uploadArg } from "../../helpers/upload";
import { validateCheckboxReplyValues, validateDynamicSelectReplyValues } from "../../utils";
import {
  fieldCanBeReplied,
  fieldHasType,
  fieldsBelongsToPetition,
  repliesBelongsToPetition,
  replyCanBeUpdated,
  replyIsForFieldOfType,
  userHasAccessToPetitions,
} from "../authorizers";

export const createSimpleReply = mutationField("createSimpleReply", {
  description: "Creates a reply to a text or select field.",
  type: "PetitionFieldReply",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    fieldId: nonNull(globalIdArg("PetitionField")),
    reply: nonNull(stringArg()),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    fieldHasType("fieldId", ["TEXT", "SELECT", "SHORT_TEXT"]),
    fieldCanBeReplied("fieldId")
  ),
  validateArgs: async (_, args, ctx, info) => {
    const field = (await ctx.petitions.loadField(args.fieldId))!;
    if (field.type === "SELECT") {
      const options = field.options.values as Maybe<string[]>;
      if (!options?.includes(args.reply)) {
        throw new InvalidOptionError(info, "reply", "Invalid option");
      }
    }
  },
  resolve: async (_, args, ctx) => {
    const field = (await ctx.petitions.loadField(args.fieldId))!;
    return await ctx.petitions.createPetitionFieldReply(
      {
        petition_field_id: args.fieldId,
        user_id: ctx.user!.id,
        type: field.type,
        content: { text: args.reply },
      },
      ctx.user!
    );
  },
});

export const updateSimpleReply = mutationField("updateSimpleReply", {
  description: "Updates a reply to a text or select field.",
  type: "PetitionFieldReply",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    replyId: nonNull(globalIdArg("PetitionFieldReply")),
    reply: nonNull(stringArg()),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    repliesBelongsToPetition("petitionId", "replyId"),
    replyIsForFieldOfType("replyId", ["TEXT", "SHORT_TEXT", "SELECT"]),
    replyCanBeUpdated("replyId")
  ),
  validateArgs: async (_, args, ctx, info) => {
    const field = (await ctx.petitions.loadFieldForReply(args.replyId))!;
    if (field.type === "SELECT") {
      const options = field.options.values as Maybe<string[]>;
      if (!options?.includes(args.reply)) {
        throw new InvalidOptionError(info, "reply", "Invalid option");
      }
    }
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.updatePetitionFieldReply(
      args.replyId,
      { content: { text: args.reply }, status: "PENDING" },
      ctx.user!
    );
  },
});

export const createFileUploadReply = mutationField("createFileUploadReply", {
  description: "Creates a reply to a file upload field.",
  type: "PetitionFieldReply",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    fieldId: nonNull(globalIdArg("PetitionField")),
    file: nonNull(uploadArg()),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    fieldHasType("fieldId", ["FILE_UPLOAD"]),
    fieldCanBeReplied("fieldId")
  ),
  resolve: async (_, args, ctx) => {
    const { createReadStream, filename, mimetype } = await args.file;
    const key = random(16);

    const res = await ctx.aws.fileUploads.uploadFile(key, mimetype, createReadStream());

    const file = await ctx.files.createFileUpload(
      {
        content_type: mimetype,
        filename,
        path: key,
        size: res["ContentLength"]!.toString(),
        upload_complete: true,
      },
      `User:${ctx.user!.id}`
    );

    return await ctx.petitions.createPetitionFieldReply(
      {
        petition_field_id: args.fieldId,
        user_id: ctx.user!.id,
        type: "FILE_UPLOAD",
        content: { file_upload_id: file.id },
      },
      ctx.user!
    );
  },
});

export const createCheckboxReply = mutationField("createCheckboxReply", {
  description: "Creates a reply to a checkbox field.",
  type: "PetitionFieldReply",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    fieldId: nonNull(globalIdArg("PetitionField")),
    values: nonNull(list(nonNull(stringArg()))),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    fieldHasType("fieldId", ["CHECKBOX"]),
    fieldCanBeReplied("fieldId")
  ),
  validateArgs: async (_, { fieldId, values }, ctx, info) => {
    try {
      const field = (await ctx.petitions.loadField(fieldId))!;
      validateCheckboxReplyValues(field, values);
    } catch (error: any) {
      throw new InvalidOptionError(info, "values", error.message);
    }
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.createPetitionFieldReply(
      {
        petition_field_id: args.fieldId,
        user_id: ctx.user!.id,
        type: "CHECKBOX",
        content: { choices: args.values },
      },
      ctx.user!
    );
  },
});

export const updateCheckboxReply = mutationField("updateCheckboxReply", {
  description: "Updates a reply of a checkbox field",
  type: "PetitionFieldReply",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    replyId: nonNull(globalIdArg("PetitionFieldReply")),
    values: nonNull(list(nonNull(stringArg()))),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    repliesBelongsToPetition("petitionId", "replyId"),
    replyIsForFieldOfType("replyId", ["CHECKBOX"]),
    replyCanBeUpdated("replyId")
  ),
  validateArgs: async (_, { replyId, values }, ctx, info) => {
    try {
      const field = (await ctx.petitions.loadFieldForReply(replyId))!;
      validateCheckboxReplyValues(field, values);
    } catch (error: any) {
      throw new InvalidOptionError(info, "values", error.message);
    }
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.updatePetitionFieldReply(
      args.replyId,
      {
        content: { choices: args.values },
        status: "PENDING",
      },
      ctx.user!
    );
  },
});

export const createDynamicSelectReply = mutationField("createDynamicSelectReply", {
  description: "Creates a reply for a dynamic select field.",
  type: "PetitionFieldReply",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    fieldId: nonNull(globalIdArg("PetitionField")),
    value: nonNull(list(nonNull(list(stringArg())))),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    fieldHasType("fieldId", ["DYNAMIC_SELECT"]),
    fieldCanBeReplied("fieldId")
  ),
  validateArgs: async (_, args, ctx, info) => {
    try {
      const field = (await ctx.petitions.loadField(args.fieldId))!;
      validateDynamicSelectReplyValues(field, args.value);
    } catch (error: any) {
      throw new InvalidOptionError(info, "value", error.message);
    }
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.createPetitionFieldReply(
      {
        petition_field_id: args.fieldId,
        user_id: ctx.user!.id,
        type: "DYNAMIC_SELECT",
        content: { columns: args.value },
      },
      ctx.user!
    );
  },
});

export const updateDynamicSelectReply = mutationField("updateDynamicSelectReply", {
  description: "Updates a reply for a dynamic select field.",
  type: "PetitionFieldReply",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    replyId: nonNull(globalIdArg("PetitionFieldReply")),
    value: nonNull(list(nonNull(list(stringArg())))),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    repliesBelongsToPetition("petitionId", "replyId"),
    replyIsForFieldOfType("replyId", ["DYNAMIC_SELECT"]),
    replyCanBeUpdated("replyId")
  ),
  validateArgs: async (_, args, ctx, info) => {
    try {
      const field = (await ctx.petitions.loadFieldForReply(args.replyId))!;
      validateDynamicSelectReplyValues(field, args.value);
    } catch (error: any) {
      throw new InvalidOptionError(info, "reply", error.message);
    }
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.updatePetitionFieldReply(
      args.replyId,
      {
        content: { columns: args.value },
        status: "PENDING",
      },
      ctx.user!
    );
  },
});

export const deletePetitionReply = mutationField("deletePetitionReply", {
  description: "Deletes a reply to a petition field.",
  type: "Result",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    replyId: nonNull(globalIdArg("PetitionFieldReply")),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    repliesBelongsToPetition("petitionId", "replyId"),
    replyCanBeUpdated("replyId")
  ),
  resolve: async (_, args, ctx) => {
    await ctx.petitions.deletePetitionFieldReply(args.replyId, `User:${ctx.user!.id}`);
    return RESULT.SUCCESS;
  },
});
