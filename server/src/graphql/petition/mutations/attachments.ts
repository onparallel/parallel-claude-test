import { booleanArg, list, mutationField, nonNull, nullable } from "nexus";
import { firstBy, isNonNullish, zip } from "remeda";
import { assert } from "ts-essentials";
import { mapFieldLogic, PetitionFieldVisibility } from "../../../util/fieldLogic";
import { toBytes } from "../../../util/fileSize";
import { fromGlobalId } from "../../../util/globalId";
import { random } from "../../../util/token";
import { authenticateAnd } from "../../helpers/authorize";
import { ApolloError, ForbiddenError } from "../../helpers/errors";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { RESULT } from "../../helpers/Result";
import {
  validateFieldLogic,
  validateFieldLogicSchema,
} from "../../helpers/validators/validFieldLogic";
import { validFileUploadInput } from "../../helpers/validators/validFileUploadInput";
import {
  fieldAttachmentBelongsToField,
  fieldsBelongsToPetition,
  isValidPetitionAttachmentReorder,
  petitionAttachmentBelongsToPetition,
  petitionDoesNotHaveStartedProcess,
  petitionIsNotAnonymized,
  petitionsAreEditable,
  petitionsAreNotPublicTemplates,
  petitionsAreNotScheduledForDeletion,
  userHasAccessToPetitions,
} from "../authorizers";
import { petitionCanUploadAttachments } from "./authorizers";

export const createPetitionFieldAttachmentUploadLink = mutationField(
  "createPetitionFieldAttachmentUploadLink",
  {
    description: "Generates and returns a signed url to upload a field attachment to AWS S3",
    type: "PetitionFieldAttachmentUploadData",
    authorize: authenticateAnd(
      userHasAccessToPetitions("petitionId", "WRITE"),
      petitionsAreNotScheduledForDeletion("petitionId"),
      fieldsBelongsToPetition("petitionId", "fieldId"),
      petitionsAreNotPublicTemplates("petitionId"),
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      fieldId: nonNull(globalIdArg("PetitionField")),
      data: nonNull("FileUploadInput"),
    },
    validateArgs: validFileUploadInput("data", { maxSizeBytes: toBytes(100, "MB") }),
    resolve: async (_, args, ctx) => {
      const attachments = await ctx.petitions.loadFieldAttachmentsByFieldId(args.fieldId);
      if (attachments.length + 1 > 10) {
        throw new ApolloError("Maximum number of attachments per field reached", "MAX_ATTACHMENTS");
      }
      const key = random(16);
      const { filename, size, contentType } = args.data;
      const [file] = await ctx.files.createFileUpload(
        {
          path: key,
          filename,
          size: size.toString(),
          content_type: contentType,
        },
        `User:${ctx.user!.id}`,
      );
      ctx.petitions.loadFieldAttachmentsByFieldId.dataloader.clear(args.fieldId);
      const [presignedPostData, attachment] = await Promise.all([
        ctx.storage.fileUploads.getSignedUploadEndpoint(key, contentType, size),
        ctx.petitions.createPetitionFieldAttachment(
          {
            file_upload_id: file.id,
            petition_field_id: args.fieldId,
          },
          ctx.user!,
        ),
      ]);

      await ctx.petitions.updatePetitionLastChangeAt(args.petitionId);

      return { presignedPostData, attachment };
    },
  },
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
      userHasAccessToPetitions("petitionId", "WRITE"),
      petitionsAreNotScheduledForDeletion("petitionId"),
      fieldsBelongsToPetition("petitionId", "fieldId"),
      fieldAttachmentBelongsToField("fieldId", "attachmentId"),
    ),
    resolve: async (_, args, ctx) => {
      const attachment = (await ctx.petitions.loadFieldAttachment(args.attachmentId))!;
      const file = await ctx.files.loadFileUpload(attachment.file_upload_id);

      await ctx.storage.fileUploads.getFileMetadata(file!.path);
      await ctx.files.markFileUploadComplete(file!.id, `User:${ctx.user!.id}`);
      ctx.files.loadFileUpload.dataloader.clear(file!.id);

      return attachment;
    },
  },
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
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    fieldAttachmentBelongsToField("fieldId", "attachmentId"),
    petitionsAreNotPublicTemplates("petitionId"),
  ),
  resolve: async (_, args, ctx) => {
    await ctx.petitions.deletePetitionFieldAttachment(args.attachmentId, ctx.user!);
    await ctx.petitions.updatePetitionLastChangeAt(args.petitionId);

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
      fieldAttachmentBelongsToField("fieldId", "attachmentId"),
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
            "attachment",
          ),
        };
      } catch {
        return {
          result: RESULT.FAILURE,
        };
      }
    },
  },
);

