import { mutationField, nonNull, stringArg } from "@nexus/schema";
import { differenceInSeconds } from "date-fns";
import { random } from "../../../util/token";
import { Maybe } from "../../../util/types";
import { authenticateAnd } from "../../helpers/authorize";
import { ArgValidationError } from "../../helpers/errors";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { RESULT } from "../../helpers/result";
import { uploadArg } from "../../helpers/upload";
import { fieldHasType } from "../../public/authorizers";
import {
  fieldsBelongsToPetition,
  repliesBelongsToPetition,
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
    fieldHasType("fieldId", ["TEXT", "SELECT"])
  ),
  validateArgs: async (_, args, ctx, info) => {
    const field = (await ctx.petitions.loadField(args.fieldId))!;
    if (field.type === "SELECT") {
      const options = field.options.values as Maybe<string[]>;
      if (!options?.includes(args.reply)) {
        throw new ArgValidationError(info, "reply", "Invalid option");
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
    repliesBelongsToPetition("petitionId", "replyId")
  ),
  validateArgs: async (_, args, ctx, info) => {
    const field = (await ctx.petitions.loadFieldForReply(args.replyId))!;
    if (field.type === "SELECT") {
      const options = field.options.values as Maybe<string[]>;
      if (!options?.includes(args.reply)) {
        throw new ArgValidationError(info, "reply", "Invalid option");
      }
    }
    if (!["TEXT", "SELECT"].includes(field.type)) {
      throw new ArgValidationError(
        info,
        "replyId",
        `Reply ${args.replyId} does not belong to a TEXT or SELECT field`
      );
    }
  },
  resolve: async (_, args, ctx) => {
    const [reply, event] = await Promise.all([
      ctx.petitions.updatePetitionFieldReply(
        args.replyId,
        { content: { text: args.reply }, status: "PENDING" },
        `User:${ctx.user!.id}`
      ),
      ctx.petitions.getLastEventForPetitionId(args.petitionId),
    ]);
    if (
      event &&
      (event.type === "REPLY_UPDATED" || event.type === "REPLY_CREATED") &&
      event.data.petition_field_reply_id === args.replyId &&
      differenceInSeconds(new Date(), event.created_at) < 60
    ) {
      await ctx.petitions.updateEvent(event.id, { created_at: new Date() });
    } else {
      await ctx.petitions.createEvent({
        type: "REPLY_UPDATED",
        petition_id: args.petitionId,
        data: {
          user_id: reply.user_id!,
          petition_field_id: reply.petition_field_id,
          petition_field_reply_id: reply.id,
        },
      });
    }
    return reply;
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
    fieldHasType("fieldId", ["FILE_UPLOAD"])
  ),
  resolve: async (_, args, ctx) => {
    const { createReadStream, filename, mimetype } = await args.file;
    const key = random(16);

    const res = await ctx.aws.fileUploads.uploadFile(
      key,
      mimetype,
      createReadStream()
    );

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

export const deletePetitionReply = mutationField("deletePetitionReply", {
  description: "Deletes a reply to a petition field.",
  type: "Result",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    replyId: nonNull(globalIdArg("PetitionFieldReply")),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    repliesBelongsToPetition("petitionId", "replyId")
  ),
  resolve: async (_, args, ctx) => {
    const reply = (await ctx.petitions.loadFieldReply(args.replyId))!;

    if (reply.type === "FILE_UPLOAD") {
      const file = await ctx.files.loadFileUpload(
        reply.content["file_upload_id"]
      );
      await Promise.all([
        ctx.files.deleteFileUpload(file!.id, `User:${ctx.user!.id}`),
        ctx.aws.fileUploads.deleteFile(file!.path),
      ]);
    }
    await ctx.petitions.deletePetitionFieldReply(
      args.replyId,
      `User:${ctx.user!.id}`
    );
    return RESULT.SUCCESS;
  },
});
