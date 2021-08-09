import { mutationField, nonNull, objectType } from "@nexus/schema";
import { random } from "../../../util/token";
import { authenticateAnd } from "../../helpers/authorize";
import { ArgValidationError, WhitelistedError } from "../../helpers/errors";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { RESULT } from "../../helpers/result";
import {
  fieldAttachmentBelongsToField,
  fieldsBelongsToPetition,
  petitionsAreNotPublicTemplates,
  userHasAccessToPetitions,
} from "../authorizers";

export const createPetitionFieldAttachmentUploadLink = mutationField(
  "createPetitionFieldAttachmentUploadLink",
  {
    description: "Generates and returns a signed url to upload a field attachment to AWS S3",
    type: objectType({
      name: "CreateFileUploadFieldAttachment",
      definition(t) {
        t.field("presignedPostData", {
          type: "AWSPresignedPostData",
        });
        t.field("attachment", { type: "PetitionFieldAttachment" });
      },
    }),
    authorize: authenticateAnd(
      userHasAccessToPetitions("petitionId"),
      fieldsBelongsToPetition("petitionId", "fieldId"),
      petitionsAreNotPublicTemplates("petitionId")
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      fieldId: nonNull(globalIdArg("PetitionField")),
      data: nonNull("FileUploadInput"),
    },
    validateArgs: (root, args, ctx, info) => {
      if (args.data.size > 1024 * 1024 * 100) {
        throw new ArgValidationError(info, "data.size", "Size limit of 100MB exceeded");
      }
    },
    resolve: async (_, args, ctx) => {
      const attachments = await ctx.petitions.loadFieldAttachmentsByFieldId(args.fieldId);
      if (attachments.length + 1 > 10) {
        throw new WhitelistedError(
          "Maximum number of attachments per field reached",
          "MAX_ATTACHMENTS"
        );
      }
      const key = random(16);
      const { filename, size, contentType } = args.data;
      const file = await ctx.files.createFileUpload(
        {
          path: key,
          filename,
          size: size.toString(),
          content_type: contentType,
        },
        `User:${ctx.user!.id}`
      );
      const [presignedPostData, attachment] = await Promise.all([
        ctx.aws.fileUploads.getSignedUploadEndpoint(key, contentType, size),
        ctx.petitions.createPetitionFieldAttachment(
          {
            file_upload_id: file.id,
            petition_field_id: args.fieldId,
          },
          ctx.user!
        ),
      ]);

      return { presignedPostData, attachment };
    },
  }
);

export const petitionFieldAttachmentUploadComplete = mutationField(
  "petitionFieldAttachmentUploadComplete",
  {
    description: "Tells the backend that the field attachment was correctly uploaded to S3",
    type: "PetitionFieldAttachment",
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      fieldId: nonNull(globalIdArg("PetitionField")),
      attachmentId: nonNull(globalIdArg("PetitionFieldAttachment")),
    },
    authorize: authenticateAnd(
      userHasAccessToPetitions("petitionId"),
      fieldsBelongsToPetition("petitionId", "fieldId"),
      fieldAttachmentBelongsToField("fieldId", "attachmentId")
    ),
    resolve: async (_, args, ctx) => {
      const attachment = (await ctx.petitions.loadFieldAttachment(args.attachmentId))!;
      const file = await ctx.files.loadFileUpload(attachment.file_upload_id);

      await ctx.aws.fileUploads.getFileMetadata(file!.path);
      await ctx.files.markFileUploadComplete(file!.id);
      ctx.files.loadFileUpload.dataloader.clear(file!.id);

      return attachment;
    },
  }
);

export const removePetitionFieldAttachment = mutationField("removePetitionFieldAttachment", {
  description: "Remove a petition field attachment",
  type: "Result",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    fieldId: nonNull(globalIdArg("PetitionField")),
    attachmentId: nonNull(globalIdArg("PetitionFieldAttachment")),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    fieldAttachmentBelongsToField("fieldId", "attachmentId"),
    petitionsAreNotPublicTemplates("petitionId")
  ),
  resolve: async (_, args, ctx) => {
    await ctx.petitions.removePetitionFieldAttachment(args.attachmentId, ctx.user!);
    return RESULT.SUCCESS;
  },
});

export const petitionFieldAttachmentDownloadLink = mutationField(
  "petitionFieldAttachmentDownloadLink",
  {
    type: "FileUploadDownloadLinkResult",
    description: "Generates a download link for a field attachment",
    authorize: authenticateAnd(
      userHasAccessToPetitions("petitionId"),
      fieldsBelongsToPetition("petitionId", "fieldId"),
      fieldAttachmentBelongsToField("fieldId", "attachmentId")
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      fieldId: nonNull(globalIdArg("PetitionField")),
      attachmentId: nonNull(globalIdArg("PetitionFieldAttachment")),
    },
    resolve: async (_, args, ctx) => {
      try {
        const fieldAttachment = (await ctx.petitions.loadFieldAttachment(args.attachmentId))!;

        const file = await ctx.files.loadFileUpload(fieldAttachment.file_upload_id);
        if (!file) {
          throw new Error(`FileUpload not found with id ${fieldAttachment.file_upload_id}`);
        }
        if (!file.upload_complete) {
          await ctx.aws.fileUploads.getFileMetadata(file!.path);
          await ctx.files.markFileUploadComplete(file.id);
        }
        return {
          result: RESULT.SUCCESS,
          file: file.upload_complete
            ? file
            : await ctx.files.loadFileUpload(file.id, { refresh: true }),
          url: await ctx.aws.fileUploads.getSignedDownloadEndpoint(
            file!.path,
            file!.filename,
            "attachment"
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