export const createPetitionAttachmentUploadLink = mutationField(
  "createPetitionAttachmentUploadLink",
  {
    description: "Generates and returns a signed url to upload a petition attachment to AWS S3",
    type: list("PetitionAttachmentUploadData"),
    authorize: authenticateAnd(
      userHasAccessToPetitions("petitionId", "WRITE"),
      petitionsAreNotScheduledForDeletion("petitionId"),
      petitionsAreNotPublicTemplates("petitionId"),
      petitionIsNotAnonymized("petitionId"),
      petitionsAreEditable("petitionId"),
      petitionDoesNotHaveStartedProcess("petitionId"),
      petitionCanUploadAttachments("petitionId", "data", 10),
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      data: nonNull(list(nonNull("FileUploadInput"))),
      type: nonNull("PetitionAttachmentType"),
    },
    validateArgs: validFileUploadInput("data", {
      maxSizeBytes: toBytes(50, "MB"),
      contentType: "application/pdf",
    }),
    resolve: async (_, args, ctx) => {
      const files = await ctx.files.createFileUpload(
        args.data.map((data) => ({
          path: random(16),
          filename: data.filename,
          size: data.size.toString(),
          content_type: data.contentType,
          upload_complete: false,
        })),
        `User:${ctx.user!.id}`,
      );

      const presignedPostDataArray = await Promise.all(
        files.map((file) =>
          ctx.storage.fileUploads.getSignedUploadEndpoint(
            file.path,
            file.content_type,
            parseInt(file.size),
          ),
        ),
      );

      const petitionAttachments = await ctx.petitions.loadPetitionAttachmentsByPetitionId(
        args.petitionId,
      );

      const maxPosition =
        firstBy(
          petitionAttachments.filter((a) => a.type === args.type),
          [(a) => a.position, "desc"],
        )?.position ?? -1;

      const attachments = await ctx.petitions.createPetitionAttachment(
        files.map((file, i) => ({
          file_upload_id: file.id,
          petition_id: args.petitionId,
          type: args.type,
          position: maxPosition + 1 + i,
        })),
        ctx.user!,
      );

      await ctx.petitions.updatePetitionLastChangeAt(args.petitionId);
      ctx.petitions.loadPetitionAttachmentsByPetitionId.dataloader.clear(args.petitionId);

      return zip(presignedPostDataArray, attachments).map(([presignedPostData, attachment]) => ({
        presignedPostData,
        attachment,
      }));
    },
  },
);

export const petitionAttachmentUploadComplete = mutationField("petitionAttachmentUploadComplete", {
  description: "Tells the backend that the petition attachment was correctly uploaded to S3",
  type: "PetitionAttachment",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    attachmentId: nonNull(globalIdArg("PetitionAttachment")),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    petitionAttachmentBelongsToPetition("petitionId", "attachmentId"),
    petitionsAreNotPublicTemplates("petitionId"),
    petitionIsNotAnonymized("petitionId"),
    petitionsAreEditable("petitionId"),
    petitionDoesNotHaveStartedProcess("petitionId"),
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
  type: "PetitionBase",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    attachmentId: nonNull(globalIdArg("PetitionAttachment")),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    petitionAttachmentBelongsToPetition("petitionId", "attachmentId"),
    petitionsAreNotPublicTemplates("petitionId"),
    petitionIsNotAnonymized("petitionId"),
    petitionsAreEditable("petitionId"),
    petitionDoesNotHaveStartedProcess("petitionId"),
  ),
  resolve: async (_, args, ctx) => {
    await ctx.petitions.deletePetitionAttachment(args.attachmentId, ctx.user!);
    return await ctx.petitions.updatePetitionLastChangeAt(args.petitionId);
  },
});

export const petitionAttachmentDownloadLink = mutationField("petitionAttachmentDownloadLink", {
  type: "FileUploadDownloadLinkResult",
  description: "Generates a download link for a petition attachment",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    petitionAttachmentBelongsToPetition("petitionId", "attachmentId"),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    attachmentId: nonNull(globalIdArg("PetitionAttachment")),
    preview: booleanArg({
      description: "If true will use content-disposition inline instead of attachment",
    }),
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
          args.preview ? "inline" : "attachment",
        ),
      };
    } catch {
      return {
        result: RESULT.FAILURE,
      };
    }
  },
});

