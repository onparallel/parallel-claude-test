import { ApolloError } from "apollo-server-core";
import { mutationField, nonNull, objectType } from "nexus";
import { isDefined } from "remeda";
import { getBaseWebhookUrl } from "../../../util/getBaseWebhookUrl";
import { toGlobalId } from "../../../util/globalId";
import { sign } from "../../../util/jwt";
import { random } from "../../../util/token";
import { authenticateAnd } from "../../helpers/authorize";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { fileUploadInputMaxSize } from "../../helpers/validators/maxFileSize";
import {
  fieldCanBeReplied,
  fieldHasType,
  fieldsBelongsToPetition,
  repliesBelongsToPetition,
  replyCanBeUpdated,
  replyIsForFieldOfType,
  userHasAccessToPetitions,
} from "../authorizers";
import { validateFieldReply, validateReplyUpdate } from "../validations";

export const createPetitionFieldReply = mutationField("createPetitionFieldReply", {
  description: "Creates a reply on a petition field",
  type: "PetitionFieldReply",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    fieldId: nonNull(globalIdArg("PetitionField")),
    reply: nonNull("JSON"),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    fieldHasType("fieldId", [
      "TEXT",
      "SHORT_TEXT",
      "SELECT",
      "PHONE",
      "NUMBER",
      "DYNAMIC_SELECT",
      "DATE",
      "CHECKBOX",
    ]),
    fieldCanBeReplied("fieldId")
  ),
  validateArgs: validateFieldReply("fieldId", "reply", "reply"),
  resolve: async (_, args, ctx) => {
    const { type } = (await ctx.petitions.loadField(args.fieldId))!;
    return await ctx.petitions.createPetitionFieldReply(
      {
        petition_field_id: args.fieldId,
        user_id: ctx.user!.id,
        type,
        status: "PENDING",
        content: { value: args.reply },
      },
      ctx.user!
    );
  },
});

export const updatePetitionFieldReply = mutationField("updatePetitionFieldReply", {
  description: "Updates a reply on a petition field",
  type: "PetitionFieldReply",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    replyId: nonNull(globalIdArg("PetitionFieldReply")),
    reply: nonNull("JSON"),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    repliesBelongsToPetition("petitionId", "replyId"),
    replyIsForFieldOfType("replyId", [
      "TEXT",
      "SHORT_TEXT",
      "SELECT",
      "PHONE",
      "NUMBER",
      "DYNAMIC_SELECT",
      "DATE",
      "CHECKBOX",
    ]),
    replyCanBeUpdated("replyId")
  ),
  validateArgs: validateReplyUpdate("replyId", "reply", "reply"),
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.updatePetitionFieldReply(
      args.replyId,
      {
        petition_access_id: null,
        user_id: ctx.user!.id,
        content: { value: args.reply },
        status: "PENDING",
      },
      ctx.user!
    );
  },
});

export const FileUploadReplyResponse = objectType({
  name: "FileUploadReplyResponse",
  definition(t) {
    t.field("presignedPostData", {
      type: "AWSPresignedPostData",
    });
    t.field("reply", { type: "PetitionFieldReply" });
  },
});

export const createFileUploadReply = mutationField("createFileUploadReply", {
  description: "Creates a reply to a file upload field.",
  type: "FileUploadReplyResponse",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    fieldId: nonNull(globalIdArg("PetitionField")),
    file: nonNull("FileUploadInput"),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    fieldHasType("fieldId", ["FILE_UPLOAD"]),
    fieldCanBeReplied("fieldId")
  ),
  validateArgs: fileUploadInputMaxSize((args) => args.file, 50 * 1024 * 1024, "file"),
  resolve: async (_, args, ctx) => {
    const key = random(16);
    const { filename, size, contentType } = args.file;
    const file = await ctx.files.createFileUpload(
      {
        path: key,
        filename,
        size: size.toString(),
        content_type: contentType,
        upload_complete: false,
      },
      `User:${ctx.user!.id}`
    );

    const [presignedPostData, reply] = await Promise.all([
      ctx.aws.fileUploads.getSignedUploadEndpoint(key, contentType, size),
      ctx.petitions.createPetitionFieldReply(
        {
          petition_field_id: args.fieldId,
          user_id: ctx.user!.id,
          type: "FILE_UPLOAD",
          content: { file_upload_id: file.id },
          status: "PENDING",
        },
        ctx.user!
      ),
    ]);
    return { presignedPostData, reply };
  },
});

export const createFileUploadReplyComplete = mutationField("createFileUploadReplyComplete", {
  description: "Notifies the backend that the upload is complete.",
  type: "PetitionFieldReply",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    replyId: nonNull(globalIdArg("PetitionFieldReply")),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    repliesBelongsToPetition("petitionId", "replyId"),
    replyIsForFieldOfType("replyId", ["FILE_UPLOAD"])
  ),
  resolve: async (_, args, ctx) => {
    const reply = (await ctx.petitions.loadFieldReply(args.replyId))!;
    const file = await ctx.files.loadFileUpload(reply.content["file_upload_id"]);
    // Try to get metadata
    await ctx.aws.fileUploads.getFileMetadata(file!.path);
    await ctx.files.markFileUploadComplete(file!.id, `User:${ctx.user!.id}`);
    ctx.files.loadFileUpload.dataloader.clear(file!.id);
    return reply;
  },
});

