import { ApolloError } from "apollo-server-core";
import { mutationField, nonNull } from "nexus";
import { random } from "../../../util/token";
import { authenticateAnd } from "../../helpers/authorize";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { RESULT } from "../../helpers/result";
import { fileUploadInputMaxSize } from "../../helpers/validators/maxFileSize";
import {
  fieldAttachmentBelongsToField,
  fieldsBelongsToPetition,
  petitionAttachmentBelongsToPetition,
  petitionsAreNotPublicTemplates,
  userHasAccessToPetitions,
} from "../authorizers";

const _50MB = 50 * 1024 * 1024;
const _100MB = 100 * 1024 * 1024;

export const createPetitionFieldAttachmentUploadLink = mutationField(
  "createPetitionFieldAttachmentUploadLink",
  {
    description: "Generates and returns a signed url to upload a field attachment to AWS S3",
    type: "PetitionFieldAttachmentUploadData",
    authorize: authenticateAnd(
      userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
      fieldsBelongsToPetition("petitionId", "fieldId"),
      petitionsAreNotPublicTemplates("petitionId")
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      fieldId: nonNull(globalIdArg("PetitionField")),
      data: nonNull("FileUploadInput"),
    },
    validateArgs: fileUploadInputMaxSize((args) => args.data, _100MB, "data"),
    resolve: async (_, args, ctx) => {
      const attachments = await ctx.petitions.loadFieldAttachmentsByFieldId(args.fieldId);
      if (attachments.length + 1 > 10) {
        throw new ApolloError("Maximum number of attachments per field reached", "MAX_ATTACHMENTS");
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
      ctx.petitions.loadFieldAttachmentsByFieldId.dataloader.clear(args.fieldId);
      const [presignedPostData, attachment] = await Promise.all([
        ctx.storage.fileUploads.getSignedUploadEndpoint(key, contentType, size),
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
      userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
      fieldsBelongsToPetition("petitionId", "fieldId"),
      fieldAttachmentBelongsToField("fieldId", "attachmentId")
    ),
    resolve: async (_, args, ctx) => {
      const attachment = (await ctx.petitions.loadFieldAttachment(args.attachmentId))!;
      const file = await ctx.files.loadFileUpload(attachment.file_upload_id);

      await ctx.storage.fileUploads.getFileMetadata(file!.path);
      await ctx.files.markFileUploadComplete(file!.id, `User:${ctx.user!.id}`);
      ctx.files.loadFileUpload.dataloader.clear(file!.id);

      return attachment;
    },
  }
);

export const deletePetitionFieldAttachment = mutationField("deletePetitionFieldAttachment", {
  description: "Remove a petition field attachment",
  type: "PetitionField",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    fieldId: nonNull(globalIdArg("PetitionField")),
    attachmentId: nonNull(globalIdArg("PetitionFieldAttachment")),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    fieldAttachmentBelongsToField("fieldId", "attachmentId"),
    petitionsAreNotPublicTemplates("petitionId")
  ),
  resolve: async (_, args, ctx) => {
    await ctx.petitions.deletePetitionFieldAttachment(args.attachmentId, ctx.user!);
    return (await ctx.petitions.loadField(args.fieldId))!;
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
          await ctx.storage.fileUploads.getFileMetadata(file!.path);
          await ctx.files.markFileUploadComplete(file.id, `User:${ctx.user!.id}`);
        }
        return {
          result: RESULT.SUCCESS,
          file: file.upload_complete
            ? file
            : await ctx.files.loadFileUpload(file.id, { refresh: true }),
          url: await ctx.storage.fileUploads.getSignedDownloadEndpoint(
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

export const createPetitionAttachmentUploadLink = mutationField(
  "createPetitionAttachmentUploadLink",
  {
    description: "Generates and returns a signed url to upload a petition attachment to AWS S3",
    type: "PetitionAttachmentUploadData",
    authorize: authenticateAnd(
      userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
      petitionsAreNotPublicTemplates("petitionId")
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      data: nonNull("FileUploadInput"),
    },
    validateArgs: fileUploadInputMaxSize((args) => args.data, _50MB, "data"),
    resolve: async (_, args, ctx) => {
      const attachments = await ctx.petitions.loadPetitionAttachmentsByPetitionId(args.petitionId);
      if (attachments.length + 1 > 10) {
        throw new ApolloError(
          "Maximum number of attachments per petition reached",
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
          upload_complete: false,
        },
        `User:${ctx.user!.id}`
      );
      const [presignedPostData, attachment] = await Promise.all([
        ctx.storage.fileUploads.getSignedUploadEndpoint(key, contentType, size),
        ctx.petitions.createPetitionAttachment(
          {
            file_upload_id: file.id,
            petition_id: args.petitionId,
          },
          ctx.user!
        ),
      ]);

      return { presignedPostData, attachment };
    },
  }
);

export const petitionAttachmentUploadComplete = mutationField("petitionAttachmentUploadComplete", {
  description: "Tells the backend that the petition attachment was correctly uploaded to S3",
  type: "PetitionAttachment",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    attachmentId: nonNull(globalIdArg("PetitionAttachment")),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    petitionAttachmentBelongsToPetition("petitionId", "attachmentId")
  ),
  resolve: async (_, args, ctx) => {
    const attachment = (await ctx.petitions.loadPetitionAttachment(args.attachmentId))!;
    const file = await ctx.files.loadFileUpload(attachment.file_upload_id);

    await ctx.storage.fileUploads.getFileMetadata(file!.path);
    await ctx.files.markFileUploadComplete(file!.id, `User:${ctx.user!.id}`);
    ctx.files.loadFileUpload.dataloader.clear(file!.id);

    return attachment;
  },
});

export const deletePetitionAttachment = mutationField("deletePetitionAttachment", {
  description: "Remove a petition attachment",
  type: "Result",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    attachmentId: nonNull(globalIdArg("PetitionAttachment")),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    petitionAttachmentBelongsToPetition("petitionId", "attachmentId"),
    petitionsAreNotPublicTemplates("petitionId")
  ),
  resolve: async (_, args, ctx) => {
    await ctx.petitions.deletePetitionAttachment(args.attachmentId, ctx.user!);
    return RESULT.SUCCESS;
  },
});

export const petitionAttachmentDownloadLink = mutationField("petitionAttachmentDownloadLink", {
  type: "FileUploadDownloadLinkResult",
  description: "Generates a download link for a petition attachment",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    petitionAttachmentBelongsToPetition("petitionId", "attachmentId")
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    attachmentId: nonNull(globalIdArg("PetitionAttachment")),
  },
  resolve: async (_, args, ctx) => {
    try {
      const attachment = (await ctx.petitions.loadPetitionAttachment(args.attachmentId))!;

      const file = await ctx.files.loadFileUpload(attachment.file_upload_id);
      if (!file) {
        throw new Error(`FileUpload:${attachment.file_upload_id} not found`);
      }
      if (!file.upload_complete) {
        await ctx.storage.fileUploads.getFileMetadata(file!.path);
        await ctx.files.markFileUploadComplete(file.id, `User:${ctx.user!.id}`);
      }
      return {
        result: RESULT.SUCCESS,
        file: file.upload_complete
          ? file
          : await ctx.files.loadFileUpload(file.id, { refresh: true }),
        url: await ctx.storage.fileUploads.getSignedDownloadEndpoint(
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
});
