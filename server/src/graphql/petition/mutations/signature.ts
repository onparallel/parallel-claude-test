import { booleanArg, mutationField, nonNull } from "@nexus/schema";
import { toGlobalId } from "../../../util/globalId";
import { authenticateAnd } from "../../helpers/authorize";
import { WhitelistedError } from "../../helpers/errors";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { jsonObjectArg } from "../../helpers/json";
import { RESULT } from "../../helpers/result";
import {
  userHasAccessToPetitions,
  userHasAccessToSignatureRequest,
  userHasFeatureFlag,
} from "../authorizers";

export const startSignatureRequest = mutationField("startSignatureRequest", {
  type: "PetitionSignatureRequest",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
  },
  authorize: authenticateAnd(
    userHasFeatureFlag("PETITION_SIGNATURE"),
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"])
  ),
  resolve: async (_, { petitionId }, ctx) => {
    const petition = await ctx.petitions.updatePetition(
      petitionId,
      { status: "COMPLETED" },
      `User:${ctx.user!.id}`
    );
    if (!petition) {
      throw new Error(`Petition with id ${petitionId} not found`);
    }
    if (!petition.signature_config) {
      throw new Error(
        `Signature configuration not found for petition with id ${petitionId}`
      );
    }
    if (process.env.NODE_ENV !== "production") {
      const contacts = await ctx.contacts.loadContact(
        petition.signature_config.contactIds as number[]
      );
      if (!contacts.every((c) => c && c.email.endsWith("@onparallel.com"))) {
        throw new WhitelistedError(
          "DEVELOPMENT: All recipients must have a parallel email.",
          "403"
        );
      }
    }

    const signatureRequest = await ctx.petitions.createPetitionSignature(
      petitionId,
      petition!.signature_config
    );

    await ctx.aws.enqueueMessages("signature-worker", {
      groupId: `signature-${toGlobalId("Petition", petitionId)}`,
      body: {
        type: "start-signature-process",
        payload: { petitionSignatureRequestId: signatureRequest.id },
      },
    });

    return signatureRequest;
  },
});

export const cancelSignatureRequest = mutationField("cancelSignatureRequest", {
  type: "PetitionSignatureRequest",
  args: {
    petitionSignatureRequestId: nonNull(globalIdArg()),
  },
  authorize: authenticateAnd(
    userHasFeatureFlag("PETITION_SIGNATURE"),
    userHasAccessToSignatureRequest("petitionSignatureRequestId", [
      "OWNER",
      "WRITE",
    ])
  ),
  resolve: async (_, { petitionSignatureRequestId }, ctx) => {
    const signature = await ctx.petitions.loadPetitionSignatureById(
      petitionSignatureRequestId
    );

    if (!signature) {
      throw new Error(
        `Petition signature request with id ${petitionSignatureRequestId} not found`
      );
    }

    if (!["PROCESSING", "ENQUEUED"].includes(signature.status)) {
      throw new Error(`Can't cancel a ${signature.status} signature process.`);
    }

    if (signature.status === "PROCESSING" && !signature.external_id) {
      throw new Error(
        `Can't find external_id on petition signature request ${signature.id}`
      );
    }

    const petition = await ctx.petitions.loadPetition(signature.petition_id);
    if (!petition) {
      throw new Error(
        `Can't find petition with id ${signature.petition_id} on signature request with id ${petitionSignatureRequestId}`
      );
    }

    const [signatureRequest] = await Promise.all([
      ctx.petitions.updatePetitionSignature(signature.id, {
        status: "CANCELLED",
        cancel_reason: "CANCELLED_BY_USER",
        cancel_data: {
          user_id: ctx.user!.id,
        },
      }),
      signature.status === "PROCESSING"
        ? ctx.aws.enqueueMessages("signature-worker", {
            groupId: `signature-${toGlobalId("Petition", petition.id)}`,
            body: {
              type: "cancel-signature-process",
              payload: { petitionSignatureRequestId: signature.id },
            },
          })
        : Promise.resolve(),
      ctx.petitions.createEvent({
        type: "SIGNATURE_CANCELLED",
        petitionId: petition.id,
        data: {
          petition_signature_request_id: signature.id,
          cancel_reason: "CANCELLED_BY_USER",
          cancel_data: {
            canceller_id: ctx.user!.id,
          },
        },
      }),
    ]);

    return signatureRequest;
  },
});

export const updateSignatureRequestMetadata = mutationField(
  "updateSignatureRequestMetadata",
  {
    type: nonNull("PetitionSignatureRequest"),
    authorize: authenticateAnd(
      userHasFeatureFlag("PETITION_SIGNATURE"),
      userHasAccessToSignatureRequest("petitionSignatureRequestId", [
        "OWNER",
        "WRITE",
      ])
    ),
    args: {
      petitionSignatureRequestId: nonNull(globalIdArg()),
      metadata: nonNull(jsonObjectArg()),
    },
    resolve: async (_, args, ctx) => {
      return await ctx.petitions.updatePetitionSignature(
        args.petitionSignatureRequestId,
        {
          metadata: args.metadata,
        }
      );
    },
  }
);

export const signedPetitionDownloadLink = mutationField(
  "signedPetitionDownloadLink",
  {
    description: "Generates a download link for the signed PDF petition.",
    type: "FileUploadDownloadLinkResult",
    authorize: authenticateAnd(
      userHasFeatureFlag("PETITION_SIGNATURE"),
      userHasAccessToSignatureRequest("petitionSignatureRequestId", [
        "OWNER",
        "WRITE",
      ])
    ),
    args: {
      petitionSignatureRequestId: nonNull(
        globalIdArg("PetitionSignatureRequest")
      ),
      preview: booleanArg({
        description:
          "If true will use content-disposition inline instead of attachment",
      }),
      downloadAuditTrail: booleanArg({
        description:
          "If true, downloads the audit trail instead of the signed document",
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
          args.downloadAuditTrail
            ? signature.file_upload_audit_trail_id!
            : signature.file_upload_id!
        );
        if (!file) {
          throw new Error(
            `Can't get ${
              args.downloadAuditTrail ? "audit trail" : "signed"
            } file for signature request with id ${
              args.petitionSignatureRequestId
            }`
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
  }
);
