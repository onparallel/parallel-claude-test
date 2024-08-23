import { booleanArg, mutationField, nonNull, nullable, stringArg } from "nexus";
import { isNonNullish, isNullish } from "remeda";
import { toBytes } from "../../../util/fileSize";
import { toGlobalId } from "../../../util/globalId";
import { random } from "../../../util/token";
import { RESULT } from "../../helpers/Result";
import { authenticateAnd } from "../../helpers/authorize";
import { ApolloError, ForbiddenError } from "../../helpers/errors";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { jsonObjectArg } from "../../helpers/scalars/JSON";
import { validFileUploadInput } from "../../helpers/validators/validFileUploadInput";
import {
  petitionCanUploadCustomSignatureDocument,
  petitionIsNotAnonymized,
  petitionsAreOfTypePetition,
  signatureRequestIsNotAnonymized,
  userHasAccessToPetitions,
  userHasAccessToSignatureRequest,
  userHasEnabledIntegration,
} from "../authorizers";

export const startSignatureRequest = mutationField("startSignatureRequest", {
  type: "PetitionSignatureRequest",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    message: nullable(stringArg()),
    customDocumentTemporaryFileId: globalIdArg("FileUpload"),
  },
  authorize: authenticateAnd(
    userHasEnabledIntegration("SIGNATURE"),
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    petitionIsNotAnonymized("petitionId"),
    async (root, args, ctx) => {
      const petition = (await ctx.petitions.loadPetition(args.petitionId))!;

      if (!petition.signature_config) {
        throw new ApolloError(
          `Petition:${petition.id} was expected to have signature_config set`,
          "MISSING_SIGNATURE_CONFIG_ERROR",
        );
      }

      if (
        petition.signature_config.useCustomDocument &&
        isNullish(args.customDocumentTemporaryFileId)
      ) {
        throw new ApolloError(
          `Petition:${petition.id} requires a custom document to be uploaded`,
          "MISSING_CUSTOM_SIGNATURE_DOCUMENT_ERROR",
        );
      }

      if (isNonNullish(args.customDocumentTemporaryFileId)) {
        try {
          const tmpFile = await ctx.files.loadTemporaryFile(args.customDocumentTemporaryFileId);
          if (isNullish(tmpFile)) {
            throw new Error();
          }
          await ctx.storage.temporaryFiles.getFileMetadata(tmpFile.path);
        } catch {
          throw new ForbiddenError("Temporary file not found");
        }
      }

      return true;
    },
  ),

  resolve: async (_, { petitionId, message, customDocumentTemporaryFileId }, ctx) => {
    try {
      const petition = (await ctx.petitions.loadPetition(petitionId))!;
      await ctx.orgCredits.ensurePetitionHasConsumedCredit(petition.id, `User:${ctx.user!.id}`);

      await ctx.petitions.updatePetition(
        petitionId,
        { status: "COMPLETED" },
        `User:${ctx.user!.id}`,
      );

      const { signatureRequest } = await ctx.signature.createSignatureRequest(
        petition.id,
        {
          ...petition.signature_config!,
          message: message ?? undefined,
          customDocumentTemporaryFileId: customDocumentTemporaryFileId ?? undefined,
        },
        ctx.user!,
      );

      return signatureRequest;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "PETITION_SEND_LIMIT_REACHED") {
          throw new ApolloError(
            "Can't complete the parallel due to lack of credits",
            "PETITION_SEND_LIMIT_REACHED",
          );
        } else if (error.message === "REQUIRED_SIGNER_INFO_ERROR") {
          throw new ApolloError(
            "Can't complete the petition without signers information",
            "REQUIRED_SIGNER_INFO_ERROR",
          );
        }
      }
      throw error;
    }
  },
});

export const cancelSignatureRequest = mutationField("cancelSignatureRequest", {
  type: "PetitionSignatureRequest",
  args: {
    petitionSignatureRequestId: nonNull(globalIdArg()),
  },
  authorize: authenticateAnd(
    userHasEnabledIntegration("SIGNATURE"),
    userHasAccessToSignatureRequest("petitionSignatureRequestId", ["OWNER", "WRITE"]),
    signatureRequestIsNotAnonymized("petitionSignatureRequestId"),
  ),
  resolve: async (_, { petitionSignatureRequestId }, ctx) => {
    const signature = await ctx.petitions.loadPetitionSignatureById(petitionSignatureRequestId);

    if (!signature) {
      throw new Error(`Petition signature request with id ${petitionSignatureRequestId} not found`);
    }

    if (signature.status === "ENQUEUED") {
      throw new Error("Can't cancel a signature request that is still enqueued");
    }

    // if, for any reason, signature was already cancelled or completed, just return it
    if (signature.status === "CANCELLED" || signature.status === "COMPLETED") {
      return signature;
    }

    const petition = await ctx.petitions.loadPetition(signature.petition_id);
    if (!petition) {
      throw new Error(
        `Can't find Petition:${signature.petition_id} on PetitionSignatureRequest:${petitionSignatureRequestId}`,
      );
    }

    const [signatureRequest] = await ctx.signature.cancelSignatureRequest(
      signature,
      "CANCELLED_BY_USER",
      {
        user_id: ctx.user!.id,
      },
    );

    return signatureRequest;
  },
});

