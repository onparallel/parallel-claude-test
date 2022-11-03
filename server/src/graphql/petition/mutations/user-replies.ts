import { ApolloError } from "apollo-server-core";
import { idArg, mutationField, nonNull, objectType } from "nexus";
import { isDefined } from "remeda";
import { getBaseWebhookUrl } from "../../../util/getBaseWebhookUrl";
import { toGlobalId } from "../../../util/globalId";
import { sign } from "../../../util/jwt";
import { random } from "../../../util/token";
import { authenticateAnd } from "../../helpers/authorize";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { jsonObjectArg } from "../../helpers/scalars";
import { fileUploadInputMaxSize } from "../../helpers/validators/maxFileSize";
import {
  fieldCanBeReplied,
  fieldHasType,
  fieldsBelongsToPetition,
  petitionIsNotAnonymized,
  repliesBelongsToPetition,
  replyCanBeUpdated,
  replyIsForFieldOfType,
  userHasAccessToPetitions,
  userHasEnabledIntegration,
  userHasFeatureFlag,
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
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
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
    fieldCanBeReplied("fieldId"),
    petitionIsNotAnonymized("petitionId")
  ),
  validateArgs: validateFieldReply("fieldId", "reply", "reply"),
  resolve: async (_, args, ctx) => {
    const { type } = (await ctx.petitions.loadField(args.fieldId))!;

    try {
      await ctx.orgCredits.ensurePetitionHasConsumedCredit(args.petitionId, `User:${ctx.user!.id}`);
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
    } catch (error: any) {
      if (error.message === "PETITION_SEND_LIMIT_REACHED") {
        throw new ApolloError(
          "Can't submit a reply due to lack of credits",
          "PETITION_SEND_LIMIT_REACHED"
        );
      }
      throw error;
    }
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
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
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
    replyCanBeUpdated("replyId"),
    petitionIsNotAnonymized("petitionId")
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
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    fieldHasType("fieldId", ["FILE_UPLOAD"]),
    fieldCanBeReplied("fieldId"),
    petitionIsNotAnonymized("petitionId")
  ),
  validateArgs: fileUploadInputMaxSize((args) => args.file, 50 * 1024 * 1024, "file"),
  resolve: async (_, args, ctx) => {
    const key = random(16);
    try {
      await ctx.orgCredits.ensurePetitionHasConsumedCredit(args.petitionId, `User:${ctx.user!.id}`);

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
        ctx.storage.fileUploads.getSignedUploadEndpoint(key, contentType, size),
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
    } catch (error: any) {
      if (error.message === "PETITION_SEND_LIMIT_REACHED") {
        throw new ApolloError(
          "Can't submit a reply due to lack of credits",
          "PETITION_SEND_LIMIT_REACHED"
        );
      }
      throw error;
    }
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
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    repliesBelongsToPetition("petitionId", "replyId"),
    replyIsForFieldOfType("replyId", ["FILE_UPLOAD"]),
    petitionIsNotAnonymized("petitionId")
  ),
  resolve: async (_, args, ctx) => {
    const reply = (await ctx.petitions.loadFieldReply(args.replyId))!;
    const file = await ctx.files.loadFileUpload(reply.content["file_upload_id"]);
    // Try to get metadata
    await ctx.storage.fileUploads.getFileMetadata(file!.path);
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
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    repliesBelongsToPetition("petitionId", "replyId"),
    replyIsForFieldOfType("replyId", ["FILE_UPLOAD"]),
    replyCanBeUpdated("replyId"),
    petitionIsNotAnonymized("petitionId")
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
      ctx.storage.fileUploads.getSignedUploadEndpoint(key, contentType, size),
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
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    repliesBelongsToPetition("petitionId", "replyId"),
    replyIsForFieldOfType("replyId", ["FILE_UPLOAD"]),
    petitionIsNotAnonymized("petitionId")
  ),
  resolve: async (_, args, ctx) => {
    const reply = (await ctx.petitions.loadFieldReply(args.replyId))!;
    const file = await ctx.files.loadFileUpload(reply.content["file_upload_id"]);
    // Try to get metadata
    await Promise.all([
      ctx.storage.fileUploads.getFileMetadata(file!.path),
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
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    repliesBelongsToPetition("petitionId", "replyId"),
    replyCanBeUpdated("replyId"),
    petitionIsNotAnonymized("petitionId")
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
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
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

    const baseWebhookUrl = await getBaseWebhookUrl(ctx.config.misc.webhooksUrl);

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

export const bulkCreatePetitionReplies = mutationField("bulkCreatePetitionReplies", {
  type: "Petition",
  description:
    "Submits multiple replies on a petition at once given a JSON input where the keys are field aliases and values are the replie(s) for that field.",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    replies: nonNull(jsonObjectArg()),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    petitionIsNotAnonymized("petitionId")
  ),
  resolve: async (_, args, ctx) => {
    try {
      await ctx.orgCredits.ensurePetitionHasConsumedCredit(args.petitionId, `User:${ctx.user!.id}`);
      return await ctx.petitions.prefillPetition(args.petitionId, args.replies, ctx.user!);
    } catch (error: any) {
      if (error.message === "PETITION_SEND_LIMIT_REACHED") {
        throw new ApolloError(
          "Can't submit a reply due to lack of credits",
          "PETITION_SEND_LIMIT_REACHED"
        );
      }
      throw error;
    }
  },
});

export const createDowJonesKycResearchReply = mutationField("createDowJonesKycResearchReply", {
  description: "Creates a reply for a DOW_JONES_KYC_FIELD, obtaining profile info and PDF document",
  type: "PetitionFieldReply",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    fieldId: nonNull(globalIdArg("PetitionField")),
    profileId: nonNull(idArg()),
  },
  authorize: authenticateAnd(
    userHasEnabledIntegration("DOW_JONES_KYC"),
    userHasFeatureFlag("DOW_JONES_KYC"),
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    fieldHasType("fieldId", ["DOW_JONES_KYC_RESEARCH"]),
    fieldCanBeReplied("fieldId"),
    petitionIsNotAnonymized("petitionId")
  ),
  resolve: async (_, args, ctx) => {
    try {
      await ctx.orgCredits.ensurePetitionHasConsumedCredit(args.petitionId, `User:${ctx.user!.id}`);

      const [integration] = await ctx.integrations.loadIntegrationsByOrgId(
        ctx.user!.org_id,
        "DOW_JONES_KYC"
      );
      const [dowJonesFile, dowJonesProfile] = await Promise.all([
        ctx.dowJonesKyc.riskEntityProfilePdf(args.profileId, integration),
        ctx.dowJonesKyc.riskEntityProfile(args.profileId, integration),
      ]);

      const path = random(16);
      const response = await ctx.storage.fileUploads.uploadFile(
        path,
        dowJonesFile.mime_type,
        Buffer.from(dowJonesFile.binary_stream, "base64")
      );

      const fileUpload = await ctx.files.createFileUpload(
        {
          path,
          filename: `${args.profileId}.pdf`,
          size: response["ContentLength"]!.toString(),
          content_type: dowJonesFile.mime_type,
          upload_complete: true,
        },
        `User:${ctx.user!.id}`
      );

      return await ctx.petitions.createPetitionFieldReply(
        {
          petition_field_id: args.fieldId,
          user_id: ctx.user!.id,
          type: "DOW_JONES_KYC_RESEARCH",
          content: { file_upload_id: fileUpload.id },
          metadata: {
            type: dowJonesProfile.data.attributes.basic.type,
            name: ctx.dowJonesKyc.entityFullName(
              dowJonesProfile.data.attributes.basic.name_details.primary_name
            ),
            iconHints:
              dowJonesProfile.data.attributes.person?.icon_hints ??
              dowJonesProfile.data.attributes.entity?.icon_hints ??
              [],
          },
          status: "PENDING",
        },
        ctx.user!
      );
    } catch (error: any) {
      if (error.message === "PETITION_SEND_LIMIT_REACHED") {
        throw new ApolloError(
          "Can't submit a reply due to lack of credits",
          "PETITION_SEND_LIMIT_REACHED"
        );
      }
      throw error;
    }
  },
});