export const updateFileUploadReply = mutationField("updateFileUploadReply", {
  description:
    "Updates the file of a FILE_UPLOAD reply. The previous file will be deleted from AWS S3 when client notifies of upload completed via updateFileUploadReplyComplete mutation.",
  type: "FileUploadReplyResponse",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    replyId: nonNull(globalIdArg("PetitionFieldReply")),
    file: nonNull("FileUploadInput"),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    repliesBelongsToPetition("petitionId", "replyId"),
    replyIsForFieldOfType("replyId", ["FILE_UPLOAD"]),
    replyCanBeUpdated("replyId")
  ),
  validateArgs: fileUploadInputMaxSize((args) => args.file, 50 * 1024 * 1024, "file"),
  resolve: async (_, args, ctx) => {
    const oldReply = (await ctx.petitions.loadFieldReply(args.replyId))!;

    const { size, filename, contentType } = await args.file;
    const key = random(16);

    const newFile = await ctx.files.createFileUpload(
      {
        path: key,
        filename,
        size: size.toString(),
        content_type: contentType,
        upload_complete: false,
      },
      `User:${ctx.user!.id}`
    );

    const [presignedPostData, reply] = await Promise.all([
      ctx.aws.fileUploads.getSignedUploadEndpoint(key, contentType, size),
      ctx.petitions.updatePetitionFieldReply(
        args.replyId,
        {
          petition_access_id: null,
          user_id: ctx.user!.id,
          content: {
            file_upload_id: newFile.id,
            old_file_upload_id: oldReply.content["file_upload_id"], // old file_upload_id will be removed and the file deleted once updatefileUploadReplyComplete has been called
          },
          status: "PENDING",
        },
        ctx.user!
      ),
    ]);

    return { presignedPostData, reply };
  },
});

export const updateFileUploadReplyComplete = mutationField("updateFileUploadReplyComplete", {
  description:
    "Notifies the backend that the new file was successfully uploaded to S3. Marks the file upload as completed and deletes the old file.",
  type: "PetitionFieldReply",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    replyId: nonNull(globalIdArg("PetitionFieldReply")),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    repliesBelongsToPetition("petitionId", "replyId"),
    replyIsForFieldOfType("replyId", ["FILE_UPLOAD"])
  ),
  resolve: async (_, args, ctx) => {
    const reply = (await ctx.petitions.loadFieldReply(args.replyId))!;
    const file = await ctx.files.loadFileUpload(reply.content["file_upload_id"]);
    // Try to get metadata
    await Promise.all([
      ctx.aws.fileUploads.getFileMetadata(file!.path),
      ctx.files.markFileUploadComplete(file!.id, `User:${ctx.user!.id}`),
      reply.content["old_file_upload_id"]
        ? ctx.files.deleteFileUpload(
            reply.content["old_file_upload_id"] as number,
            `User:${ctx.user!.id}`
          )
        : null,
    ]);

    ctx.files.loadFileUpload.dataloader.clear(file!.id);
    return await ctx.petitions.updatePetitionFieldReply(
      args.replyId,
      {
        petition_access_id: null,
        user_id: ctx.user!.id,
        content: { file_upload_id: reply.content["file_upload_id"] }, // rewrite content to remove old_file_upload_id reference
      },
      ctx.user!
    );
  },
});

export const deletePetitionReply = mutationField("deletePetitionReply", {
  description: "Deletes a reply to a petition field.",
  type: "PetitionField",
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
    return await ctx.petitions.deletePetitionFieldReply(args.replyId, ctx.user!);
  },
});

export const startAsyncFieldCompletion = mutationField("startAsyncFieldCompletion", {
  description: "Starts the completion of an async field",
  type: "AsyncFieldCompletionResponse",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    fieldId: nonNull(globalIdArg("PetitionField")),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    fieldHasType("fieldId", ["ES_TAX_DOCUMENTS"]),
    fieldCanBeReplied("fieldId")
  ),
  resolve: async (_, { petitionId, fieldId }, ctx) => {
    const payload = {
      fieldId: toGlobalId("PetitionField", fieldId),
      userId: toGlobalId("User", ctx.user!.id),
    };

    const token = await sign(payload, ctx.config.security.jwtSecret, { expiresIn: "1d" });

    const baseWebhookUrl = await getBaseWebhookUrl(ctx.config.misc.parallelUrl);

    const userId = toGlobalId("User", ctx.user!.id);
    const res = await ctx.fetch.fetch(`https://api.bankflip.io/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        webhookUrl: `${baseWebhookUrl}/api/webhooks/bankflip?token=${token}`,
        userId,
        metadata: {
          ...payload,
          petitionId: toGlobalId("Petition", petitionId),
        },
      }),
    });
    const result = await res.json();

    if (!isDefined(result.id)) {
      throw new ApolloError("BAD_REQUEST", "BAD_REQUEST");
    }

    return {
      type: "WINDOW",
      url: `https://app.bankflip.io?${new URLSearchParams({
        userId,
        requestId: result.id,
        companyName: "Parallel",
      })}`,
    };
  },
});