export const updateSignatureRequestMetadata = mutationField("updateSignatureRequestMetadata", {
  type: nonNull("PetitionSignatureRequest"),
  authorize: authenticateAnd(
    userHasEnabledIntegration("SIGNATURE"),
    userHasAccessToSignatureRequest("petitionSignatureRequestId", ["OWNER", "WRITE"]),
    signatureRequestIsNotAnonymized("petitionSignatureRequestId"),
  ),
  args: {
    petitionSignatureRequestId: nonNull(globalIdArg()),
    metadata: nonNull(jsonObjectArg()),
  },
  resolve: async (_, args, ctx) => {
    const [signature] = await ctx.petitions.updatePetitionSignatures(
      args.petitionSignatureRequestId,
      {
        metadata: args.metadata,
      },
    );
    return signature!;
  },
});

export const signedPetitionDownloadLink = mutationField("signedPetitionDownloadLink", {
  description: "Generates a download link for the signed PDF petition.",
  type: "FileUploadDownloadLinkResult",
  authorize: authenticateAnd(
    userHasEnabledIntegration("SIGNATURE"),
    userHasAccessToSignatureRequest("petitionSignatureRequestId"),
    signatureRequestIsNotAnonymized("petitionSignatureRequestId"),
  ),
  args: {
    petitionSignatureRequestId: nonNull(globalIdArg("PetitionSignatureRequest")),
    preview: booleanArg({
      description: "If true will use content-disposition inline instead of attachment",
    }),
    downloadAuditTrail: booleanArg({
      description: "If true, downloads the audit trail instead of the signed document",
    }),
  },
  resolve: async (_, args, ctx) => {
    try {
      const signature = await ctx.petitions.loadPetitionSignatureById(
        args.petitionSignatureRequestId,
      );

      if (
        signature?.status !== "COMPLETED" ||
        (args.downloadAuditTrail && !signature.file_upload_audit_trail_id) ||
        (!args.downloadAuditTrail && !signature.file_upload_id)
      ) {
        throw new Error(
          `Can't download signed doc on ${signature?.status} petitionSignatureRequest with id ${args.petitionSignatureRequestId}`,
        );
      }
      const file = await ctx.files.loadFileUpload(
        args.downloadAuditTrail ? signature.file_upload_audit_trail_id! : signature.file_upload_id!,
      );
      if (!file) {
        throw new Error(
          `Can't get ${
            args.downloadAuditTrail ? "audit trail" : "signed"
          } file for signature request with id ${args.petitionSignatureRequestId}`,
        );
      }
      return {
        result: RESULT.SUCCESS,
        file,
        url: await ctx.storage.fileUploads.getSignedDownloadEndpoint(
          file.path,
          file.filename,
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

export const sendSignatureRequestReminders = mutationField("sendSignatureRequestReminders", {
  description: "Sends a reminder email to the pending signers",
  type: "Result",
  authorize: authenticateAnd(
    userHasEnabledIntegration("SIGNATURE"),
    userHasAccessToSignatureRequest("petitionSignatureRequestId", ["OWNER", "WRITE"]),
    signatureRequestIsNotAnonymized("petitionSignatureRequestId"),
  ),
  args: {
    petitionSignatureRequestId: nonNull(globalIdArg("PetitionSignatureRequest")),
  },
  resolve: async (_, { petitionSignatureRequestId }, ctx) => {
    const signature = await ctx.petitions.loadPetitionSignatureById(petitionSignatureRequestId);

    if (!signature) {
      throw new Error(`Petition signature request with id ${petitionSignatureRequestId} not found`);
    }

    const petition = await ctx.petitions.loadPetition(signature.petition_id);
    if (!petition) {
      throw new Error(
        `Can't find petition with id ${signature.petition_id} on signature request with id ${petitionSignatureRequestId}`,
      );
    }

    if (signature.status === "PROCESSED") {
      await ctx.signature.sendSignatureReminders(signature, ctx.user!.id);
    }

    return RESULT.SUCCESS;
  },
});

export const createCustomSignatureDocumentUploadLink = mutationField(
  "createCustomSignatureDocumentUploadLink",
  {
    type: "JSONObject",
    authorize: authenticateAnd(
      userHasEnabledIntegration("SIGNATURE"),
      userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
      petitionCanUploadCustomSignatureDocument("petitionId"),
      petitionsAreOfTypePetition("petitionId"),
      petitionIsNotAnonymized("petitionId"),
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      file: nonNull("FileUploadInput"),
    },
    validateArgs: validFileUploadInput(
      (args) => args.file,
      { contentType: "application/pdf", maxSizeBytes: toBytes(10, "MB") },
      "file",
    ),
    resolve: async (_, args, ctx) => {
      const { filename, size, contentType } = args.file;
      const key = random(16);
      const temporaryFile = await ctx.files.createTemporaryFile(
        {
          path: key,
          filename,
          size: size.toString(),
          content_type: contentType,
        },
        `User:${ctx.user!.id}`,
      );

      const presignedPostData = await ctx.storage.temporaryFiles.getSignedUploadEndpoint(
        key,
        contentType,
        size,
      );

      return { temporaryFileId: toGlobalId("FileUpload", temporaryFile.id), presignedPostData };
    },
  },
);
