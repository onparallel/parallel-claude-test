import { mutationField, nonNull, objectType } from "@nexus/schema";
import { random } from "../../../util/token";
import { authenticateAnd } from "../../helpers/authorize";
import { ArgValidationError } from "../../helpers/errors";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { RESULT } from "../../helpers/result";
import {
  fieldAttachmentBelongsToField,
  fieldsBelongsToPetition,
  userHasAccessToPetitions,
} from "../authorizers";

export const createPetitionFieldAttachmentUploadLink = mutationField(
  "createPetitionFieldAttachmentUploadLink",
  {
    description:
      "Generates and returns a signed url to upload a field attachment to AWS S3",
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
      fieldsBelongsToPetition("petitionId", "fieldId")
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      fieldId: nonNull(globalIdArg("PetitionField")),
      data: nonNull("FileUploadInput"),
    },
    validateArgs: (root, args, ctx, info) => {
      if (args.data.size > 1024 * 1024 * 100) {
        throw new ArgValidationError(
          info,
          "data.size",
          "Size limit of 100MB exceeded"
        );
      }
    },
    resolve: async (_, args, ctx) => {
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
        ctx.petitions.createFileUploadAttachment(
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

export const petitionFieldAttachmentDownloadLink = mutationField(
  "petitionFieldAttachmentDownloadLink",
  {
    type: "FileUploadDownloadLinkResult",
    description: "Generates a download link for a field attachment",
    authorize: authenticateAnd(
      userHasAccessToPetitions("petitionId"),
      fieldsBelongsToPetition("petitionId", "fieldId"),
      fieldAttachmentBelongsToField("fieldId", "fieldAttachmentId")
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      fieldId: nonNull(globalIdArg("PetitionField")),
      fieldAttachmentId: nonNull(globalIdArg("PetitionFieldAttachment")),
    },
    resolve: async (_, args, ctx) => {
      try {
        const fieldAttachment = (await ctx.petitions.loadFieldAttachment(
          args.fieldAttachmentId
        ))!;

        const file = await ctx.files.loadFileUpload(
          fieldAttachment.file_upload_id
        );
        if (file && !file.upload_complete) {
          await ctx.aws.fileUploads.getFileMetadata(file!.path);
          await ctx.files.markFileUploadComplete(file.id);
        }
        return {
          result: RESULT.SUCCESS,
          file,
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
