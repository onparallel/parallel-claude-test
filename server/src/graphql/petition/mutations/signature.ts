import { ApolloError } from "apollo-server-core";
import { booleanArg, mutationField, nonNull, nullable, stringArg } from "nexus";
import { toGlobalId } from "../../../util/globalId";
import { authenticateAnd } from "../../helpers/authorize";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { jsonObjectArg } from "../../helpers/json";
import { RESULT } from "../../helpers/result";
import {
  userHasAccessToPetitions,
  userHasAccessToSignatureRequest,
  userHasEnabledIntegration,
} from "../authorizers";

export const startSignatureRequest = mutationField("startSignatureRequest", {
  type: "PetitionSignatureRequest",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    message: nullable(stringArg()),
  },
  authorize: authenticateAnd(
    userHasEnabledIntegration("SIGNATURE"),
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"])
  ),
  resolve: async (_, { petitionId, message }, ctx) => {
    try {
      return await ctx.petitions.withTransaction(async (t) => {
        const [petition] = await ctx.petitions.updatePetition(
          petitionId,
          { status: "COMPLETED" },
          `User:${ctx.user!.id}`,
          t
        );
        if (!petition) {
          throw new Error(`Petition with id ${petitionId} not found`);
        }

        if (!petition.signature_config) {
          throw new Error(`Petition:${petition.id} was expected to have signature_config set`);
        }

        const { signatureRequest } = await ctx.signature.createSignatureRequest(
          petition.id,
          { ...petition.signature_config, message: message ?? undefined },
          ctx.user!,
          t
        );
        return signatureRequest;
      });
    } catch (error: any) {
      if (error.message === "SIGNATURIT_SHARED_APIKEY_LIMIT_REACHED") {
        // in this case, just throw the error without creating a SIGNATURE_CANCELLED event. We will inform in the front-end with an error dialog
        throw new ApolloError(
          "You reached the limit of uses for our signature API_KEY",
          "SIGNATURIT_SHARED_APIKEY_LIMIT_REACHED"
        );
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
    userHasAccessToSignatureRequest("petitionSignatureRequestId", ["OWNER", "WRITE"])
  ),
  resolve: async (_, { petitionSignatureRequestId }, ctx) => {
    const signature = await ctx.petitions.loadPetitionSignatureById(petitionSignatureRequestId);

    if (!signature) {
      throw new Error(`Petition signature request with id ${petitionSignatureRequestId} not found`);
    }

    // if, for any reason, signature was already cancelled, just return it
    if (signature.status === "CANCELLED") {
      return signature;
    }

    const petition = await ctx.petitions.loadPetition(signature.petition_id);
    if (!petition) {
      throw new Error(
        `Can't find Petition:${signature.petition_id} on PetitionSignatureRequest:${petitionSignatureRequestId}`
      );
    }

    const [[signatureRequest]] = await Promise.all([
      ctx.petitions.cancelPetitionSignatureRequest(signature, "CANCELLED_BY_USER", {
        user_id: ctx.user!.id,
      }),
      signature.status === "PROCESSED"
        ? ctx.aws.enqueueMessages("signature-worker", {
            groupId: `signature-${toGlobalId("Petition", petition.id)}`,
            body: {
              type: "cancel-signature-process",
              payload: { petitionSignatureRequestId: signature.id },
            },
          })
        : null,
    ]);

    return signatureRequest;
  },
});

export const updateSignatureRequestMetadata = mutationField("updateSignatureRequestMetadata", {
  type: nonNull("PetitionSignatureRequest"),
  authorize: authenticateAnd(
    userHasEnabledIntegration("SIGNATURE"),
    userHasAccessToSignatureRequest("petitionSignatureRequestId", ["OWNER", "WRITE"])
  ),
  args: {
    petitionSignatureRequestId: nonNull(globalIdArg()),
    metadata: nonNull(jsonObjectArg()),
  },
  resolve: async (_, args, ctx) => {
    return (await ctx.petitions.updatePetitionSignature(args.petitionSignatureRequestId, {
      metadata: args.metadata,
    }))!;
  },
});

export const signedPetitionDownloadLink = mutationField("signedPetitionDownloadLink", {
  description: "Generates a download link for the signed PDF petition.",
  type: "FileUploadDownloadLinkResult",
  authorize: authenticateAnd(
    userHasEnabledIntegration("SIGNATURE"),
    userHasAccessToSignatureRequest("petitionSignatureRequestId", ["OWNER", "WRITE"])
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
        args.petitionSignatureRequestId
      );

      if (
        signature?.status !== "COMPLETED" ||
        (args.downloadAuditTrail && !signature.file_upload_audit_trail_id) ||
        (!args.downloadAuditTrail && !signature.file_upload_id)
      ) {
        throw new Error(
          `Can't download signed doc on ${signature?.status} petitionSignatureRequest with id ${args.petitionSignatureRequestId}`
        );
      }
      const file = await ctx.files.loadFileUpload(
        args.downloadAuditTrail ? signature.file_upload_audit_trail_id! : signature.file_upload_id!
      );
      if (!file) {
        throw new Error(
          `Can't get ${
            args.downloadAuditTrail ? "audit trail" : "signed"
          } file for signature request with id ${args.petitionSignatureRequestId}`
        );
      }
      return {
        result: RESULT.SUCCESS,
        file,
        url: await ctx.aws.fileUploads.getSignedDownloadEndpoint(
          file.path,
          file.filename,
          args.preview ? "inline" : "attachment"
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
    userHasAccessToSignatureRequest("petitionSignatureRequestId", ["OWNER", "WRITE"])
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
        `Can't find petition with id ${signature.petition_id} on signature request with id ${petitionSignatureRequestId}`
      );
    }

    if (signature.status === "PROCESSED") {
      await Promise.all([
        ctx.aws.enqueueMessages("signature-worker", {
          groupId: `signature-${toGlobalId("Petition", petition.id)}`,
          body: {
            type: "send-signature-reminder",
            payload: { petitionSignatureRequestId },
          },
        }),
        ctx.petitions.createEvent({
          type: "SIGNATURE_REMINDER",
          petition_id: petition.id,
          data: {
            user_id: ctx.user!.id,
            petition_signature_request_id: petitionSignatureRequestId,
          },
        }),
      ]);
    }

    return RESULT.SUCCESS;
  },
});
