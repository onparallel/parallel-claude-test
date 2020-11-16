import { booleanArg, mutationField } from "@nexus/schema";
import { toGlobalId } from "../../../util/globalId";
import { authenticateAnd } from "../../helpers/authorize";
import { WhitelistedError } from "../../helpers/errors";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { RESULT } from "../../helpers/result";
import {
  userHasAccessToPetitions,
  userHasAccessToSignatureRequest,
  userHasFeatureFlag,
} from "../authorizers";

export const startSignatureRequest = mutationField("startSignatureRequest", {
  type: "PetitionSignatureRequest",
  args: {
    petitionId: globalIdArg("Petition", { required: true }),
  },
  authorize: authenticateAnd(
    userHasFeatureFlag("PETITION_SIGNATURE"),
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"])
  ),
  resolve: async (_, { petitionId }, ctx) => {
    const petition = await ctx.petitions.loadPetition(petitionId);
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
      if (!contacts.every((c) => c && c.email.endsWith("@parallel.so"))) {
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
    petitionSignatureRequestId: globalIdArg({ required: true }),
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
    if (!signature.external_id) {
      throw new Error(
        `Can't find external_id on petition signature request ${signature.id}`
      );
    }

    if (signature.status !== "PROCESSING") {
      throw new Error(`Can't cancel a ${signature.status} signature process.`);
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
      ctx.aws.enqueueMessages("signature-worker", {
        groupId: `signature-${toGlobalId("Petition", petition.id)}`,
        body: {
          type: "cancel-signature-process",
          payload: { petitionSignatureRequestId: signature.id },
        },
      }),
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

export const signedPetitionDownloadLink = mutationField(
  "signedPetitionDownloadLink",
  {
    description: "Generates a download link for the signed PDF petition.",
    type: "FileUploadReplyDownloadLinkResult",
    authorize: authenticateAnd(
      userHasFeatureFlag("PETITION_SIGNATURE"),
      userHasAccessToSignatureRequest("petitionSignatureRequestId", [
        "OWNER",
        "WRITE",
      ])
    ),
    args: {
      petitionSignatureRequestId: globalIdArg("PetitionSignatureRequest", {
        required: true,
      }),
      preview: booleanArg({
        description:
          "If true will use content-disposition inline instead of attachment",
      }),
    },
    resolve: async (_, args, ctx) => {
      try {
        const signature = await ctx.petitions.loadPetitionSignatureById(
          args.petitionSignatureRequestId
        );

        if (signature?.status !== "COMPLETED") {
          throw new Error(
            `Can't download signed doc on ${signature?.status} petitionSignatureRequest with id ${args.petitionSignatureRequestId}`
          );
        }
        const file = await ctx.files.loadFileUpload(signature.file_upload_id!);
        if (!file) {
          throw new Error(
            `Can't get signed file for signature request with id ${args.petitionSignatureRequestId}`
          );
        }
        return {
          result: RESULT.SUCCESS,
          url: await ctx.aws.getSignedDownloadEndpoint(
            file!.path,
            file!.filename,
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
