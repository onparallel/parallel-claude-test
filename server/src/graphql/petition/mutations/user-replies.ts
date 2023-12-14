import {
  booleanArg,
  idArg,
  inputObjectType,
  list,
  mutationField,
  nonNull,
  objectType,
} from "nexus";
import pMap from "p-map";
import { isDefined, uniq } from "remeda";
import { CreatePetitionFieldReply } from "../../../db/__types";
import { InvalidCredentialsError } from "../../../integrations/GenericIntegration";
import { fieldReplyContent } from "../../../util/fieldReplyContent";
import { fromGlobalId, toGlobalId } from "../../../util/globalId";
import { isFileTypeField } from "../../../util/isFileTypeField";
import { random } from "../../../util/token";
import { authenticateAnd, chain } from "../../helpers/authorize";
import { ApolloError } from "../../helpers/errors";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { jsonObjectArg } from "../../helpers/scalars/JSON";
import { validateAnd } from "../../helpers/validateArgs";
import { notEmptyArray } from "../../helpers/validators/notEmptyArray";
import { validFileUploadInput } from "../../helpers/validators/validFileUploadInput";
import {
  fieldCanBeReplied,
  fieldHasType,
  fieldsBelongsToPetition,
  petitionIsNotAnonymized,
  repliesBelongsToPetition,
  replyCanBeDeleted,
  replyCanBeUpdated,
  replyIsForFieldOfType,
  userHasAccessToPetitions,
  userHasEnabledIntegration,
  userHasFeatureFlag,
} from "../authorizers";
import {
  validateCreateFileReplyInput,
  validateCreatePetitionFieldReplyInput,
  validateUpdatePetitionFieldReplyInput,
} from "../validations";

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
    parentReplyId: globalIdArg("PetitionFieldReply"),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    fieldHasType("fieldId", ["FILE_UPLOAD"]),
    fieldCanBeReplied((args) => ({ id: args.fieldId, parentReplyId: args.parentReplyId })),
    petitionIsNotAnonymized("petitionId"),
  ),
  validateArgs: validateAnd(
    validFileUploadInput((args) => args.file, { maxSizeBytes: 300 * 1024 * 1024 }, "file"),
    validateCreateFileReplyInput(
      (args) => [{ id: args.fieldId, parentReplyId: args.parentReplyId }],
      "fieldId",
    ),
  ),
  resolve: async (_, args, ctx) => {
    const key = random(16);
    try {
      await ctx.orgCredits.ensurePetitionHasConsumedCredit(args.petitionId, `User:${ctx.user!.id}`);

      const { filename, size, contentType } = args.file;
      const [file] = await ctx.files.createFileUpload(
        {
          path: key,
          filename,
          size: size.toString(),
          content_type: contentType,
          upload_complete: false,
        },
        `User:${ctx.user!.id}`,
      );

      const [presignedPostData, [reply]] = await Promise.all([
        ctx.storage.fileUploads.getSignedUploadEndpoint(key, contentType, size),
        ctx.petitions.createPetitionFieldReply(
          args.petitionId,
          {
            petition_field_id: args.fieldId,
            user_id: ctx.user!.id,
            type: "FILE_UPLOAD",
            content: { file_upload_id: file.id },
            parent_petition_field_reply_id: args.parentReplyId ?? null,
            status: "PENDING",
          },
          `User:${ctx.user!.id}`,
        ),
      ]);
      return { presignedPostData, reply };
    } catch (error) {
      if (error instanceof Error && error.message === "PETITION_SEND_LIMIT_REACHED") {
        throw new ApolloError(
          "Can't submit a reply due to lack of credits",
          "PETITION_SEND_LIMIT_REACHED",
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
    petitionIsNotAnonymized("petitionId"),
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
    petitionIsNotAnonymized("petitionId"),
  ),
  validateArgs: validFileUploadInput(
    (args) => args.file,
    { maxSizeBytes: 300 * 1024 * 1024 },
    "file",
  ),
  resolve: async (_, args, ctx) => {
    const oldReply = (await ctx.petitions.loadFieldReply(args.replyId))!;

    const { size, filename, contentType } = await args.file;
    const key = random(16);

    const [newFile] = await ctx.files.createFileUpload(
      {
        path: key,
        filename,
        size: size.toString(),
        content_type: contentType,
        upload_complete: false,
      },
      `User:${ctx.user!.id}`,
    );

    const [presignedPostData, [reply]] = await Promise.all([
      ctx.storage.fileUploads.getSignedUploadEndpoint(key, contentType, size),
      ctx.petitions.updatePetitionFieldRepliesContent(
        args.petitionId,
        [
          {
            id: args.replyId,
            content: {
              file_upload_id: newFile.id,
              old_file_upload_id: oldReply.content["file_upload_id"], // old file_upload_id will be removed and the file deleted once updatefileUploadReplyComplete has been called
            },
          },
        ],
        ctx.user!,
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
    petitionIsNotAnonymized("petitionId"),
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
            `User:${ctx.user!.id}`,
          )
        : null,
    ]);

    ctx.files.loadFileUpload.dataloader.clear(file!.id);
    const [updatedReply] = await ctx.petitions.updatePetitionFieldRepliesContent(
      args.petitionId,
      [
        {
          id: args.replyId,
          content: { file_upload_id: reply.content["file_upload_id"] }, // rewrite content to remove old_file_upload_id reference
        },
      ],
      ctx.user!,
    );
    return updatedReply;
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
    petitionIsNotAnonymized("petitionId"),
    chain(
      replyCanBeDeleted("replyId"),
      replyCanBeUpdated("replyId"),
      repliesBelongsToPetition("petitionId", "replyId"),
    ),
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
    parentReplyId: globalIdArg("PetitionFieldReply"),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    fieldHasType("fieldId", ["ES_TAX_DOCUMENTS"]),
    fieldCanBeReplied((args) => ({ id: args.fieldId, parentReplyId: args.parentReplyId })),
  ),
  validateArgs: validateCreateFileReplyInput(
    (args) => [{ id: args.fieldId, parentReplyId: args.parentReplyId }],
    "fieldId",
  ),
  resolve: async (_, { petitionId, fieldId, parentReplyId }, ctx) => {
    const session = await ctx.bankflip.createSession({
      petitionId: toGlobalId("Petition", petitionId),
      orgId: toGlobalId("Organization", ctx.user!.org_id),
      fieldId: toGlobalId("PetitionField", fieldId),
      userId: toGlobalId("User", ctx.user!.id),
      parentReplyId: isDefined(parentReplyId)
        ? toGlobalId("PetitionFieldReply", parentReplyId)
        : null,
    });

    return {
      type: "WINDOW",
      url: session.widgetLink,
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
    petitionIsNotAnonymized("petitionId"),
  ),
  resolve: async (_, args, ctx) => {
    try {
      await ctx.orgCredits.ensurePetitionHasConsumedCredit(args.petitionId, `User:${ctx.user!.id}`);
      return await ctx.petitions.prefillPetition(args.petitionId, args.replies, ctx.user!);
    } catch (error) {
      if (error instanceof Error && error.message === "PETITION_SEND_LIMIT_REACHED") {
        throw new ApolloError(
          "Can't submit a reply due to lack of credits",
          "PETITION_SEND_LIMIT_REACHED",
        );
      }
      throw error;
    }
  },
});

export const createDowJonesKycReply = mutationField("createDowJonesKycReply", {
  description: "Creates a reply for a DOW_JONES_KYC_FIELD, obtaining profile info and PDF document",
  type: "PetitionFieldReply",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    fieldId: nonNull(globalIdArg("PetitionField")),
    profileId: nonNull(idArg()),
    parentReplyId: globalIdArg("PetitionFieldReply"),
  },
  authorize: authenticateAnd(
    userHasEnabledIntegration("DOW_JONES_KYC"),
    userHasFeatureFlag("DOW_JONES_KYC"),
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    fieldHasType("fieldId", ["DOW_JONES_KYC"]),
    fieldCanBeReplied((args) => ({ id: args.fieldId, parentReplyId: args.parentReplyId })),
    petitionIsNotAnonymized("petitionId"),
  ),
  validateArgs: validateCreateFileReplyInput(
    (args) => [{ id: args.fieldId, parentReplyId: args.parentReplyId }],
    "fieldId",
  ),
  resolve: async (_, args, ctx) => {
    try {
      await ctx.orgCredits.ensurePetitionHasConsumedCredit(args.petitionId, `User:${ctx.user!.id}`);

      const [integration] = await ctx.integrations.loadIntegrationsByOrgId(
        ctx.user!.org_id,
        "DOW_JONES_KYC",
      );
      const [dowJonesFile, dowJonesProfile] = await Promise.all([
        ctx.dowJonesKyc.riskEntityProfilePdf(integration.id, args.profileId),
        ctx.dowJonesKyc.riskEntityProfile(integration.id, args.profileId),
      ]);

      const path = random(16);
      const response = await ctx.storage.fileUploads.uploadFile(
        path,
        dowJonesFile.mime_type,
        Buffer.from(dowJonesFile.binary_stream, "base64"),
      );

      const [fileUpload] = await ctx.files.createFileUpload(
        {
          path,
          filename: `${args.profileId}.pdf`,
          size: response["ContentLength"]!.toString(),
          content_type: dowJonesFile.mime_type,
          upload_complete: true,
        },
        `User:${ctx.user!.id}`,
      );

      const [reply] = await ctx.petitions.createPetitionFieldReply(
        args.petitionId,
        {
          petition_field_id: args.fieldId,
          user_id: ctx.user!.id,
          type: "DOW_JONES_KYC",
          parent_petition_field_reply_id: args.parentReplyId ?? null,
          content: {
            file_upload_id: fileUpload.id,
            entity: {
              profileId: args.profileId,
              type: dowJonesProfile.data.attributes.basic.type,
              name: ctx.dowJonesKyc.entityFullName(
                dowJonesProfile.data.attributes.basic.name_details.primary_name,
              ),
              iconHints:
                dowJonesProfile.data.attributes.person?.icon_hints ??
                dowJonesProfile.data.attributes.entity?.icon_hints ??
                [],
            },
          },
          status: "PENDING",
        },
        `User:${ctx.user!.id}`,
      );

      return reply;
    } catch (error) {
      if (error instanceof Error && error.message === "PETITION_SEND_LIMIT_REACHED") {
        throw new ApolloError(
          "Can't submit a reply due to lack of credits",
          "PETITION_SEND_LIMIT_REACHED",
        );
      } else if (error instanceof InvalidCredentialsError && error.code === "FORBIDDEN") {
        throw new ApolloError("Forbidden", "INVALID_CREDENTIALS");
      }
      throw error;
    }
  },
});

export const createPetitionFieldReplies = mutationField("createPetitionFieldReplies", {
  description: "Creates multiple replies for a petition at once",
  type: list("PetitionFieldReply"),
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    fieldsBelongsToPetition("petitionId", (args) => args.fields.map((field) => field.id)),
    fieldCanBeReplied((args) => args.fields, "overwriteExisting"),
    replyIsForFieldOfType(
      (args) => args.fields.map((field) => field.parentReplyId).filter(isDefined),
      "FIELD_GROUP",
    ),
    repliesBelongsToPetition("petitionId", (args) =>
      args.fields.map((field) => field.parentReplyId).filter(isDefined),
    ),
    petitionIsNotAnonymized("petitionId"),
  ),
  validateArgs: validateAnd(
    notEmptyArray((args) => args.fields, "fields"),
    validateCreatePetitionFieldReplyInput((args) => args.fields, "fields"),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    fields: nonNull(
      list(
        nonNull(
          inputObjectType({
            name: "CreatePetitionFieldReplyInput",
            definition(t) {
              t.nonNull.globalId("id", { prefixName: "PetitionField" });
              t.nullable.globalId("parentReplyId", { prefixName: "PetitionFieldReply" });
              t.nullable.json("content");
            },
          }),
        ),
      ),
    ),
    overwriteExisting: booleanArg({
      description: "pass true to remove existing replies for the given fields",
    }),
  },
  resolve: async (_, args, ctx) => {
    try {
      await ctx.orgCredits.ensurePetitionHasConsumedCredit(args.petitionId, `User:${ctx.user!.id}`);

      const fields = await ctx.petitions.loadField(uniq(args.fields.map((field) => field.id)));

      const fileReplyIds = args.fields
        .filter((field) => isFileTypeField(fields.find((f) => f!.id === field.id)!.type))
        .map((field) => fromGlobalId(field.content.petitionFieldReplyId, "PetitionFieldReply").id);

      const fileReplies =
        fileReplyIds.length > 0
          ? (await ctx.petitions.loadFieldReply(fileReplyIds)).filter(isDefined)
          : [];

      if (args.overwriteExisting) {
        await ctx.petitions.deletePetitionFieldReplies(args.fields, ctx.user!);
      }

      const data: CreatePetitionFieldReply[] = await pMap(
        args.fields,
        async (fieldReply) => {
          const field = fields.find((f) => f!.id === fieldReply.id)!;
          if (isFileTypeField(field.type)) {
            // on FILE replies, clone the FileUpload from the passed reply and insert it as a new one
            const reply = fileReplies.find(
              (r) =>
                r.id ===
                fromGlobalId(fieldReply.content.petitionFieldReplyId, "PetitionFieldReply").id,
            )!;
            const [fileUpload] = await ctx.files.cloneFileUpload(reply.content.file_upload_id);
            return {
              content: { file_upload_id: fileUpload.id },
              petition_field_id: field.id,
              parent_petition_field_reply_id: fieldReply.parentReplyId ?? null,
              type: field.type,
              user_id: ctx.user!.id,
              status: "PENDING",
            };
          } else {
            return {
              content: fieldReplyContent(field.type, fieldReply.content),
              petition_field_id: field.id,
              parent_petition_field_reply_id: fieldReply.parentReplyId ?? null,
              type: field.type,
              user_id: ctx.user!.id,
              status: "PENDING",
            };
          }
        },
        {
          concurrency: 10,
        },
      );

      return await ctx.petitions.createPetitionFieldReply(
        args.petitionId,
        data,
        `User:${ctx.user!.id}`,
      );
    } catch (error) {
      if (error instanceof Error && error.message === "PETITION_SEND_LIMIT_REACHED") {
        throw new ApolloError(
          "Can't submit a reply due to lack of credits",
          "PETITION_SEND_LIMIT_REACHED",
        );
      }
      throw error;
    }
  },
});