export const reorderPetitionAttachments = mutationField("reorderPetitionAttachments", {
  description: "Reorders the positions of attachments in the petition",
  type: "PetitionBase",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    petitionAttachmentBelongsToPetition("petitionId", "attachmentIds"),
    isValidPetitionAttachmentReorder("petitionId", "attachmentType", "attachmentIds"),
    petitionsAreNotPublicTemplates("petitionId"),
    petitionIsNotAnonymized("petitionId"),
    petitionsAreEditable("petitionId"),
    petitionDoesNotHaveStartedProcess("petitionId"),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    attachmentType: nonNull("PetitionAttachmentType"),
    attachmentIds: nonNull(list(nonNull(globalIdArg("PetitionAttachment")))),
  },
  resolve: async (_, args, ctx) => {
    const petition = await ctx.petitions.updatePetitionAttachmentPositions(
      args.petitionId,
      args.attachmentType,
      args.attachmentIds,
      `User:${ctx.user!.id}`,
    );
    ctx.petitions.loadPetitionAttachmentsByPetitionId.dataloader.clear(args.petitionId);
    return petition;
  },
});

export const updatePetitionAttachmentType = mutationField("updatePetitionAttachmentType", {
  description: "Updates the type of a petition attachment and sets it in the final position",
  type: "PetitionAttachment",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    petitionAttachmentBelongsToPetition("petitionId", "attachmentId"),
    petitionsAreNotPublicTemplates("petitionId"),
    petitionIsNotAnonymized("petitionId"),
    petitionsAreEditable("petitionId"),
    petitionDoesNotHaveStartedProcess("petitionId"),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    attachmentId: nonNull(globalIdArg("PetitionAttachment")),
    type: nonNull("PetitionAttachmentType"),
  },
  resolve: async (_, args, ctx) => {
    const petitionAttachment = await ctx.petitions.updatePetitionAttachmentType(
      args.petitionId,
      args.attachmentId,
      args.type,
      `User:${ctx.user!.id}`,
    );
    await ctx.petitions.updatePetitionLastChangeAt(args.petitionId);

    return petitionAttachment;
  },
});

export const updatePetitionAttachmentVisibility = mutationField(
  "updatePetitionAttachmentVisibility",
  {
    description: "Updates the visibility of a petition attachment. Pass null to remove visibility.",
    type: "PetitionAttachment",
    authorize: authenticateAnd(
      userHasAccessToPetitions("petitionId", "WRITE"),
      petitionsAreNotScheduledForDeletion("petitionId"),
      petitionAttachmentBelongsToPetition("petitionId", "attachmentId"),
      petitionsAreNotPublicTemplates("petitionId"),
      petitionIsNotAnonymized("petitionId"),
      petitionsAreEditable("petitionId"),
      petitionDoesNotHaveStartedProcess("petitionId"),
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      attachmentId: nonNull(globalIdArg("PetitionAttachment")),
      visibility: nullable("JSONObject"),
    },
    resolve: async (_, { attachmentId, petitionId, visibility }, ctx) => {
      let mappedVisibility: PetitionFieldVisibility | null = null;

      if (visibility !== null) {
        try {
          const logic = { visibility: visibility, math: null };
          // validate input JSON schema before anything
          validateFieldLogicSchema(logic, "string");

          const [allFields, petition] = await Promise.all([
            ctx.petitions.loadAllFieldsByPetitionId(petitionId),
            ctx.petitions.loadPetition(petitionId),
          ]);
          assert(isNonNullish(petition), "Petition not found");

          const mappedLogic = mapFieldLogic<string>({ visibility: logic.visibility }, (id) => {
            assert(typeof id === "string", "Expected fieldId to be a string");
            return fromGlobalId(id, "PetitionField").id;
          });

          await validateFieldLogic(
            {
              petition_id: petitionId,
              visibility: mappedVisibility,
            },
            allFields,
            {
              variables: petition.variables ?? [],
              standardListDefinitions:
                await ctx.petitions.loadResolvedStandardListDefinitionsByPetitionId(petitionId),
              customLists: petition.custom_lists ?? [],
              loadSelectOptionsValuesAndLabels: (options) =>
                ctx.petitionFields.loadSelectOptionsValuesAndLabels(options),
            },
            true,
          );

          mappedVisibility = mappedLogic.field.visibility;
        } catch (e) {
          if (e instanceof Error) {
            throw new ForbiddenError(e.message);
          }
          throw e;
        }
      }

      const petitionAttachment = await ctx.petitions.updatePetitionAttachmentVisibility(
        attachmentId,
        mappedVisibility,
        `User:${ctx.user!.id}`,
      );
      await ctx.petitions.updatePetitionLastChangeAt(petitionId);

      return petitionAttachment;
    },
  },
);