export const updatePetitionFieldReplies = mutationField("updatePetitionFieldReplies", {
  description: "Updates multiple replies for a petition at once",
  type: list("PetitionFieldReply"),
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    repliesBelongsToPetition("petitionId", (args) => args.replies.map((r) => r.id)),
    replyIsForFieldOfType(
      (args) => args.replies.map((r) => r.id),
      [
        "TEXT",
        "SHORT_TEXT",
        "SELECT",
        "PHONE",
        "NUMBER",
        "DYNAMIC_SELECT",
        "DATE",
        "DATE_TIME",
        "CHECKBOX",
      ],
    ),
    replyCanBeUpdated((args) => args.replies.map((r) => r.id)),
    petitionIsNotAnonymized("petitionId"),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    replies: nonNull(
      list(
        nonNull(
          inputObjectType({
            name: "UpdatePetitionFieldReplyInput",
            definition(t) {
              t.nonNull.globalId("id", { prefixName: "PetitionFieldReply" });
              t.nullable.json("content");
            },
          }),
        ),
      ),
    ),
  },
  validateArgs: validateAnd(
    notEmptyArray((args) => args.replies, "replies"),
    validateUpdatePetitionFieldReplyInput((args) => args.replies, "replies"),
  ),
  resolve: async (_, args, ctx) => {
    const replyIds = uniq(args.replies.map((r) => r.id));
    const replies = await ctx.petitions.loadFieldReply(replyIds);

    const replyInput = args.replies.map((replyData) => {
      const reply = replies.find((r) => r!.id === replyData.id)!;
      return {
        ...replyData,
        type: reply.type,
      };
    });

    return await ctx.petitions.updatePetitionFieldRepliesContent(
      args.petitionId,
      replyInput.map((replyData) => ({
        id: replyData.id,
        content: fieldReplyContent(replyData.type, replyData.content),
      })),
      ctx.user!,
    );
  },
});
